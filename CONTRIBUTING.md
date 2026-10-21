## LiquiVault Frontend Contribution Guide

We love contributions to the LiquiVault web UI! Follow these steps to get started.

### 1️⃣ Fork & Clone
```bash
# Fork the repo on GitHub first
git clone https://github.com/<your‑username>/liquivault-frontend.git
cd liquivault-frontend
```

### 2️⃣ Create a Branch
```bash
git checkout -b my‑frontend‑feature
```

### 3️⃣ Install Dependencies
```bash
npm ci   # installs exact versions from package-lock.json
```

### 4️⃣ Development Workflow
- **Run the dev server**: `npm run dev`
- **Run tests**: `npm test`
- **Run lint**: `npm run lint`
- **Build for production**: `npm run build`

### 5️⃣ Commit & Push
```bash
git add .
git commit -m "feat: short description"
git push origin my‑frontend‑feature
```
Open a Pull Request on GitHub targeting `main`.

### 6️⃣ Review Checklist (maintainers)
- ✅ All `npm test` pass.
- ✅ Lint passes (`npm run lint`).
- ✅ Build succeeds (`npm run build`).
- ✅ No CI failures.
- ✅ Documentation updated if applicable.

### Resources
- **Next.js Docs**: https://nextjs.org/docs
- **Stellar Soroban SDK**: https://soroban.stellar.org/docs
- **Drips Wave Guidelines**: https://drips.network/wave-guidelines
- **Contributor Covenant**: see `CODE_OF_CONDUCT.md`
