# Change: Refactor Adapter Decorator API and Documentation

## Why

The current `@Port` decorator naming is confusing and inconsistent with its purpose. Users are defining **adapters**, not ports - the decorator should reflect this. Additionally, the protected hook pattern (`imports()`, `extraProviders()`) creates unnecessary indirection. Moving these to decorator options makes the API more declarative and easier to understand at a glance.

The documentation is too verbose in the README and lacks clear separation between library and CLI documentation, making it harder for users to find what they need.

## What Changes

- **BREAKING**: Rename `@Port` decorator to `@Adapter` (clean rename, no deprecated alias)
- **BREAKING**: Add `imports` and `providers` options to `@Adapter` decorator (protected hooks remain available for complex cases)
- Rename terminology: "provider" → "port" throughout documentation (when referring to what adapters provide)
- Restructure documentation:
  - Simplify `README.md` to a concise introduction with links to full docs
  - Create `docs/library.md` - Complete library API and usage guide with:
    - Table of contents
    - Hexagonal architecture flowchart (Mermaid diagram)
    - Complete API reference
    - Advanced usage patterns
    - Migration guide
  - Create `docs/cli.md` - Complete CLI documentation with:
    - Table of contents
    - All available commands
    - Configuration options
    - Templates and customization
    - Examples
- Update all examples and code to use new API

## Impact

- **Affected specs**: core-api (new), documentation (new)
- **Affected code**:
  - `src/decorators/port.decorator.ts` → `src/decorators/adapter.decorator.ts`
  - `src/adapter.base.ts` - Update protected hooks documentation
  - `README.md` - Update all examples and API documentation
  - `examples/**/*.ts` - Update all example code
  - `example-project/**/*.ts` - Update example project
- **Migration required**: Users need to rename `@Port` to `@Adapter` (simple find/replace)
- **Breaking change**: Yes, but trivial migration path
