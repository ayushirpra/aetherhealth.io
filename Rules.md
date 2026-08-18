# AetherHealth — VibeCoding Rules

## Core Rules
1. Do not introduce a new library when an existing chosen dependency solves the problem.
2. Prefer free/open-source or free-tier services.
3. Never store medical files directly on blockchain.
4. Never put plaintext medical information in blockchain transactions/events.
5. Never expose API keys, private keys, JWT secrets, or encryption keys to the frontend.
6. Never commit .env files or secrets.
7. Patient authorization is mandatory for doctor access.
8. Permissions must support expiry and revocation.
9. Backend authorization is authoritative; frontend checks are not security.
10. Validate and sanitize all external input.
11. Handle API, database, IPFS, OCR, AI, and blockchain failures explicitly.
12. Do not silently invent medical information.
13. AI must summarize/extract only; it must not diagnose or prescribe.
14. Preserve raw OCR output separately from AI interpretation.
15. Keep components modular and readable.
16. Do not rewrite unrelated working code.
17. Before major changes, inspect existing files and Memory.md.
18. After each completed phase, update Memory.md and run relevant tests.
19. Use meaningful Git commits after stable milestones.
20. Prefer small, reversible changes.

## Code Quality
- Use consistent naming.
- Keep secrets in environment variables.
- Add comments only where logic is non-obvious.
- Avoid duplicated business logic.
- Keep blockchain calls isolated from normal API logic.
- Keep AI/OCR providers replaceable.

## Testing
Test authentication, authorization, record ownership, permission expiry/revocation, upload failures, malformed input, and critical blockchain/storage workflows.
