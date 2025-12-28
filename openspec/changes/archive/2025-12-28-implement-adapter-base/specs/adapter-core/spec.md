# Adapter Core Specification

## ADDED Requirements

### Requirement: AdapterModule Type Definition

The library SHALL provide an `AdapterModule<TToken>` type that extends `DynamicModule` with a compile-time proof of the provided token.

#### Scenario: Type structure
- **WHEN** an adapter returns `AdapterModule<typeof MY_TOKEN>`
- **THEN** the type SHALL include `DynamicModule` properties (module, providers, exports, imports)
- **AND** SHALL include a `__provides: TToken` field for structural typing

#### Scenario: Compile-time type safety
- **WHEN** a feature module expects `AdapterModule<typeof STORAGE_TOKEN>`
- **AND** receives `AdapterModule<typeof AUTH_TOKEN>`
- **THEN** TypeScript SHALL produce a compile-time type error

### Requirement: Adapter Base Class Structure

The library SHALL provide an abstract `Adapter<TToken, TOptions>` base class for building adapter modules.

#### Scenario: Abstract properties
- **WHEN** a class extends `Adapter<TToken, TOptions>`
- **THEN** it MUST define a protected `token` property of type `TToken`
- **AND** MUST define a protected `implementation` property of type `Type<unknown>`

#### Scenario: Optional hooks
- **WHEN** an adapter needs to import other NestJS modules
- **THEN** it MAY override the `imports(options?: TOptions): any[]` method
- **WHEN** an adapter needs additional providers
- **THEN** it MAY override the `extraPoviders(options: TOptions): Port[]` method

### Requirement: Synchronous Registration

The Adapter class SHALL provide a static `register()` method for synchronous configuration.

#### Scenario: Basic registration
- **WHEN** `MyAdapter.register(options)` is called
- **THEN** it SHALL return `AdapterModule<TToken>` with:
  - `module` set to the adapter class
  - `providers` containing the implementation class
  - `providers` containing token aliased to implementation via `useExisting`
  - `exports` containing only the token

#### Scenario: With imports
- **WHEN** adapter overrides `imports(options)` returning `[HttpModule]`
- **AND** `MyAdapter.register(options)` is called
- **THEN** the returned module SHALL include `HttpModule` in imports

#### Scenario: With extra providers
- **WHEN** adapter overrides `extraPoviders(options)` returning additional providers
- **AND** `MyAdapter.register(options)` is called
- **THEN** the returned module SHALL include those providers

#### Scenario: Type safety
- **WHEN** `MyAdapter.register(options)` is called
- **THEN** the return type SHALL be `AdapterModule<TToken>` where `TToken` matches the adapter's token

### Requirement: Asynchronous Registration

The Adapter class SHALL provide a static `registerAsync()` method for DI-based configuration.

#### Scenario: Factory-based configuration
- **WHEN** `MyAdapter.registerAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: (config) => config.get('adapter') })` is called
- **THEN** it SHALL return `AdapterModule<TToken>` with:
  - `module` set to the adapter class
  - `imports` containing specified imports plus adapter's `imports()` result
  - `providers` containing the implementation class
  - `providers` containing token aliased to implementation via `useExisting`
  - `exports` containing only the token

#### Scenario: Without factory dependencies
- **WHEN** `MyAdapter.registerAsync({ useFactory: () => defaultOptions })` is called
- **THEN** it SHALL work without imports or inject arrays

#### Scenario: Type safety
- **WHEN** `MyAdapter.registerAsync(asyncOptions)` is called
- **THEN** the return type SHALL be `AdapterModule<TToken>` where `TToken` matches the adapter's token

### Requirement: Declarative Token Binding

The Adapter class SHALL provide a static `forToken()` helper for declarative token binding.

#### Scenario: Token binding
- **WHEN** `class MyAdapter extends Adapter.forToken(MY_TOKEN)<MyOptions> {}`
- **THEN** the `token` property SHALL be automatically set to `MY_TOKEN`
- **AND** the adapter SHALL only need to define `implementation`

#### Scenario: Type inference
- **WHEN** using `Adapter.forToken(STORAGE_TOKEN)`
- **THEN** TypeScript SHALL infer `TToken` as `typeof STORAGE_TOKEN`
- **AND** `register()` SHALL return `AdapterModule<typeof STORAGE_TOKEN>`

#### Scenario: Multiple adapters for same token
- **WHEN** multiple adapter classes use `Adapter.forToken(SAME_TOKEN)`
- **THEN** each adapter SHALL provide the same token independently
- **AND** apps MAY choose which adapter implementation to use

### Requirement: Port Registration Pattern

The Adapter base class SHALL automatically handle provider registration following NestJS best practices.

#### Scenario: Implementation class registration
- **WHEN** an adapter defines `implementation = MyServiceClass`
- **AND** calls `register()` or `registerAsync()`
- **THEN** the providers array SHALL include `MyServiceClass` as a provider

#### Scenario: Token aliasing
- **WHEN** an adapter provides `token = MY_TOKEN` and `implementation = MyService`
- **THEN** the providers array SHALL include `{ provide: MY_TOKEN, useExisting: MyService }`

#### Scenario: Token-only exports
- **WHEN** an adapter registers providers
- **THEN** the exports array SHALL contain only the token
- **AND** SHALL NOT contain provider objects or implementation classes

### Requirement: TypeScript Strict Mode Compliance

All adapter code SHALL compile successfully under TypeScript strict mode with isolated declarations.

#### Scenario: No type assertions
- **WHEN** implementing the Adapter base class
- **THEN** it SHALL minimize use of `as` type casts
- **AND** SHALL avoid `any` type (use proper types or `unknown`)

#### Scenario: Isolated declarations
- **WHEN** compiling with `isolatedDeclarations: true`
- **THEN** all public APIs SHALL have explicit return types
- **AND** all exported types SHALL be independently type-checkable

#### Scenario: Type-check validation
- **WHEN** running `tsc` after implementation
- **THEN** it SHALL produce zero TypeScript errors
