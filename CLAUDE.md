<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## ✅ Definition of Done (Do after each code change)

Run these commands after **every** code change:

```bash
bun run lint && bun run type-check && bun run vibecheck
bun test
```

---

## Project Overview

This is a NestJS adapter library implementing the Ports & Adapters (Hexagonal Architecture) pattern.

The library provides base classes that enable building pluggable, type-safe adapters for NestJS applications with minimal boilerplate.

**Current Status**: Early development. Some areas may still contain scaffolding / placeholder code.
Always treat `spec/spec.md` (and OpenSpec docs when applicable) as the source of truth for final behavior and API design.

---

## ⚠️ Project Rules (Must follow)

- **Do not introduce breaking changes** unless explicitly requested.
- **If a change impacts public API**, create/apply an OpenSpec change proposal **before coding**.
- **Never use `process.env` in library code**. Apps must provide configuration externally.
- **Always keep `src/index.ts` exports in sync** with new or changed public API.
- Prefer **runtime-safe wiring** (`useExisting`, metadata validation, explicit tokens).
- Keep modules **class-based** (NestJS `DynamicModule` patterns) — avoid loose factory modules unless the spec says otherwise.
- Avoid `any`. Prefer `unknown` + validation (Zod or custom runtime checks) when required.
- Minimize type assertions (`as`). If you must assert, document why.

---

## Core Architecture Concepts

### Port Token System
- Ports are represented by tokens (typically `Symbol()` or strings)
- Example:
  ```ts
  export const OBJECT_STORAGE_PROVIDER = Symbol('OBJECT_STORAGE_PROVIDER');
  ```
- Tokens enable dependency injection and adapter swapping

### Adapter Module Pattern
- Adapters provide infrastructure implementations (AWS S3, HTTP APIs, etc.)
- Must extend `Adapter.forToken(TOKEN)<OptionsType>`
- Automatically handle:
	- Token registration and aliasing (`useExisting`)
	- Port configuration
	- Export management
- Support both `register()` (sync) and `registerAsync()` (async with DI)

### Domain / Feature Module Pattern
- Domain modules expose domain services that consume adapters
- Extend `DomainModule`
- Accept adapters via `register({ adapter: DynamicModule })`
- Keep business logic independent of infrastructure

### Runtime Safety
- The library uses decorator metadata to ensure adapters provide the correct port token at runtime

---

## Development Commands

### Build & Development
```bash
bun run build          # Build the library using bunup
bun run dev            # Build in watch mode
tsc                    # Type-check (run after code changes per project rules)
```

### Testing
```bash
bun test               # Run all tests
bun test --watch       # Run tests in watch mode
bun test --coverage    # Run tests with coverage report
```

### Linting & Formatting
```bash
bun run lint           # Check code style with Biome
bun run lint:fix       # Auto-fix code style issues
```

### Release
```bash
bun run release        # Bump version, commit, tag, and push (using bumpp)
```

---

## TypeScript Guidelines

- **Strict mode enabled**: All strict TypeScript checks are enforced
- **Minimize type assertions**: Avoid `as` type casts where possible
- **Avoid `any`**: Use proper types or `unknown` when type is truly unknown
- **After changes, run `tsc`**: Verify no TypeScript errors after code modifications
- **Isolated declarations**: Each module must be independently type-checkable (`isolatedDeclarations: true`)

---

## Code Style

### Editor Configuration
- **Indentation**: Tabs (configured in `.editorconfig`)
- **Line endings**: LF
- **Quotes**: Single quotes (enforced by Biome)
- **Semicolons**: As needed (minimal; enforced by Biome)

### Biome Rules
- Recommended rules enabled
- Auto-organize imports on save
- VCS integration with Git

---

## Pre-commit Hooks

Git hooks run automatically via `simple-git-hooks`:
1. `bun run lint` - Check code formatting
2. `bun run type-check` - Verify TypeScript compilation

---

## Implementation Reference

The complete implementation specification lives in:

- `spec/spec.md`

It includes:
- Detailed API design for `@Adapter` decorator, `AdapterBase`, and `PortModule`
- Example implementations for S3 storage and HTTP currency rates adapters
- Testing patterns for mocking adapters
- Best practices and common pitfalls

Key implementation files:
- `src/core/types.ts` - Type definitions including `AdapterConfig`
- `src/core/adapter.base.ts` - `AdapterBase` class for building adapters
- `src/core/domain-module.base.ts` - `DomainModule` base class for domain modules
- `src/core/decorators.ts` - `@Adapter` and `@InjectPort` decorators
- `src/index.ts` - Public API exports

---

## Design Principles

1. **Declarative Configuration**: Declare tokens and implementations once, not repeatedly
2. **Class-based Modules**: Use NestJS class-based dynamic modules, not function factories
3. **App-owned Configuration**: Never use `process.env` in library code; apps provide configuration
4. **Single Responsibility**: Adapters handle infrastructure only; domain logic lives in domain modules
5. **Port Token Exports**: Always export tokens, never export provider objects directly

---

## Common Mistakes to Avoid

- Exporting provider objects instead of exporting **port tokens**
- Registering adapters with `useClass` when the design expects `useExisting` aliasing
- Putting domain logic inside adapters (adapters must remain infrastructure-only)
- Adding a new public API but forgetting to export it in `src/index.ts`
- Making changes that contradict `spec/spec.md` or OpenSpec proposal requirements

---

## Documentation / Library References

When running in an environment where **Context7 MCP** is available (e.g. Claude Code),
use it for code generation, setup/config steps, or library/API documentation lookup:

- Resolve library ID
- Fetch official docs
- Prefer primary sources over blog posts

If Context7 is not available in the current environment, rely on repository specs
(`spec/spec.md`) and existing code patterns as the source of truth.
