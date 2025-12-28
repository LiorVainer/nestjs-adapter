# Implementation Tasks

## 1. Type Definitions
- [ ] 1.1 Create `src/core/types.ts` with `AdapterModule<TToken>` type
- [ ] 1.2 Add JSDoc comments explaining the `__provides` field purpose
- [ ] 1.3 Verify type compiles with `tsc`

## 2. Constants
- [ ] 2.1 Create `src/core/constants.ts`
- [ ] 2.2 Define `ADAPTER_TOKEN_METADATA` symbol for decorator metadata
- [ ] 2.3 Define `ADAPTER_IMPL_METADATA` symbol for decorator metadata
- [ ] 2.4 Verify constants compile with `tsc`

## 3. Decorators
- [ ] 3.1 Create `src/core/decorators.ts`
- [ ] 3.2 Implement `@AdapterToken(token)` class decorator
- [ ] 3.3 Implement `@AdapterImpl(implementation)` class decorator
- [ ] 3.4 Implement `@InjectPort(token)` parameter decorator
- [ ] 3.5 Add comprehensive JSDoc comments for each decorator
- [ ] 3.6 Verify decorators compile with `tsc`

## 4. Adapter Base Class
- [ ] 4.1 Create `src/core/adapter.base.ts` with abstract `Adapter<TOptions>` class (only generic over TOptions, not TToken)
- [ ] 4.2 Implement optional `imports()` method for module imports
- [ ] 4.3 Implement optional `extraProviders()` method for additional providers
- [ ] 4.4 Implement static `register<TToken, TOptions>()` method that reads decorator metadata
- [ ] 4.5 Add runtime validation in `register()` (throw if decorators missing)
- [ ] 4.6 Implement static `registerAsync<TToken, TOptions>()` method that reads decorator metadata
- [ ] 4.7 Add runtime validation in `registerAsync()` (throw if decorators missing)
- [ ] 4.8 Add comprehensive JSDoc comments
- [ ] 4.9 Verify TypeScript compilation with `tsc`

## 5. Define Adapter Helper
- [ ] 5.1 Create `src/core/define-adapter.ts`
- [ ] 5.2 Implement `defineAdapter<TToken, TOptions>()` curried function
- [ ] 5.3 Add type constraint: `extends new () => Adapter<TOptions>` (validates class extends Adapter with only TOptions)
- [ ] 5.4 Add return type augmentation for `register()` and `registerAsync()`
- [ ] 5.5 Add JSDoc explaining compile-time only nature (identity function)
- [ ] 5.6 Verify helper compiles with `tsc`

## 6. Feature Module Base Class
- [ ] 6.1 Create `src/core/feature-module.base.ts`
- [ ] 6.2 Implement abstract `FeatureModule<TService, TToken>` class
- [ ] 6.3 Add `@Module({})` decorator
- [ ] 6.4 Implement static `register()` method accepting adapter
- [ ] 6.5 Add JSDoc comments
- [ ] 6.6 Verify TypeScript compilation with `tsc`

## 7. Public API Exports
- [ ] 7.1 Update `src/index.ts` to export `Adapter` class
- [ ] 7.2 Export `FeatureModule` class
- [ ] 7.3 Export `AdapterModule` type
- [ ] 7.4 Export all decorators: `AdapterToken`, `AdapterImpl`, `InjectPort`
- [ ] 7.5 Export `defineAdapter` helper
- [ ] 7.6 Remove placeholder `greet()` function
- [ ] 7.7 Verify exports compile with `tsc`

## 8. Validation
- [ ] 8.1 Run `bun run build` to verify bundle builds successfully
- [ ] 8.2 Run `bun run lint` to ensure code style compliance
- [ ] 8.3 Run `tsc` to verify no TypeScript errors
- [ ] 8.4 Verify `dist/` contains expected output files
- [ ] 8.5 Check that decorators work correctly (metadata is set/read)
