# Change: Add Comprehensive API Examples

## Why

The library exports several APIs (`Adapter`, `FeatureModule`, decorators, helpers, types) but lacks working examples demonstrating how to use them. Developers need concrete, runnable examples to understand:
- How to implement adapters using the decorator-driven API
- How to create feature modules that consume adapters
- How to wire adapters and features in apps
- How to write tests with mock adapters

## What Changes

Add an `examples/` folder at project root containing working TypeScript examples that demonstrate every exported API:

1. **Core type examples** - Demonstrating `AdapterModule<TToken>`
2. **Adapter implementation examples** - Using `Adapter` base class with `@AdapterToken` and `@AdapterImpl` decorators
3. **Feature module examples** - Using `FeatureModule` base class
4. **Decorator examples** - Showing `@AdapterToken`, `@AdapterImpl`, and `@InjectPort` in real scenarios
5. **Helper examples** - Using `defineAdapter<TToken, TOptions>()` for compile-time verification
6. **Complete working scenarios**:
   - AWS S3 object storage adapter
   - HTTP-based currency rates adapter
   - Feature modules consuming these adapters
   - App module wiring
   - Testing patterns with mock adapters

Each example will be a complete, self-contained TypeScript file with inline comments explaining the concepts.

## Impact

**Affected code:**
- Add `examples/` directory at project root
- Add example TypeScript files (no changes to `src/`)
- Update package.json scripts if needed (e.g., example runner)
- Potentially add README.md in examples/ folder

**Affected specs:**
- None (this is documentation/examples, not a library capability change)

**Benefits:**
- Faster developer onboarding
- Clear reference implementations
- Reduced support burden (developers can reference working code)
- Validation that the API works as designed

**Breaking changes:** None
