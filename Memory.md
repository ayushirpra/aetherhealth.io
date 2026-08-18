# AetherHealth — Project Memory

_Last updated: 2026-08-19_

---

## Current Phase

**Phase 3 — Medical Records** ✅ (complete)
**Next: Phase 4 — Secure IPFS**

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
  - Automated Tests (`server/tests/auth.test.js`): 14 Vitest + Supertest test cases with in-process `mongodb-memory-server` covering all auth operations. All 14 tests pass ✅.
- **Phase 2 (Task 2 — Frontend Auth UI & Integration)**:
  - API Client & Interceptors (`client/src/services/api.js`): Axios client with Bearer token injection on requests and automatic 401 session clearing on responses; helper methods `loginUser`, `registerUser`, `getCurrentUser`.
  - AuthContext & Provider (`client/src/context/AuthContext.jsx`): Centralized auth state, persistent JWT session in `localStorage`, automatic session validation via `/api/auth/me` on mount, `login`, `register`, `logout`, role flags (`isPatient`, `isDoctor`), and error handling.
  - Custom Hook (`client/src/hooks/useAuth.js`): Accessible hook for consuming AuthContext throughout components.
  - Protected Route Component (`client/src/components/ProtectedRoute.jsx`): Session verification spinner, unauthenticated redirect to `/login` with return location state, and optional `allowedRoles` enforcement.
  - Login Page (`client/src/pages/LoginPage.jsx`): Healthcare-styled UI matching Design.md, email/password validation, show/hide password toggle, loading spinner, server error alerts, and auto-redirect.
  - Register Page (`client/src/pages/RegisterPage.jsx`): Interactive Patient vs. Doctor role selector cards, name/email/password/confirm validation, server error alerts, and instant onboarding redirect.
  - Navbar & Dashboard (`client/src/components/Navbar.jsx`, `client/src/pages/DashboardPage.jsx`): Role badge indicators (Patient: Teal, Doctor: Indigo), session info, sign-in/out controls, and role-specific dashboard overviews.
  - Automated Tests (`client/src/test/`): 16 Vitest + React Testing Library tests covering AuthContext (6 tests), ProtectedRoute (4 tests), and AuthPages (6 tests). All 16 tests pass ✅.
  - Client production build verified (`vite build`): 104 modules transformed, 0 errors ✅.
- **Phase 3 (Task 1 — Medical Records Backend Foundation)**:
  - `MedicalRecord` Mongoose Model (`server/src/models/MedicalRecord.js`): schema fields `patient` (ObjectId ref User), `title`, `recordType` (enum: `lab_report`, `prescription`, `radiology`, `discharge_summary`, `consultation_note`, `other`), `recordDate`, `description`, `doctorNotes`, `ipfsCid`, `fileHash`, `fileName`, `fileSize`, `mimeType`, `status`, `metadata`, `authorizedDoctors` (ObjectId ref User array), timestamps; `isUserAuthorized(userId, role)` helper supporting populated & unpopulated document references.
  - Validation Middleware (`server/src/middleware/recordValidation.js`): express-validator chains for record creation, updates, and doctor authorization checks.
  - Record Service (`server/src/services/recordService.js`): `createRecord` (patient owned), `listRecords` (patient owned / doctor authorized with query filters), `getRecordById` (strict authorization check), `updateRecord` (owner-only), `deleteRecord` (owner-only), `authorizeDoctor`, `revokeDoctor`.
  - Record Controller (`server/src/controllers/recordController.js`): handlers for CRUD and doctor authorization with appropriate status codes (201, 200, 403, 404, 422).
  - Record Routes (`server/src/routes/records.js`): mounted at `/api/records` in `app.js` with `authMiddleware` enforcement.
  - Automated Tests (`server/tests/records.test.js`): 16 Vitest + Supertest test cases with in-process `mongodb-memory-server` verifying patient creation (201), validation rules (422), doctor creation restriction (403), patient listing, doctor authorized listing, ownership verification on GET/PUT/DELETE (403/404), and doctor authorization/revocation. All 16 tests pass ✅.
- **Phase 3 (Task 2 — Frontend Records UI & Management)**:
  - API Client Methods (`client/src/services/api.js`): `getRecords`, `getRecord`, `createRecord`, `updateRecord`, `deleteRecord`, `authorizeDoctor`, `revokeDoctor`.
  - Record Card (`client/src/components/RecordCard.jsx`): Category badges with icons & colors (Lab Report: Teal, Prescription: Emerald, Radiology: Purple, Discharge: Amber, Consultation: Blue, Other: Slate), status badge, formatted date, owner controls, and authorized doctor count.
  - Create Record Modal (`client/src/components/CreateRecordModal.jsx`): Category selector with icons, date picker, title/description/doctor remarks inputs, client-side validation, and error alert handling.
  - Edit Record Modal (`client/src/components/EditRecordModal.jsx`): Metadata updating with active/archived status control.
  - Records Dashboard (`client/src/pages/RecordsPage.jsx`): Full records view with keyword search, category filter pills, status selector, loading skeletons, empty state with CTAs, delete confirmation, and modal wiring for Patient Vault & Doctor Access.
  - Record Detail Page (`client/src/pages/RecordDetailPage.jsx`): Complete clinical summary view, owner edit/delete actions, decentralized IPFS & AI pipeline placeholders, and interactive doctor access management with instant grant/revoke.
  - Navigation & App Router (`client/src/components/Navbar.jsx`, `client/src/App.jsx`, `client/src/pages/DashboardPage.jsx`): Added `/records` and `/records/:id` protected routes, nav links, and dashboard overview card connections.
  - Automated Tests (`client/src/test/`): 25 passing client tests including 5 tests in `RecordsPage.test.jsx` and 4 tests in `RecordDetailPage.test.jsx`. All 25 tests pass ✅.
  - Client production build verified (`vite build`): 109 modules transformed, 0 errors ✅.

---

## Architecture Decisions

| Concern | Decision |
|---|---|
| Storage | Encrypted files → IPFS via Pinata; CID stored in MongoDB |
| Blockchain | Solidity on Polygon Amoy testnet; stores ownership, permission events, audit hashes only |
| Database | MongoDB Atlas for metadata, user profiles, structured AI results |
| Medical files on-chain | **Never** — forbidden by design |
| Auth | JWT + bcrypt; server-side authorization is authoritative |
| Records Access | Patient owns record; Doctors require explicit inclusion in `authorizedDoctors` |
| OCR pipeline | PDF/Image → preprocessing → Tesseract.js → Gemini API |
| Encryption | Node.js crypto / AES before IPFS upload |
| Permissions | Time-bound + revocable; enforced on backend |
| Dev server proxy | Vite proxies `/api/*` → `localhost:5000` — no CORS issues in dev |
| Express pattern | App factory (`createApp()`) exported separately from `server.js` for clean Supertest usage |
| Node dev watcher | `node --watch` (built-in) used instead of nodemon — no extra dependency |
| Testing isolation | Vitest + `mongodb-memory-server` on backend; Vitest + jsdom + RTL on frontend |

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React + Vite | React 19, Vite 7 |
| Styling | Tailwind CSS | 3.x |
| Routing | React Router | 7.x |
| HTTP client | Axios | 1.x (with JWT request/response interceptors) |
| Backend | Node.js + Express | Node 26 LTS, Express 5 |
| Database | MongoDB Atlas + Mongoose | Mongoose 8 |
| Storage | IPFS + Pinata | Phase 4 |
| Blockchain | Solidity, Polygon Amoy, Hardhat | Phase 7 |
| Web3 | ethers.js, MetaMask | Phase 7 |
| OCR | Tesseract.js | Phase 5 |
| AI | Gemini API | Phase 5 |
| Auth | JWT + bcrypt | Live (`jsonwebtoken`, `bcrypt`) |
| Security | Helmet, rate-limit, express-validator | Live |
| Testing | Vitest, RTL, Supertest, mongodb-memory-server | Live (55/55 tests passing) |
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

Phase 3 (Medical Records — Backend & Frontend) complete with 55 passing automated tests across the entire stack. Memory.md updated.

---

## Next Task

**Phase 4 — Secure IPFS**
- Client-side / backend AES encryption before IPFS upload
- IPFS upload/download via Pinata API
- CID management & integrity hashing (SHA-256)
- Secure decryption on authorized download

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
| Phase 1 — Foundation scaffold | `main` | ✅ Committed & pushed |
| Phase 2 — Authentication (Backend & Frontend) | `main` | ✅ Complete (30/30 tests passing) |
| Phase 3 — Medical Records (Backend & Frontend) | `main` | ✅ Complete (55/55 total tests passing) |
| Phase 4 — Secure IPFS | `main` | ⬜ Not started |

> **Rule reminder:** After each completed phase — test → review → update Memory.md → `git commit` → `git push`.



