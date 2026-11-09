// Teacher & Tutor Portal: classrooms, linking requests, assignments, analytics, resources, lesson plans, AI assistant.
// Privacy model: a teacher can only reach learners who have an APPROVED link to one of their classrooms. Links can be revoked at any time.
import { ai, SYSTEM, buildPrompt, parseQuiz, TASK_NAMES } from './ai.js';

export default function mountClassroom(app, h) {
  const { db, need, bad, str, j, report, summary, uniqueCode } = h;
  const T = need('teacher'), hits = new Map(), isoNow = () => new Date().toISOString();
  const limitUser = (name, max, win) => (req, res, next) => { const k = name + req.user.id, t = Date.now(), a = (hits.get(k) || []).filter(x => t - x < win); if (a.length >= max) return bad(res, 'Too many requests. Please try again later.', 429); a.push(t); hits.set(k, a); next(); };
  const inList = a => a.map(() => '?').join(',');
  const norm = v => String(v ?? '').trim().toLowerCase();
  const own = (req, res) => { const c = db.prepare('SELECT * FROM classrooms WHERE id=? AND teacher_id=? AND archived=0').get(+req.params.id, req.user.id); if (!c) bad(res, 'Classroom not found', 404); return c; };
  const teacherInfo = id => { const u = db.prepare('SELECT u.name,t.kind,t.organisation,t.verified FROM users u JOIN teacher_profiles t ON t.user_id=u.id WHERE u.id=?').get(id); return { name: u.name, kind: u.kind, organisation: u.organisation, verified: !!u.verified }; };
  const roster = cid => db.prepare('SELECT u.id,u.name,l.grade,l.interests,l.xp,u.last_seen,m.parent_updates,m.joined FROM members m JOIN users u ON u.id=m.learner_id JOIN learners l ON l.user_id=u.id WHERE m.classroom_id=? AND u.active=1 ORDER BY u.name').all(cid);
  const visibleTo = (tid, lid) => db.prepare('SELECT m.classroom_id id FROM members m JOIN classrooms c ON c.id=m.classroom_id WHERE c.teacher_id=? AND m.learner_id=? AND c.archived=0').all(tid, lid).map(r => r.id);
  const pct = (s, m) => (s != null && m ? Math.round(100 * s / m) : null);

  // ---------- assignments: status and grading ----------
  function aStatus(a, lid) {
    if (a.type === 'lesson') { const p = db.prepare('SELECT done,best,attempts,pct FROM progress WHERE user_id=? AND lesson_id=?').get(lid, a.lesson_id) || {}; return p.done ? { status: 'graded', score: p.best, max: 100 } : (p.pct > 0 || p.attempts > 0) ? { status: 'in_progress' } : { status: 'not_started' }; }
    const s = db.prepare('SELECT * FROM submissions WHERE assignment_id=? AND learner_id=?').get(a.id, lid);
    return s ? { status: s.status, score: s.score, max: s.max, feedback: s.feedback, submitted: s.submitted } : { status: 'not_started' };
  }
  const isDone = st => st === 'graded' || st === 'submitted';
  function gradeQuiz(quiz, ans) {
    let score = 0, max = 0;
    const results = quiz.map((q, i) => { const m = q.marks || 1, a = Array.isArray(ans) ? ans[i] : null; max += m; const ok = q.type === 'mcq' ? a === q.answer : (q.answers || []).some(x => norm(x) === norm(a)); if (ok) score += m; return { ok, shown: q.type === 'mcq' ? q.options[q.answer] : (q.answers || [])[0], explain: q.explain || '' }; });
    return { score, max, results };
  }
  function cleanQuiz(arr) {
    return (Array.isArray(arr) ? arr : []).slice(0, 40).map(q => {
      const text = str(q.q, 400), marks = Math.max(1, Math.min(10, Math.round(+q.marks) || 1)), explain = str(q.explain, 400);
      if (q.type === 'mcq') { const raw = (q.options || []).map(o => str(o, 150)), correct = raw[Math.round(+q.answer)], options = raw.filter(Boolean).slice(0, 6), answer = options.indexOf(correct); return text && correct && options.length >= 2 && answer >= 0 ? { type: 'mcq', q: text, options, answer, marks, explain } : null; }
      if (q.type === 'short') { const answers = (q.answers || []).map(o => str(o, 100)).filter(Boolean).slice(0, 6); return text && answers.length ? { type: 'short', q: text, answers, marks, explain } : null; }
      return null;
    }).filter(Boolean);
  }
  const TYPES = ['lesson', 'homework', 'worksheet', 'quiz', 'assessment'];
  function lstats(lid, cids) {
    const as = db.prepare(`SELECT * FROM assignments WHERE published=1 AND classroom_id IN (${inList(cids)})`).all(...cids), now = isoNow();
    let done = 0, overdue = 0; const scored = [];
    for (const a of as) { const s = aStatus(a, lid), c = isDone(s.status); if (c) done++; if (s.status === 'graded' && s.max) scored.push(100 * s.score / s.max); if (!c && a.due && a.due < now) overdue++; }
    const att = db.prepare("SELECT avg(pct) a, count(*) n FROM attempts WHERE user_id=? AND at>=datetime('now','-30 day')").get(lid);
    const u = db.prepare("SELECT last_seen, (last_seen IS NULL OR last_seen < datetime('now','-14 day')) inactive FROM users WHERE id=?").get(lid);
    const avgScore = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null, quizAvg = att.n ? Math.round(att.a) : null, completion = as.length ? Math.round(100 * done / as.length) : null, reasons = [];
    if (avgScore != null && avgScore < 50) reasons.push(`Assignment average ${avgScore}%`);
    if (quizAvg != null && quizAvg < 50) reasons.push(`Learniverse quiz average ${quizAvg}%`);
    if (overdue >= 2) reasons.push(`${overdue} overdue assignments`);
    if (as.length >= 2 && completion < 50) reasons.push(`Only ${completion}% of set work completed`);
    if (u.inactive) reasons.push('No activity in 14 days');
    return { assigned: as.length, completed: done, completion, avgScore, overdue, quizAvg, quizzes: att.n, lastSeen: u.last_seen, struggling: reasons.length > 0, reasons };
  }
  const assignmentRow = (a, mem) => { const st = mem.map(m => aStatus(a, m.id).status), c = st.filter(isDone).length; return { id: a.id, type: a.type, title: a.title, due: a.due, published: !!a.published, source: a.source, lesson_id: a.lesson_id, max_marks: a.max_marks, questions: a.quiz ? j(a.quiz, []).length : 0, completed: c, total: mem.length, completion: mem.length ? Math.round(100 * c / mem.length) : null }; };

  // ---------- teacher: classrooms ----------
  app.get('/api/teacher/subjects', T, (req, res) => res.json(db.prepare('SELECT id,name FROM subjects').all()));
  app.get('/api/teacher/lessons', T, (req, res) => res.json(db.prepare('SELECT l.id,l.title,l.grade,s.name subject,m.title module FROM lessons l JOIN subjects s ON s.id=l.subject_id JOIN modules m ON m.id=l.module_id WHERE (?=0 OR l.grade=?) AND (?=0 OR l.subject_id=?) ORDER BY l.grade,s.name,m.pos,l.pos LIMIT 400').all(+req.query.grade || 0, +req.query.grade || 0, +req.query.subject || 0, +req.query.subject || 0)));
  app.get('/api/teacher/classrooms', T, (req, res) => {
    const rows = db.prepare('SELECT c.*,s.name subject FROM classrooms c LEFT JOIN subjects s ON s.id=c.subject_id WHERE c.teacher_id=? AND c.archived=0 ORDER BY c.id DESC').all(req.user.id);
    res.json(rows.map(c => { const mem = roster(c.id), as = db.prepare('SELECT * FROM assignments WHERE classroom_id=? AND published=1').all(c.id), comp = as.map(a => assignmentRow(a, mem).completion).filter(x => x != null);
      return { ...c, learners: mem.length, pending: db.prepare("SELECT count(*) n FROM link_requests WHERE classroom_id=? AND status='pending'").get(c.id).n, assignments: as.length, completion: comp.length ? Math.round(comp.reduce((a, b) => a + b, 0) / comp.length) : null }; }));
  });
  const classFields = b => { const grade = b.grade ? Math.round(+b.grade) : null, subject = b.subject_id ? +b.subject_id : null; return { name: str(b.name, 80), grade: grade >= 1 && grade <= 7 ? grade : null, subject, description: str(b.description, 500), instructions: str(b.instructions, 2000) }; };
  app.post('/api/teacher/classrooms', T, (req, res) => {
    const f = classFields(req.body); if (f.name.length < 2) return bad(res, 'Please name the classroom');
    if (f.subject && !db.prepare('SELECT 1 FROM subjects WHERE id=?').get(f.subject)) return bad(res, 'Unknown subject');
    res.status(201).json({ id: Number(db.prepare('INSERT INTO classrooms(teacher_id,name,grade,subject_id,description,instructions) VALUES(?,?,?,?,?,?)').run(req.user.id, f.name, f.grade, f.subject, f.description, f.instructions).lastInsertRowid) });
  });
  app.put('/api/teacher/classrooms/:id', T, (req, res) => {
    const c = own(req, res); if (!c) return; const f = classFields({ ...c, subject_id: c.subject_id, ...req.body }); if (f.name.length < 2) return bad(res, 'Please name the classroom');
    db.prepare('UPDATE classrooms SET name=?,grade=?,subject_id=?,description=?,instructions=? WHERE id=?').run(f.name, f.grade, f.subject, f.description, f.instructions, c.id); res.json({ ok: true });
  });
  app.delete('/api/teacher/classrooms/:id', T, (req, res) => { const c = own(req, res); if (!c) return; db.prepare('UPDATE classrooms SET archived=1 WHERE id=?').run(c.id); res.json({ ok: true }); });
  app.get('/api/teacher/classrooms/:id', T, (req, res) => {
    const c = own(req, res); if (!c) return; const mem = roster(c.id);
    res.json({ classroom: { ...c, subject: c.subject_id ? db.prepare('SELECT name FROM subjects WHERE id=?').get(c.subject_id)?.name : null },
      members: mem.map(m => ({ id: m.id, name: m.name, grade: m.grade, xp: m.xp, parentUpdates: !!m.parent_updates, joined: m.joined, ...lstats(m.id, [c.id]) })),
      pending: db.prepare("SELECT id,code,created FROM link_requests WHERE classroom_id=? AND status='pending' ORDER BY id DESC").all(c.id),
      announcements: db.prepare('SELECT * FROM announcements WHERE classroom_id=? ORDER BY id DESC').all(c.id),
      assignments: db.prepare('SELECT * FROM assignments WHERE classroom_id=? ORDER BY id DESC').all(c.id).map(a => assignmentRow(a, mem)),
      resources: db.prepare('SELECT r.id,r.title,r.kind,r.url,r.filename,r.folder FROM resources r JOIN resource_shares s ON s.resource_id=r.id WHERE s.classroom_id=?').all(c.id),
      updates: db.prepare('SELECT f.id,f.title,f.body,f.created,u.name learner FROM family_updates f JOIN users u ON u.id=f.learner_id WHERE f.classroom_id=? ORDER BY f.id DESC LIMIT 30').all(c.id) });
  });

  // ---------- teacher: linking (separate from the Family Code) ----------
  app.post('/api/teacher/classrooms/:id/link', T, limitUser('link', 20, 3600e3), (req, res) => {
    const c = own(req, res); if (!c) return;
    const code = ('TC-' + str(req.body.code, 12).toUpperCase().replace(/^TC-?/, '').replace(/[^A-Z0-9]/g, '')), L = db.prepare('SELECT l.user_id FROM learners l JOIN users u ON u.id=l.user_id WHERE l.teacher_code=? AND u.active=1').get(code);
    if (!L) return bad(res, 'That Teacher/Tutor code was not found. Please check it with the learner.', 404);
    if (db.prepare('SELECT 1 FROM members WHERE classroom_id=? AND learner_id=?').get(c.id, L.user_id)) return bad(res, 'This learner is already in this classroom', 409);
    if (db.prepare("SELECT 1 FROM link_requests WHERE classroom_id=? AND learner_id=? AND status='pending'").get(c.id, L.user_id)) return bad(res, 'A request for this learner is already waiting for approval', 409);
    db.prepare('INSERT INTO link_requests(classroom_id,learner_id,code) VALUES(?,?,?)').run(c.id, L.user_id, code);
    res.status(201).json({ ok: true, message: 'Request sent. The learner or their parent or guardian must approve it before the learner appears in your classroom.' }); // no learner details are revealed before approval
  });
  app.delete('/api/teacher/classrooms/:id/requests/:rid', T, (req, res) => { const c = own(req, res); if (!c) return; db.prepare("UPDATE link_requests SET status='cancelled',decided=? WHERE id=? AND classroom_id=? AND status='pending'").run(isoNow(), +req.params.rid, c.id); res.json({ ok: true }); });
  function revoke(cid, lid, by) { db.prepare('DELETE FROM members WHERE classroom_id=? AND learner_id=?').run(cid, lid); db.prepare("UPDATE link_requests SET status='revoked',decided=?,decided_by=? WHERE classroom_id=? AND learner_id=? AND status='approved'").run(isoNow(), by, cid, lid); }
  app.delete('/api/teacher/classrooms/:id/members/:lid', T, (req, res) => { const c = own(req, res); if (!c) return; revoke(c.id, +req.params.lid, req.user.id); res.json({ ok: true }); });

  // ---------- teacher: announcements, parent updates ----------
  app.post('/api/teacher/classrooms/:id/announcements', T, (req, res) => {
    const c = own(req, res); if (!c) return; const title = str(req.body.title, 120), body = str(req.body.body, 2000); if (!title) return bad(res, 'Please add a title');
    db.prepare('INSERT INTO announcements(classroom_id,title,body) VALUES(?,?,?)').run(c.id, title, body); res.status(201).json({ ok: true });
  });
  app.delete('/api/teacher/classrooms/:id/announcements/:aid', T, (req, res) => { const c = own(req, res); if (!c) return; db.prepare('DELETE FROM announcements WHERE id=? AND classroom_id=?').run(+req.params.aid, c.id); res.json({ ok: true }); });
  app.post('/api/teacher/classrooms/:id/updates', T, (req, res) => { // only to learners whose family has granted permission
    const c = own(req, res); if (!c) return; const title = str(req.body.title, 120), body = str(req.body.body, 2000); if (!title || !body) return bad(res, 'Please add a title and a message');
    const targets = roster(c.id).filter(m => (!req.body.learnerId || m.id === +req.body.learnerId)); let sent = 0, skipped = 0;
    for (const m of targets) { const hasParent = db.prepare('SELECT 1 FROM parent_links WHERE learner_id=?').get(m.id); if (m.parent_updates && hasParent) { db.prepare('INSERT INTO family_updates(classroom_id,learner_id,title,body) VALUES(?,?,?,?)').run(c.id, m.id, title, body); sent++; } else skipped++; }
    res.json({ sent, skipped });
  });

  // ---------- teacher: assignments ----------
  function saveAssignment(req, res, c, id) {
    const b = req.body, type = TYPES.includes(b.type) ? b.type : null, title = str(b.title, 150), instructions = str(b.instructions, 12000), due = b.due && !isNaN(new Date(b.due)) ? new Date(b.due).toISOString() : null;
    if (!type || !title) return bad(res, 'Choose a type and add a title');
    let lessonId = null, quiz = null, max = Math.max(1, Math.min(1000, +b.max_marks || 10));
    if (type === 'lesson') { lessonId = +b.lesson_id; if (!db.prepare('SELECT 1 FROM lessons WHERE id=?').get(lessonId)) return bad(res, 'Choose a Learniverse lesson'); max = 100; }
    if (type === 'quiz' || type === 'assessment') { const q = cleanQuiz(b.quiz); if (!q.length) return bad(res, 'Add at least one complete question'); quiz = JSON.stringify(q); max = q.reduce((a, x) => a + x.marks, 0); }
    if ((type === 'homework' || type === 'worksheet') && !instructions) return bad(res, 'Add instructions for the learners');
    if (id) { const old = db.prepare('SELECT * FROM assignments WHERE id=? AND classroom_id=?').get(id, c.id); if (!old) return bad(res, 'Assignment not found', 404);
      if (old.quiz && quiz !== old.quiz && db.prepare('SELECT 1 FROM submissions WHERE assignment_id=?').get(id)) return bad(res, 'Questions cannot change after learners have submitted. Delete the submissions first.', 409);
      db.prepare('UPDATE assignments SET type=?,title=?,instructions=?,lesson_id=?,quiz=?,due=?,max_marks=? WHERE id=?').run(type, title, instructions, lessonId, quiz, due, max, id); return res.json({ id }); }
    const source = b.source === 'ai' ? 'ai' : 'manual', published = source === 'ai' || b.draft ? 0 : 1; // AI-assisted work always starts as an unpublished draft
    id = Number(db.prepare('INSERT INTO assignments(classroom_id,type,title,instructions,lesson_id,quiz,due,max_marks,published,source) VALUES(?,?,?,?,?,?,?,?,?,?)').run(c.id, type, title, instructions, lessonId, quiz, due, max, published, source).lastInsertRowid);
    res.status(201).json({ id, published: !!published });
  }
  app.post('/api/teacher/classrooms/:id/assignments', T, (req, res) => { const c = own(req, res); if (c) saveAssignment(req, res, c, 0); });
  app.put('/api/teacher/classrooms/:id/assignments/:aid', T, (req, res) => { const c = own(req, res); if (c) saveAssignment(req, res, c, +req.params.aid); });
  app.get('/api/teacher/classrooms/:id/assignments/:aid', T, (req, res) => { const c = own(req, res); if (!c) return; const a = db.prepare('SELECT * FROM assignments WHERE id=? AND classroom_id=?').get(+req.params.aid, c.id); if (!a) return bad(res, 'Assignment not found', 404); res.json({ ...a, quiz: a.quiz ? j(a.quiz, []) : null }); });
  app.delete('/api/teacher/classrooms/:id/assignments/:aid', T, (req, res) => { const c = own(req, res); if (!c) return; db.prepare('DELETE FROM assignments WHERE id=? AND classroom_id=?').run(+req.params.aid, c.id); res.json({ ok: true }); });
  app.post('/api/teacher/classrooms/:id/assignments/:aid/publish', T, (req, res) => {
    const c = own(req, res); if (!c) return; const a = db.prepare('SELECT * FROM assignments WHERE id=? AND classroom_id=?').get(+req.params.aid, c.id); if (!a) return bad(res, 'Assignment not found', 404);
    if (req.body.publish === false) { db.prepare('UPDATE assignments SET published=0 WHERE id=?').run(a.id); return res.json({ published: false }); }
    if (a.source === 'ai' && req.body.reviewed !== true) return bad(res, 'AI-assisted work must be reviewed by you before it is assigned. Please confirm that you have reviewed it.');
    db.prepare('UPDATE assignments SET published=1 WHERE id=?').run(a.id); res.json({ published: true });
  });
  app.get('/api/teacher/classrooms/:id/assignments/:aid/results', T, (req, res) => {
    const c = own(req, res); if (!c) return; const a = db.prepare('SELECT * FROM assignments WHERE id=? AND classroom_id=?').get(+req.params.aid, c.id); if (!a) return bad(res, 'Assignment not found', 404);
    const mem = roster(c.id), quiz = a.quiz ? j(a.quiz, []) : null, items = quiz ? quiz.map(() => ({ right: 0, n: 0 })) : null;
    const rows = mem.map(m => { const s = aStatus(a, m.id), sub = db.prepare('SELECT * FROM submissions WHERE assignment_id=? AND learner_id=?').get(a.id, m.id);
      if (quiz && sub) gradeQuiz(quiz, j(sub.answers, [])).results.forEach((r, i) => { items[i].n++; if (r.ok) items[i].right++; });
      return { learnerId: m.id, name: m.name, ...s, percent: pct(s.score, s.max), text: sub?.text || '', late: !!(a.due && sub && sub.submitted > a.due), overdue: !!(a.due && a.due < isoNow() && !isDone(s.status)) }; });
    res.json({ assignment: { ...a, quiz: quiz && quiz.map(q => ({ type: q.type, q: q.q })) }, rows, items: items && items.map((x, i) => ({ q: quiz[i].q, percentCorrect: x.n ? Math.round(100 * x.right / x.n) : null, answered: x.n })) });
  });
  app.post('/api/teacher/classrooms/:id/assignments/:aid/grade', T, (req, res) => {
    const c = own(req, res); if (!c) return; const a = db.prepare('SELECT * FROM assignments WHERE id=? AND classroom_id=?').get(+req.params.aid, c.id), lid = +req.body.learnerId;
    if (!a || !['homework', 'worksheet'].includes(a.type)) return bad(res, 'Only homework and worksheets are graded by hand'); if (!roster(c.id).some(m => m.id === lid)) return bad(res, 'Learner not in this classroom', 403);
    const score = +req.body.score; if (!(score >= 0 && score <= a.max_marks)) return bad(res, `Marks must be between 0 and ${a.max_marks}`);
    db.prepare("INSERT INTO submissions(assignment_id,learner_id,score,max,feedback,status,graded) VALUES(?,?,?,?,?, 'graded',?) ON CONFLICT(assignment_id,learner_id) DO UPDATE SET score=excluded.score,max=excluded.max,feedback=excluded.feedback,status='graded',graded=excluded.graded").run(a.id, lid, score, a.max_marks, str(req.body.feedback, 1000), isoNow());
    res.json({ ok: true });
  });
  app.delete('/api/teacher/classrooms/:id/assignments/:aid/submissions/:lid', T, (req, res) => { const c = own(req, res); if (!c) return; db.prepare('DELETE FROM submissions WHERE assignment_id IN (SELECT id FROM assignments WHERE id=? AND classroom_id=?) AND learner_id=?').run(+req.params.aid, c.id, +req.params.lid); res.json({ ok: true }); });

  // ---------- teacher: learners, analytics, reports ----------
  app.get('/api/teacher/analytics', T, (req, res) => {
    let cids;
    if (req.query.classroom && req.query.classroom !== 'all') { const c = db.prepare('SELECT id FROM classrooms WHERE id=? AND teacher_id=? AND archived=0').get(+req.query.classroom, req.user.id); if (!c) return bad(res, 'Classroom not found', 404); cids = [c.id]; }
    else cids = db.prepare('SELECT id FROM classrooms WHERE teacher_id=? AND archived=0').all(req.user.id).map(r => r.id);
    const ids = [...new Set(cids.flatMap(id => roster(id).map(m => m.id)))];
    if (!ids.length) return res.json({ learners: [], flagged: [], subjects: [], weekly: [], hotspots: [], assignments: [], summary: { learners: 0, avgScore: null, completion: null, flagged: 0 } });
    const learners = ids.map(id => { const u = db.prepare('SELECT u.name,l.grade FROM users u JOIN learners l ON l.user_id=u.id WHERE u.id=?').get(id); return { id, name: u.name, grade: u.grade, ...lstats(id, cids) }; });
    const sc = learners.map(l => l.avgScore).filter(x => x != null), cp = learners.map(l => l.completion).filter(x => x != null);
    res.json({ learners, flagged: learners.filter(l => l.struggling),
      subjects: db.prepare(`SELECT s.name, round(avg(a.pct)) avg, count(*) quizzes, count(DISTINCT a.user_id) learners FROM attempts a JOIN subjects s ON s.id=a.subject_id WHERE a.user_id IN (${inList(ids)}) AND a.at>=datetime('now','-90 day') GROUP BY s.id ORDER BY avg ASC`).all(...ids).map(r => ({ ...r, needsAttention: r.avg < 60 })),
      weekly: db.prepare(`SELECT date(at,'weekday 0','-6 days') week, round(avg(pct)) avg, count(*) quizzes FROM attempts WHERE user_id IN (${inList(ids)}) AND at>=datetime('now','-56 day') GROUP BY week ORDER BY week`).all(...ids),
      hotspots: db.prepare(`SELECT l.title lesson, s.name subject, round(avg(p.best)) avg, count(*) learners FROM progress p JOIN lessons l ON l.id=p.lesson_id JOIN subjects s ON s.id=l.subject_id WHERE p.user_id IN (${inList(ids)}) AND p.attempts>0 GROUP BY l.id HAVING avg(p.best)<60 ORDER BY avg ASC LIMIT 6`).all(...ids),
      assignments: db.prepare(`SELECT a.*,c.name classroom FROM assignments a JOIN classrooms c ON c.id=a.classroom_id WHERE a.published=1 AND a.classroom_id IN (${inList(cids)}) ORDER BY a.id DESC LIMIT 12`).all(...cids).map(a => ({ id: a.id, title: a.title, type: a.type, due: a.due, classroom: a.classroom, classroom_id: a.classroom_id, completion: assignmentRow(a, roster(a.classroom_id)).completion })),
      summary: { learners: ids.length, avgScore: sc.length ? Math.round(sc.reduce((a, b) => a + b, 0) / sc.length) : null, completion: cp.length ? Math.round(cp.reduce((a, b) => a + b, 0) / cp.length) : null, flagged: learners.filter(l => l.struggling).length } });
  });
  app.get('/api/teacher/learners/:lid', T, (req, res) => {
    const lid = +req.params.lid, cids = visibleTo(req.user.id, lid); if (!cids.length) return bad(res, 'This learner is not linked to you', 403);
    const u = db.prepare('SELECT u.name,l.grade,l.interests FROM users u JOIN learners l ON l.user_id=u.id WHERE u.id=?').get(lid), subjIds = db.prepare(`SELECT DISTINCT subject_id FROM classrooms WHERE id IN (${inList(cids)}) AND subject_id IS NOT NULL`).all(...cids).map(r => r.subject_id), sm = summary(lid); // limited view: no email, codes or family details
    const subjects = sm.subjects.filter(s => !subjIds.length || subjIds.includes(s.id)).map(s => ({ name: s.name, done: s.done, total: s.total, avg: s.avg, level: s.level }));
    const assignments = db.prepare(`SELECT a.*,c.name classroom FROM assignments a JOIN classrooms c ON c.id=a.classroom_id WHERE a.published=1 AND a.classroom_id IN (${inList(cids)}) ORDER BY a.id DESC`).all(...cids).map(a => { const s = aStatus(a, lid); return { id: a.id, title: a.title, type: a.type, classroom: a.classroom, due: a.due, ...s, percent: pct(s.score, s.max) }; });
    res.json({ id: lid, name: u.name, grade: u.grade, interests: j(u.interests, []), classrooms: db.prepare(`SELECT id,name FROM classrooms WHERE id IN (${inList(cids)})`).all(...cids), subjects, assignments, stats: lstats(lid, cids), recent: sm.recent.map(r => ({ title: r.title || r.subject + ' review', pct: r.pct, at: r.at })) });
  });
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  app.post('/api/teacher/learners/:lid/report', T, (req, res) => {
    const lid = +req.params.lid, cids = visibleTo(req.user.id, lid); if (!cids.length) return bad(res, 'This learner is not linked to you', 403);
    const cid = cids.includes(+req.body.classroomId) ? +req.body.classroomId : cids[0], c = db.prepare('SELECT c.*,s.slug FROM classrooms c LEFT JOIN subjects s ON s.id=c.subject_id WHERE c.id=?').get(cid);
    const u = db.prepare('SELECT u.name,l.grade FROM users u JOIN learners l ON l.user_id=u.id WHERE u.id=?').get(lid), rep = report(lid), t = teacherInfo(req.user.id), st = lstats(lid, [cid]);
    const rows = rep.rows.filter(r => !c.slug || r.slug === c.slug), as = db.prepare('SELECT * FROM assignments WHERE published=1 AND classroom_id=? ORDER BY id').all(cid);
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Learner progress report</title><style>body{font:15px/1.5 Arial,sans-serif;max-width:820px;margin:30px auto;padding:0 16px;color:#111}h1{margin:0}table{width:100%;border-collapse:collapse;margin:10px 0}th,td{border:1px solid #bbb;padding:6px 8px;text-align:left}th{background:#eee}.m{color:#555}</style></head><body>
<h1>Learner progress report</h1><p class="m">Generated ${new Date().toLocaleDateString('en-ZA')} by ${esc(t.name)} (${esc(t.kind)}${t.organisation ? ', ' + esc(t.organisation) : ''}) for ${esc(c.name)}</p>
<p><b>${esc(u.name)}</b> &middot; Grade ${u.grade}</p>
<h2>Learniverse marks</h2><table><tr><th>Subject</th><th>Mark</th><th>Level</th><th>Achievement</th><th>Lessons</th></tr>${rows.map(r => `<tr><td>${esc(r.name)}</td><td>${r.mark == null ? '-' : r.mark + '%'}</td><td>${r.code ?? '-'}</td><td>${esc(r.descriptor)}</td><td>${r.done}/${r.total}</td></tr>`).join('') || '<tr><td colspan="5">No marks yet</td></tr>'}</table>
<h2>Classroom work</h2><p>Completed ${st.completed} of ${st.assigned} assignments${st.avgScore != null ? ` &middot; average ${st.avgScore}%` : ''}${st.overdue ? ` &middot; ${st.overdue} overdue` : ''}</p>
<table><tr><th>Assignment</th><th>Type</th><th>Due</th><th>Status</th><th>Mark</th><th>Feedback</th></tr>${as.map(a => { const s = aStatus(a, lid); return `<tr><td>${esc(a.title)}</td><td>${esc(a.type)}</td><td>${a.due ? new Date(a.due).toLocaleDateString('en-ZA') : '-'}</td><td>${esc(s.status.replace('_', ' '))}</td><td>${s.status === 'graded' && s.max ? s.score + '/' + s.max + ' (' + pct(s.score, s.max) + '%)' : '-'}</td><td>${esc(s.feedback || '')}</td></tr>`; }).join('') || '<tr><td colspan="6">No assignments yet</td></tr>'}</table>
${st.reasons.length ? `<h2>Areas needing attention</h2><ul>${st.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
${str(req.body.comment, 1500) ? `<h2>Teacher comment</h2><p>${esc(str(req.body.comment, 1500)).replace(/\n/g, '<br>')}</p>` : ''}
<p class="m">This report contains a child's personal information. Share it only with the learner's parent or guardian. Marks from Learniverse are practice marks; official promotion decisions are made by the school.</p></body></html>`;
    res.json({ html, filename: `progress-report-${u.name.replace(/[^A-Za-z0-9]+/g, '-')}.html` });
  });
  app.get('/api/teacher/classrooms/:id/export.csv', T, (req, res) => {
    const c = own(req, res); if (!c) return; const mem = roster(c.id), as = db.prepare('SELECT * FROM assignments WHERE published=1 AND classroom_id=? ORDER BY id').all(c.id);
    const cell = v => { v = String(v ?? ''); if (/^[=+\-@]/.test(v)) v = "'" + v; return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
    const lines = [['Learner', 'Grade', ...as.map(a => a.title), 'Average %', 'Completion %'].map(cell).join(',')];
    for (const m of mem) { const st = lstats(m.id, [c.id]); lines.push([m.name, m.grade, ...as.map(a => { const s = aStatus(a, m.id); return s.status === 'graded' ? pct(s.score, s.max) + '%' : s.status.replace('_', ' '); }), st.avgScore ?? '', st.completion ?? ''].map(cell).join(',')); }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename="classroom-${c.id}-results.csv"`); res.send('\ufeff' + lines.join('\r\n'));
  });

  // ---------- teacher: resources and lesson plans ----------
  const MIME = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain', 'text/csv', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  app.get('/api/teacher/resources', T, (req, res) => res.json(db.prepare('SELECT id,title,kind,url,filename,size,folder,content,created FROM resources WHERE teacher_id=? ORDER BY folder,id DESC').all(req.user.id).map(r => ({ ...r, shared: db.prepare('SELECT classroom_id FROM resource_shares WHERE resource_id=?').all(r.id).map(x => x.classroom_id) }))));
  app.post('/api/teacher/resources', T, (req, res) => {
    const kind = req.body.kind === 'note' ? 'note' : 'link', title = str(req.body.title, 120), folder = str(req.body.folder, 60); if (!title) return bad(res, 'Please add a title');
    let url = null, content = null;
    if (kind === 'link') { url = str(req.body.url, 500); if (!/^https?:\/\/[^\s]+$/i.test(url)) return bad(res, 'Links must start with http:// or https://'); } else { content = str(req.body.content, 8000); if (!content) return bad(res, 'Please write the note'); }
    res.status(201).json({ id: Number(db.prepare('INSERT INTO resources(teacher_id,title,kind,url,content,folder) VALUES(?,?,?,?,?,?)').run(req.user.id, title, kind, url, content, folder).lastInsertRowid) });
  });
  app.post('/api/teacher/resources/upload', T, limitUser('upload', 30, 3600e3), (req, res) => {
    const title = str(req.body.title, 120), mime = str(req.body.mime, 100), filename = str(req.body.filename, 120).replace(/[^\w.\- ]+/g, '_'); if (!title || !filename) return bad(res, 'Please add a title and choose a file');
    if (!MIME.includes(mime)) return bad(res, 'Allowed files: PDF, images (PNG, JPG, WEBP), Word, PowerPoint, Excel, text and CSV');
    const data = Buffer.from(String(req.body.data || ''), 'base64'); if (!data.length || data.length > 4 * 1024 * 1024) return bad(res, 'Files must be 4 MB or smaller');
    const id = Number(db.prepare("INSERT INTO resources(teacher_id,title,kind,filename,mime,size,folder) VALUES(?,?,'file',?,?,?,?)").run(req.user.id, title, filename, mime, data.length, str(req.body.folder, 60)).lastInsertRowid);
    db.prepare('INSERT INTO resource_files VALUES(?,?)').run(id, data); res.status(201).json({ id });
  });
  app.delete('/api/teacher/resources/:rid', T, (req, res) => { db.prepare('DELETE FROM resources WHERE id=? AND teacher_id=?').run(+req.params.rid, req.user.id); res.json({ ok: true }); });
  app.post('/api/teacher/resources/:rid/share', T, (req, res) => {
    const r = db.prepare('SELECT id FROM resources WHERE id=? AND teacher_id=?').get(+req.params.rid, req.user.id), c = db.prepare('SELECT id FROM classrooms WHERE id=? AND teacher_id=?').get(+req.body.classroomId, req.user.id);
    if (!r || !c) return bad(res, 'Not found', 404);
    req.body.on === false ? db.prepare('DELETE FROM resource_shares WHERE resource_id=? AND classroom_id=?').run(r.id, c.id) : db.prepare('INSERT OR IGNORE INTO resource_shares VALUES(?,?)').run(r.id, c.id); res.json({ ok: true });
  });
  app.get('/api/files/:rid', need('teacher', 'learner'), (req, res) => {
    const r = db.prepare("SELECT r.*,f.data FROM resources r JOIN resource_files f ON f.resource_id=r.id WHERE r.id=?").get(+req.params.rid); if (!r) return bad(res, 'File not found', 404);
    const ok = req.user.role === 'teacher' ? r.teacher_id === req.user.id : !!db.prepare('SELECT 1 FROM resource_shares s JOIN members m ON m.classroom_id=s.classroom_id JOIN classrooms c ON c.id=s.classroom_id WHERE s.resource_id=? AND m.learner_id=? AND c.archived=0').get(r.id, req.user.id);
    if (!ok) return bad(res, 'Not allowed', 403);
    res.setHeader('Content-Type', r.mime); res.setHeader('Content-Disposition', `attachment; filename="${r.filename}"`); res.setHeader('X-Content-Type-Options', 'nosniff'); res.send(Buffer.from(r.data));
  });
  app.get('/api/teacher/plans', T, (req, res) => res.json(db.prepare('SELECT p.*,s.name subject,c.name classroom FROM lesson_plans p LEFT JOIN subjects s ON s.id=p.subject_id LEFT JOIN classrooms c ON c.id=p.classroom_id WHERE p.teacher_id=? ORDER BY p.updated DESC').all(req.user.id)));
  function savePlan(req, res, id) {
    const b = req.body, title = str(b.title, 150), grade = Math.round(+b.grade) || null; if (!title) return bad(res, 'Please add a title');
    const cid = b.classroom_id && db.prepare('SELECT id FROM classrooms WHERE id=? AND teacher_id=?').get(+b.classroom_id, req.user.id) ? +b.classroom_id : null, vals = [cid, title, grade >= 1 && grade <= 7 ? grade : null, +b.subject_id || null, str(b.topic, 150), Math.max(5, Math.min(240, +b.duration || 45)), str(b.content, 20000)];
    if (id) { if (!db.prepare('SELECT 1 FROM lesson_plans WHERE id=? AND teacher_id=?').get(id, req.user.id)) return bad(res, 'Plan not found', 404); db.prepare('UPDATE lesson_plans SET classroom_id=?,title=?,grade=?,subject_id=?,topic=?,duration=?,content=?,updated=CURRENT_TIMESTAMP WHERE id=?').run(...vals, id); return res.json({ id }); }
    res.status(201).json({ id: Number(db.prepare('INSERT INTO lesson_plans(teacher_id,classroom_id,title,grade,subject_id,topic,duration,content,source) VALUES(?,?,?,?,?,?,?,?,?)').run(req.user.id, ...vals, b.source === 'ai' ? 'ai' : 'manual').lastInsertRowid) });
  }
  app.post('/api/teacher/plans', T, (req, res) => savePlan(req, res, 0));
  app.put('/api/teacher/plans/:id', T, (req, res) => savePlan(req, res, +req.params.id));
  app.delete('/api/teacher/plans/:id', T, (req, res) => { db.prepare('DELETE FROM lesson_plans WHERE id=? AND teacher_id=?').run(+req.params.id, req.user.id); res.json({ ok: true }); });

  // ---------- AI Teaching Assistant (Groq) ----------
  app.get('/api/teacher/ai/status', T, (req, res) => res.json({ configured: ai.configured(), model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile' }));
  app.post('/api/teacher/ai', T, limitUser('ai', 25, 3600e3), async (req, res) => {
    const b = req.body, task = b.task, grade = Math.round(+b.grade), topic = str(b.topic, 200), subject = str(b.subject, 80), count = Math.max(1, Math.min(20, Math.round(+b.count) || 8));
    if (!TASK_NAMES.includes(task) || !(grade >= 1 && grade <= 7) || !topic || !subject) return bad(res, 'Choose a task, grade, subject and topic');
    try {
      const out = await ai.chat([{ role: 'system', content: SYSTEM }, { role: 'user', content: buildPrompt({ task, grade, subject, topic, notes: str(b.notes, 500), count }) }], { json: task === 'quiz', temperature: task === 'quiz' ? 0.3 : 0.5, max: 3500 });
      if (task === 'quiz') { const q = parseQuiz(out), quiz = cleanQuiz(q?.questions); if (!quiz.length) return bad(res, 'The AI did not return a usable quiz. Please try again.', 502); return res.json({ task, title: str(q.title, 150) || topic, quiz }); }
      res.json({ task, content: out.trim() });
    } catch (e) { bad(res, e.message, e.status || 502); }
  });
  app.post('/api/teacher/ai/insights', T, limitUser('ai', 25, 3600e3), async (req, res) => { // learner data is anonymised before it leaves the server
    let cids;
    if (req.body.classroomId && req.body.classroomId !== 'all') { const c = db.prepare('SELECT id FROM classrooms WHERE id=? AND teacher_id=? AND archived=0').get(+req.body.classroomId, req.user.id); if (!c) return bad(res, 'Classroom not found', 404); cids = [c.id]; } else cids = db.prepare('SELECT id FROM classrooms WHERE teacher_id=? AND archived=0').all(req.user.id).map(r => r.id);
    const ids = [...new Set(cids.flatMap(id => roster(id).map(m => m.id)))]; if (!ids.length) return bad(res, 'Link some learners first, then the assistant can interpret their progress.');
    const names = {}, lines = ids.map((id, i) => { const n = `Learner ${i + 1}`, st = lstats(id, cids), u = db.prepare('SELECT name FROM users WHERE id=?').get(id); names[n] = u.name.split(' ')[0];
      const subs = db.prepare('SELECT s.name, round(avg(a.pct)) avg FROM attempts a JOIN subjects s ON s.id=a.subject_id WHERE a.user_id=? GROUP BY s.id').all(id).map(x => `${x.name} ${x.avg}%`).join(', ');
      return `${n}: assignment average ${st.avgScore ?? 'n/a'}%, completion ${st.completion ?? 'n/a'}%, overdue ${st.overdue}, Learniverse quiz average ${st.quizAvg ?? 'n/a'}%, subjects: ${subs || 'none'}`; });
    const weak = db.prepare(`SELECT l.title lesson, s.name subject, round(avg(p.best)) avg FROM progress p JOIN lessons l ON l.id=p.lesson_id JOIN subjects s ON s.id=l.subject_id WHERE p.user_id IN (${inList(ids)}) AND p.attempts>0 GROUP BY l.id ORDER BY avg ASC LIMIT 6`).all(...ids).map(x => `${x.lesson} (${x.subject}) ${x.avg}%`).join('; ');
    try {
      let out = await ai.chat([{ role: 'system', content: SYSTEM }, { role: 'user', content: `Interpret this class performance data (learners are anonymised). Give: 1) a brief summary, 2) strengths, 3) learners who need extra support and why, 4) topics that need re-teaching, 5) three concrete, age-appropriate activities to try next. Do not guess at causes outside the data.\n\n${lines.join('\n')}\n\nLowest-scoring lessons: ${weak || 'none yet'}` }], { max: 1800 });
      out = out.replace(/Learner (\d+)/g, m => names[m] || m); res.json({ content: out.trim() }); // put real first names back for the teacher only
    } catch (e) { bad(res, e.message, e.status || 502); }
  });

  // ---------- learner and parent: classroom views ----------
  function classroomsFor(lid, forParent) {
    return db.prepare('SELECT c.*,s.name subject FROM members m JOIN classrooms c ON c.id=m.classroom_id LEFT JOIN subjects s ON s.id=c.subject_id WHERE m.learner_id=? AND c.archived=0 ORDER BY c.id').all(lid).map(c => {
      const as = db.prepare('SELECT * FROM assignments WHERE classroom_id=? AND published=1 ORDER BY due IS NULL, due, id').all(c.id).map(a => { const s = aStatus(a, lid); return { id: a.id, type: a.type, title: a.title, instructions: a.instructions, due: a.due, lesson_id: a.lesson_id, ...s, percent: pct(s.score, s.max), overdue: !!(a.due && a.due < isoNow() && !isDone(s.status)) }; });
      const done = as.filter(a => isDone(a.status)), graded = as.filter(a => a.status === 'graded' && a.max);
      return { id: c.id, name: c.name, grade: c.grade, subject: c.subject, description: c.description, instructions: c.instructions, teacher: teacherInfo(c.teacher_id), parentUpdates: !!db.prepare('SELECT parent_updates p FROM members WHERE classroom_id=? AND learner_id=?').get(c.id, lid).p,
        announcements: db.prepare('SELECT id,title,body,created FROM announcements WHERE classroom_id=? ORDER BY id DESC LIMIT 20').all(c.id), assignments: as,
        stats: { completion: as.length ? Math.round(100 * done.length / as.length) : null, average: graded.length ? Math.round(graded.reduce((a, x) => a + x.percent, 0) / graded.length) : null },
        ...(forParent ? { updates: db.prepare('SELECT id,title,body,created FROM family_updates WHERE classroom_id=? AND learner_id=? ORDER BY id DESC LIMIT 20').all(c.id, lid) }
          : { resources: db.prepare('SELECT r.id,r.title,r.kind,r.url,r.content,r.filename,r.folder FROM resources r JOIN resource_shares s ON s.resource_id=r.id WHERE s.classroom_id=?').all(c.id) }) };
    });
  }
  const pendingFor = lid => db.prepare("SELECT r.id,r.created,c.name classroom,c.grade,s.name subject,c.teacher_id FROM link_requests r JOIN classrooms c ON c.id=r.classroom_id LEFT JOIN subjects s ON s.id=c.subject_id WHERE r.learner_id=? AND r.status='pending' AND c.archived=0 ORDER BY r.id DESC").all(lid).map(r => ({ id: r.id, created: r.created, classroom: r.classroom, grade: r.grade, subject: r.subject, teacher: teacherInfo(r.teacher_id) }));
  function respond(req, res, lid) {
    const r = db.prepare("SELECT * FROM link_requests WHERE id=? AND learner_id=? AND status='pending'").get(+req.params.rid, lid); if (!r) return bad(res, 'Request not found', 404);
    if (req.body.approve === true) { db.prepare("UPDATE link_requests SET status='approved',decided=?,decided_by=? WHERE id=?").run(isoNow(), req.user.id, r.id); db.prepare('INSERT OR IGNORE INTO members(classroom_id,learner_id,parent_updates) VALUES(?,?,?)').run(r.classroom_id, lid, req.body.parentUpdates ? 1 : 0); }
    else db.prepare("UPDATE link_requests SET status='declined',decided=?,decided_by=? WHERE id=?").run(isoNow(), req.user.id, r.id);
    res.json({ ok: true });
  }
  app.get('/api/classroom', need('learner'), (req, res) => res.json({ requests: pendingFor(req.user.id), classrooms: classroomsFor(req.user.id, false) }));
  app.post('/api/classroom/requests/:rid/respond', need('learner'), (req, res) => respond(req, res, req.user.id));
  app.post('/api/classroom/:cid/leave', need('learner'), (req, res) => { revoke(+req.params.cid, req.user.id, req.user.id); res.json({ ok: true }); });
  app.post('/api/classroom/:cid/parent-updates', need('learner'), (req, res) => { db.prepare('UPDATE members SET parent_updates=? WHERE classroom_id=? AND learner_id=?').run(req.body.on ? 1 : 0, +req.params.cid, req.user.id); res.json({ ok: true }); });
  function memberAssignment(req, res) {
    const a = db.prepare('SELECT a.* FROM assignments a JOIN members m ON m.classroom_id=a.classroom_id JOIN classrooms c ON c.id=a.classroom_id WHERE a.id=? AND a.published=1 AND m.learner_id=? AND c.archived=0').get(+req.params.aid, req.user.id);
    if (!a) bad(res, 'Assignment not found', 404); return a;
  }
  app.get('/api/classroom/assignments/:aid', need('learner'), (req, res) => {
    const a = memberAssignment(req, res); if (!a) return; const quiz = a.quiz ? j(a.quiz, []) : null, sub = db.prepare('SELECT * FROM submissions WHERE assignment_id=? AND learner_id=?').get(a.id, req.user.id), s = aStatus(a, req.user.id);
    const files = db.prepare("SELECT r.id,r.title,r.kind,r.url,r.filename FROM resources r JOIN resource_shares x ON x.resource_id=r.id WHERE x.classroom_id=?").all(a.classroom_id);
    res.json({ id: a.id, type: a.type, title: a.title, instructions: a.instructions, due: a.due, lesson_id: a.lesson_id, max: a.max_marks, ...s, percent: pct(s.score, s.max), files, text: sub?.text || '',
      questions: quiz && quiz.map(q => ({ type: q.type, q: q.q, options: q.options, marks: q.marks })),
      review: quiz && sub && a.type === 'quiz' ? gradeQuiz(quiz, j(sub.answers, [])).results : null }); // correct answers are shown after submitting a quiz, never for assessments
  });
  app.post('/api/classroom/assignments/:aid/submit', need('learner'), (req, res) => {
    const a = memberAssignment(req, res); if (!a) return; if (a.type === 'lesson') return bad(res, 'Complete the lesson and its quiz in Learniverse to finish this task');
    if (db.prepare('SELECT 1 FROM submissions WHERE assignment_id=? AND learner_id=?').get(a.id, req.user.id)) return bad(res, 'You have already submitted this', 409);
    if (a.quiz) { const g = gradeQuiz(j(a.quiz, []), req.body.answers); db.prepare("INSERT INTO submissions(assignment_id,learner_id,answers,score,max,status,graded) VALUES(?,?,?,?,?,'graded',?)").run(a.id, req.user.id, JSON.stringify(req.body.answers || []), g.score, g.max, isoNow()); return res.json({ score: g.score, max: g.max, percent: pct(g.score, g.max), results: a.type === 'quiz' ? g.results : null }); }
    const text = str(req.body.text, 4000); if (!text) return bad(res, 'Please write or paste your answer');
    db.prepare("INSERT INTO submissions(assignment_id,learner_id,text,status) VALUES(?,?,?,'submitted')").run(a.id, req.user.id, text); res.json({ submitted: true });
  });
  // parents: same family-code link as before; classroom data only for their own children
  const myKids = pid => db.prepare('SELECT u.id,u.name FROM parent_links p JOIN users u ON u.id=p.learner_id WHERE p.parent_id=?').all(pid);
  const isMine = (pid, lid) => !!db.prepare('SELECT 1 FROM parent_links WHERE parent_id=? AND learner_id=?').get(pid, lid);
  app.get('/api/parent/classroom', need('parent'), (req, res) => res.json(myKids(req.user.id).map(k => ({ id: k.id, name: k.name, requests: pendingFor(k.id), classrooms: classroomsFor(k.id, true) }))));
  app.post('/api/parent/classroom/requests/:rid/respond', need('parent'), (req, res) => { const r = db.prepare('SELECT learner_id FROM link_requests WHERE id=?').get(+req.params.rid); if (!r || !isMine(req.user.id, r.learner_id)) return bad(res, 'Request not found', 404); respond(req, res, r.learner_id); });
  app.post('/api/parent/classroom/:cid/learners/:lid/revoke', need('parent'), (req, res) => { if (!isMine(req.user.id, +req.params.lid)) return bad(res, 'Not allowed', 403); revoke(+req.params.cid, +req.params.lid, req.user.id); res.json({ ok: true }); });
  app.post('/api/parent/classroom/:cid/learners/:lid/parent-updates', need('parent'), (req, res) => { if (!isMine(req.user.id, +req.params.lid)) return bad(res, 'Not allowed', 403); db.prepare('UPDATE members SET parent_updates=? WHERE classroom_id=? AND learner_id=?').run(req.body.on ? 1 : 0, +req.params.cid, +req.params.lid); res.json({ ok: true }); });
}
