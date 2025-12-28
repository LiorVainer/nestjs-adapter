# Change: Standardize on "Port" Terminology Throughout Library

## Why

The library currently mixes two competing terminologies:
- **"Port"** (from Hexagonal Architecture) - domain interfaces/contracts
- **"Port"** (from NestJS) - dependency injection providers

This creates confusion:
- Token names use "PROVIDER" (e.g., `OBJECT_STORAGE_PROVIDER`)
- Interfaces use "Port" suffix (e.g., `ObjectStoragePort`)
- But we also have `@AdapterToken` and `@PortService` decorators
- The `FeatureModule` name doesn't indicate it requires an adapter

**Problem:** Users must mentally reconcile whether "provider" means:
1. A NestJS DI provider (class that can be injected)
2. A port interface (domain contract)
3. A token representing the port

This violates the principle of clear, unambiguous naming aligned with Hexagonal Architecture patterns.

## What Changes

**BREAKING CHANGES:**

1. **Rename `FeatureModule` → `PortModule`**
   - Makes explicit that it consumes a port via adapter
   - Aligns with Hexagonal Architecture terminology

2. **Replace `@AdapterToken` and `@AdapterImpl` with single `@Port` decorator**
   - Combines token and implementation declaration into one decorator
   - Cleaner, more declarative API: `@Port({ token, implementation })`
   - Reduces boilerplate from two decorators to one
   - More idiomatic (similar to `@Module()`, `@Injectable()`, etc.)

3. **Rename constants:**
   - `ADAPTER_TOKEN_METADATA` → `PORT_TOKEN_METADATA`
   - `ADAPTER_IMPL_METADATA` → `PORT_IMPLEMENTATION_METADATA`

4. **Keep unchanged (already clear):**
   - `Adapter` - Well-understood term
   - `@InjectPort` - Perfect for injecting ports
   - `AdapterModule<TToken>` - Type name is clear

6. **Update all documentation:**
   - Update `spec/spec.md` with new terminology
   - Create `README.md` for the library
   - Update all examples to use new names

## Impact

**Affected specs:**
- core-api (classes, decorators, constants)

**Affected code:**
- `src/core/feature-module.base.ts` → rename class
- `src/core/decorators.ts` → rename decorators
- `src/core/constants.ts` → rename constants
- `src/index.ts` → update exports
- `examples/**/*.ts` → update all usage
- `spec/spec.md` → comprehensive rewrite
- `README.md` → create new file

**Migration path:**
- Simple find-replace across codebase
- Clear mapping of old → new names
- No behavioral changes, only naming

**Benefits:**
1. Consistent Hexagonal Architecture terminology
2. No ambiguity between NestJS "provider" and port "provider"
3. Clear semantic meaning for all decorators
4. Self-documenting code (names explain purpose)
