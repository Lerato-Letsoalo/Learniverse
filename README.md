# Learniverse 2.0

Neuroadaptive, CAPS-aligned (Grades 1-7) learning platform for learners with ADHD, autism and dyslexia.

## Run it
```bash
npm install
npm start     # http://localhost:3000
npm test      # API checks: auth, roles, CAPS subjects per grade, unlocking, quizzes, report card, study plan, admin
```
Needs **Node 22.13+** (built-in `node:sqlite`). On first start an admin account is created: set `ADMIN_EMAIL` / `ADMIN_PASSWORD` (see `.env.example`) or copy the random password printed in the console.
Upgrading from v1? The curriculum model changed, so an old `data/learniverse.db` is rebuilt automatically on first start.
Deploy with the included `Dockerfile` (mount a volume at `/data`).

## What is where
- `server/index.js` REST API, roles (learner / parent / admin), bcrypt, hashed server-side sessions in httpOnly cookies, rate limiting, CSP, JSON-only writes.
- `server/seed.js` CAPS phase structure and starter lessons. `server/quiz.js` activity engine (multiple choice, true/false, drag a word into a blank, drag words into sentences, type a number, drag to order) with hints, worked corrections and interest-themed wording.
- `public/app.js` core (icons, accessibility, Google Translate, animation, idle popup, public site, auth). `public/learn.js` learner, parent and admin screens.

## Your images (all optional, all drop-in)
Files are picked up automatically; if one is missing a built-in placeholder shows instead.
- **Buddies** (profile pictures): `public/assets/buddies/Finn.jpg`, `Spark.jpg`, `Pip.jpg`, `Leo.jpg`, `Ollie.jpg`, `Byte.jpg`, `Koko.jpg`, `Luna.jpg` (square images work best). Names, personalities and intros live in `server/buddies.js`.
- **Subject cards**: images in `public/assets/subjects/` are mapped to their curriculum slugs in `public/learn.js`.
- **Team photos**: `public/assets/team/Lerato.jpeg`, `Unathi.jpeg`, `Tebogo.jpeg`.

## Forgot password
Learners and parents use "Forgot your password?" on the login page. A single-use link (valid 1 hour) is emailed. Configure SMTP in `.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`) and set `APP_URL` to your public address. Without SMTP the link is only printed to the server console in development, and nothing is sent in production. Many learners may not have their own email, so register them with a parent's address or let an admin reset the password under Admin > Users.

## Interest-themed learning
Each quiz is generated fresh from the learner's interests, grade and level. Home Language and First Additional Language quizzes are a "Vocabulary Builder" using interest vocabulary banks (for example "What does the word defend mean in football?"), with difficulty tiers for Grades 1-3, 4-6 and 7. Maths word problems use the interest (goals and matches for Football, songs and shows for Music, and so on). Banks live in `server/quiz.js`. Other subjects keep their own lesson facts with interest-themed wording and examples; add more interest banks there to deepen it.

## Teacher & Tutor Portal
Teachers (school or learning centre) and independent tutors register as "Teacher or tutor" and get their own dashboard.
- **Linking**: every learner has two separate codes: the **Family Code** (for parents, unchanged) and a **Teacher/Tutor code** starting with `TC-`. A teacher enters the code inside one of their classrooms, which sends a *request*. Nothing about the learner is revealed until the learner or a linked parent approves. Either can later revoke it (learner: leave classroom; parent: disconnect), and the teacher loses access immediately.
- **What a teacher can see** (only for approved learners): name, grade, interests, Learniverse progress and quiz averages (limited to the classroom's subject if one is set) and classroom results. Never email, family code or parent details.
- **Classrooms**: multiple per teacher, organised by grade and subject; instructions, announcements, learners roster, completion rates.
- **Assignments**: existing Learniverse lessons, homework, worksheets (marked by hand with feedback), quizzes and assessments (auto-marked, with deadlines). Quizzes show corrections; assessments show marks only. Drafts stay hidden until published.
- **Analytics**: struggling-learner flags with reasons, subjects needing attention, weekly progress trend, weak topics, assignment completion, class CSV export, downloadable learner HTML reports (open and print to save as PDF).
- **Resources and lesson plans**: upload files (PDF, images, Office, text, up to 4 MB), links and notes, organised in folders and shared per classroom; lesson-plan library.
- **Parent updates**: only sent for learners whose family has allowed it (set when approving, changeable by the learner or parent at any time).
- **Learners and parents** both have a Classroom area. With no classroom it shows a friendly message and nothing else changes; self-learning is never blocked.
- **Admin** can verify teachers (families see a "Verified" badge on requests) under Admin > Users.

### AI Teaching Assistant (Groq, free tier)
Set `GROQ_API_KEY` (free key from console.groq.com). Default model `llama-3.3-70b-versatile` with automatic fallback to `llama-3.1-8b-instant`; override with `GROQ_MODEL`. It drafts CAPS-aligned lesson plans, worksheets, revision, quizzes, explanations, worked examples and differentiated activities, and interprets class performance. Safeguards: AI output is always editable; AI-assisted assignments are created as unpublished drafts and **cannot be published until the teacher confirms they reviewed them** (enforced by the server); learner names are never sent to Groq (performance data is anonymised as "Learner 1, 2..." and names are restored only for the teacher); requests are rate limited per teacher. Free-tier limits apply and change over time. Verify current limits and model names in the Groq console.

### Upgrading an existing installation
Start the new version against your existing database. Migrations are additive: all accounts, passwords, progress, Family Codes and lessons are kept; teacher accounts, classroom tables and a Teacher/Tutor code for every existing learner are added automatically. Back up `data/learniverse.db` first, as you would for any upgrade.

## Team photos
Drop `lerato.jpg`, `unathi.jpg` and `tebogo.jpg` into `public/assets/team/`. They replace the placeholder silhouettes automatically.

## Languages
The language selector uses the free Google Website Translator for all 11 official languages. Google controls which languages the widget offers, so any it does not support simply have no effect. Translation is machine-generated and should be spot-checked for educational wording.

## Curriculum and marks
- Foundation (Gr 1-3): Home Language, First Additional Language, Mathematics, Life Skills. Intermediate (Gr 4-6): adds Natural Sciences and Technology and Social Sciences, with Life Skills strands. Senior (Gr 7): Natural Sciences, Social Sciences, Technology, EMS, Life Orientation, Creative Arts.
- A lesson unlocks when the previous one is passed (50% on its quiz). Marks are the average of best quiz scores per subject, shown as CAPS levels 1-7 against the NPPPR promotion requirements.
- Lessons are authored per phase and copied to each grade in it. This is a **starter** set: have a qualified educator review it against CAPS and extend it in Admin > Curriculum (mark key words with *asterisks*; use {thing} {place} {group} {hero} {action} to personalise).

## Before real-world use with children
1. **POPIA**: add a privacy policy, verified parental consent and a retention policy. The consent checkbox is a placeholder.
2. Add HTTPS, email password reset, backups and a production database for scale.
3. The report card is a practice report; the school makes the official promotion decision.
