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

# Do after each code change:
- Run `bun run lint && bun run type-check` to ensure no style or type errors.
- Run `npx vibechck .` to detect hallucinations, lazy implementation, and security shortcuts.


## Project Overview

This is a NestJS adapter library implementing the Ports & Adapters (Hexagonal Architecture) pattern. The library provides base classes (`Adapter` and `FeatureModule`) that enable building pluggable, type-safe adapters for NestJS applications with minimal boilerplate.

**Current Status**: Early development. The codebase currently has placeholder code (`greet` function) that will be replaced with the actual implementation described in `spec/spec.md`.

## Core Architecture Concepts

### Port Token System
- Ports are represented by tokens (typically `Symbol()` or strings)
- Example: `OBJECT_STORAGE_PROVIDER = Symbol('OBJECT_STORAGE_PROVIDER')`
- Tokens enable dependency injection and adapter swapping

### Adapter Module Pattern
- Adapters provide infrastructure implementations (AWS S3, HTTP APIs, etc.)
- Must extend `Adapter.forToken(TOKEN)<OptionsType>`
- Automatically handle:
  - Token registration and aliasing (`useExisting`)
  - Port configuration
  - Export management
- Support both `register()` (sync) and `registerAsync()` (async with DI)

### Feature Module Pattern
- Feature modules expose domain services that consume adapters
- Extend `FeatureModule<ServiceType, TokenType>`
- Accept adapters via `register({ adapter: AdapterModule })`
- Keep business logic independent of infrastructure

### Type Safety
- `AdapterModule<TToken>` carries compile-time proof of provided token via `__provides` field
- Ensures feature modules receive compatible adapters

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

## TypeScript Guidelines

- **Strict mode enabled**: All strict TypeScript checks are enforced
- **Minimize type assertions**: Avoid `as` type casts where possible
- **Avoid `any`**: Use proper types or `unknown` when type is truly unknown
- **After changes, run `tsc`**: Verify no TypeScript errors after code modifications
- **Isolated declarations**: Each module must be independently type-checkable (`isolatedDeclarations: true`)

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

## Pre-commit Hooks

Git hooks run automatically via `simple-git-hooks`:
1. `bun run lint` - Check code formatting
2. `bun run type-check` - Verify TypeScript compilation

## Implementation Reference

The complete implementation specification lives in `spec/spec.md`, which includes:
- Detailed API design for `Adapter`, `FeatureModule`, and `AdapterModule<TToken>`
- Example implementations for S3 storage and HTTP currency rates adapters
- Testing patterns for mocking adapters
- Best practices and common pitfalls

Key implementation files (to be created):
- `src/types.ts` - `AdapterModule<TToken>` type definition
- `src/adapter.base.ts` - `Adapter` base class with `forToken()` helper
- `src/feature-module.base.ts` - `FeatureModule` base class
- `src/index.ts` - Public API exports

## Design Principles

1. **Declarative Configuration**: Declare tokens and implementations once, not repeatedly
2. **Class-based Modules**: Use NestJS class-based dynamic modules, not function factories
3. **App-owned Configuration**: Never use `process.env` in library code; apps provide configuration
4. **Single Responsibility**: Adapters handle infrastructure only; domain logic lives in feature modules
5. **Port Token Exports**: Always export tokens, never export provider objects directly


Always use context7 when I need code generation, setup or configuration steps, or
library/API documentation. This means you should automatically use the Context7 MCP
tools to resolve library id and get library docs without me having to explicitly ask.
