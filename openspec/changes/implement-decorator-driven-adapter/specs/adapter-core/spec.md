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

### Requirement: Decorator Metadata Constants

The library SHALL provide Symbol constants for storing decorator metadata.

#### Scenario: Token metadata key
- **WHEN** the library defines metadata keys
- **THEN** it SHALL export `ADAPTER_TOKEN_METADATA` as a Symbol
- **AND** SHALL use this symbol to store token metadata in decorators

#### Scenario: Implementation metadata key
- **WHEN** the library defines metadata keys
- **THEN** it SHALL export `ADAPTER_IMPL_METADATA` as a Symbol
- **AND** SHALL use this symbol to store implementation class metadata in decorators

### Requirement: AdapterToken Decorator

The library SHALL provide an `@AdapterToken(token)` class decorator for declaring which port token an adapter provides.

#### Scenario: Decorator application
- **WHEN** a class is decorated with `@AdapterToken(MY_TOKEN)`
- **THEN** the decorator SHALL store `MY_TOKEN` in class metadata using `Reflect.defineMetadata()`
- **AND** SHALL use `ADAPTER_TOKEN_METADATA` as the metadata key

#### Scenario: Multiple adapters same token
- **WHEN** multiple adapter classes use `@AdapterToken(SAME_TOKEN)`
- **THEN** each adapter SHALL independently store the token in its own metadata
- **AND** apps MAY choose which adapter implementation to use

### Requirement: AdapterImpl Decorator

The library SHALL provide an `@AdapterImpl(ImplementationClass)` class decorator for declaring the concrete implementation.

#### Scenario: Decorator application
- **WHEN** a class is decorated with `@AdapterImpl(MyService)`
- **THEN** the decorator SHALL store `MyService` in class metadata using `Reflect.defineMetadata()`
- **AND** SHALL use `ADAPTER_IMPL_METADATA` as the metadata key

#### Scenario: Implementation class type
- **WHEN** `@AdapterImpl(ImplementationClass)` is used
- **THEN** `ImplementationClass` MUST be a valid NestJS injectable class
- **AND** MUST implement the port interface

### Requirement: InjectPort Decorator

The library SHALL provide an `@InjectPort(token)` parameter decorator for injecting port tokens into service constructors.

#### Scenario: Port injection
- **WHEN** a constructor parameter is decorated with `@InjectPort(STORAGE_TOKEN)`
- **THEN** it SHALL function identically to `@Inject(STORAGE_TOKEN)`
- **AND** SHALL inject the provider bound to that token

#### Scenario: Type inference
- **WHEN** using `@InjectPort(token)` with TypeScript
- **THEN** the parameter type SHALL be inferred from context
- **AND** SHALL provide IDE autocomplete for the injected service

### Requirement: Adapter Base Class Structure

The library SHALL provide an abstract `Adapter<TOptions>` base class for building adapter modules that reads metadata from decorators.

#### Scenario: Single generic parameter
- **WHEN** defining an adapter class
- **THEN** it SHALL extend `Adapter<TOptions>` with only the options type parameter
- **AND** SHALL NOT include `TToken` as a generic parameter (eliminating duplication)

#### Scenario: Optional hooks
- **WHEN** an adapter needs to import other NestJS modules
- **THEN** it MAY override the `imports(options?: TOptions): any[]` method
- **WHEN** an adapter needs additional providers
- **THEN** it MAY override the `extraProviders(options: TOptions): Provider[]` method

#### Scenario: No abstract properties
- **WHEN** a class extends `Adapter<TOptions>`
- **THEN** it SHALL NOT require defining abstract `token` or `implementation` properties
- **AND** SHALL instead use `@AdapterToken` and `@AdapterImpl` decorators

### Requirement: Synchronous Registration with Decorator Metadata

The Adapter class SHALL provide a static `register()` method that reads token and implementation from decorator metadata.

#### Scenario: Metadata retrieval
- **WHEN** `MyAdapter.register(options)` is called
- **THEN** it SHALL read token using `Reflect.getMetadata(ADAPTER_TOKEN_METADATA, MyAdapter)`
- **AND** SHALL read implementation using `Reflect.getMetadata(ADAPTER_IMPL_METADATA, MyAdapter)`

#### Scenario: Missing decorator validation
- **WHEN** `MyAdapter.register(options)` is called
- **AND** `@AdapterToken` decorator is missing
- **THEN** it SHALL throw an Error with message: `${this.name} must be decorated with @AdapterToken()`

#### Scenario: Missing implementation validation
- **WHEN** `MyAdapter.register(options)` is called
- **AND** `@AdapterImpl` decorator is missing
- **THEN** it SHALL throw an Error with message: `${this.name} must be decorated with @AdapterImpl()`

#### Scenario: Successful registration
- **WHEN** `MyAdapter.register(options)` is called with valid decorators
- **THEN** it SHALL return `AdapterModule<TToken>` with:
  - `module` set to the adapter class
  - `providers` containing the implementation class
  - `providers` containing token aliased to implementation via `useExisting`
  - `exports` containing only the token
  - `__provides` set to the token

#### Scenario: With imports
- **WHEN** adapter overrides `imports(options)` returning `[HttpModule]`
- **AND** `MyAdapter.register(options)` is called
- **THEN** the returned module SHALL include `HttpModule` in imports

#### Scenario: With extra providers
- **WHEN** adapter overrides `extraProviders(options)` returning additional providers
- **AND** `MyAdapter.register(options)` is called
- **THEN** the returned module SHALL include those providers

### Requirement: Asynchronous Registration with Decorator Metadata

The Adapter class SHALL provide a static `registerAsync()` method that reads token and implementation from decorator metadata.

#### Scenario: Metadata retrieval
- **WHEN** `MyAdapter.registerAsync(asyncOptions)` is called
- **THEN** it SHALL read token using `Reflect.getMetadata(ADAPTER_TOKEN_METADATA, MyAdapter)`
- **AND** SHALL read implementation using `Reflect.getMetadata(ADAPTER_IMPL_METADATA, MyAdapter)`

#### Scenario: Missing decorator validation
- **WHEN** `MyAdapter.registerAsync(asyncOptions)` is called without decorators
- **THEN** it SHALL throw appropriate errors as in synchronous registration

#### Scenario: Factory-based configuration
- **WHEN** `MyAdapter.registerAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: (config) => config.get('adapter') })` is called
- **THEN** it SHALL return `AdapterModule<TToken>` with:
  - `module` set to the adapter class
  - `imports` containing specified imports plus adapter's `imports()` result
  - `providers` containing the implementation class from decorator
  - `providers` containing token aliased to implementation via `useExisting`
  - `exports` containing only the token

### Requirement: Define Adapter Compile-Time Helper

The library SHALL provide a `defineAdapter<TToken, TOptions>()` helper for compile-time type verification.

#### Scenario: Identity function
- **WHEN** `defineAdapter<TToken, TOptions>()(AdapterClass)` is called
- **THEN** it SHALL return `AdapterClass` unchanged (identity function)
- **AND** SHALL have zero runtime overhead

#### Scenario: Type constraint verification
- **WHEN** using `defineAdapter<typeof TOKEN, Options>()(AdapterClass)`
- **THEN** TypeScript SHALL verify `AdapterClass` extends `Adapter<Options>` (only TOptions, not TToken)
- **AND** SHALL produce compile error if class doesn't match contract

#### Scenario: Method signature augmentation
- **WHEN** using `defineAdapter<typeof TOKEN, Options>()(AdapterClass)`
- **THEN** the returned type SHALL include `register(options: Options): AdapterModule<typeof TOKEN>`
- **AND** SHALL include `registerAsync(asyncOptions): AdapterModule<typeof TOKEN>`

#### Scenario: Curried syntax
- **WHEN** calling `defineAdapter<TToken, TOptions>()`
- **THEN** it SHALL return a function accepting the adapter class
- **AND** SHALL enable clean decorator syntax: `defineAdapter<T, O>()(@Decorators class {})`

### Requirement: Feature Module Base Class

The library SHALL provide an abstract `FeatureModule<TService, TToken>` base class for building feature modules.

#### Scenario: Module decorator
- **WHEN** defining a FeatureModule class
- **THEN** it SHALL be decorated with `@Module({})`

#### Scenario: Static service property
- **WHEN** extending FeatureModule
- **THEN** the class SHALL define `protected static service: Type<any>`

#### Scenario: Register method
- **WHEN** `FeatureModule.register({ adapter })` is called
- **THEN** it SHALL return a `DynamicModule` that:
  - Imports the adapter module
  - Provides the service class
  - Exports the service class

### Requirement: Provider Registration Pattern

The Adapter base class SHALL automatically handle provider registration following NestJS best practices.

#### Scenario: Implementation class registration
- **WHEN** an adapter is decorated with `@AdapterImpl(MyServiceClass)`
- **AND** calls `register()` or `registerAsync()`
- **THEN** the providers array SHALL include `MyServiceClass` as a provider

#### Scenario: Token aliasing
- **WHEN** an adapter provides `@AdapterToken(MY_TOKEN)` and `@AdapterImpl(MyService)`
- **THEN** the providers array SHALL include `{ provide: MY_TOKEN, useExisting: MyService }`

#### Scenario: Token-only exports
- **WHEN** an adapter registers providers
- **THEN** the exports array SHALL contain only the token
- **AND** SHALL NOT contain provider objects or implementation classes

### Requirement: TypeScript Strict Mode Compliance

All adapter code SHALL compile successfully under TypeScript strict mode with isolated declarations.

#### Scenario: No type assertions
- **WHEN** implementing the Adapter base class and decorators
- **THEN** it SHALL minimize use of `as` type casts
- **AND** SHALL avoid `any` type except where necessary for reflection API

#### Scenario: Isolated declarations
- **WHEN** compiling with `isolatedDeclarations: true`
- **THEN** all public APIs SHALL have explicit return types
- **AND** all exported types SHALL be independently type-checkable

#### Scenario: Type-check validation
- **WHEN** running `tsc` after implementation
- **THEN** it SHALL produce zero TypeScript errors

### Requirement: Reflect Metadata Dependency

The library SHALL require `reflect-metadata` as a peer dependency for decorator metadata storage.

#### Scenario: Metadata operations
- **WHEN** using decorators to store or retrieve metadata
- **THEN** it SHALL use `Reflect.defineMetadata()` for storage
- **AND** SHALL use `Reflect.getMetadata()` for retrieval

#### Scenario: Peer dependency documentation
- **WHEN** consuming applications install the library
- **THEN** they MUST install `reflect-metadata` as a peer dependency
- **AND** MUST import it before using any decorators (typically in `main.ts` or entry point)
