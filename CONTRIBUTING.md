# Contributing to PayPilot

Thank you for contributing to PayPilot! We welcome pull requests from developers building safe autonomous payment agents.

---

## 1. Development Workflow

### Prerequisites
- Node.js 20.x or higher (see `.nvmrc`)
- npm 10.x or higher

### Setup
```bash
# Clone the repository
git clone https://github.com/your-username/paypilot.git
cd paypilot

# Install dependencies (pinned lockfile)
npm ci

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 2. Quality Gates & Definition of Done

Before submitting any pull request, ensure all quality checks pass with zero errors:

```bash
# 1. ESLint check
npm run lint

# 2. TypeScript strict typecheck
npm run typecheck

# 3. Vitest unit tests (53 tests across 5 suites)
npm test

# 4. Next.js production build
npm run build
```

---

## 3. Pull Request Guidelines

1. **Branch Naming:** Use descriptive branch names:
   - `feat/feature-name`
   - `fix/bug-description`
   - `docs/documentation-update`
2. **Commit Messages:** Follow Conventional Commits format:
   - `feat: add new guardrail rule for multi-currency settlement`
   - `fix: correct idempotency key hash encoding`
   - `test: add edge cases for negative amounts`
3. **Tests Required:** Every new rule, risk factor, or payment utility MUST include accompanying unit tests in `src/**/*.test.ts`.
4. **No Secrets:** Never commit real API keys, credentials, or `.env.local` files.
