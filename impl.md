# Implementation Plan for nest-hex

This document outlines the step-by-step implementation plan for building the NestJS adapter library as specified in `spec/spec.md`.

## Overview

The library provides three core components:
1. **`AdapterModule<TToken>`** - Type definition for type-safe adapter modules
2. **`Adapter`** - Base class for building adapter modules with minimal boilerplate
3. **`FeatureModule`** - Base class for feature modules that consume adapters

## Project Structure

```
src/
├── core/                    # Core library logic
│   ├── types.ts            # AdapterModule<TToken> type definition
│   ├── adapter.base.ts     # Adapter base class
│   ├── feature-module.base.ts  # FeatureModule base class
│   └── index.ts            # Core exports
├── cli/                     # CLI tooling for code generation (future)
│   └── (to be implemented)
└── index.ts                 # Main entry point (re-exports from core)
```

**Note**: The CLI tooling (`src/cli/`) will be implemented in a future phase for generating adapters, ports, and feature modules.

---

## Implementation Steps

### Step 1: Project Setup & Type Definitions

**Goal**: Set up the project structure and define the core `AdapterModule<TToken>` type.

**Files to create/modify**:
- `src/core/types.ts`

**Implementation**:
```typescript
// src/core/types.ts
import type { DynamicModule } from '@nestjs/common';

/**
 * A DynamicModule that carries a compile-time proof it provides `TToken`.
 * The `__provides` field is used only for TypeScript structural typing.
 */
export type AdapterModule<TToken> = DynamicModule & {
  __provides: TToken;
};
```

**Tests to write**:
- `tests/core/types.test.ts`:
  - ✅ Verify `AdapterModule<TToken>` is assignable to `DynamicModule`
  - ✅ Verify `AdapterModule<TToken>` requires `__provides` field
  - ✅ Verify type safety: `AdapterModule<Symbol1>` is not assignable to `AdapterModule<Symbol2>`

**Validation**:
```bash
bun test tests/core/types.test.ts
tsc --noEmit
```

---

### Step 2: Adapter Base Class - Core Structure

**Goal**: Implement the `Adapter` base class with basic structure and the `forToken()` helper.

**Files to create/modify**:
- `src/core/adapter.base.ts`

**Implementation**:
```typescript
// src/core/adapter.base.ts
import type { Provider, Type } from '@nestjs/common';
import type { AdapterModule } from './types';

export abstract class Adapter<TToken, TOptions> {
  /** Capability token (declared once via forToken) */
  protected abstract readonly token: TToken;

  /** Concrete implementation class (declared once) */
  protected abstract readonly implementation: Type<unknown>;

  /** Optional imports (can depend on options) */
  protected imports(_options?: TOptions): unknown[] {
    return [];
  }

  /** Optional extra providers (e.g., helper tokens, loggers, mappers) */
  protected extraPoviders(_options: TOptions): Port[] {
    return [];
  }

  /**
   * Declarative helper: bind a token once.
   *
   * Usage:
   *   class MyAdapter extends Adapter.forToken(MY_TOKEN)<MyOptions> { ... }
   */
  static forToken<TToken>(token: TToken) {
    // Note: Cannot use 'abstract' keyword inside a method, but this class
    // is effectively abstract since it inherits abstract members from Adapter
    class TokenAdapter<TOptions> extends Adapter<TToken, TOptions> {
      protected readonly token = token;
    }
    return TokenAdapter;
  }
}
```

**Tests to write**:
- `tests/core/adapter.base.test.ts`:
  - ✅ `forToken()` creates an adapter class with the token pre-bound
  - ✅ Subclass of `Adapter.forToken(TOKEN)` has access to `token` property
  - ✅ Abstract methods (`implementation`) must be implemented by subclasses
  - ✅ `imports()` returns empty array by default
  - ✅ `extraPoviders()` returns empty array by default

**Validation**:
```bash
bun test tests/core/adapter.base.test.ts
tsc --noEmit
```

---

### Step 3: Adapter Base Class - Sync Registration

**Goal**: Implement the `register()` method for synchronous adapter registration.

**Files to modify**:
- `src/core/adapter.base.ts`

**Implementation**:
Add the `register()` static method to the `Adapter` class:

```typescript
/**
 * Sync registration (app already has options available).
 */
static register<TToken, TOptions>(
  this: new () => Adapter<TToken, TOptions>,
  options: TOptions,
): AdapterModule<TToken> {
  const instance = new this();

  return {
    module: this,
    imports: instance.imports(options),
    providers: [
      instance.implementation,
      { provide: instance.token, useExisting: instance.implementation },
      ...instance.extraPoviders(options),
    ],
    exports: [instance.token],
    __provides: instance.token,
  };
}
```

**Tests to write**:
- `tests/core/adapter.register.test.ts`:
  - ✅ `register()` returns a `DynamicModule` with correct structure
  - ✅ `register()` includes the implementation class as a provider
  - ✅ `register()` aliases the token to the implementation using `useExisting`
  - ✅ `register()` exports only the token (not the provider object)
  - ✅ `register()` includes `__provides` field with the token
  - ✅ `register()` calls `imports()` with options and includes the result
  - ✅ `register()` calls `extraPoviders()` with options and includes the result
  - ✅ Type safety: returned module is typed as `AdapterModule<TToken>`

**Validation**:
```bash
bun test tests/core/adapter.register.test.ts
tsc --noEmit
```

---

### Step 4: Adapter Base Class - Async Registration

**Goal**: Implement the `registerAsync()` method for asynchronous adapter registration with DI.

**Files to modify**:
- `src/core/adapter.base.ts`

**Implementation**:
Add the `registerAsync()` static method to the `Adapter` class:

```typescript
/**
 * Async registration (app provides options via DI).
 *
 * NOTE: The base version does not auto-create an options token.
 * If your adapter needs DI-resolved options, you can:
 * 1) Keep the adapter options sync (recommended), OR
 * 2) Add an adapter-specific options token + provider in `extraPoviders()`,
 *    and configure imports (like HttpModule.registerAsync) there.
 */
static registerAsync<TToken, TOptions>(
  this: new () => Adapter<TToken, TOptions>,
  options: {
    imports?: unknown[];
    inject?: unknown[];
    useFactory: (...args: unknown[]) => TOptions | Promise<TOptions>;
  },
): AdapterModule<TToken> {
  const instance = new this();

  return {
    module: this,
    imports: [
      ...(options.imports ?? []),
      ...instance.imports(),
    ],
    providers: [
      instance.implementation,
      { provide: instance.token, useExisting: instance.implementation },
      ...instance.extraPoviders({} as TOptions),
    ],
    exports: [instance.token],
    __provides: instance.token,
  };
}
```

**Tests to write**:
- `tests/core/adapter.register-async.test.ts`:
  - ✅ `registerAsync()` returns a `DynamicModule` with correct structure
  - ✅ `registerAsync()` includes imports from options
  - ✅ `registerAsync()` includes imports from `imports()` method
  - ✅ `registerAsync()` includes implementation class as provider
  - ✅ `registerAsync()` aliases token using `useExisting`
  - ✅ `registerAsync()` exports only the token
  - ✅ `registerAsync()` includes `__provides` field
  - ✅ Type safety: returned module is typed as `AdapterModule<TToken>`

**Validation**:
```bash
bun test tests/core/adapter.register-async.test.ts
tsc --noEmit
```

---

### Step 5: Feature Module Base Class

**Goal**: Implement the `FeatureModule` base class for domain services that consume adapters.

**Files to create/modify**:
- `src/core/feature-module.base.ts`

**Implementation**:
```typescript
// src/core/feature-module.base.ts
import { Module } from '@nestjs/common';
import type { DynamicModule, Type } from '@nestjs/common';
import type { AdapterModule } from './types';

@Module({})
export abstract class FeatureModule<TService, TToken> {
  protected static service: Type<unknown>;

  static register<TToken>(
    this: { service: Type<unknown> },
    options: { adapter: AdapterModule<TToken> },
  ): DynamicModule {
    return {
      module: this,
      imports: [options.adapter],
      providers: [this.service],
      exports: [this.service],
    };
  }
}
```

**Tests to write**:
- `tests/core/feature-module.test.ts`:
  - ✅ `FeatureModule` is decorated with `@Module({})`
  - ✅ `register()` returns a `DynamicModule` with correct structure
  - ✅ `register()` imports the adapter module
  - ✅ `register()` provides the service class
  - ✅ `register()` exports the service class
  - ✅ Type safety: `register()` only accepts `AdapterModule<TToken>` matching the feature module's token type

**Validation**:
```bash
bun test tests/core/feature-module.test.ts
tsc --noEmit
```

---

### Step 6: Public API Exports

**Goal**: Create the core exports and main entry point that exports all public APIs.

**Files to create/modify**:
- `src/core/index.ts` - Core module exports
- `src/index.ts` - Main entry point (re-exports from core)

**Implementation**:
```typescript
// src/core/index.ts
export { Adapter } from './adapter.base';
export { FeatureModule } from './feature-module.base';
export type { AdapterModule } from './types';
```

```typescript
// src/index.ts
// Re-export all core functionality
export { Adapter, FeatureModule } from './core';
export type { AdapterModule } from './core';
```

**Tests to write**:
- `tests/core/exports.test.ts`:
  - ✅ Core exports: `Adapter`, `FeatureModule`, `AdapterModule` are exported from `src/core`
- `tests/exports.test.ts`:
  - ✅ Main exports: `Adapter`, `FeatureModule`, `AdapterModule` are exported from `src`
  - ✅ Main entry re-exports from core correctly
  - ✅ No other exports are present (public API is minimal)

**Validation**:
```bash
bun test tests/core/exports.test.ts
bun test tests/exports.test.ts
tsc --noEmit
```

---

### Step 7: Integration Testing - Simple Adapter Example

**Goal**: Create end-to-end tests using a simple in-memory adapter to verify the full flow.

**Files to create**:
- `tests/integration/simple-adapter.test.ts`

**Test scenario**:
Create a simple "Logger" port with:
- Token: `LOGGER_PROVIDER`
- Port interface: `LoggerPort { log(message: string): void }`
- Adapter: `ConsoleLoggerAdapter` (logs to array instead of console)
- Feature module: `LoggerModule`
- Domain service: `LoggerService`

**Tests to write**:
- ✅ Create adapter using `Adapter.forToken()`
- ✅ Register adapter with `register()`
- ✅ Create feature module using `FeatureModule`
- ✅ Wire adapter into feature module
- ✅ Create NestJS testing module
- ✅ Inject domain service
- ✅ Verify service uses adapter implementation
- ✅ Verify token aliasing works (`@Inject(LOGGER_PROVIDER)` resolves to implementation)

**Validation**:
```bash
bun test tests/integration/simple-adapter.test.ts
```

---

### Step 8: Integration Testing - Adapter with Options

**Goal**: Test adapters that require configuration options.

**Files to create**:
- `tests/integration/adapter-with-options.test.ts`

**Test scenario**:
Create a "Config Storage" adapter with options:
- Token: `CONFIG_STORAGE_PROVIDER`
- Options: `{ prefix: string }`
- Implementation uses options to prefix all keys
- Test both `register()` with sync options

**Tests to write**:
- ✅ Adapter `register()` receives and uses options
- ✅ Options are passed to `imports()`
- ✅ Options are passed to `extraPoviders()`
- ✅ Implementation receives configuration correctly

**Validation**:
```bash
bun test tests/integration/adapter-with-options.test.ts
```

---

### Step 9: Integration Testing - Adapter with Imports

**Goal**: Test adapters that import other NestJS modules (like `HttpModule`).

**Files to create**:
- `tests/integration/adapter-with-imports.test.ts`

**Test scenario**:
Create an adapter that imports another module:
- Token: `HTTP_CLIENT_PROVIDER`
- Imports: Mock HTTP module
- Verify module is included in adapter's imports

**Tests to write**:
- ✅ Adapter includes modules from `imports()` in the returned `DynamicModule`
- ✅ Imported module providers are available to the implementation

**Validation**:
```bash
bun test tests/integration/adapter-with-imports.test.ts
```

---

### Step 10: Integration Testing - Extra Ports

**Goal**: Test adapters that provide additional providers beyond the main implementation.

**Files to create**:
- `tests/integration/extra-providers.test.ts`

**Test scenario**:
Create an adapter with extra providers:
- Main provider: Storage implementation
- Extra provider: Initializer that calls `init()` method (like S3 example)
- Verify both providers are registered

**Tests to write**:
- ✅ `extraPoviders()` result is included in providers array
- ✅ Extra providers can inject the main implementation
- ✅ Extra providers are instantiated correctly

**Validation**:
```bash
bun test tests/integration/extra-providers.test.ts
```

---

### Step 11: Integration Testing - Type Safety

**Goal**: Verify compile-time type safety of the adapter system.

**Files to create**:
- `tests/integration/type-safety.test.ts`

**Test scenario**:
Create two incompatible adapters/features and verify TypeScript catches mismatches:
- Feature module for token A cannot accept adapter for token B
- `AdapterModule<TokenA>` is not assignable to `AdapterModule<TokenB>`

**Tests to write**:
- ✅ Type-level tests using `expectType` or similar utilities
- ✅ Verify `FeatureModule.register()` enforces token matching
- ✅ Verify `AdapterModule<T>` is properly branded with `__provides`

**Validation**:
```bash
bun test tests/integration/type-safety.test.ts
tsc --noEmit
```

---

### Step 12: Integration Testing - Realistic Example (Mock S3)

**Goal**: Create a realistic example similar to the S3 adapter from the spec.

**Files to create**:
- `tests/integration/realistic-storage.test.ts`

**Test scenario**:
Implement a simplified version of the Object Storage example:
- Token: `OBJECT_STORAGE_PROVIDER`
- Port: `ObjectStoragePort` with `putObject()` and `getSignedGetUrl()`
- Mock adapter: `MockS3Adapter`
- Feature module: `ObjectStorageModule`
- Service: `ObjectStorageService` with `uploadProfilePhoto()`

**Tests to write**:
- ✅ Complete end-to-end flow from app module to service
- ✅ Service successfully calls adapter methods
- ✅ Options are passed through correctly
- ✅ Module wiring works as documented in spec

**Validation**:
```bash
bun test tests/integration/realistic-storage.test.ts
```

---

### Step 13: Integration Testing - Testing Pattern

**Goal**: Demonstrate the testing pattern from Example E in the spec.

**Files to create**:
- `tests/integration/testing-pattern.test.ts`

**Test scenario**:
Show two ways to mock adapters in tests:
1. Create a `MockAdapter` class and use it in `FeatureModule.register()`
2. Use NestJS `.overridePort()` to replace the token with a mock

**Tests to write**:
- ✅ Mock adapter approach works
- ✅ Override provider approach works
- ✅ Both approaches allow injecting the service and calling methods
- ✅ Mock implementations are called instead of real adapters

**Validation**:
```bash
bun test tests/integration/testing-pattern.test.ts
```

---

### Step 14: Documentation & Examples

**Goal**: Create README with usage examples and API documentation.

**Files to create/modify**:
- `README.md`

**Content**:
- Installation instructions
- Quick start example
- API reference for `Adapter`, `FeatureModule`, `AdapterModule<T>`
- Link to full examples in spec
- Testing patterns
- Best practices from spec

**Validation**:
- Manual review
- Verify all examples are accurate and compile

---

### Step 15: Final Validation & Cleanup

**Goal**: Run all tests, type-check, lint, and prepare for release.

**Tasks**:
1. Run full test suite with coverage
2. Run type-checking
3. Run linting
4. Remove placeholder `greet` function and tests
5. Verify package.json exports are correct (should export `./core` and main entry)
6. Build the package
7. Test the built package

**Commands**:
```bash
# Remove old placeholder code
rm src/greet.ts tests/greet.test.ts

# Run all validations
bun test --coverage
tsc --noEmit
bun run lint
bun run build

# Verify build output
ls -la dist/
```

**Package.json exports should include**:
```json
{
  "exports": {
    ".": "./dist/index.js",
    "./core": "./dist/core/index.js"
  }
}
```

**Validation checklist**:
- ✅ All tests pass (100% coverage target)
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Build succeeds
- ✅ dist/ contains expected files (dist/index.js, dist/core/*.js)
- ✅ No placeholder code remains
- ✅ Package exports configured correctly

---

## Testing Strategy

### Unit Tests
- Test each class/method in isolation
- Mock dependencies
- Focus on single responsibility

### Integration Tests
- Test complete flows from adapter registration to service usage
- Use NestJS testing utilities
- Create realistic scenarios

### Type Tests
- Verify compile-time type safety
- Use type assertion utilities
- Ensure `AdapterModule<T>` branding works

### Coverage Goals
- **Target**: 100% line coverage
- **Minimum**: 95% line coverage
- All public APIs must be tested
- All edge cases must be covered

---

## Validation Checklist

After each step:
1. ✅ Run `tsc --noEmit` to verify no TypeScript errors
2. ✅ Run step-specific tests
3. ✅ Verify no regressions in previous tests
4. ✅ Check code follows style guide (run `bun run lint`)

Final validation:
1. ✅ All tests pass
2. ✅ Test coverage ≥ 95%
3. ✅ No TypeScript errors
4. ✅ No linting errors
5. ✅ Build succeeds
6. ✅ Package exports work correctly
7. ✅ README examples are accurate

---

## Implementation Order Summary

1. **Types** → Define `AdapterModule<TToken>` in `src/core/types.ts`
2. **Adapter structure** → Base class + `forToken()` in `src/core/adapter.base.ts`
3. **Adapter sync** → `register()` method
4. **Adapter async** → `registerAsync()` method
5. **Feature module** → Base class + `register()` in `src/core/feature-module.base.ts`
6. **Exports** → Core exports (`src/core/index.ts`) + main entry (`src/index.ts`)
7. **Simple integration** → Basic end-to-end test
8. **Options** → Test adapter configuration
9. **Imports** → Test module imports
10. **Extra providers** → Test additional providers
11. **Type safety** → Compile-time checks
12. **Realistic example** → S3-like scenario
13. **Testing pattern** → Mock strategies
14. **Documentation** → README + examples
15. **Cleanup** → Final validation + package.json exports

Each step builds on the previous, ensuring a solid foundation before adding complexity.

---

## Future: CLI Tooling (src/cli/)

The CLI tooling will be implemented in a future phase and will include:

- **Code generators**:
  - Generate adapter boilerplate
  - Generate port interfaces and tokens
  - Generate feature modules
  - Generate test scaffolding

- **Commands** (planned):
  - `generate:adapter` - Create a new adapter implementation
  - `generate:port` - Create a new port (token + interface)
  - `generate:feature` - Create a new feature module
  - `validate:adapter` - Validate adapter implementation

This will live in `src/cli/` and be a separate implementation phase after the core library is stable.
