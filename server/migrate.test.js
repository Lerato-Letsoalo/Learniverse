// Proves an existing (pre-teacher) database keeps all accounts and data when upgraded.
import { DatabaseSync } from 'node:sqlite'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const file = path.join(os.tmpdir(), `lv-migrate-${Date.now()}.db`); const o = new DatabaseSync(file);
o.exec(`PRAGMA foreign_keys=ON;
CREATE TABLE users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN('learner','parent','admin')), active INTEGER DEFAULT 1, created TEXT DEFAULT CURRENT_TIMESTAMP, last_seen TEXT);
CREATE TABLE sessions(token TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, expires INTEGER);
CREATE TABLE learners(user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, grade INTEGER, interests TEXT DEFAULT '[]', prefs TEXT DEFAULT '{}', xp INTEGER DEFAULT 0, streak INTEGER DEFAULT 0, last_day TEXT, code TEXT UNIQUE, onboarded INTEGER DEFAULT 0, buddy TEXT);
CREATE TABLE parent_links(parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE, learner_id INTEGER REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY(parent_id,learner_id));
INSERT INTO users(id,name,email,hash,role) VALUES(1,'Old Learner','old@x.co.za','h1','learner'),(2,'Old Parent','oldp@x.co.za','h2','parent'),(3,'Old Admin','oldadmin@x.co.za','h3','admin');
INSERT INTO learners(user_id,grade,interests,xp,streak,code,onboarded,buddy) VALUES(1,5,'["Football"]',250,4,'ABC234',1,'leo');
INSERT INTO parent_links VALUES(2,1); INSERT INTO sessions VALUES('tok',1,99999999999999); PRAGMA user_version=3;`); o.close();
process.env.DB_PATH = file; const { db } = await import('./db.js'); let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
ok(db.prepare('SELECT count(*) n FROM users').get().n === 3 && db.prepare('SELECT hash FROM users WHERE id=1').get().hash === 'h1', 'existing users and password hashes preserved');
const l = db.prepare('SELECT * FROM learners WHERE user_id=1').get(); ok(l.xp === 250 && l.streak === 4 && l.grade === 5 && l.code === 'ABC234' && l.buddy === 'leo' && /^TC-[A-Z2-9]{6}$/.test(l.teacher_code), 'learner progress and Family Code preserved; a Teacher/Tutor code is added');
ok(db.prepare('SELECT count(*) n FROM parent_links').get().n === 1 && db.prepare('SELECT count(*) n FROM sessions').get().n === 1, 'parent links and sessions preserved');
db.prepare("INSERT INTO users(name,email,hash,role) VALUES('T','t@x.co.za','h','teacher')").run(); ok(db.prepare("SELECT count(*) n FROM users WHERE role='teacher'").get().n === 1, 'teacher accounts can now be created');
ok(db.prepare('SELECT count(*) n FROM subjects').get().n >= 1 && db.prepare('PRAGMA foreign_key_check').all().length === 0, 'curriculum available and database consistent');
fs.rmSync(file, { force: true }); console.log(fail ? `\n${fail} FAILED` : '\nMigration test passed'); process.exit(fail ? 1 : 0);
