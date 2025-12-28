# Change: Implement Decorator-Driven Adapter API

## Why

The library currently has only placeholder code. We need to implement the core decorator-driven adapter API that enables developers to create pluggable NestJS adapters with minimal boilerplate, exceptional DX, and compile-time type safety.

This decorator-driven approach provides:
- Cleaner adapter declarations using `@AdapterToken()` and `@AdapterImpl()` decorators
- Stronger compile-time guarantees with `defineAdapter<TToken, TOptions>()` helper
- Better readability and maintainability
- Zero runtime cost for type safety
- Full alignment with NestJS decorator philosophy

This is the foundation of the entire library - without it, consumers cannot create adapters or feature modules.

## What Changes

- Create `src/core/types.ts` with `AdapterModule<TToken>` type definition
- Create `src/core/constants.ts` with metadata keys for decorators
- Create `src/core/decorators.ts` with `@AdapterToken`, `@AdapterImpl`, and `@InjectPort` decorators
- Create `src/core/adapter.base.ts` with abstract `Adapter` base class that reads decorator metadata
- Create `src/core/define-adapter.ts` with compile-time type safety helper
- Create `src/core/feature-module.base.ts` with `FeatureModule` base class
- Update `src/index.ts` to export the new public API
- Remove placeholder `greet()` function

## Impact

**Affected specs:**
- Creates new capability: `adapter-core`

**Affected code:**
- `src/core/types.ts` (new file)
- `src/core/constants.ts` (new file)
- `src/core/decorators.ts` (new file)
- `src/core/adapter.base.ts` (new file)
- `src/core/define-adapter.ts` (new file)
- `src/core/feature-module.base.ts` (new file)
- `src/index.ts` (replace placeholder with real exports)

**Breaking changes:**
- None (this is the initial implementation)

**Dependencies:**
- Requires `@nestjs/common` as peer dependency (already in package.json)
- Requires `reflect-metadata` as peer dependency (critical for decorator metadata)
