# AetherHealth — Product Requirements Document

## 1. Product
AetherHealth is a secure, patient-controlled medical record platform combining decentralized storage, blockchain auditability, OCR, and AI-assisted medical-document processing.

## 2. Problem
Medical records are fragmented across providers. Patients have limited control over sharing, while providers face difficulty accessing reliable records securely.

## 3. Target Users
- Patient: uploads, reviews, owns, shares, revokes, and audits records.
- Doctor: requests access and views records explicitly authorized by patients.
- Admin: optional platform-level management; never bypasses patient permissions.

## 4. Core Requirements
1. Secure authentication and role-based access.
2. Medical report upload for PDF/images.
3. Encryption before decentralized storage.
4. IPFS storage; medical files never stored on blockchain.
5. MongoDB for application metadata and searchable structured data.
6. OCR extraction from scanned/image/PDF reports.
7. AI extraction of medicines, tests, diseases, abnormal findings, and summary.
8. Patient-controlled doctor access.
9. Time-bound permissions and revocation.
10. Solidity smart contract for ownership, permissions, and audit events.
11. Notifications for access requests, approvals, rejection, and expiry.
12. Tamper/integrity verification using hashes.
13. Audit trail of access and permission actions.

## 5. Core Flow
Patient uploads report → encrypt → IPFS → CID/hash metadata → blockchain ownership record → OCR → AI analysis → patient reviews → doctor requests → patient approves/rejects → blockchain permission event → authorized doctor accesses record.

## 6. Non-Functional Requirements
- Privacy-first architecture.
- Least-privilege access.
- Secure authentication and authorization.
- Clear failure handling.
- Responsive UI.
- Free/open-source or free-tier infrastructure.
- Testable modular code.

## 7. Safety
AI output is informational and must not diagnose, prescribe, or replace a clinician. Raw OCR and AI results must be reviewable by the patient.

## 8. Out of Scope
- Real-world medical diagnosis.
- Real hospital/EHR integration.
- Production-grade regulatory certification.
- Storing medical files directly on-chain.
- Paid infrastructure.

## 9. Success Criteria
A patient can securely upload a report, see extracted/AI-processed information, grant a doctor time-bound access, revoke it, and verify the corresponding blockchain audit history.
