# AetherHealth — Architecture

## 1. Architecture
React/Vite frontend → Express/Node API → MongoDB + encrypted IPFS storage
                                   ↓
                              Solidity contract
                                   ↓
                         Polygon Amoy testnet

AI pipeline:
PDF/Image → preprocessing → Tesseract OCR → extracted text → Gemini → structured result + summary

## 2. Technology Stack
- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB Atlas
- Storage: IPFS + Pinata
- Blockchain: Solidity, Polygon Amoy, Hardhat
- Web3: ethers.js, MetaMask
- OCR: Tesseract.js
- AI: Gemini API
- Auth: JWT + bcrypt
- Security: Node crypto/AES, hashing, Helmet, rate limiting, validation
- Testing: Vitest, Supertest
- Deployment: Vercel + Render
- Version control: Git + GitHub

## 3. Suggested Structure
aetherhealth.io/
├── client/
├── server/
├── contracts/
├── tests/
├── docs/
├── PRD.md
├── Architecture.md
├── Rules.md
├── Phases.md
├── Design.md
└── Memory.md

## 4. Backend Modules
auth, users, records, storage, OCR, AI, access-control, blockchain, notifications, audit, security.

## 5. Data Separation
- Blockchain: ownership, permission state/events, hashes, audit references.
- IPFS: encrypted medical files.
- MongoDB: application metadata, encrypted/derived structured data, user profiles, workflow state.
- Never put medical file contents or plaintext sensitive medical data on-chain.

## 6. Access Model
Patient owns the record.
Doctor receives access only after patient approval.
Permission contains grantee, record reference, start time, expiry, and revocation state.
Backend verifies authorization before returning/decrypting data.

## 7. Security Principles
Defense in depth, least privilege, encrypted secrets, server-side authorization, input validation, auditability, secure headers, rate limiting, and no secrets in Git.
