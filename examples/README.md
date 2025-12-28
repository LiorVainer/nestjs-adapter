# NestJS Adapter Examples

This directory contains comprehensive, working examples demonstrating all APIs provided by the `nestjs-adapter` library.

## Quick Start

The examples are organized by complexity. Start with the basic examples (01-04) to understand core concepts, then explore the complete scenarios in the domain folders.

### Type-Checking Examples

Run type-checking on all examples:

```bash
bun run type-check:examples
```

## Organization

### Basic Examples (`01-04-*.ts`)

Foundational examples showing individual APIs in isolation:

- `01-adapter-module-type.ts` - Understanding the `AdapterModule<TToken>` type
- `02-decorator-basics.ts` - Using `@AdapterToken` and `@AdapterImpl` decorators
- `03-inject-port.ts` - Injecting ports with `@InjectPort` decorator
- `04-define-adapter-helper.ts` - Compile-time verification with `defineAdapter()`

### Complete Scenarios

Two full end-to-end examples demonstrating real-world adapter patterns:

#### Object Storage (AWS S3)

Directory: `storage/`

A complete example of building an object storage abstraction with an S3 adapter:

- `storage/object-storage.token.ts` - Port token definition
- `storage/object-storage.port.ts` - Port interface (domain contract)
- `storage/object-storage.service.ts` - Domain service consuming the port
- `storage/object-storage.module.ts` - Feature module using `FeatureModule` base class
- `storage/adapters/s3/` - AWS S3 adapter implementation

#### Currency Rates (HTTP API)

Directory: `rates/`

A complete example of building a currency rates abstraction with an HTTP adapter:

- `rates/currency-rates.token.ts` - Port token definition
- `rates/currency-rates.port.ts` - Port interface (domain contract)
- `rates/currency-rates.service.ts` - Domain service consuming the port
- `rates/currency-rates.module.ts` - Feature module using `FeatureModule` base class
- `rates/adapters/http/` - HTTP-based adapter implementation

### App Integration (`app/`)

Examples showing how to wire adapters and feature modules in a NestJS application:

- `app/app.module.ts` - Synchronous registration with `register()`
- `app/app.module.async.ts` - Asynchronous registration with `registerAsync()` and DI

### Testing (`testing/`)

Examples demonstrating testing patterns for adapters and feature modules:

- `testing/mock-adapter.test.ts` - Creating mock adapters for testing
- `testing/override-provider.test.ts` - Using NestJS testing module overrides
- `testing/test-module.test.ts` - Complete test module setup

### Advanced Patterns (`advanced/`)

Examples showing advanced customization techniques:

- `advanced/custom-imports.ts` - Overriding `imports()` to add module dependencies
- `advanced/extra-providers.ts` - Overriding `extraPoviders()` to add helper services
- `advanced/multiple-adapters.ts` - Using multiple adapters for the same port

## Learning Path

1. **Start here**: Read the basic examples (01-04) to understand core APIs
2. **Pick a scenario**: Choose either storage or rates to see a complete implementation
3. **See integration**: Read the app integration examples to understand wiring
4. **Learn testing**: Explore the testing examples for test patterns
5. **Go advanced**: Check out advanced patterns when you need customization

## Key Concepts

### Ports & Adapters Pattern

This library implements the Ports & Adapters (Hexagonal Architecture) pattern:

- **Ports** are interfaces defining what your domain needs (e.g., storage, external APIs)
- **Adapters** are implementations providing those capabilities (e.g., S3, HTTP)
- **Feature Modules** contain domain logic and depend on ports, not adapters
- **Apps** wire everything together by choosing which adapters to use

### Type Safety

The library provides compile-time type safety through:

- `AdapterModule<TToken>` - Carries proof of which token an adapter provides
- `defineAdapter<TToken, TOptions>()` - Verifies adapter signatures at compile time
- `FeatureModule<TService>` - Ensures feature modules receive compatible adapters

### Decorator-Driven API

Adapters are configured using decorators to minimize boilerplate:

- `@AdapterToken(TOKEN)` - Declares which port token the adapter provides
- `@AdapterImpl(ServiceClass)` - Declares the implementation class
- `@InjectPort(TOKEN)` - Injects ports into service constructors (sugar for `@Inject`)

## Contributing

When adding new examples:

1. Follow the project's TypeScript conventions (tabs, single quotes, strict mode)
2. Include JSDoc comments explaining key concepts
3. Add inline comments for non-obvious patterns
4. Run `bun run type-check:examples` to verify compilation
5. Keep examples focused and self-contained
