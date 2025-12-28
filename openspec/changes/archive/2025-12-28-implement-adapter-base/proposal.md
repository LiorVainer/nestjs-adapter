# Change: Implement Adapter Base Class and Type System

## Why

The library currently has only placeholder code. We need to implement the core adapter base class that enables developers to create pluggable NestJS adapters with minimal boilerplate, following the Ports & Adapters (Hexagonal Architecture) pattern.

This is the foundation of the entire library - without it, consumers cannot create adapters or feature modules.

## What Changes

- Create `src/core/types.ts` with `AdapterModule<TToken>` type definition
- Create `src/core/adapter.base.ts` with abstract `Adapter` base class
- Implement `Adapter.forToken()` declarative helper for token binding
- Implement `Adapter.register()` for synchronous configuration
- Implement `Adapter.registerAsync()` for async configuration with DI
- Update `src/index.ts` to export the new public API
- Remove placeholder `greet()` function

## Impact

**Affected specs:**
- Creates new capability: `adapter-core`

**Affected code:**
- `src/core/types.ts` (new file)
- `src/core/adapter.base.ts` (new file)
- `src/index.ts` (replace placeholder with real exports)

**Breaking changes:**
- None (this is the initial implementation)

**Dependencies:**
- Requires `@nestjs/common` as peer dependency (already in package.json)
