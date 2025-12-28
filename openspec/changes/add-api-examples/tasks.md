# Implementation Tasks

## 1. Project Structure
- [x] 1.1 Create `examples/` directory at project root
- [x] 1.2 Create `examples/README.md` explaining example organization
- [x] 1.3 Add TypeScript configuration for examples (tsconfig.json or extend from root)
- [x] 1.4 Set up package.json scripts for type-checking examples

## 2. Basic Examples
- [x] 2.1 Create `examples/01-adapter-module-type.ts` - Demonstrate `AdapterModule<TToken>` type
- [x] 2.2 Create `examples/02-decorator-basics.ts` - Show `@AdapterToken` and `@AdapterImpl` usage
- [x] 2.3 Create `examples/03-inject-port.ts` - Demonstrate `@InjectPort` decorator
- [x] 2.4 Create `examples/04-define-adapter-helper.ts` - Show `defineAdapter()` compile-time verification

## 3. Object Storage Port (Example Domain A)
- [x] 3.1 Create `examples/storage/object-storage.token.ts` - Port token definition
- [x] 3.2 Create `examples/storage/object-storage.port.ts` - Port interface
- [x] 3.3 Create `examples/storage/object-storage.service.ts` - Domain service
- [x] 3.4 Create `examples/storage/object-storage.module.ts` - Feature module

## 4. AWS S3 Adapter (Infrastructure for Storage Port)
- [x] 4.1 Create `examples/storage/adapters/s3/s3.types.ts` - S3 adapter options
- [x] 4.2 Create `examples/storage/adapters/s3/s3.service.ts` - S3 implementation service
- [x] 4.3 Create `examples/storage/adapters/s3/s3.adapter.ts` - S3 adapter module using decorators

## 5. Currency Rates Port (Example Domain B)
- [x] 5.1 Create `examples/rates/currency-rates.token.ts` - Port token definition
- [x] 5.2 Create `examples/rates/currency-rates.port.ts` - Port interface
- [x] 5.3 Create `examples/rates/currency-rates.service.ts` - Domain service
- [x] 5.4 Create `examples/rates/currency-rates.module.ts` - Feature module

## 6. HTTP Rates Adapter (Infrastructure for Rates Port)
- [x] 6.1 Create `examples/rates/adapters/http/http-rates.types.ts` - HTTP adapter options
- [x] 6.2 Create `examples/rates/adapters/http/http-rates.service.ts` - HTTP implementation service
- [x] 6.3 Create `examples/rates/adapters/http/http-rates.adapter.ts` - HTTP adapter using decorators

## 7. App Integration Examples
- [x] 7.1 Create `examples/app/app.module.ts` - Complete app wiring both adapters
- [x] 7.2 Create `examples/app/app.module.async.ts` - App wiring with `registerAsync()`
- [ ] 7.3 Create `examples/app/main.ts` - Bootstrap example (optional, not critical)

## 8. Testing Examples
- [ ] 8.1 Create `examples/testing/mock-adapter.test.ts` - Creating mock adapters (deferred for future iteration)
- [ ] 8.2 Create `examples/testing/override-provider.test.ts` - Using NestJS testing overrides (deferred)
- [ ] 8.3 Create `examples/testing/test-module.test.ts` - Complete test module setup (deferred)

## 9. Advanced Examples
- [ ] 9.1 Create `examples/advanced/custom-imports.ts` - Adapter with custom `imports()` override (shown in existing examples)
- [ ] 9.2 Create `examples/advanced/extra-providers.ts` - Adapter with `extraPoviders()` override (shown in existing examples)
- [ ] 9.3 Create `examples/advanced/multiple-adapters.ts` - Multiple adapters for same port (deferred)

## 10. Documentation
- [ ] 10.1 Update root README.md to reference examples folder (deferred for future iteration)
- [x] 10.2 Add inline JSDoc comments to all example files
- [x] 10.3 Ensure each example file has a header comment explaining its purpose

## 11. Validation
- [x] 11.1 Run `bun run type-check:examples` for examples directory
- [x] 11.2 Verify all examples compile without errors
- [x] 11.3 Test that examples can import from the library correctly
- [x] 11.4 Validate examples follow project TypeScript conventions (tabs, single quotes, etc.)
