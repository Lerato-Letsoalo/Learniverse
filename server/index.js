import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, INTERESTS, uniqueCode } from './db.js';
import mountClassroom from './classroom.js';
import nodemailer from 'nodemailer';
import { THEMES, DEFAULT_THEME, fillTokens, keywords, buildLessonQuiz, publicQuestion, gradeQ, shuffle, themesFor, quizName } from './quiz.js';
import { BUDDIES } from './buddies.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const app = express();
const PROD = process.env.NODE_ENV === 'production';
const COOKIE = 'lv_sid', DAY = 864e5;
const j = (s, d) => { try { return JSON.parse(s); } catch { return d; } };
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const today = () => new Date().toISOString().slice(0, 10);
const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Email: set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/MAIL_FROM in production. Without SMTP, messages are printed to the console (development only).
const mailer = process.env.SMTP_HOST ? nodemailer.createTransport({ host: process.env.SMTP_HOST, port: +process.env.SMTP_PORT || 587, secure: process.env.SMTP_SECURE === 'true', auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined }) : null;
export const outbox = [];
async function sendMail(to, subject, text) {
  if (mailer) return mailer.sendMail({ from: process.env.MAIL_FROM || 'Learniverse <no-reply@learniverse.local>', to, subject, text });
  if (!PROD) { outbox.push({ to, subject, text }); console.log(`\n[dev mail] To: ${to}\n${subject}\n${text}\n`); }
  else console.error('SMTP is not configured, so the password reset email could not be sent.');
}

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https://www.gstatic.com https://translate.googleapis.com https://www.google.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com https://translate.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://www.gstatic.com 'sha256-R6kjt5FwTd5vAw94Q08NLDZsSaGTzg4NsdIfKtECSp0='; connect-src 'self' https://translate.googleapis.com https://translate-pa.googleapis.com; frame-ancestors 'none'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});
app.use((req, res, next) => express.json({ limit: req.path === '/api/teacher/resources/upload' ? '8mb' : '50kb' })(req, res, next));
app.use('/api', (req, res, next) => { // CSRF defence: state-changing calls must be JSON (blocked cross-site by CORS preflight) + SameSite cookie
  if (req.method !== 'GET' && !(req.headers['content-type'] || '').includes('application/json')) return bad(res, 'JSON required', 415);
  next();
});
const hits = new Map();
const limit = (name, max, win) => (req, res, next) => {
  const k = name + req.ip, now = Date.now(), a = (hits.get(k) || []).filter(t => now - t < win);
  if (a.length >= max) return bad(res, 'Too many attempts. Please try again later.', 429);
  a.push(now); hits.set(k, a); next();
};

// ---------- auth ----------
app.use((req, res, next) => {
  const m = (req.headers.cookie || '').match(new RegExp(`${COOKIE}=([a-f0-9]+)`));
  if (m) {
    const s = db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>? AND u.active=1').get(sha(m[1]), Date.now());
    if (s) { req.user = s; db.prepare('UPDATE users SET last_seen=CURRENT_TIMESTAMP WHERE id=?').run(s.id); }
  }
  next();
});
const need = (...roles) => (req, res, next) => !req.user ? bad(res, 'Please log in', 401) : roles.length && !roles.includes(req.user.role) ? bad(res, 'Not allowed', 403) : next();
function startSession(res, uid) {
  const t = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(sha(t), uid, Date.now() + 14 * DAY);
  res.setHeader('Set-Cookie', `${COOKIE}=${t}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${14 * 86400}${PROD ? '; Secure' : ''}`);
}
const code6 = () => Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[crypto.randomInt(32)]).join('');

function publicUser(u) {
  const out = { id: u.id, name: u.name, email: u.email, role: u.role };
  if (u.role === 'learner') {
    const L = db.prepare('SELECT * FROM learners WHERE user_id=?').get(u.id);
    Object.assign(out, { grade: L.grade, interests: j(L.interests, []), prefs: j(L.prefs, {}), onboarded: !!L.onboarded, code: L.code, teacherCode: L.teacher_code, xp: L.xp, buddy: L.buddy });
  }
  if (u.role === 'teacher') { const t = db.prepare('SELECT * FROM teacher_profiles WHERE user_id=?').get(u.id); Object.assign(out, { kind: t.kind, organisation: t.organisation, verified: !!t.verified }); }
  return out;
}
app.post('/api/auth/register', limit('reg', 10, 15 * 60e3), (req, res) => {
  const name = str(req.body.name, 80), email = str(req.body.email, 120).toLowerCase(), pw = req.body.password, role = req.body.role;
  if (name.length < 2) return bad(res, 'Please enter your name');
  if (!EMAIL.test(email)) return bad(res, 'Please enter a valid email');
  if (typeof pw !== 'string' || pw.length < 8) return bad(res, 'Password must be at least 8 characters');
  if (!['learner', 'parent', 'teacher'].includes(role)) return bad(res, 'Choose learner, parent or teacher or tutor');
  if (!req.body.consent) return bad(res, role === 'learner' ? 'A parent or guardian must agree before a learner account is created' : role === 'teacher' ? 'Please confirm the teacher and tutor terms' : 'Please accept the privacy notice');
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email)) return bad(res, 'That email is already registered', 409);
  const id = Number(db.prepare('INSERT INTO users(name,email,hash,role) VALUES(?,?,?,?)').run(name, email, bcrypt.hashSync(pw, 12), role).lastInsertRowid);
  if (role === 'learner') db.prepare('INSERT INTO learners(user_id,code,teacher_code) VALUES(?,?,?)').run(id, code6(), uniqueCode('learners', 'teacher_code', 'TC-'));
  if (role === 'teacher') db.prepare('INSERT INTO teacher_profiles(user_id,kind,organisation) VALUES(?,?,?)').run(id, req.body.kind === 'tutor' ? 'tutor' : 'teacher', str(req.body.organisation, 100));
  startSession(res, id);
  res.status(201).json(publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(id)));
});
app.post('/api/auth/login', limit('login', 10, 15 * 60e3), (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(str(req.body.email, 120).toLowerCase());
  if (!u || !bcrypt.compareSync(String(req.body.password || ''), u.hash)) return bad(res, 'Email or password is incorrect', 401);
  if (!u.active) return bad(res, 'This account has been deactivated', 403);
  startSession(res, u.id);
  res.json(publicUser(u));
});
app.post('/api/auth/logout', (req, res) => {
  const m = (req.headers.cookie || '').match(new RegExp(`${COOKIE}=([a-f0-9]+)`));
  if (m) db.prepare('DELETE FROM sessions WHERE token=?').run(sha(m[1]));
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Path=/; Max-Age=0`);
  res.json({ ok: true });
});
app.post('/api/auth/forgot', limit('forgot', 5, 15 * 60e3), async (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE email=? AND active=1').get(str(req.body.email, 120).toLowerCase());
  if (u) {
    const t = crypto.randomBytes(32).toString('hex');
    db.prepare('DELETE FROM password_resets WHERE user_id=?').run(u.id);
    db.prepare('INSERT INTO password_resets VALUES(?,?,?)').run(sha(t), u.id, Date.now() + 3600e3);
    const base = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    try { await sendMail(u.email, 'Reset your Learniverse password', `Hi ${u.name.split(' ')[0]},\n\nUse this link within 1 hour to choose a new password:\n${base}/#/reset/${t}\n\nIf you did not ask for this, you can ignore this email. Your password has not changed.\n\nThe Learniverse team`); } catch (e) { console.error('mail failed:', e.message); }
  }
  res.json({ ok: true }); // identical answer whether or not the email exists, so accounts cannot be discovered
});
app.post('/api/auth/reset', limit('reset', 10, 15 * 60e3), (req, res) => {
  const pw = req.body.password, r = db.prepare('SELECT * FROM password_resets WHERE token=? AND expires>?').get(sha(String(req.body.token || '')), Date.now());
  if (typeof pw !== 'string' || pw.length < 8) return bad(res, 'Password must be at least 8 characters');
  if (!r) return bad(res, 'This reset link is invalid or has expired. Please request a new one.');
  db.prepare('UPDATE users SET hash=? WHERE id=?').run(bcrypt.hashSync(pw, 12), r.user_id);
  db.prepare('DELETE FROM password_resets WHERE user_id=?').run(r.user_id); db.prepare('DELETE FROM sessions WHERE user_id=?').run(r.user_id);
  res.json({ ok: true });
});
app.get('/api/buddies', (req, res) => res.json(BUDDIES));
app.get('/api/me', need(), (req, res) => res.json(publicUser(req.user)));
app.put('/api/me/profile', need('learner'), (req, res) => {
  const L = db.prepare('SELECT * FROM learners WHERE user_id=?').get(req.user.id);
  const b = req.body; let buddy = L.buddy; if (typeof b.buddy === 'string' && BUDDIES.some(x => x.slug === b.buddy)) buddy = b.buddy;
  let { grade, interests, prefs, onboarded } = { grade: L.grade, interests: j(L.interests, []), prefs: j(L.prefs, {}), onboarded: L.onboarded };
  if (b.grade !== undefined) { if (!Number.isInteger(b.grade) || b.grade < 1 || b.grade > 7) return bad(res, 'Grade must be 1 to 7'); grade = b.grade; onboarded = 1; }
  if (Array.isArray(b.interests)) interests = b.interests.filter(i => INTERESTS.includes(i)).slice(0, 9);
  if (b.prefs && typeof b.prefs === 'object') {
    const p = b.prefs;
    prefs = { textSize: Math.min(1.6, Math.max(0.9, +p.textSize || 1)), dyslexia: !!p.dyslexia, focus: !!p.focus, calm: !!p.calm, tts: !!p.tts, spacing: !!p.spacing, reduceMotion: !!p.reduceMotion, colorblind: ['none', 'deut', 'prot', 'trit'].includes(p.colorblind) ? p.colorblind : 'none' };
  }
  db.prepare('UPDATE learners SET grade=?,interests=?,prefs=?,onboarded=?,buddy=? WHERE user_id=?').run(grade, JSON.stringify(interests), JSON.stringify(prefs), onboarded, buddy, req.user.id);
  res.json(publicUser(req.user));
});

// ---------- gamification ----------
const STAGES = [['Seed', 0], ['Sprout', 50], ['Star', 150], ['Planet', 300], ['Galaxy', 600]];
const stage = xp => { let i = 0; STAGES.forEach(([, m], k) => { if (xp >= m) i = k; }); return { index: i, name: STAGES[i][0], next: STAGES[i + 1]?.[1] ?? null, stages: STAGES.map(s => s[0]) }; };
const BADGES = [
  ['first', 'First Launch', 'rocket', 'Complete your first lesson', s => s.lessons >= 1],
  ['five', 'Star Collector', 'star', 'Complete 5 lessons', s => s.lessons >= 5],
  ['quiz', 'Quiz Explorer', 'compass', 'Take 3 quizzes', s => s.quizzes >= 3],
  ['perfect', 'Perfect Orbit', 'planet', 'Score 100% on a quiz', s => s.perfect >= 1],
  ['streak', '3-Day Streak', 'flame', 'Learn 3 days in a row', s => s.streak >= 3],
  ['math', 'Maths Master', 'calculator', 'Complete 3 Mathematics lessons', s => s.math >= 3],
  ['xp100', 'Rocket Fuel', 'sparkles', 'Earn 100 XP', s => s.xp >= 100],
  ['xp300', 'Planet Hopper', 'trophy', 'Earn 300 XP', s => s.xp >= 300],
];
function stats(uid) {
  const L = db.prepare('SELECT xp,streak FROM learners WHERE user_id=?').get(uid);
  const c = sql => db.prepare(sql).get(uid).n;
  return { xp: L.xp, streak: L.streak,
    lessons: c('SELECT count(*) n FROM progress WHERE user_id=? AND done=1'),
    quizzes: c('SELECT count(*) n FROM attempts WHERE user_id=?'),
    perfect: c('SELECT count(*) n FROM attempts WHERE user_id=? AND pct=100'),
    math: c("SELECT count(*) n FROM progress p JOIN lessons l ON l.id=p.lesson_id JOIN subjects s ON s.id=l.subject_id WHERE p.user_id=? AND p.done=1 AND s.slug='maths'") };
}
const badges = uid => { const s = stats(uid); return BADGES.map(([id, name, icon, desc, t]) => ({ id, name, icon, desc, earned: t(s) })); };
function addXp(uid, n) {
  const L = db.prepare('SELECT last_day,streak FROM learners WHERE user_id=?').get(uid);
  let streak = L.streak;
  if (L.last_day !== today()) { const y = new Date(Date.now() - DAY).toISOString().slice(0, 10); streak = L.last_day === y ? streak + 1 : 1; }
  db.prepare('UPDATE learners SET xp=xp+?, streak=?, last_day=? WHERE user_id=?').run(n, streak, today(), uid);
}
const getLevel = (uid, sid) => db.prepare('SELECT level FROM levels WHERE user_id=? AND subject_id=?').get(uid, sid)?.level ?? 2;
const themeFor = (interests, seed) => THEMES[interests[seed % Math.max(1, interests.length)]] || DEFAULT_THEME;
const interestName = (interests, seed) => interests.length ? interests[seed % interests.length] : null;

// CAPS achievement levels (NPPPR)
const SCALE = [[80, 7, 'Outstanding'], [70, 6, 'Meritorious'], [60, 5, 'Substantial'], [50, 4, 'Adequate'], [40, 3, 'Moderate'], [30, 2, 'Elementary'], [0, 1, 'Not Achieved']];
const levelOf = p => { const r = SCALE.find(([m]) => p >= m); return { code: r[1], name: r[2] }; };
const REQ = { hl: 4, fal: 3, maths: 3 }; // minimum level; all other subjects need level 2 (Grade 7: three of them need level 3)
const COMMENT = { 7: 'Outstanding work. Keep shining and challenge yourself with harder missions.', 6: 'Meritorious effort. Just a little more practice for the top level.', 5: 'Substantial progress. You are building strong understanding.', 4: 'Adequate progress. Keep practising a little every day.', 3: 'Moderate progress. Revise the lesson notes and retry the quizzes.', 2: 'Elementary level. Short daily practice will help build confidence.', 1: 'A fresh start. Small daily steps and the hints will help you grow.' };

/** Lessons of a subject for a grade, in order, with unlock status. Only the first unfinished lesson is open. */
function course(uid, sid, grade) {
  const rows = db.prepare(`SELECT l.id,l.title,l.xp,l.mins,l.pos,m.id mid,m.pos mpos,m.title mtitle,coalesce(p.done,0) done,coalesce(p.best,0) best,coalesce(p.attempts,0) attempts,coalesce(p.pct,0) pct
    FROM lessons l JOIN modules m ON m.id=l.module_id LEFT JOIN progress p ON p.lesson_id=l.id AND p.user_id=? WHERE l.subject_id=? AND l.grade=? ORDER BY m.pos,l.pos`).all(uid, sid, grade);
  let open = true;
  rows.forEach((r, i) => {
    r.num = i + 1;
    if (r.done) r.status = 'done';
    else if (open) { r.status = (r.pct > 0 || r.attempts > 0) ? 'progress' : 'current'; open = false; }
    else { r.status = 'locked'; const first = i === 0 || rows[i - 1].mid !== r.mid; r.lock = first ? `Complete Module ${r.mpos - 1}` : `Complete Lesson ${r.num - 1}`; }
  });
  return rows;
}
function summary(uid) {
  const L = db.prepare('SELECT * FROM learners WHERE user_id=?').get(uid);
  const subjects = db.prepare(`SELECT s.id,s.slug,s.name,s.icon,s.blurb,
    (SELECT count(*) FROM lessons l WHERE l.subject_id=s.id AND l.grade=@g) total,
    (SELECT coalesce(sum(xp),0) FROM lessons l WHERE l.subject_id=s.id AND l.grade=@g) xp,
    (SELECT count(*) FROM progress p JOIN lessons l ON l.id=p.lesson_id WHERE p.user_id=@u AND p.done=1 AND l.subject_id=s.id AND l.grade=@g) done,
    coalesce((SELECT level FROM levels WHERE user_id=@u AND subject_id=s.id),2) level,
    (SELECT round(avg(pct)) FROM attempts a WHERE a.user_id=@u AND a.subject_id=s.id) avg FROM subjects s`).all({ g: L.grade ?? 0, u: uid }).filter(s => s.total > 0);
  return { grade: L.grade, xp: L.xp, streak: L.streak, journey: stage(L.xp), subjects, badges: badges(uid), interests: j(L.interests, []), stats: stats(uid),
    recent: db.prepare('SELECT a.pct,a.at,l.title,s.name subject FROM attempts a LEFT JOIN lessons l ON l.id=a.lesson_id JOIN subjects s ON s.id=a.subject_id WHERE a.user_id=? ORDER BY a.id DESC LIMIT 8').all(uid) };
}

// ---------- learner ----------
app.get('/api/dashboard', need('learner'), (req, res) => {
  const d = summary(req.user.id);
  const open = [...d.subjects].filter(s => s.done < s.total).sort((a, b) => (a.level - b.level) || (a.done / a.total - b.done / b.total))[0];
  const nx = open && course(req.user.id, open.id, d.grade).find(r => r.status === 'current' || r.status === 'progress');
  d.next = nx ? { id: nx.id, title: nx.title, subject: open.name, status: nx.status } : null;
  res.json(d);
});
app.get('/api/subjects/:id', need('learner'), (req, res) => {
  const L = db.prepare('SELECT grade FROM learners WHERE user_id=?').get(req.user.id);
  const subject = db.prepare('SELECT * FROM subjects WHERE id=?').get(+req.params.id);
  if (!subject) return bad(res, 'Subject not found', 404);
  const rows = course(req.user.id, subject.id, L.grade);
  const mods = [];
  rows.forEach(r => { let m = mods.find(x => x.id === r.mid); if (!m) mods.push(m = { id: r.mid, pos: r.mpos, title: r.mtitle, lessons: [] }); m.lessons.push(r); });
  const done = rows.filter(r => r.done).length, total = rows.length;
  res.json({ subject, grade: L.grade, level: getLevel(req.user.id, subject.id), modules: mods, totalXp: rows.reduce((a, r) => a + r.xp, 0),
    progress: { done, total, pct: total ? Math.round(100 * done / total) : 0 },
    rewards: [{ name: `${subject.name} Master`, desc: 'Complete all modules', icon: 'trophy', earned: total > 0 && done === total },
      { name: 'High Flyer', desc: 'Score 80% or more in 3 lessons', icon: 'medal', earned: rows.filter(r => r.best >= 80).length >= 3 }] });
});
function openLesson(uid, id) {
  const l = db.prepare('SELECT l.*,s.name subject,s.icon,s.slug FROM lessons l JOIN subjects s ON s.id=l.subject_id WHERE l.id=?').get(id);
  if (!l) return { code: 404, msg: 'Lesson not found' };
  const L = db.prepare('SELECT * FROM learners WHERE user_id=?').get(uid);
  if (l.grade !== L.grade) return { code: 403, msg: 'This lesson is for another grade' };
  const c = course(uid, l.subject_id, l.grade).find(r => r.id === l.id);
  if (c.status === 'locked') return { code: 403, msg: `${c.lock} to unlock this lesson` };
  return { l, L, c };
}
app.get('/api/lessons/:id', need('learner'), (req, res) => {
  const o = openLesson(req.user.id, +req.params.id);
  if (o.code) return bad(res, o.msg, o.code);
  const { l, L, c } = o, interests = j(L.interests, []), th = themeFor(interests, l.id + l.grade), level = getLevel(req.user.id, l.subject_id);
  res.json({ id: l.id, title: l.title, subject: l.subject, subject_id: l.subject_id, icon: l.icon, grade: l.grade, xp: l.xp, mins: l.mins, steps: j(l.steps, []), level, mode: ['guided', 'standard', 'challenge'][level - 1],
    notes: { interest: interestName(interests, l.id + l.grade), mnemonic: fillTokens(l.mnemonic, th), example: fillTokens(l.example, th) },
    status: c.status, pct: c.pct, progress: db.prepare('SELECT done,best,attempts FROM progress WHERE user_id=? AND lesson_id=?').get(req.user.id, l.id) || { done: 0, best: 0, attempts: 0 } });
});
app.post('/api/lessons/:id/step', need('learner'), (req, res) => {
  const o = openLesson(req.user.id, +req.params.id);
  if (o.code) return bad(res, o.msg, o.code);
  const pct = Math.max(0, Math.min(99, Math.round(+req.body.pct || 0)));
  db.prepare('INSERT INTO progress(user_id,lesson_id,pct) VALUES(?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET pct=max(pct,excluded.pct)').run(req.user.id, o.l.id, pct);
  res.json({ ok: true });
});

function lessonQuestions(l, slug, interests, level) {
  const pool = db.prepare('SELECT steps FROM lessons WHERE subject_id=? AND id!=?').all(l.subject_id, l.id).flatMap(r => j(r.steps, []).flatMap(keywords));
  return buildLessonQuiz({ title: l.title, steps: j(l.steps, []), kind: l.kind, grade: l.grade, level, themes: themesFor(interests), pool, slug });
}
app.post('/api/quiz', need('learner'), (req, res) => {
  const L = db.prepare('SELECT * FROM learners WHERE user_id=?').get(req.user.id), interests = j(L.interests, []);
  let qs = [], lessonId = null, sid, title, xp = 0;
  if (+req.body.lessonId) {
    const o = openLesson(req.user.id, +req.body.lessonId);
    if (o.code) return bad(res, o.msg, o.code);
    lessonId = o.l.id; sid = o.l.subject_id; xp = o.l.xp; title = quizName(o.l.slug, o.l.kind, o.l.title);
    qs = lessonQuestions(o.l, o.l.slug, interests, getLevel(req.user.id, sid));
  } else {
    sid = +req.body.subjectId; const s = db.prepare('SELECT name,slug FROM subjects WHERE id=?').get(sid);
    if (!s) return bad(res, 'Subject not found', 404);
    const done = db.prepare('SELECT l.* FROM lessons l JOIN progress p ON p.lesson_id=l.id AND p.user_id=? AND p.done=1 WHERE l.subject_id=? AND l.grade=?').all(req.user.id, sid, L.grade);
    if (!done.length) return bad(res, 'Complete a lesson first, then you can take the full subject quiz');
    title = ['hl', 'fal'].includes(s.slug) ? 'Vocabulary Builder' : `${s.name} review quiz`;
    qs = shuffle(done.flatMap(l => lessonQuestions(l, s.slug, interests, getLevel(req.user.id, sid)).slice(0, 2))).slice(0, 8);
  }
  const id = crypto.randomUUID(), level = getLevel(req.user.id, sid);
  db.prepare('INSERT INTO quiz_sessions(id,user_id,lesson_id,subject_id,qs,created) VALUES(?,?,?,?,?,?)').run(id, req.user.id, lessonId, sid, JSON.stringify(qs), Date.now());
  res.json({ id, level, title, xp, questions: qs.map(q => publicQuestion(q, level === 1)) });
});
const PASS = 50;
app.post('/api/quiz/:id/submit', need('learner'), (req, res) => {
  const s = db.prepare('SELECT * FROM quiz_sessions WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!s) return bad(res, 'Quiz not found', 404);
  if (s.done) return bad(res, 'This quiz was already submitted', 409);
  const qs = j(s.qs, []), ans = Array.isArray(req.body.answers) ? req.body.answers : [];
  const results = qs.map((q, i) => { const f = gradeQ(q, ans[i]); return { score: f, ok: f === 1, shown: q.show, explain: q.explain, type: q.type }; });
  const pct = Math.round(100 * results.reduce((a, r) => a + r.score, 0) / qs.length), right = results.filter(r => r.ok).length;
  const before = badges(req.user.id).filter(b => b.earned).map(b => b.id);
  db.prepare('UPDATE quiz_sessions SET done=1 WHERE id=?').run(s.id);
  db.prepare('INSERT INTO attempts(user_id,lesson_id,subject_id,pct) VALUES(?,?,?,?)').run(req.user.id, s.lesson_id, s.subject_id, pct);
  let xpGained = right * 3 + (pct === 100 ? 10 : 0), passed = pct >= PASS, unlockedNext = null;
  if (s.lesson_id) {
    const l = db.prepare('SELECT * FROM lessons WHERE id=?').get(s.lesson_id), was = db.prepare('SELECT done FROM progress WHERE user_id=? AND lesson_id=?').get(req.user.id, l.id)?.done;
    db.prepare('INSERT INTO progress(user_id,lesson_id,best,attempts,done,pct) VALUES(?,?,?,1,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET best=max(best,excluded.best), attempts=attempts+1, done=max(done,excluded.done), pct=CASE WHEN excluded.done=1 THEN 100 ELSE pct END, updated=CURRENT_TIMESTAMP')
      .run(req.user.id, l.id, pct, passed ? 1 : 0, passed ? 100 : 0);
    if (passed && !was) { xpGained += l.xp; const nx = course(req.user.id, l.subject_id, l.grade).find(r => r.status === 'current'); if (nx) unlockedNext = { id: nx.id, title: nx.title }; }
  }
  addXp(req.user.id, xpGained);
  // adaptive engine: average of the last 5 quiz scores in this subject moves the learner between Guided / Standard / Challenge
  const last = db.prepare('SELECT pct FROM attempts WHERE user_id=? AND subject_id=? ORDER BY id DESC LIMIT 5').all(req.user.id, s.subject_id).map(r => r.pct);
  const avg = last.reduce((a, b) => a + b, 0) / last.length, old = getLevel(req.user.id, s.subject_id);
  const level = avg >= 80 && last.length >= 2 ? Math.min(3, old + 1) : avg < 50 ? Math.max(1, old - 1) : old;
  db.prepare('INSERT INTO levels VALUES(?,?,?) ON CONFLICT(user_id,subject_id) DO UPDATE SET level=excluded.level').run(req.user.id, s.subject_id, level);
  const advice = level > old ? 'Amazing progress! Harder missions are now unlocked for you.' : level < old ? 'Great effort. We will give you friendlier questions and extra hints. Read the corrections, then try again.'
    : pct >= 90 ? 'Outstanding! You are a true star.' : pct >= 70 ? 'Great job! You are doing really well.' : passed ? 'Well done, you passed! Every try makes your brain stronger.' : 'Good try! Learning takes practice. Read the corrections below, then try again. You can do it.';
  res.json({ pct, right, total: qs.length, passed, results, xpGained, level, levelChange: level - old, advice, unlockedNext, achievement: levelOf(pct), newBadges: badges(req.user.id).filter(b => b.earned && !before.includes(b.id)) });
});
app.get('/api/badges', need('learner'), (req, res) => res.json({ badges: badges(req.user.id), journey: stage(stats(req.user.id).xp) }));
app.get('/api/leaderboard', need('learner'), (req, res) => {
  const L = db.prepare('SELECT grade FROM learners WHERE user_id=?').get(req.user.id);
  const rows = db.prepare("SELECT u.id,u.name,l.xp,l.buddy FROM learners l JOIN users u ON u.id=l.user_id WHERE l.grade=? AND u.active=1 ORDER BY l.xp DESC, u.id LIMIT 10").all(L.grade);
  res.json({ grade: L.grade, rows: rows.map((r, i) => ({ rank: i + 1, name: r.name.split(' ')[0], buddy: r.buddy, xp: r.xp, stage: stage(r.xp).name, me: r.id === req.user.id })) });
});

// ---------- report card (NPPPR promotion requirements) ----------
function report(uid) {
  const L = db.prepare('SELECT grade FROM learners WHERE user_id=?').get(uid), g = L.grade ?? 0;
  const rows = [];
  for (const s of db.prepare('SELECT * FROM subjects').all()) {
    const ls = db.prepare('SELECT p.best,p.done,p.attempts FROM lessons l LEFT JOIN progress p ON p.lesson_id=l.id AND p.user_id=? WHERE l.subject_id=? AND l.grade=?').all(uid, s.id, g);
    if (!ls.length) continue;
    const att = ls.filter(x => x.attempts > 0), mark = att.length ? Math.round(att.reduce((a, x) => a + x.best, 0) / att.length) : null, lv = mark == null ? null : levelOf(mark);
    rows.push({ slug: s.slug, name: s.name, icon: s.icon, mark, code: lv?.code ?? null, descriptor: lv?.name ?? 'Not yet assessed', done: ls.filter(x => x.done).length, total: ls.length, required: REQ[s.slug] ?? 2,
      comment: lv ? COMMENT[lv.code] : 'No quizzes completed yet. Start the first lesson to earn a mark.' });
  }
  const others = rows.filter(r => !REQ[r.slug]);
  rows.forEach(r => { r.status = r.mark == null ? 'pending' : r.code >= r.required ? 'met' : 'not_met'; });
  const assessed = rows.filter(r => r.mark != null), notes = rows.filter(r => r.status === 'not_met').map(r => `${r.name}: Level ${r.code}, needs at least Level ${r.required}`);
  const gr7Ok = g < 7 || others.filter(r => r.code >= 3).length >= Math.min(3, others.length);
  const allAssessed = rows.length > 0 && assessed.length === rows.length;
  if (g === 7 && allAssessed && !gr7Ok) notes.push('Grade 7 needs Level 3 or higher in any three subjects besides Home Language, First Additional Language and Mathematics');
  const verdict = !assessed.length ? 'not_started' : notes.length ? 'at_risk' : allAssessed ? 'meets' : 'on_track';
  const avg = assessed.length ? Math.round(assessed.reduce((a, r) => a + r.mark, 0) / assessed.length) : null;
  return { grade: g, phase: g <= 3 ? 'Foundation Phase' : g <= 6 ? 'Intermediate Phase' : 'Senior Phase', rows, average: avg, overall: avg == null ? null : levelOf(avg), verdict, notes,
    scale: SCALE.map(([m, code, name], i) => ({ code, name, range: i === 0 ? '80-100%' : `${m}-${SCALE[i - 1][0] - 1}%` })) };
}
app.get('/api/report', need('learner'), (req, res) => res.json(report(req.user.id)));

// ---------- study plan (set by the parent, read-only for the learner) ----------
function plan(uid) {
  const p = db.prepare('SELECT * FROM study_plans WHERE learner_id=?').get(uid);
  if (p) return { subjects: j(p.subjects, []), exam: p.exam, hours: p.hours, view: p.view, saved: true };
  const L = db.prepare('SELECT grade FROM learners WHERE user_id=?').get(uid);
  const names = db.prepare('SELECT DISTINCT s.name,s.slug FROM subjects s JOIN lessons l ON l.subject_id=s.id WHERE l.grade=?').all(L.grade ?? 0);
  const order = ['maths', 'hl', 'fal'];
  names.sort((a, b) => (order.indexOf(a.slug) + 1 || 9) - (order.indexOf(b.slug) + 1 || 9));
  return { subjects: names.slice(0, 6).map((s, i) => ({ name: s.name, priority: i + 1 })), exam: '', hours: 2, view: 'weekly', saved: false };
}
app.get('/api/plan', need('learner'), (req, res) => res.json(plan(req.user.id)));
const linked = (pid, lid) => !!db.prepare('SELECT 1 FROM parent_links WHERE parent_id=? AND learner_id=?').get(pid, lid);

// ---------- parent ----------
app.get('/api/parent/children', need('parent'), (req, res) => {
  const kids = db.prepare('SELECT u.id,u.name,u.last_seen FROM parent_links p JOIN users u ON u.id=p.learner_id WHERE p.parent_id=?').all(req.user.id);
  res.json(kids.map(k => ({ ...k, ...summary(k.id), report: report(k.id), plan: plan(k.id),
    lessons: db.prepare('SELECT l.title,s.name subject,p.best,p.attempts,p.updated FROM progress p JOIN lessons l ON l.id=p.lesson_id JOIN subjects s ON s.id=l.subject_id WHERE p.user_id=? AND p.done=1 ORDER BY p.updated DESC').all(k.id) })));
});
app.put('/api/parent/plan/:id', need('parent'), (req, res) => {
  const lid = +req.params.id;
  if (!linked(req.user.id, lid)) return bad(res, 'Learner not linked to your account', 403);
  const b = req.body, subs = (Array.isArray(b.subjects) ? b.subjects : []).slice(0, 12).map(s => ({ name: str(s.name, 60), priority: Math.max(1, Math.min(20, Math.round(+s.priority) || 1)) })).filter(s => s.name);
  if (!subs.length) return bad(res, 'Add at least one subject');
  const hours = Math.max(0.5, Math.min(8, +b.hours || 2)), exam = /^\d{4}-\d{2}-\d{2}$/.test(b.exam || '') ? b.exam : '', view = b.view === 'monthly' ? 'monthly' : 'weekly';
  db.prepare('INSERT INTO study_plans(learner_id,subjects,exam,hours,view) VALUES(?,?,?,?,?) ON CONFLICT(learner_id) DO UPDATE SET subjects=excluded.subjects,exam=excluded.exam,hours=excluded.hours,view=excluded.view,updated=CURRENT_TIMESTAMP')
    .run(lid, JSON.stringify(subs), exam, hours, view);
  res.json(plan(lid));
});
app.post('/api/parent/link', need('parent'), limit('link', 10, 15 * 60e3), (req, res) => {
  const L = db.prepare('SELECT user_id FROM learners WHERE code=?').get(str(req.body.code, 10).toUpperCase());
  if (!L) return bad(res, 'That family code was not found', 404);
  db.prepare('INSERT OR IGNORE INTO parent_links VALUES(?,?)').run(req.user.id, L.user_id);
  res.json({ ok: true });
});
app.delete('/api/parent/link/:id', need('parent'), (req, res) => { db.prepare('DELETE FROM parent_links WHERE parent_id=? AND learner_id=?').run(req.user.id, +req.params.id); res.json({ ok: true }); });

// ---------- contact ----------
app.post('/api/contact', limit('contact', 5, 60 * 60e3), (req, res) => {
  const name = str(req.body.name, 80), email = str(req.body.email, 120), message = str(req.body.message, 2000);
  if (name.length < 2 || !EMAIL.test(email) || message.length < 10) return bad(res, 'Please fill in your name, a valid email and a message (10+ characters)');
  db.prepare('INSERT INTO enquiries(name,email,message) VALUES(?,?,?)').run(name, email, message);
  res.status(201).json({ ok: true });
});

// ---------- admin ----------
const admin = need('admin');
app.get('/api/admin/stats', admin, (req, res) => {
  const n = (sql, ...a) => db.prepare(sql).get(...a).n;
  res.json({
    learners: n("SELECT count(*) n FROM users WHERE role='learner'"), teachers: n("SELECT count(*) n FROM users WHERE role='teacher'"), classrooms: n('SELECT count(*) n FROM classrooms WHERE archived=0'), parents: n("SELECT count(*) n FROM users WHERE role='parent'"),
    active7: n("SELECT count(*) n FROM users WHERE role!='admin' AND last_seen>=datetime('now','-7 day')"),
    lessonsDone: n('SELECT count(*) n FROM progress WHERE done=1'), quizzes: n('SELECT count(*) n FROM attempts'),
    avgScore: n('SELECT coalesce(round(avg(pct)),0) n FROM attempts'), newEnquiries: n("SELECT count(*) n FROM enquiries WHERE status='new'"),
    lessons: n('SELECT count(*) n FROM lessons'),
    grades: db.prepare('SELECT grade,count(*) n FROM learners WHERE grade IS NOT NULL GROUP BY grade ORDER BY grade').all(),
    subjects: db.prepare('SELECT s.name,count(DISTINCT l.id) lessons,count(p.lesson_id) completions,(SELECT round(avg(pct)) FROM attempts a WHERE a.subject_id=s.id) avg FROM subjects s LEFT JOIN lessons l ON l.subject_id=s.id LEFT JOIN progress p ON p.lesson_id=l.id AND p.done=1 GROUP BY s.id').all() });
});
app.get('/api/admin/users', admin, (req, res) => {
  const q = `%${str(req.query.q, 60)}%`, role = ['learner', 'parent', 'admin', 'teacher'].includes(req.query.role) ? req.query.role : '%';
  res.json(db.prepare('SELECT u.id,u.name,u.email,u.role,u.active,u.created,u.last_seen,l.grade,l.xp,t.verified,t.kind FROM users u LEFT JOIN learners l ON l.user_id=u.id LEFT JOIN teacher_profiles t ON t.user_id=u.id WHERE (u.name LIKE ? OR u.email LIKE ?) AND u.role LIKE ? ORDER BY u.id DESC LIMIT 200').all(q, q, role));
});
app.patch('/api/admin/users/:id', admin, (req, res) => {
  const id = +req.params.id, u = db.prepare('SELECT * FROM users WHERE id=?').get(id);
  if (!u) return bad(res, 'User not found', 404);
  if (id === req.user.id && (req.body.active === false || (req.body.role && req.body.role !== 'admin'))) return bad(res, 'You cannot lock yourself out');
  if (typeof req.body.active === 'boolean') { db.prepare('UPDATE users SET active=? WHERE id=?').run(+req.body.active, id); if (!req.body.active) db.prepare('DELETE FROM sessions WHERE user_id=?').run(id); }
  if (typeof req.body.verified === 'boolean' && u.role === 'teacher') db.prepare('UPDATE teacher_profiles SET verified=? WHERE user_id=?').run(+req.body.verified, id);
  if (['parent', 'admin'].includes(req.body.role) && ['parent', 'admin'].includes(u.role)) db.prepare('UPDATE users SET role=? WHERE id=?').run(req.body.role, id);
  if (typeof req.body.password === 'string') { if (req.body.password.length < 8) return bad(res, 'Password must be at least 8 characters'); db.prepare('UPDATE users SET hash=? WHERE id=?').run(bcrypt.hashSync(req.body.password, 12), id); db.prepare('DELETE FROM sessions WHERE user_id=?').run(id); }
  res.json({ ok: true });
});
app.delete('/api/admin/users/:id', admin, (req, res) => {
  if (+req.params.id === req.user.id) return bad(res, 'You cannot delete yourself');
  db.prepare('DELETE FROM users WHERE id=?').run(+req.params.id); res.json({ ok: true });
});
app.get('/api/admin/subjects', admin, (req, res) => res.json(db.prepare('SELECT id,name FROM subjects').all()));
app.get('/api/admin/lessons', admin, (req, res) => {
  const rows = db.prepare('SELECT l.*,m.title module FROM lessons l JOIN modules m ON m.id=l.module_id WHERE l.subject_id=? AND l.grade=? ORDER BY m.pos,l.pos').all(+req.query.subject, +req.query.grade);
  res.json(rows.map(l => ({ ...l, steps: j(l.steps, []) })));
});
function saveLesson(req, res, id) {
  const b = req.body, title = str(b.title, 120), steps = (Array.isArray(b.steps) ? b.steps : []).map(s => str(s, 400)).filter(Boolean), modTitle = str(b.module, 100) || 'General';
  const kind = ['static', 'add', 'sub', 'mul', 'div', 'frac', 'geo', 'pattern', 'word'].includes(b.kind) ? b.kind : 'static';
  if (!title || !steps.length || !db.prepare('SELECT 1 FROM subjects WHERE id=?').get(+b.subject_id) || !(b.grade >= 1 && b.grade <= 7)) return bad(res, 'Title, steps, subject and grade (1-7) are required');
  if (kind === 'static' && !steps.some(s => /\*.+?\*/.test(s))) return bad(res, 'Mark at least one key word with *asterisks* so quizzes can be generated');
  let m = db.prepare('SELECT id FROM modules WHERE subject_id=? AND grade=? AND title=?').get(+b.subject_id, b.grade, modTitle);
  if (!m) m = { id: Number(db.prepare('INSERT INTO modules(subject_id,grade,pos,title) VALUES(?,?,(SELECT coalesce(max(pos),0)+1 FROM modules WHERE subject_id=? AND grade=?),?)').run(+b.subject_id, b.grade, +b.subject_id, b.grade, modTitle).lastInsertRowid) };
  const xp = Math.min(200, Math.max(5, +b.xp || 15)), mins = Math.min(90, Math.max(3, +b.mins || 12)), mn = str(b.mnemonic, 300), ex = str(b.example, 400);
  if (id) db.prepare('UPDATE lessons SET subject_id=?,module_id=?,grade=?,title=?,steps=?,mnemonic=?,example=?,kind=?,xp=?,mins=? WHERE id=?').run(+b.subject_id, m.id, b.grade, title, JSON.stringify(steps), mn, ex, kind, xp, mins, id);
  else { const pos = db.prepare('SELECT coalesce(max(pos),0)+1 n FROM lessons WHERE subject_id=? AND grade=?').get(+b.subject_id, b.grade).n; id = Number(db.prepare('INSERT INTO lessons(subject_id,module_id,grade,pos,title,steps,mnemonic,example,kind,xp,mins) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(+b.subject_id, m.id, b.grade, pos, title, JSON.stringify(steps), mn, ex, kind, xp, mins).lastInsertRowid); }
  db.prepare('DELETE FROM modules WHERE subject_id=? AND grade=? AND id NOT IN (SELECT module_id FROM lessons)').run(+b.subject_id, b.grade);
  res.json({ id });
}
app.post('/api/admin/lessons', admin, (req, res) => saveLesson(req, res, 0));
app.put('/api/admin/lessons/:id', admin, (req, res) => saveLesson(req, res, +req.params.id));
app.delete('/api/admin/lessons/:id', admin, (req, res) => { db.prepare('DELETE FROM lessons WHERE id=?').run(+req.params.id); res.json({ ok: true }); });
app.get('/api/admin/enquiries', admin, (req, res) => res.json(db.prepare('SELECT * FROM enquiries WHERE status LIKE ? ORDER BY id DESC LIMIT 200').all(['new', 'in_progress', 'resolved'].includes(req.query.status) ? req.query.status : '%')));
app.patch('/api/admin/enquiries/:id', admin, (req, res) => {
  const st = ['new', 'in_progress', 'resolved'].includes(req.body.status) ? req.body.status : null;
  if (!st) return bad(res, 'Invalid status');
  db.prepare('UPDATE enquiries SET status=?,note=?,updated=CURRENT_TIMESTAMP WHERE id=?').run(st, str(req.body.note, 2000), +req.params.id); res.json({ ok: true });
});
app.delete('/api/admin/enquiries/:id', admin, (req, res) => { db.prepare('DELETE FROM enquiries WHERE id=?').run(+req.params.id); res.json({ ok: true }); });

mountClassroom(app, { db, need, bad, str, j, report, summary, uniqueCode });
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api', (req, res) => bad(res, 'Not found', 404));
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: PROD ? '1h' : 0,
  setHeaders(res, file) {
    if (/\.(?:html|js|css)$/.test(file)) res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  },
}));
app.use((err, req, res, next) => { console.error(err); bad(res, 'Something went wrong on our side', 500); });

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Learniverse running on http://localhost:${port}`));
}
