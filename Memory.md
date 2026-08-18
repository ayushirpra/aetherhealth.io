# AetherHealth — Project Memory

_Last updated: 2026-08-19_

---

## Current Phase

**Phase 1 — Foundation** ✅ (complete)
**Next: Phase 2 — Authentication**

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
| Auth | JWT + bcrypt | Phase 2 |
| Security | Helmet, rate-limit, express-validator | Live |
| Testing | Vitest, Supertest | Phase 10 |
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

Phase 1 complete. Memory.md updated.

---

## Next Task

**Phase 2 — Authentication**
- `User` Mongoose model (patient / doctor roles, bcrypt password)
- `POST /api/auth/register` and `POST /api/auth/login` endpoints
- JWT issuance and `authMiddleware.js` (protect routes)
- Refresh token strategy (optional — decide at phase start)
- Protected profile route `GET /api/auth/me`
- Frontend: register, login pages; AuthContext + useAuth hook; axios interceptor attaches JWT header; protected route wrapper

---

## Known Issues

- `server.js` requires `MONGODB_URI` in `.env` to start. Copy `server/.env.example` → `server/.env` and fill in your Atlas URI before running `npm run dev` in `server/`.
- Vite Google Fonts preconnect in `index.html` requires network access at build/dev time; no offline impact.

---

## Git Milestone

| Milestone | Branch | Status |
|---|---|---|
| Phase 0 — Planning docs | `main` | ✅ Committed & pushed |
| Phase 1 — Foundation scaffold | `main` | ⬜ Ready to commit |
| Phase 2 — Authentication | `main` | ⬜ Not started |

> **Rule reminder:** After each completed phase — test → review → update Memory.md → `git commit` → `git push`.
