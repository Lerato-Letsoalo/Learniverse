# Learniverse

### Every child learns differently. Every child belongs.

**Learniverse** is an inclusive, CAPS-aligned adaptive learning platform designed to support learners in Grades 1–7. It aims to make learning more accessible, engaging and responsive to different learning needs, learning preferences and abilities.

The platform recognises that children do not all learn in the same way. It brings together educational content, interactive learning experiences and accessibility-focused tools to create a more supportive digital learning environment for both neurodivergent and neurotypical learners.

---

## About the Project

Learniverse is being developed to help learners engage with the South African Curriculum and Assessment Policy Statement (CAPS) through a more flexible and accessible learning experience.

The platform is designed around three key user groups:

- **Learners:** Access educational content, learning activities and interactive resources.
- **Parents:** Support and follow their children's learning journey.
- **Teachers and tutors:** Support learners through classroom-based learning and educational resources.

The platform is being developed with inclusivity, accessibility, usability and learner engagement at its core.

## Key Features

- **CAPS-aligned learning:** Educational content structured around the South African curriculum for Grades 1–7.
- **Adaptive learning experience:** Supports different learning preferences and approaches to understanding educational concepts.
- **AI-powered learning assistance:** Uses Groq's chat API to provide AI-assisted educational support.
- **Interactive quizzes:** Quiz generation and educational activities to reinforce learning.
- **Accessibility tools:** Read-aloud functionality, text presentation options and other accessibility-focused features.
- **Multilingual support:** Google Website Translator integration covering South Africa's 11 official languages.
- **Parent and teacher access:** Dedicated experiences for supporting learners and managing educational activities.
- **Classroom functionality:** Supports teacher-led learning and classroom resources.
- **Learning companions:** Illustrated buddy characters to make the learning environment more engaging.
- **Educational resources:** Teachers can upload and manage learning materials.

*Features and functionality are subject to ongoing development.*

---

## Technology Stack

### Backend

| Technology | Purpose |
|---|---|
| Node.js 22.13+ | Server-side runtime |
| Express 4 | Backend framework and API routing |
| SQLite (`node:sqlite`) | Relational database |
| bcryptjs | Password hashing |
| Nodemailer | Password-reset emails |
| Groq API | AI-powered learning assistance |
| Plain SQL | Database queries and operations |

**Authentication and security**

Learniverse implements several security measures:

- Password hashing using bcryptjs.
- Cryptographically random session tokens, stored as hashes in the database.
- HTTP-only and SameSite session cookies, with Secure enabled in production.
- Rate limiting to help protect against abuse.
- Content Security Policy (CSP).
- JSON-only write requests as part of the application's CSRF protection.
- Role-based access checks on protected routes.

### Frontend

Learniverse uses a lightweight frontend without a framework or build step.

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | Styling and responsive layouts |
| Vanilla JavaScript | Frontend functionality |
| Hash-based routing | Single-page application navigation |
| SVG | Icons and custom charts |
| Canvas API | Starfield and confetti effects |
| Web Speech API | Browser-based read-aloud functionality |
| Google Website Translator | Multilingual support |
| HTML Drag and Drop API | Drag-and-drop interactions |

**Typography:** Poppins and Inter, loaded through Google Fonts.

### Database and Educational Content

- SQLite is accessed through Node.js's built-in `node:sqlite` module.
- CAPS curriculum content is seeded through `server/seed.js`.
- Quiz generation logic is maintained in `server/quiz.js`.
- Teacher-uploaded resources are stored as blobs in SQLite.
- Learner buddy illustrations, subject images and team photographs are maintained as static assets in `public/assets/`.

---

## Project Structure

```text
Learniverse/
│
├── public/
│   ├── assets/
│   │   ├── buddies/
│   │   ├── subjects/
│   │   └── team/
│   │
│   ├── app.js
│   ├── classroom.js
│   ├── index.html
│   ├── learn.js
│   ├── styles.css
│   └── teacher.js
│
├── server/
│   ├── ai.js
│   ├── ai.test.js
│   ├── buddies.js
│   ├── classroom.js
│   ├── db.js
│   ├── index.js
│   ├── migrate.test.js
│   ├── quiz.js
│   ├── seed.js
│   ├── smoke.test.js
│   └── teacher.test.js
│
├── .env.example
├── .gitignore
├── Dockerfile
├── package.json
├── package-lock.json
└── README.md
```

---

## Getting Started

### Prerequisites

Before running Learniverse locally, ensure you have:

- Node.js 22.13 or newer.
- npm (included with Node.js).
- Git.
- A Groq API key for AI functionality.
- SMTP credentials if you want to test password-reset email delivery.

### 1. Clone the repository

```bash
git clone https://github.com/Lerato-Letsoalo/Learniverse.git
```

Navigate into the project:

```bash
cd Learniverse
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local `.env` file using the example configuration.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

```bash
cp .env.example .env
```

Open `.env` and configure the required values:

```env
PORT=3000
NODE_ENV=development

DB_PATH=./data/learniverse.db

ADMIN_EMAIL=admin@yourdomain.co.za
ADMIN_PASSWORD=change-me-to-a-long-passphrase

GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

APP_URL=http://localhost:3000

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
MAIL_FROM="Learniverse Team <your_email@gmail.com>"
```

**Important:**

- Obtain a Groq API key through [Groq Console](https://console.groq.com/).
- Use a Gmail App Password or another supported SMTP credential rather than your normal email password.
- Set a strong, unique administrator password.
- Never commit your `.env` file, API keys, email credentials or database files to GitHub.

The `.env.example` file provides the configuration template. Your actual credentials belong in `.env`.

### 4. Start the development server

```bash
npm run dev
```

The application should be accessible at:

```text
http://localhost:3000
```

For production-style local execution:

```bash
npm start
```

---

## AI Integration

Learniverse integrates Groq's chat API to support AI-assisted learning experiences.

The default model is:

```text
llama-3.3-70b-versatile
```

An automatic fallback model is configured:

```text
llama-3.1-8b-instant
```

The model can be configured through the `GROQ_MODEL` environment variable.

AI functionality requires a valid `GROQ_API_KEY`. API credentials should remain on the server and must never be exposed in frontend JavaScript.

---

## Email and Password Recovery

Learniverse uses Nodemailer to send password-reset emails through an SMTP provider.

The password recovery process includes:

1. A learner or user requests a password reset.
2. The application generates a cryptographically random reset token.
3. A hashed version of the token is stored in SQLite.
4. A password-reset link is sent to the user's email address.
5. The token expires after its configured validity period.
6. Once a valid token is used, the password is updated and the reset token is invalidated.

SMTP settings are configured through environment variables.

---

## Testing

Learniverse includes automated tests written using Node.js scripts.

Run the test suite with:

```bash
npm test
```

The test command runs:

- `server/ai.test.js` – AI integration-related tests.
- `server/smoke.test.js` – Application and API smoke tests.
- `server/teacher.test.js` – Teacher functionality tests.
- `server/migrate.test.js` – Database migration and upgrade tests.

Additional jsdom-based screen walkthroughs were used during development but are not included in the repository.

---

## Deployment

Learniverse includes a Dockerfile based on the official Node.js 22 slim image.

The container configuration:

- Installs production dependencies.
- Runs the Express application.
- Exposes port 3000.
- Uses `/data/learniverse.db` as the production database location.
- Supports environment-based configuration.

Build the Docker image:

```bash
docker build -t learniverse .
```

Run the container with persistent database storage:

```bash
docker run -p 3000:3000 \
  --env-file .env \
  -v learniverse-data:/data \
  learniverse
```

The application is intended for Docker-compatible hosting. Vercel deployment configuration is still being worked through.

**Production considerations**

The current architecture is designed for development, testing and an initial pilot. Before a broader rollout, the following should be addressed:

- Move from SQLite to PostgreSQL or another suitable managed database.
- Configure persistent storage and automated database backups.
- Use HTTPS for all production traffic.
- Configure a reliable production email provider.
- Review security, privacy and access controls before onboarding real learners.
- Establish appropriate data retention and deletion procedures for children's information.
- Configure production environment variables securely.

---

## Current Development Status

Learniverse is an ongoing project. Its core application, backend, database structure, authentication, AI integration and educational functionality are under active development.

The current implementation is designed to establish a working foundation that can evolve as the platform is tested and refined.

Future development priorities include:

- Expanding CAPS-aligned educational content.
- Improving adaptive learning experiences.
- Refining parent, teacher and learner functionality.
- Strengthening accessibility and multilingual experiences.
- Improving database scalability and deployment infrastructure.
- Further testing with learners, parents and educators.

---

## Privacy and Security

Learniverse is intended for use by children, parents and educators. Protecting learner information is therefore an important development priority.

The project incorporates authentication, password hashing, role-based access and server-side security controls.

Before public or large-scale deployment, the platform must undergo further privacy and security reviews, including appropriate consideration of South Africa's Protection of Personal Information Act (POPIA), particularly regarding children's personal information.

---

## The Team

Learniverse is being developed by:

- **Lerato Letsoalo**
- **Unathi Masemola**
- **Tebogo Mosoma**

We share an interest in building meaningful technology that addresses real educational needs and makes digital learning more inclusive.

---

## Acknowledgements

Learniverse is inspired by the belief that access to meaningful education should not be limited by the way a child learns.

We aim to create a learning environment where differences are accommodated, curiosity is encouraged and every learner has the opportunity to grow.

**Every child learns differently. Every child belongs.**

---

*Learniverse – An inclusive, CAPS-aligned learning platform for South African learners.*

© 2026 Learniverse. All rights reserved.

Learniverse, including its original source code, platform design, branding, written content and proprietary materials, is protected by applicable intellectual property laws. No part of this project may be copied, reproduced, distributed, modified or used commercially without prior written permission from the Learniverse team, except where permitted by law.

**All rights reserved.**