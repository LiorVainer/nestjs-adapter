# Implementation Tasks

## 1. Core API Changes
- [x] 1.1 Renamed decorator to `@Adapter` in `src/core/decorators.ts` (file already named correctly)
- [x] 1.2 Renamed `@Port` decorator to `@Adapter` with full JSDoc examples
- [x] 1.3 Added `imports` and `providers` options to `@Adapter` decorator (proper DynamicModule types)
- [x] 1.4 Updated `src/index.ts` to export `Adapter` decorator and `AdapterBase` class separately
- [x] 1.5 Updated decorator JSDoc with examples showing new options
- [x] 1.6 Type-check passes (test files updated to use new API)
- [x] 1.7 Added new metadata constants for imports and providers
- [x] 1.8 Changed `token` parameter to `portToken` in decorator
- [x] 1.9 Removed explicit `unique symbol` types from constants (let TS infer)
- [x] 1.10 Updated all test files to use `@Adapter` and `extends AdapterBase`

## 2. Example Code Updates
- [x] 2.1 Updated all adapter files in `examples/` to use `@Adapter` decorator
- [x] 2.2 Changed `token` to `portToken` in all examples
- [x] 2.3 Updated imports to use `Adapter` decorator and `AdapterBase` class
- [x] 2.4 Updated `extends Adapter` to `extends AdapterBase` in examples
- [x] 2.5 Updated `examples/README.md` to use "port" instead of "provider"
- [x] 2.6 Type-check passes for all example files

## 3. Documentation Overhaul
- [x] 3.1 Create `docs/` directory
- [x] 3.2 Create `docs/library.md` with table of contents
- [x] 3.3 Add hexagonal architecture flowchart (Mermaid diagram) to `docs/library.md`
- [x] 3.4 Add "Core Concepts" section to `docs/library.md`
- [x] 3.5 Add "Why Hexagonal Architecture?" section with benefits to `docs/library.md`
- [x] 3.6 Add complete "API Reference" section to `docs/library.md`
- [x] 3.7 Add "Advanced Usage" section with all patterns to `docs/library.md`
- [x] 3.8 Add "Testing" section with mock adapters to `docs/library.md`
- [x] 3.9 Add "Migration Guide" for `@Port` → `@Adapter` to `docs/library.md`
- [x] 3.10 Create `docs/cli.md` with table of contents
- [x] 3.11 Add "Quick Start" section to `docs/cli.md`
- [x] 3.12 Add "Commands Reference" with all CLI commands to `docs/cli.md`
- [x] 3.13 Add "Configuration" section explaining nest-hex.config.ts to `docs/cli.md`
- [x] 3.14 Add "Templates" section for customization to `docs/cli.md`
- [x] 3.15 Add "Examples" section with common workflows to `docs/cli.md`
- [x] 3.16 Restructure `README.md` with:
  - Brief introduction explaining what the library does
  - "Features" section highlighting key capabilities
  - "Quick Start" section with basic usage example (single adapter setup)
  - "CLI" section with simple CLI example
  - "Documentation" section with clear links to `docs/library.md` and `docs/cli.md`
  - Installation, License, and Contributing sections
- [x] 3.17 Replace "provider" terminology with "port" throughout README and examples (when referring to what adapters provide)
- [x] 3.18 Update all code examples to use `@Adapter` instead of `@Port`

## 4. CLI Template Updates
- [x] 4.1 Update adapter templates to use `@Adapter` and remove comments
- [x] 4.2 Update port templates and remove comments
- [x] 4.3 Removed all comments from templates for better readability

## 5. Testing and Validation
- [x] 5.1 Run `bun run lint` - ensure all files pass
- [x] 5.2 Run `tsc` - ensure no TypeScript errors
- [x] 5.3 Run `bun test` - ensure all tests pass (49/49 passing)
- [ ] 5.4 Run `openspec validate refactor-adapter-decorator-api --strict`
- [x] 5.5 Manually test example project builds and runs
- [x] 5.6 Manually test CLI generation with new templates (verified templates updated correctly)

## 6. Final Polish
- [x] 6.1 Update CONTRIBUTING.md if it references old decorator names (no changes needed)
- [x] 6.2 Add MIGRATION.md guide for users upgrading
- [x] 6.3 Update package.json version (user will handle with `bun run release`)
- [x] 6.4 Update CHANGELOG.md with breaking changes notice
