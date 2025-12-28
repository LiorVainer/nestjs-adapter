## ADDED Requirements

### Requirement: API Examples Structure

The project SHALL provide a comprehensive `examples/` directory at the project root demonstrating all exported APIs with working, type-safe TypeScript code.

#### Scenario: Developer explores examples folder

- **WHEN** a developer opens the `examples/` directory
- **THEN** they SHALL find organized subdirectories for different domains (storage, rates, app, testing, advanced)
- **AND** SHALL find a README.md explaining the organization and how to run examples

#### Scenario: Examples are type-safe

- **WHEN** running `bun run type-check` in the examples directory
- **THEN** all example files SHALL compile without TypeScript errors
- **AND** SHALL follow project conventions (tabs, single quotes, strict mode)

### Requirement: Core API Examples

The examples SHALL demonstrate every exported API from the library including base classes, decorators, types, and helpers.

#### Scenario: Adapter base class example

- **WHEN** a developer reads adapter examples
- **THEN** they SHALL find examples showing `Adapter<TOptions>` base class usage
- **AND** SHALL see examples using `@AdapterToken` and `@AdapterImpl` decorators
- **AND** SHALL see examples of `register()` and `registerAsync()` methods

#### Scenario: FeatureModule base class example

- **WHEN** a developer reads feature module examples
- **THEN** they SHALL find examples showing `FeatureModule<TService, TToken>` base class usage
- **AND** SHALL see how to accept adapters via `register({ adapter })`

#### Scenario: Decorator examples

- **WHEN** a developer needs to use decorators
- **THEN** they SHALL find examples of `@AdapterToken(token)` usage
- **AND** SHALL find examples of `@AdapterImpl(ImplementationClass)` usage
- **AND** SHALL find examples of `@InjectPort(token)` usage in service constructors

#### Scenario: Helper function examples

- **WHEN** a developer wants compile-time type safety
- **THEN** they SHALL find examples using `defineAdapter<TToken, TOptions>()` helper
- **AND** SHALL see how it provides type verification at compile time

### Requirement: Complete Working Scenarios

The examples SHALL include at least two complete end-to-end scenarios demonstrating real-world adapter patterns (one AWS-based, one HTTP-based).

#### Scenario: Object storage with S3 adapter

- **WHEN** a developer explores the storage example
- **THEN** they SHALL find:
  - Port token definition (`OBJECT_STORAGE_PROVIDER`)
  - Port interface (`ObjectStoragePort`)
  - Domain service using `@InjectPort()`
  - Feature module extending `FeatureModule`
  - S3 adapter implementing the port
  - Complete adapter options and configuration

#### Scenario: Currency rates with HTTP adapter

- **WHEN** a developer explores the rates example
- **THEN** they SHALL find:
  - Port token definition (`CURRENCY_RATES_PROVIDER`)
  - Port interface (`CurrencyRatesPort`)
  - Domain service using `@InjectPort()`
  - Feature module extending `FeatureModule`
  - HTTP adapter using `HttpModule`
  - Complete adapter options and configuration

### Requirement: App Integration Examples

The examples SHALL demonstrate how to wire adapters and feature modules in a NestJS application.

#### Scenario: Synchronous app wiring

- **WHEN** a developer reads the app integration examples
- **THEN** they SHALL find an `app.module.ts` showing how to import feature modules with adapters using `register()`
- **AND** SHALL see configuration passed from environment variables or config service

#### Scenario: Asynchronous app wiring

- **WHEN** a developer needs async configuration
- **THEN** they SHALL find an example using `registerAsync()` with dependency injection
- **AND** SHALL see how to inject `ConfigService` or other providers into the factory function

### Requirement: Testing Examples

The examples SHALL demonstrate testing patterns for adapters and feature modules.

#### Scenario: Mock adapter creation

- **WHEN** a developer needs to test code using adapters
- **THEN** they SHALL find examples of creating mock adapters using the `Adapter` base class
- **AND** SHALL see how to use `defineAdapter()` with mock implementations

#### Scenario: Port override testing

- **WHEN** a developer uses NestJS testing utilities
- **THEN** they SHALL find examples using `.overridePort(TOKEN).useValue(mock)`
- **AND** SHALL see complete test module setup with mocked dependencies

### Requirement: Advanced Patterns

The examples SHALL demonstrate advanced customization patterns including custom imports and extra providers.

#### Scenario: Custom imports override

- **WHEN** an adapter needs to import other NestJS modules
- **THEN** developers SHALL find examples overriding the `imports(options)` method
- **AND** SHALL see how imports can depend on adapter options

#### Scenario: Extra providers override

- **WHEN** an adapter needs additional helper providers
- **THEN** developers SHALL find examples overriding the `extraPoviders(options)` method
- **AND** SHALL see how to add factory providers, value providers, etc.

### Requirement: Documentation Quality

All example files SHALL include clear inline documentation explaining concepts and best practices.

#### Scenario: Example file documentation

- **WHEN** a developer opens any example file
- **THEN** the file SHALL have a header comment explaining its purpose
- **AND** SHALL include JSDoc comments on classes and key methods
- **AND** SHALL include inline comments explaining non-obvious patterns

#### Scenario: Examples README

- **WHEN** a developer opens `examples/README.md`
- **THEN** it SHALL explain the organization of examples
- **AND** SHALL provide guidance on which examples to read first
- **AND** SHALL explain how to run or type-check the examples
