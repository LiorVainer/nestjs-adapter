# Design: Decorator-Driven Adapter API Implementation

## Context

This is the core foundation of the `nest-hex` library. The decorator-driven adapter API provides a clean, declarative way to build NestJS dynamic modules that implement the Ports & Adapters (Hexagonal Architecture) pattern.

**Key stakeholders:**
- Library consumers who will use decorators to create adapters
- Feature module authors who will receive `AdapterModule<TToken>` instances
- NestJS developers familiar with decorator-based patterns

**Constraints:**
- Must be compatible with NestJS dynamic module system
- Must enforce TypeScript strict mode and isolated declarations
- Must support both sync and async configuration patterns
- Zero runtime dependencies (NestJS is peer dependency)
- Requires `reflect-metadata` for decorator metadata storage

## Goals / Non-Goals

**Goals:**
- Provide decorator-based API for declaring adapter metadata
- Enable compile-time type safety with `defineAdapter()` helper
- Minimize boilerplate for creating adapter modules
- Support both `register()` and `registerAsync()` patterns
- Auto-handle provider registration, aliasing, and exports
- Zero runtime overhead for type safety (decorators serve as metadata storage only)

**Non-Goals:**
- Feature module implementation (included but separate concern)
- Example adapters (documentation concern)
- Testing utilities (future enhancement)
- Runtime validation beyond missing decorator checks
- Custom decorator composition patterns (keep it simple)

## Decisions

### Decision 1: Decorator-Based Metadata Storage

**What:** Use class decorators (`@AdapterToken`, `@AdapterImpl`) to store adapter metadata via `Reflect.defineMetadata()`.

**Why:**
- Declarative and readable - metadata is colocated with class definition
- Aligns with NestJS philosophy (uses decorators extensively)
- Eliminates need for protected abstract fields
- Cleaner class hierarchy (no need for `forToken()` helper)
- Metadata is read at runtime but type-checked at compile time

**Alternatives considered:**
- Protected fields with `forToken()`: Rejected - less clean, requires inheritance tricks
- Function factories: Rejected - not class-based, harder to extend
- Configuration objects: Rejected - less declarative, doesn't leverage TypeScript decorators

**Implementation:**
```typescript
@AdapterToken(STORAGE_TOKEN)
@AdapterImpl(S3Service)
class S3Adapter extends Adapter<Options> {}
```

### Decision 2: `defineAdapter<TToken, TOptions>()` Compile-Time Helper

**What:** Provide a curried identity function that verifies adapter contract at compile time.

**Why:**
- Enforces correct `register()` and `registerAsync()` signatures
- Provides compile-time proof that adapter provides the correct token
- Zero runtime cost (function returns class unchanged)
- Enables better IDE autocomplete and type inference
- Prevents common mistakes (wrong options type, wrong token type)

**Alternatives considered:**
- No helper (rely on base class types only): Rejected - less safe, weaker guarantees
- Runtime validation: Rejected - adds overhead, defeats zero-cost abstraction goal
- Branded types: Rejected - same result but more complex

**Implementation:**
```typescript
export default defineAdapter<typeof TOKEN, Options>()(
  @AdapterToken(TOKEN)
  @AdapterImpl(Service)
  class MyAdapter extends Adapter<Options> {}
);
```

### Decision 3: `@InjectPort(token)` DX Decorator

**What:** Shorthand decorator for injecting port tokens (wraps `@Inject()`).

**Why:**
- Cleaner, more semantic syntax in domain services
- Clearly communicates "this is a port injection"
- Reduces imports (don't need `@Inject` from `@nestjs/common`)
- Consistent with library's declarative philosophy

**Alternatives considered:**
- Use `@Inject()` directly: Works but less semantic, more verbose
- Custom injection decorator with validation: Rejected - over-engineering

**Implementation:**
```typescript
constructor(
  @InjectPort(STORAGE_TOKEN)
  private storage: StoragePort
) {}
```

### Decision 4: Runtime Validation for Missing Decorators

**What:** Throw descriptive errors in `register()` and `registerAsync()` if decorators are missing.

**Why:**
- Prevents cryptic errors (undefined token, undefined implementation)
- Guides developers to correct usage
- Fails fast with clear error messages
- Minimal runtime cost (only checked during module registration, not per-request)

**Alternatives considered:**
- No runtime validation: Rejected - poor DX, confusing errors
- Compile-time only validation: Not possible, decorators are runtime metadata

**Implementation:**
```typescript
if (!token) {
  throw new Error(`${this.name} must be decorated with @AdapterToken()`);
}
if (!implementation) {
  throw new Error(`${this.name} must be decorated with @AdapterImpl()`);
}
```

### Decision 5: Metadata Keys as Symbols

**What:** Use `Symbol()` for `ADAPTER_TOKEN_METADATA` and `ADAPTER_IMPL_METADATA`.

**Why:**
- Prevents accidental collisions with other metadata keys
- Follows best practices for Reflect metadata keys
- Type-safe (can't use wrong string by accident)
- Private by nature (can't be accessed without importing the symbol)

**Alternatives considered:**
- String keys: Rejected - higher collision risk, less type-safe
- Unique strings with prefixes: Works but symbols are better suited

## Risks / Trade-offs

### Risk: Decorator syntax unfamiliar to some developers

**Risk:** Developers not familiar with TypeScript decorators may find the syntax confusing.

**Mitigation:**
- Provide comprehensive examples in documentation
- JSDoc comments explain each decorator's purpose
- Error messages guide correct usage
- Decorators are optional (can still use base class directly, though not recommended)

**Trade-off:** Slightly steeper learning curve vs cleaner API. We choose cleaner API.

### Risk: `reflect-metadata` peer dependency

**Risk:** Consuming apps must install and import `reflect-metadata`.

**Mitigation:**
- Document clearly in README and package.json peerDependencies
- NestJS already requires `reflect-metadata`, so most apps will have it
- Provide clear error if metadata is missing (though rare)

**Trade-off:** Additional dependency vs decorator functionality. We choose decorators.

### Risk: `defineAdapter()` might be seen as "magic"

**Risk:** The curried function syntax `defineAdapter<T, O>()(class ...)` might confuse developers.

**Mitigation:**
- Document that it's an identity function (returns class unchanged)
- Explain compile-time only purpose in JSDoc
- Provide examples in spec.md
- Make it optional (works without it, but loses some type safety)

**Trade-off:** Slightly unusual syntax vs strong type safety. We choose type safety.

### Risk: Runtime validation overhead

**Risk:** Checking for decorators in `register()` adds minimal overhead.

**Mitigation:**
- Validation only runs during module registration (one-time, at app startup)
- Not in the hot path (per-request)
- Errors are thrown early, preventing worse issues later
- Overhead is negligible compared to NestJS module initialization

**Trade-off:** Tiny startup cost vs much better DX. We choose DX.

## Migration Plan

**N/A** - This is the initial implementation, no migration needed.

**Future considerations:**
- If we deprecate decorator API, provide codemod for migration
- If we add more decorators, keep them optional and backward compatible
- Breaking changes should follow semver (major version bump)

## Open Questions

None - the spec.md provides complete implementation guidance based on the decorator-driven API design.
