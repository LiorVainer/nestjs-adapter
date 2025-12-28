# Implementation Tasks

## 1. Core Library Renaming
- [ ] 1.1 Rename `FeatureModule` class to `PortModule` in `src/core/feature-module.base.ts`
- [ ] 1.2 Rename file `src/core/feature-module.base.ts` to `src/core/port-module.base.ts`
- [ ] 1.3 Replace `@AdapterToken` and `@AdapterImpl` with single `@Port({ token, implementation })` decorator in `src/core/decorators.ts`
- [ ] 1.4 Rename `ADAPTER_TOKEN_METADATA` to `PORT_TOKEN_METADATA` in `src/core/constants.ts`
- [ ] 1.5 Rename `ADAPTER_IMPL_METADATA` to `PORT_IMPLEMENTATION_METADATA` in `src/core/constants.ts`
- [ ] 1.6 Remove unused `PROVIDER_SERVICE_METADATA` constant from `src/core/constants.ts`
- [ ] 1.7 Update `Adapter` base class to read from `@Port` decorator metadata
- [ ] 1.8 Update exports in `src/index.ts` with new names

## 2. Update Examples
- [ ] 2.1 Update `examples/01-adapter-module-type.ts` with new decorator names
- [ ] 2.2 Update `examples/02-decorator-basics.ts` with `@ProvidesPort` and new examples
- [ ] 2.3 Update `examples/03-inject-port.ts` (verify still correct)
- [ ] 2.4 Update `examples/04-define-adapter-helper.ts` with new decorator names
- [ ] 2.5 Update `examples/storage/object-storage.module.ts` to use `PortModule` and `@ExportsService`
- [ ] 2.6 Update `examples/storage/adapters/s3/s3.adapter.ts` to use `@ProvidesPort`
- [ ] 2.7 Update `examples/rates/currency-rates.module.ts` to use `PortModule` and `@ExportsService`
- [ ] 2.8 Update `examples/rates/adapters/http/http-rates.adapter.ts` to use `@ProvidesPort`
- [ ] 2.9 Update `examples/app/app.module.ts` (verify usage still correct)
- [ ] 2.10 Update `examples/app/app.module.async.ts` (verify usage still correct)
- [ ] 2.11 Update `examples/README.md` with new terminology

## 3. Update Documentation
- [ ] 3.1 Update `spec/spec.md` comprehensively with new terminology
- [ ] 3.2 Replace all instances of `FeatureModule` with `PortModule`
- [ ] 3.3 Replace all instances of `@AdapterToken` with `@ProvidesPort`
- [ ] 3.4 Replace all instances of `@PortService` with `@ExportsService`
- [ ] 3.5 Update all code examples in spec.md
- [ ] 3.6 Create `README.md` for the library with new terminology
- [ ] 3.7 Update `CLAUDE.md` with new class and decorator names
- [ ] 3.8 Update `openspec/project.md` with new terminology

## 4. Validation
- [ ] 4.1 Run `bun run type-check` to verify TypeScript compilation
- [ ] 4.2 Run `bun run type-check:examples` to verify examples compile
- [ ] 4.3 Run `bun run lint` to verify code style
- [ ] 4.4 Run `openspec validate standardize-port-terminology --strict`
- [ ] 4.5 Verify all examples work correctly with new names
- [ ] 4.6 Verify no references to old names remain in codebase
