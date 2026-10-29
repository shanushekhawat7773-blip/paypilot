## Description
Provide a concise summary of the changes and the motivating problem or feature.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Security / Guardrails enhancement
- [ ] Documentation update

## Verification & Quality Checklist
- [ ] `npm run lint` passes with 0 errors and 0 warnings.
- [ ] `npm run typecheck` passes with 0 errors.
- [ ] `npm test` passes (all unit test suites green).
- [ ] `npm run build` succeeds cleanly.
- [ ] No secrets or API keys committed.
- [ ] All new payment paths carry an idempotency key and an audit log event.
