process.env.DB_PATH = ':memory:'; process.env.ADMIN_EMAIL = 'admin@test.co.za'; process.env.ADMIN_PASSWORD = 'adminpass123'; process.env.GROQ_API_KEY = '';
const { app } = await import('./index.js'); const { db } = await import('./db.js'); const { ai } = await import('./ai.js');
const srv = app.listen(0); const base = `http://localhost:${srv.address().port}/api`;
const mk = () => { let ck = ''; const f = async (m, u, b) => { const r = await fetch(base + u, { method: m, headers: { 'Content-Type': 'application/json', cookie: ck }, body: m === 'GET' ? undefined : JSON.stringify(b || {}) }); const s = r.headers.get('set-cookie'); if (s) ck = s.split(';')[0]; const ct = r.headers.get('content-type') || ''; return { s: r.status, d: ct.includes('json') ? await r.json() : await r.text(), ct, h: r.headers }; }; return f; };
let fail = 0; const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) fail++; };
const T1 = mk(), T2 = mk(), L = mk(), L2 = mk(), P = mk(), P2 = mk(), A = mk();
const reg = (f, name, email, role, extra = {}) => f('POST', '/auth/register', { name, email, password: 'password1', role, consent: true, ...extra });
let r = await reg(T1, 'Mrs Nkosi', 't1@school.co.za', 'teacher', { kind: 'teacher', organisation: 'Sunrise Primary' }); ok(r.s === 201 && r.d.role === 'teacher' && r.d.kind === 'teacher' && r.d.organisation === 'Sunrise Primary' && !r.d.verified, 'teacher registers');
r = await reg(T2, 'Mr Dube', 't2@tutor.co.za', 'teacher', { kind: 'tutor' }); ok(r.d.kind === 'tutor', 'independent tutor registers');
r = await reg(L, 'Thabo Mokoena', 'thabo@x.co.za', 'learner'); const thabo = r.d; await L('PUT', '/me/profile', { grade: 4, interests: ['Football'], buddy: 'leo' });
const me = (await L('GET', '/me')).d; ok(/^TC-[A-Z2-9]{6}$/.test(me.teacherCode) && /^[A-Z2-9]{6}$/.test(me.code) && me.teacherCode !== me.code, 'learner has a Family Code and a separate Teacher/Tutor code');
await reg(L2, 'Zanele Dlamini', 'zanele@x.co.za', 'learner'); await L2('PUT', '/me/profile', { grade: 4 });
await reg(P, 'Mrs Mokoena', 'p@x.co.za', 'parent'); await reg(P2, 'Mr Other', 'p2@x.co.za', 'parent');
ok((await P('POST', '/parent/link', { code: me.code })).s === 200, 'Family Code still links the parent');
ok((await P('POST', '/parent/link', { code: me.teacherCode })).s === 404, 'the Teacher/Tutor code does not work as a Family Code');
ok((await L('GET', '/classroom')).d.classrooms.length === 0 && (await L('GET', '/classroom')).s === 200, 'learner with no classroom: empty Classroom tab, no error');
ok((await L('GET', '/dashboard')).s === 200, 'self-learning works without a classroom');
// role isolation
ok((await L('GET', '/teacher/classrooms')).s === 403 && (await T1('GET', '/dashboard')).s === 403 && (await P('GET', '/teacher/classrooms')).s === 403, 'roles cannot cross into each other\'s areas');
const maths = (await L('GET', '/dashboard')).d.subjects.find(s => s.slug === 'maths');
r = await T1('POST', '/teacher/classrooms', { name: 'Grade 4 Maths', grade: 4, subject_id: maths.id, description: 'Term 4', instructions: 'Bring your notebooks.' }); const cid = r.d.id; ok(r.s === 201, 'teacher creates a classroom');
ok((await T1('POST', `/teacher/classrooms/${cid}/link`, { code: 'TC-ZZZZZZ' })).s === 404, 'unknown code rejected');
r = await T1('POST', `/teacher/classrooms/${cid}/link`, { code: me.teacherCode.slice(3).toLowerCase() }); ok(r.s === 201 && !JSON.stringify(r.d).includes('Thabo'), 'linking request sent, learner identity not revealed');
ok((await T1('POST', `/teacher/classrooms/${cid}/link`, { code: me.teacherCode })).s === 409, 'duplicate pending request blocked');
ok((await T1('GET', `/teacher/learners/${thabo.id}`)).s === 403 && (await T1('GET', `/teacher/classrooms/${cid}`)).d.members.length === 0, 'teacher cannot see the learner before approval');
r = await L('GET', '/classroom'); const rid = r.d.requests[0].id; ok(r.d.requests.length === 1 && r.d.requests[0].teacher.name === 'Mrs Nkosi' && r.d.requests[0].teacher.verified === false && !JSON.stringify(r.d).includes('t1@school'), 'learner sees the request (teacher name, kind, no email)');
r = await P('GET', '/parent/classroom'); ok(r.d[0].requests.length === 1 && r.d[0].classrooms.length === 0, 'parent sees the pending request');
ok((await P2('POST', `/parent/classroom/requests/${rid}/respond`, { approve: true })).s === 404, 'another parent cannot approve it');
ok((await L2('POST', `/classroom/requests/${rid}/respond`, { approve: true })).s === 404, 'another learner cannot approve it');
ok((await T2('POST', `/teacher/classrooms/${cid}/link`, { code: me.teacherCode })).s === 404, 'another teacher cannot use my classroom');
ok((await L('POST', `/classroom/requests/${rid}/respond`, { approve: true, parentUpdates: false })).s === 200, 'learner approves the link');
r = await T1('GET', `/teacher/classrooms/${cid}`); ok(r.d.members.length === 1 && r.d.members[0].name === 'Thabo Mokoena' && !JSON.stringify(r.d).includes('thabo@x.co.za') && !JSON.stringify(r.d).includes(me.code), 'after approval the teacher sees the learner, without email or codes');
r = await T1('GET', `/teacher/learners/${thabo.id}`); ok(r.s === 200 && r.d.subjects.every(s => s.name === 'Mathematics') && !JSON.stringify(r.d).includes('@'), 'teacher learner view is limited to the classroom subject');
// announcements + assignments
ok((await T1('POST', `/teacher/classrooms/${cid}/announcements`, { title: 'Test on Friday', body: 'Revise times tables' })).s === 201, 'teacher posts an announcement');
const due = new Date(Date.now() + 3 * 864e5).toISOString(), past = new Date(Date.now() - 864e5).toISOString();
const hw = (await T1('POST', `/teacher/classrooms/${cid}/assignments`, { type: 'homework', title: 'Page 12', instructions: 'Do exercises 1-5', due, max_marks: 10 })).d.id;
const quiz = [{ type: 'mcq', q: '3 x 4?', options: ['10', '12', '14'], answer: 1, explain: '3 groups of 4' }, { type: 'short', q: 'What is 5 + 5?', answers: ['10', 'ten'] }];
const qz = (await T1('POST', `/teacher/classrooms/${cid}/assignments`, { type: 'quiz', title: 'Times tables quiz', due: past, quiz })).d.id, as = (await T1('POST', `/teacher/classrooms/${cid}/assignments`, { type: 'assessment', title: 'Term test', quiz })).d.id;
const lessonId = db.prepare("SELECT l.id FROM lessons l JOIN subjects s ON s.id=l.subject_id WHERE s.slug='maths' AND l.grade=4 ORDER BY l.pos LIMIT 1").get().id;
const ls = (await T1('POST', `/teacher/classrooms/${cid}/assignments`, { type: 'lesson', title: 'Do the multiplication lesson', lesson_id: lessonId })).d.id;
ok((await T1('POST', `/teacher/classrooms/${cid}/assignments`, { type: 'quiz', title: 'Empty', quiz: [] })).s === 400, 'quiz needs at least one valid question');
r = await T1('POST', `/teacher/classrooms/${cid}/assignments`, { type: 'worksheet', title: 'AI worksheet', instructions: 'Draft from AI', source: 'ai', published: true }); const aiA = r.d.id; ok(r.d.published === false, 'AI-assisted work is created as an unpublished draft even if "published" is requested');
ok((await L('GET', '/classroom')).d.classrooms[0].assignments.every(a => a.title !== 'AI worksheet'), 'learners cannot see drafts');
ok((await T1('POST', `/teacher/classrooms/${cid}/assignments/${aiA}/publish`, {})).s === 400, 'AI draft cannot be published without teacher review');
ok((await T1('PUT', `/teacher/classrooms/${cid}/assignments/${aiA}`, { type: 'worksheet', title: 'Reviewed worksheet', instructions: 'Edited by the teacher' })).s === 200, 'teacher can edit AI content');
ok((await T1('POST', `/teacher/classrooms/${cid}/assignments/${aiA}/publish`, { reviewed: true })).d.published === true, 'publishing after review works');
// learner's Classroom tab
r = await L('GET', '/classroom'); const c = r.d.classrooms[0]; ok(c.name === 'Grade 4 Maths' && c.instructions === 'Bring your notebooks.' && c.announcements.length === 1 && c.assignments.length === 5 && c.teacher.name === 'Mrs Nkosi' && !('updates' in c), 'learner Classroom tab: name, instructions, announcements, homework, deadlines');
ok((await L2('GET', `/classroom/assignments/${hw}`)).s === 404, 'a non-member learner cannot open the assignment');
r = await L('GET', `/classroom/assignments/${qz}`); ok(r.d.questions.length === 2 && !JSON.stringify(r.d).includes('"answer"'), 'quiz questions sent without answers');
r = await L('POST', `/classroom/assignments/${qz}/submit`, { answers: [1, 'Ten'] }); ok(r.d.score === 2 && r.d.max === 2 && r.d.results.length === 2, 'quiz auto-graded (case-insensitive short answers), corrections shown');
ok((await L('POST', `/classroom/assignments/${qz}/submit`, { answers: [1, '10'] })).s === 409, 'cannot submit twice');
r = await L('POST', `/classroom/assignments/${as}/submit`, { answers: [0, 'x'] }); ok(r.d.score === 0 && r.d.results === null, 'assessment: marks only, answers not revealed');
ok((await L('POST', `/classroom/assignments/${hw}/submit`, { text: 'My answers: 1) 12' })).d.submitted === true, 'learner submits homework');
r = await T1('GET', `/teacher/classrooms/${cid}/assignments/${hw}/results`); ok(r.d.rows[0].status === 'submitted' && r.d.rows[0].text.includes('12'), 'teacher sees the submission');
ok((await T1('POST', `/teacher/classrooms/${cid}/assignments/${hw}/grade`, { learnerId: thabo.id, score: 11 })).s === 400, 'marks cannot exceed the maximum');
ok((await T1('POST', `/teacher/classrooms/${cid}/assignments/${hw}/grade`, { learnerId: thabo.id, score: 2, feedback: 'Please redo question 3' })).s === 200, 'teacher grades with feedback');
r = await L('GET', '/classroom'); const hwv = r.d.classrooms[0].assignments.find(a => a.id === hw); ok(hwv.status === 'graded' && hwv.score === 2 && hwv.feedback === 'Please redo question 3', 'learner sees marks and feedback');
r = await T1('GET', `/teacher/classrooms/${cid}/assignments/${qz}/results`); ok(r.d.items.length === 2 && r.d.items[0].percentCorrect === 100, 'quiz item analysis');
// lesson assignment completes through normal learning
r = await L('POST', '/quiz', { lessonId }); const sid = r.d.id; const qs = JSON.parse(db.prepare('SELECT qs FROM quiz_sessions WHERE id=?').get(sid).qs);
await L('POST', `/quiz/${sid}/submit`, { answers: qs.map(q => q.type === 'order' ? q.answer : q.answer) }); r = await L('GET', '/classroom'); ok(r.d.classrooms[0].assignments.find(a => a.id === ls).status === 'graded', 'assigned Learniverse lesson completes through normal learning');
// parent updates need permission
r = await T1('POST', `/teacher/classrooms/${cid}/updates`, { title: 'Progress', body: 'Thabo is doing well' }); ok(r.d.sent === 0 && r.d.skipped === 1, 'no update is sent to parents without permission');
ok((await P('POST', `/parent/classroom/${cid}/learners/${thabo.id}/parent-updates`, { on: true })).s === 200 && (await P2('POST', `/parent/classroom/${cid}/learners/${thabo.id}/parent-updates`, { on: true })).s === 403, 'parent grants permission (other parents cannot)');
r = await T1('POST', `/teacher/classrooms/${cid}/updates`, { title: 'Progress', body: 'Thabo is doing well' }); ok(r.d.sent === 1, 'update sent once permission is granted');
r = await P('GET', '/parent/classroom'); const pc = r.d[0].classrooms[0]; ok(pc.updates.length === 1 && pc.announcements.length === 1 && pc.assignments.length === 5 && pc.stats.average != null && pc.parentUpdates === true && !('resources' in pc), 'parent Classroom section: announcements, homework, deadlines, marks, updates');
ok((await P2('GET', '/parent/classroom')).d.length === 0, 'unlinked parents see nothing');
// analytics and reports
for (const t of ['Overdue 1', 'Overdue 2']) await T1('POST', `/teacher/classrooms/${cid}/assignments`, { type: 'homework', title: t, instructions: 'Late work', due: past });
r = await T1('GET', '/teacher/analytics?classroom=all'); ok(r.d.summary.learners === 1 && r.d.flagged.length === 1 && r.d.flagged[0].reasons.length > 0 && Array.isArray(r.d.weekly) && r.d.subjects.length >= 1 && r.d.assignments.length > 0, 'analytics flags the struggling learner with reasons, subjects, trend and completion');
r = await T1('POST', `/teacher/learners/${thabo.id}/report`, { classroomId: cid, comment: 'Keep practising times tables' }); ok(r.d.html.includes('Thabo Mokoena') && r.d.html.includes('Keep practising') && !r.d.html.includes('thabo@x.co.za'), 'downloadable learner report');
r = await T1('GET', `/teacher/classrooms/${cid}/export.csv`); ok(r.ct.includes('text/csv') && r.d.includes('Thabo Mokoena') && (r.h.get('content-disposition') || '').includes('attachment'), 'class results CSV export');
ok((await T2('GET', `/teacher/learners/${thabo.id}`)).s === 403 && (await T2('GET', `/teacher/classrooms/${cid}`)).s === 404 && (await T2('POST', `/teacher/learners/${thabo.id}/report`, {})).s === 403 && (await T2('GET', '/teacher/analytics?classroom=' + cid)).s === 404, 'other teachers cannot reach this learner or classroom');
// resources
const rl = (await T1('POST', '/teacher/resources', { kind: 'link', title: 'Times tables song', url: 'https://example.com/song', folder: 'Maths' })).d.id; ok((await T1('POST', '/teacher/resources', { kind: 'link', title: 'bad', url: 'javascript:alert(1)' })).s === 400, 'unsafe links rejected');
ok((await T1('POST', '/teacher/resources', { kind: 'note', title: 'Tip', content: 'Use arrays' })).s === 201, 'note resource');
const pdf = Buffer.from('%PDF-1.4 test').toString('base64'); const fr = (await T1('POST', '/teacher/resources/upload', { title: 'Worksheet PDF', filename: 'ws.pdf', mime: 'application/pdf', data: pdf })).d.id;
ok((await T1('POST', '/teacher/resources/upload', { title: 'x', filename: 'x.html', mime: 'text/html', data: pdf })).s === 400, 'HTML uploads rejected');
await T1('POST', `/teacher/resources/${fr}/share`, { classroomId: cid }); await T1('POST', `/teacher/resources/${rl}/share`, { classroomId: cid });
r = await L('GET', `/files/${fr}`); ok(r.s === 200 && r.ct.includes('application/pdf') && r.d.startsWith('%PDF') && r.h.get('content-disposition').includes('attachment'), 'learner downloads a shared file');
ok((await L2('GET', `/files/${fr}`)).s === 403 && (await T2('GET', `/files/${fr}`)).s === 403, 'non-members and other teachers cannot download it');
ok((await L('GET', '/classroom')).d.classrooms[0].resources.length === 2, 'learner Classroom tab lists shared resources');
// lesson plans
const pl = (await T1('POST', '/teacher/plans', { title: 'Times tables', grade: 4, subject_id: maths.id, topic: 'Multiplication', duration: 45, content: 'Intro...' })).d.id; ok((await T1('PUT', '/teacher/plans/' + pl, { title: 'Times tables v2', grade: 4, content: 'Edited' })).s === 200 && (await T1('GET', '/teacher/plans')).d[0].title === 'Times tables v2' && (await T2('GET', '/teacher/plans')).d.length === 0, 'lesson plans: create, edit, private to the teacher');
// AI (Groq) assistant
ok((await T1('POST', '/teacher/ai', { task: 'lesson_plan', grade: 4, subject: 'Mathematics', topic: 'Fractions' })).s === 503, 'AI reports a clear message when no GROQ_API_KEY is set');
process.env.GROQ_API_KEY = 'test'; const seen = []; ai.chat = async (m, o) => { seen.push(m.map(x => x.content).join('\n')); return o.json ? JSON.stringify({ title: 'Fractions quiz', questions: [{ type: 'mcq', q: 'What is 1/2 of 10?', options: ['5', '2', '10'], answer: 0, explain: 'Share into 2' }, { type: 'bad' }, { type: 'short', q: '1/4 of 8?', answers: ['2'] }] }) : 'Learner 1 needs help with fractions. Objectives: ...'; };
ok((await T1('GET', '/teacher/ai/status')).d.configured === true, 'AI status');
r = await T1('POST', '/teacher/ai', { task: 'lesson_plan', grade: 4, subject: 'Mathematics', topic: 'Fractions' }); ok(r.d.content.length > 10 && seen[0].includes('CAPS') && seen[0].includes('Grade 4'), 'AI lesson plan request is CAPS/grade aware');
r = await T1('POST', '/teacher/ai', { task: 'quiz', grade: 4, subject: 'Mathematics', topic: 'Fractions', count: 5 }); ok(r.d.quiz.length === 2 && r.d.quiz[0].type === 'mcq', 'AI quiz is validated into the editable quiz format');
ok((await T1('POST', '/teacher/ai', { task: 'hack', grade: 4, subject: 'x', topic: 'y' })).s === 400, 'unknown AI task rejected');
r = await T1('POST', '/teacher/ai/insights', { classroomId: cid }); const sent = seen[seen.length - 1]; ok(!sent.includes('Thabo') && !sent.includes('Mokoena') && sent.includes('Learner 1') && r.d.content.startsWith('Thabo needs help'), 'AI insights: learner names never sent to the AI, restored for the teacher');
ok((await L('POST', '/teacher/ai', { task: 'quiz' })).s === 403, 'learners cannot use the AI assistant');
// admin
await A('POST', '/auth/login', { email: 'admin@test.co.za', password: 'adminpass123' }); const t1id = (await A('GET', '/admin/users?role=teacher')).d.find(u => u.email === 't1@school.co.za').id;
ok((await A('PATCH', '/admin/users/' + t1id, { verified: true })).s === 200 && (await L('GET', '/classroom')).s === 200, 'admin verifies a teacher'); ok((await A('GET', '/admin/stats')).d.teachers === 2, 'admin stats count teachers');
// revocation
ok((await P('POST', `/parent/classroom/${cid}/learners/${thabo.id}/revoke`, {})).s === 200, 'parent revokes the link');
ok((await T1('GET', `/teacher/learners/${thabo.id}`)).s === 403 && (await T1('GET', `/teacher/classrooms/${cid}`)).d.members.length === 0 && (await L('GET', `/files/${fr}`)).s === 403 && (await L('GET', '/classroom')).d.classrooms.length === 0, 'after revocation the teacher loses access and the learner returns to self-learning');
await T1('POST', `/teacher/classrooms/${cid}/link`, { code: me.teacherCode }); const rid2 = (await L('GET', '/classroom')).d.requests[0].id; await L('POST', `/classroom/requests/${rid2}/respond`, { approve: false });
ok((await T1('GET', `/teacher/classrooms/${cid}`)).d.members.length === 0 && (await L('GET', '/classroom')).d.requests.length === 0, 'a declined request adds nobody');
await T1('POST', `/teacher/classrooms/${cid}/link`, { code: me.teacherCode }); const rid3 = (await L('GET', '/classroom')).d.requests[0].id; await P('POST', `/parent/classroom/requests/${rid3}/respond`, { approve: true, parentUpdates: true });
ok((await T1('GET', `/teacher/classrooms/${cid}`)).d.members[0].parentUpdates === true, 'a parent can approve a request and allow updates');
await L('POST', `/classroom/${cid}/leave`, {}); ok((await T1('GET', `/teacher/classrooms/${cid}`)).d.members.length === 0, 'a learner can leave a classroom');
srv.close(); console.log(fail ? `\n${fail} FAILED` : '\nTeacher portal tests passed'); process.exit(fail ? 1 : 0);
