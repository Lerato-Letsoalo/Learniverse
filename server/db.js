import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { SUBJECTS, CONTENT } from './seed.js';

export function uniqueCode(table, col, prefix = '') {
  for (;;) { const c = prefix + Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[crypto.randomInt(32)]).join(''); if (!db.prepare(`SELECT 1 FROM ${table} WHERE ${col}=?`).get(c)) return c; }
}

const file = process.env.DB_PATH || './data/learniverse.db';
if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
export const db = new DatabaseSync(file);
export const INTERESTS = ['Football','Netball','Music','Animals','Art','Gaming','Space','Dinosaurs','Cars'];
const VERSION = 3;

// Schema v3 changed the curriculum model (modules, phases). Older databases are rebuilt.
if (db.prepare('PRAGMA user_version').get().user_version < VERSION) {
  db.exec('PRAGMA foreign_keys=OFF');
  for (const { name } of db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()) db.exec(`DROP TABLE IF EXISTS "${name}"`);
}
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN('learner','parent','admin','teacher')), active INTEGER DEFAULT 1, created TEXT DEFAULT CURRENT_TIMESTAMP, last_seen TEXT);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, expires INTEGER);
CREATE TABLE IF NOT EXISTS learners(user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, grade INTEGER, interests TEXT DEFAULT '[]', prefs TEXT DEFAULT '{}', xp INTEGER DEFAULT 0, streak INTEGER DEFAULT 0, last_day TEXT, code TEXT UNIQUE, onboarded INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS parent_links(parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE, learner_id INTEGER REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY(parent_id,learner_id));
CREATE TABLE IF NOT EXISTS subjects(id INTEGER PRIMARY KEY, slug TEXT UNIQUE, name TEXT, icon TEXT, blurb TEXT);
CREATE TABLE IF NOT EXISTS modules(id INTEGER PRIMARY KEY, subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE, grade INTEGER, pos INTEGER, title TEXT);
CREATE TABLE IF NOT EXISTS lessons(id INTEGER PRIMARY KEY, subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE, module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE, grade INTEGER, pos INTEGER, title TEXT, steps TEXT, mnemonic TEXT DEFAULT '', example TEXT DEFAULT '', kind TEXT DEFAULT 'static', xp INTEGER DEFAULT 15, mins INTEGER DEFAULT 12);
CREATE TABLE IF NOT EXISTS progress(user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE, done INTEGER DEFAULT 0, best INTEGER DEFAULT 0, attempts INTEGER DEFAULT 0, pct INTEGER DEFAULT 0, updated TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id,lesson_id));
CREATE TABLE IF NOT EXISTS attempts(id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, lesson_id INTEGER, subject_id INTEGER, pct INTEGER, at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS levels(user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, subject_id INTEGER, level INTEGER DEFAULT 2, PRIMARY KEY(user_id,subject_id));
CREATE TABLE IF NOT EXISTS quiz_sessions(id TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, lesson_id INTEGER, subject_id INTEGER, qs TEXT, created INTEGER, done INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS study_plans(learner_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, subjects TEXT, exam TEXT DEFAULT '', hours REAL DEFAULT 2, view TEXT DEFAULT 'weekly', updated TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS password_resets(token TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, expires INTEGER);
CREATE TABLE IF NOT EXISTS enquiries(id INTEGER PRIMARY KEY, name TEXT, email TEXT, message TEXT, status TEXT DEFAULT 'new', note TEXT DEFAULT '', created TEXT DEFAULT CURRENT_TIMESTAMP, updated TEXT);
PRAGMA user_version=${VERSION};
`);

if (!db.prepare('PRAGMA table_info(learners)').all().some(c => c.name === 'buddy')) db.exec('ALTER TABLE learners ADD COLUMN buddy TEXT'); // additive migration, keeps existing data

// ---- additive migrations (existing accounts, progress and lessons are preserved) ----
const usersSql = db.prepare("SELECT sql FROM sqlite_master WHERE name='users'").get()?.sql || '';
if (!usersSql.includes("'teacher'")) { // widen the role CHECK so teacher accounts are allowed
  db.exec('PRAGMA foreign_keys=OFF');
  db.exec(`BEGIN; CREATE TABLE users_new(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN('learner','parent','admin','teacher')), active INTEGER DEFAULT 1, created TEXT DEFAULT CURRENT_TIMESTAMP, last_seen TEXT);
    INSERT INTO users_new(id,name,email,hash,role,active,created,last_seen) SELECT id,name,email,hash,role,active,created,last_seen FROM users; DROP TABLE users; ALTER TABLE users_new RENAME TO users; COMMIT;`);
  db.exec('PRAGMA foreign_keys=ON');
}
if (!db.prepare('PRAGMA table_info(learners)').all().some(c => c.name === 'teacher_code')) db.exec('ALTER TABLE learners ADD COLUMN teacher_code TEXT');
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_learners_tcode ON learners(teacher_code)');
db.exec(`
CREATE TABLE IF NOT EXISTS teacher_profiles(user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, kind TEXT DEFAULT 'teacher', organisation TEXT DEFAULT '', verified INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS classrooms(id INTEGER PRIMARY KEY, teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, grade INTEGER, subject_id INTEGER, description TEXT DEFAULT '', instructions TEXT DEFAULT '', archived INTEGER DEFAULT 0, created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS link_requests(id INTEGER PRIMARY KEY, classroom_id INTEGER REFERENCES classrooms(id) ON DELETE CASCADE, learner_id INTEGER REFERENCES users(id) ON DELETE CASCADE, code TEXT, status TEXT DEFAULT 'pending', decided_by INTEGER, created TEXT DEFAULT CURRENT_TIMESTAMP, decided TEXT);
CREATE TABLE IF NOT EXISTS members(classroom_id INTEGER REFERENCES classrooms(id) ON DELETE CASCADE, learner_id INTEGER REFERENCES users(id) ON DELETE CASCADE, parent_updates INTEGER DEFAULT 0, joined TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(classroom_id,learner_id));
CREATE TABLE IF NOT EXISTS announcements(id INTEGER PRIMARY KEY, classroom_id INTEGER REFERENCES classrooms(id) ON DELETE CASCADE, title TEXT, body TEXT, created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS assignments(id INTEGER PRIMARY KEY, classroom_id INTEGER REFERENCES classrooms(id) ON DELETE CASCADE, type TEXT, title TEXT, instructions TEXT DEFAULT '', lesson_id INTEGER, quiz TEXT, due TEXT, max_marks REAL DEFAULT 10, published INTEGER DEFAULT 0, source TEXT DEFAULT 'manual', created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS submissions(id INTEGER PRIMARY KEY, assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE, learner_id INTEGER REFERENCES users(id) ON DELETE CASCADE, answers TEXT, text TEXT, score REAL, max REAL, feedback TEXT DEFAULT '', status TEXT DEFAULT 'submitted', submitted TEXT DEFAULT CURRENT_TIMESTAMP, graded TEXT, UNIQUE(assignment_id,learner_id));
CREATE TABLE IF NOT EXISTS resources(id INTEGER PRIMARY KEY, teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE, title TEXT, kind TEXT, url TEXT, filename TEXT, mime TEXT, size INTEGER, content TEXT, folder TEXT DEFAULT '', created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS resource_files(resource_id INTEGER PRIMARY KEY REFERENCES resources(id) ON DELETE CASCADE, data BLOB);
CREATE TABLE IF NOT EXISTS resource_shares(resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE, classroom_id INTEGER REFERENCES classrooms(id) ON DELETE CASCADE, PRIMARY KEY(resource_id,classroom_id));
CREATE TABLE IF NOT EXISTS lesson_plans(id INTEGER PRIMARY KEY, teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE, classroom_id INTEGER, title TEXT, grade INTEGER, subject_id INTEGER, topic TEXT DEFAULT '', duration INTEGER DEFAULT 45, content TEXT DEFAULT '', source TEXT DEFAULT 'manual', created TEXT DEFAULT CURRENT_TIMESTAMP, updated TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS family_updates(id INTEGER PRIMARY KEY, classroom_id INTEGER REFERENCES classrooms(id) ON DELETE CASCADE, learner_id INTEGER REFERENCES users(id) ON DELETE CASCADE, title TEXT, body TEXT, created TEXT DEFAULT CURRENT_TIMESTAMP);
`);
for (const { user_id } of db.prepare('SELECT user_id FROM learners WHERE teacher_code IS NULL').all()) db.prepare('UPDATE learners SET teacher_code=? WHERE user_id=?').run(uniqueCode('learners', 'teacher_code', 'TC-'), user_id);

if (!db.prepare('SELECT 1 FROM subjects').get()) {
  const addS = db.prepare('INSERT INTO subjects(slug,name,icon,blurb) VALUES(?,?,?,?)');
  const addM = db.prepare('INSERT INTO modules(subject_id,grade,pos,title) VALUES(?,?,?,?)');
  const addL = db.prepare('INSERT INTO lessons(subject_id,module_id,grade,pos,title,steps,mnemonic,example,kind,xp,mins) VALUES(?,?,?,?,?,?,?,?,?,?,?)');
  const ids = {};
  for (const [slug, name, icon, blurb] of SUBJECTS) ids[slug] = Number(addS.run(slug, name, icon, blurb).lastInsertRowid);
  // CONTENT line format: "#slug|grades" starts a block, "@Module title" starts a module, otherwise a lesson:
  // Title|step;step;step (*keyword* marks key words)|mnemonic|example (uses {thing} {place} ...)|kind
  let slug, grades, mods;
  const flush = () => {
    if (!slug) return;
    for (const g of grades) {
      let mpos = 0, lpos = 0;
      for (const m of mods) {
        const mid = Number(addM.run(ids[slug], g, ++mpos, m.title).lastInsertRowid);
        for (const l of m.lessons) {
          const steps = l.steps.split(';');
          addL.run(ids[slug], mid, g, ++lpos, l.title, JSON.stringify(steps), l.mn, l.ex, l.kind || 'static', 15 + 5 * (lpos % 2), 9 + steps.length * 2 + (lpos % 3) * 2);
        }
      }
    }
  };
  for (const raw of CONTENT.split('\n')) {
    const line = raw.trim(); if (!line) continue;
    if (line[0] === '#') { flush(); const [s, g] = line.slice(1).split('|'); slug = s; grades = g.split(',').map(Number); mods = []; }
    else if (line[0] === '@') mods.push({ title: line.slice(1), lessons: [] });
    else { const [title, steps, mn, ex, kind] = line.split('|'); mods[mods.length - 1].lessons.push({ title, steps, mn, ex, kind }); }
  }
  flush();
}

if (!db.prepare("SELECT 1 FROM users WHERE role='admin'").get()) {
  const email = (process.env.ADMIN_EMAIL || 'admin@learniverse.local').toLowerCase();
  const pw = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
  db.prepare("INSERT INTO users(name,email,hash,role) VALUES('Learniverse Admin',?,?, 'admin')").run(email, bcrypt.hashSync(pw, 12));
  console.log(`\n  Admin account created -> ${email}  /  ${process.env.ADMIN_PASSWORD ? '(password from ADMIN_PASSWORD)' : pw}\n  Change this password after first login.\n`);
}
