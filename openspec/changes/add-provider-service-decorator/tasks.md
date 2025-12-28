# Implementation Tasks

## 1. Core Implementation
- [x] 1.1 Add `PROVIDER_SERVICE_METADATA` constant to `src/core/constants.ts`
- [x] 1.2 Implement `@PortService` decorator in `src/core/decorators.ts`
- [x] 1.3 Update `FeatureModule.register()` to read service from metadata
- [x] 1.4 Remove `protected static service` requirement from FeatureModule
- [x] 1.5 Export `@PortService` from `src/index.ts`

## 2. Update Examples
- [x] 2.1 Update `examples/storage/object-storage.module.ts` to use `@PortService`
- [x] 2.2 Update `examples/rates/currency-rates.module.ts` to use `@PortService`

## 3. Update Specification
- [x] 3.1 Update spec.md with decorator-based service registration
- [x] 3.2 Add migration guide for breaking change

## 4. Validation
- [x] 4.1 Run `bun run type-check` to verify TypeScript compilation
- [x] 4.2 Run `bun run type-check:examples` to verify examples compile
- [x] 4.3 Run `bun run lint` to verify code style
- [x] 4.4 Verify all existing functionality works with new decorator
