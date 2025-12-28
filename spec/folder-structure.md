# 📦 Bun NPM Package – Recommended Folder Structure

This document describes a clean, scalable folder structure for a Bun-based NPM package,
inspired by real-world packages like `vibechck`, but optimized for Bun tooling.

---

## 📁 Project Tree

```
.
├── .github/
│   └── workflows/
│       └── ci.yml                # CI pipeline (bun install, test, build)
│
├── .husky/                       # Git hooks (optional)
│   └── pre-commit
│
├── src/
│   ├── index.ts                  # Public entry point (exports)
│   ├── cli.ts                    # CLI entry (if applicable)
│   ├── commands/                 # CLI / feature commands
│   ├── core/                     # Core business logic
│   ├── adapters/                 # External integrations / adapters
│   ├── utils/                    # Shared utilities
│   └── types/                    # Shared TypeScript types
│
├── tests/
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── setup.ts                  # Global test setup
│
├── examples/
│   ├── basic.ts                  # Minimal usage example
│   └── advanced.ts               # Advanced usage example
│
├── scripts/
│   ├── build.ts                  # Build helpers
│   ├── release.ts                # Release automation
│   └── clean.ts                  # Cleanup scripts
│
├── website/                      # Docs / landing site (optional)
│
├── .gitignore
├── .prettierrc
├── .eslintrc.cjs
├── bun.lockb
├── bunfig.toml
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
```

---

## 🧠 Design Principles

- **src/** contains only runtime code
- **tests/** mirrors src structure when possible
- **adapters/** isolate external APIs
- **core/** remains framework-agnostic
- **cli.ts** is optional but recommended for tools
- Bun handles:
  - Testing (`bun test`)
  - Building (`bun build`)
  - Running scripts (`bun run`)

---

## ✅ Ready for

- npm publishing
- GitHub Actions CI
- CLI tools
- Libraries
- Adapter / SDK packages
- AI-generated extensions

---

> This structure is intentionally AI-friendly:
> predictable, flat where possible, and easy to refactor.
