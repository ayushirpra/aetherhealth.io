# AetherHealth — Project Memory

_Last updated: 2026-08-19_

---

## Current Phase

**Phase 2 — Authentication (Task 1: Backend Auth Foundation ✅ complete)**
**Next: Phase 2 Task 2 — Frontend Auth UI & Integration**

---

## Completed Work

- **Phase 0**: PRD, Architecture, Rules, Phases, Design documents written and pushed to `origin/main`.
- **Phase 1**: Full project scaffold created and verified:
  - Root `.gitignore` (covers all layers: env, node_modules, build, secrets, blockchain artifacts)
  - `contracts/`, `tests/`, `docs/` directories created with placeholders
  - `client/` — Vite 7 + React 19 + Tailwind CSS 3 + React Router 7 + Axios; Vite dev proxy `/api → localhost:5000`; Tailwind tokens matching Design.md (indigo primary, teal secondary, Inter font); placeholder page/folder structure
  - `server/` — Express 5 + Mongoose 8 + Helmet + CORS + rate-limit + Morgan + express-validator; app factory pattern (testable without starting server); `GET /api/health` live; `connectDB()` singleton; comprehensive `.env.example` covering all future phases
  - Both `npm install` completed with 0 vulnerabilities
  - Vite production build verified: 43 modules, 2.40s ✅
  - Express app factory smoke-tested: starts cleanly ✅
- **Phase 2 (Task 1 — Backend Auth Foundation)**:
  - `User` Mongoose model (`server/src/models/User.js`): fields `name`, `email` (unique, lowercase, normalized), `passwordHash` (hidden via `select: false`), `role` (`patient` | `doctor`), timestamps, `comparePassword` method, `toSafeObject` sanitizer.
  - JWT utility (`server/src/utils/jwt.js`): `signToken()` and `verifyToken()` reading `JWT_SECRET` and `JWT_EXPIRES_IN`.
  - Auth Service (`server/src/services/authService.js`): `registerUser` with bcrypt (12 rounds) and duplicate email check; `loginUser` with timing/enumeration-safe credential check.
  - Auth Controller (`server/src/controllers/authController.js`): `register`, `login`, and `getMe` handlers.
  - Auth Validation Middleware (`server/src/middleware/authValidation.js`): express-validator chains returning 422 on field format/length/role failures.
  - Auth Middleware (`server/src/middleware/authMiddleware.js`): Bearer token extraction and verification, loads user and sets `req.user`, 401 on unauthorized requests.
  - Auth Routes (`server/src/routes/auth.js`): mounted at `/api/auth` in `app.js` (`POST /register`, `POST /login`, `GET /me`).
  - Automated Tests (`server/tests/auth.test.js`): 14 Vitest + Supertest test cases with in-process `mongodb-memory-server` covering registration (success, doctor role, duplicate email 409, missing fields 422, invalid email 422, short password 422, invalid role 422), login (success 200, wrong password 401, non-existent email 401, missing email 422), and protected `/api/auth/me` route (valid token 200, missing token 401, malformed token 401). All 14 tests pass ✅.

---

## Architecture Decisions

| Concern | Decision |
|---|---|
| Storage | Encrypted files → IPFS via Pinata; CID stored in MongoDB |
| Blockchain | Solidity on Polygon Amoy testnet; stores ownership, permission events, audit hashes only |
| Database | MongoDB Atlas for metadata, user profiles, structured AI results |
| Medical files on-chain | **Never** — forbidden by design |
| Auth | JWT + bcrypt; server-side authorization is authoritative |
| OCR pipeline | PDF/Image → preprocessing → Tesseract.js → Gemini API |
| Encryption | Node.js crypto / AES before IPFS upload |
| Permissions | Time-bound + revocable; enforced on backend |
| Dev server proxy | Vite proxies `/api/*` → `localhost:5000` — no CORS issues in dev |
| Express pattern | App factory (`createApp()`) exported separately from `server.js` for clean Supertest usage |
| Node dev watcher | `node --watch` (built-in) used instead of nodemon — no extra dependency |
| Auth testing | Vitest + `mongodb-memory-server` for fully isolated, offline test execution |

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React + Vite | React 19, Vite 7 |
| Styling | Tailwind CSS | 3.x |
| Routing | React Router | 7.x |
| HTTP client | Axios | 1.x |
| Backend | Node.js + Express | Node 26 LTS, Express 5 |
| Database | MongoDB Atlas + Mongoose | Mongoose 8 |
| Storage | IPFS + Pinata | Phase 4 |
| Blockchain | Solidity, Polygon Amoy, Hardhat | Phase 7 |
| Web3 | ethers.js, MetaMask | Phase 7 |
| OCR | Tesseract.js | Phase 5 |
| AI | Gemini API | Phase 5 |
| Auth | JWT + bcrypt | Live (`jsonwebtoken`, `bcrypt`) |
| Security | Helmet, rate-limit, express-validator | Live |
| Testing | Vitest, Supertest, mongodb-memory-server | Live (14/14 tests passing) |
| Deployment | Vercel (frontend) + Render (backend) | Phase 11 |

---

## Important Constraints

1. Medical file contents must **never** be stored on-chain or in plaintext.
2. API keys, private keys, JWT secrets, and encryption keys must **never** reach the frontend or be committed to Git.
3. AI output is informational only — no diagnosis, no prescription.
4. Raw OCR output must be preserved separately from AI interpretation.
5. Doctor access requires explicit patient approval and supports expiry/revocation.
6. All external input must be validated and sanitized on the backend.
7. Only free/open-source or free-tier services are in scope.
8. Do not introduce new libraries when an existing chosen dependency covers the need.

---

## Current Task

Phase 2 Task 1 (Authentication Foundation) complete with 14 passing automated tests. Memory.md updated.

---

## Next Task

**Phase 2 — Task 2: Frontend Auth UI & Integration**
- AuthContext + useAuth hook in `client/`
- Axios interceptor attaching JWT Authorization header
- Register page & Login page (patient / doctor selection)
- Protected route wrapper component
- User profile page

---

## Known Issues

- `server.js` requires `MONGODB_URI` in `.env` to start. Copy `server/.env.example` → `server/.env` and fill in your Atlas URI before running `npm run dev` in `server/`.
- Vite Google Fonts preconnect in `index.html` requires network access at build/dev time; no offline impact.
- MongoDB Atlas connection currently fails with SSL alert number 80 in local runtime; backend tests use `mongodb-memory-server` and are fully insulated.

---

## Git Milestone

| Milestone | Branch | Status |
|---|---|---|
| Phase 0 — Planning docs | `main` | ✅ Committed & pushed |
| Phase 1 — Foundation scaffold | `main` | ⬜ Ready to commit |
| Phase 2 Task 1 — Auth foundation | `main` | ✅ Complete (14/14 tests passing) |
| Phase 2 Task 2 — Frontend auth & profiles | `main` | ⬜ Not started |

> **Rule reminder:** After each completed phase — test → review → update Memory.md → `git commit` → `git push`.
