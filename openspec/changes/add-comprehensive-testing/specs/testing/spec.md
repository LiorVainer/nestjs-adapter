## ADDED Requirements

### Requirement: Unit Testing for Adapter Base Class

The library SHALL provide comprehensive unit tests for the `Adapter` base class covering both synchronous and asynchronous registration methods.

#### Scenario: Adapter register() creates valid DynamicModule
- **WHEN** an adapter class decorated with `@Port` calls `register()` with options
- **THEN** it SHALL return a `DynamicModule` with the correct module, providers, imports, and exports
- **AND** the module SHALL include the implementation class as a provider
- **AND** the module SHALL alias the port token to the implementation using `useExisting`
- **AND** the module SHALL export only the port token

#### Scenario: Adapter register() reads decorator metadata
- **WHEN** an adapter class decorated with `@Port({ token, implementation })` calls `register()`
- **THEN** it SHALL read the token from `PORT_TOKEN_METADATA` reflection metadata
- **AND** it SHALL read the implementation from `PORT_IMPLEMENTATION_METADATA` reflection metadata

#### Scenario: Adapter register() throws error when decorator is missing
- **WHEN** an adapter class without `@Port` decorator calls `register()`
- **THEN** it SHALL throw an error indicating the decorator is required
- **AND** the error message SHALL mention `@Port()` decorator

#### Scenario: Adapter registerAsync() creates DynamicModule with factory
- **WHEN** an adapter calls `registerAsync()` with a factory function
- **THEN** it SHALL return a `DynamicModule` that resolves options via dependency injection
- **AND** the factory SHALL receive injected dependencies
- **AND** the module SHALL include the implementation class and token alias

#### Scenario: Adapter imports() hook is called
- **WHEN** an adapter overrides `imports()` method
- **THEN** the returned imports SHALL be included in the DynamicModule
- **AND** the imports SHALL receive the adapter options

#### Scenario: Adapter extraProviders() hook is called
- **WHEN** an adapter overrides `extraProviders()` method
- **THEN** the returned providers SHALL be included in the module's providers array
- **AND** the extra providers SHALL receive the adapter options

### Requirement: Unit Testing for PortModule Base Class

The library SHALL provide unit tests for the `PortModule` base class ensuring proper adapter acceptance and module registration.

#### Scenario: PortModule register() accepts adapter module
- **WHEN** `PortModule.register()` is called with an adapter parameter
- **THEN** it SHALL return a `DynamicModule` importing the adapter
- **AND** the module SHALL reference `PortModule` as the module class

#### Scenario: PortModule register() works without adapter
- **WHEN** `PortModule.register()` is called without an adapter parameter
- **THEN** it SHALL return a valid `DynamicModule` with empty imports
- **AND** the module SHALL not throw an error

### Requirement: Unit Testing for Decorators

The library SHALL provide unit tests for all decorators ensuring metadata storage and parameter injection work correctly.

#### Scenario: @Port decorator stores token metadata
- **WHEN** a class is decorated with `@Port({ token, implementation })`
- **THEN** the token SHALL be stored in reflection metadata under `PORT_TOKEN_METADATA` key
- **AND** the metadata SHALL be retrievable using `Reflect.getMetadata()`

#### Scenario: @Port decorator stores implementation metadata
- **WHEN** a class is decorated with `@Port({ token, implementation })`
- **THEN** the implementation class SHALL be stored in reflection metadata under `PORT_IMPLEMENTATION_METADATA` key
- **AND** the metadata SHALL be retrievable using `Reflect.getMetadata()`

#### Scenario: @InjectPort decorator injects port token
- **WHEN** a constructor parameter is decorated with `@InjectPort(token)`
- **THEN** it SHALL behave identically to `@Inject(token)`
- **AND** NestJS DI SHALL resolve the token to the correct provider

### Requirement: Unit Testing for defineAdapter Helper

The library SHALL provide tests verifying the `defineAdapter()` helper enforces type constraints at compile time.

#### Scenario: defineAdapter() returns adapter class unchanged
- **WHEN** an adapter class is passed to `defineAdapter<TToken, TOptions>()`
- **THEN** the returned class SHALL be the same class (identity function at runtime)
- **AND** the class SHALL have typed `register()` and `registerAsync()` methods

#### Scenario: defineAdapter() enforces type safety
- **WHEN** TypeScript compiles code using `defineAdapter()`
- **THEN** the type system SHALL enforce that `register()` accepts `TOptions`
- **AND** the return type SHALL be `AdapterModule<TToken>`

### Requirement: Integration Testing for Adapter Registration

The library SHALL provide integration tests using NestJS testing module to verify end-to-end adapter behavior.

#### Scenario: Adapter provides port token to DI container
- **WHEN** an adapter module is compiled using `Test.createTestingModule()`
- **THEN** the port token SHALL be resolvable via `module.get(TOKEN)`
- **AND** the resolved instance SHALL be the implementation class

#### Scenario: Port token resolves to correct implementation
- **WHEN** a service injects a port token using `@InjectPort()`
- **THEN** NestJS SHALL inject the implementation instance
- **AND** the instance SHALL be the class specified in `@Port({ implementation })`

#### Scenario: Multiple adapters for different tokens work independently
- **WHEN** multiple adapter modules with different tokens are imported
- **THEN** each token SHALL resolve to its own implementation
- **AND** there SHALL be no cross-contamination between adapters

### Requirement: Integration Testing for Mock Adapters

The library SHALL provide example mock adapter patterns for testing consumer applications.

#### Scenario: Mock adapter for testing
- **WHEN** a mock adapter extending `Adapter` is created for testing
- **THEN** it SHALL follow the same registration pattern as real adapters
- **AND** it SHALL provide a test implementation of the port interface

#### Scenario: Override port token in tests
- **WHEN** using `.overrideProvider(TOKEN).useValue(mock)` in test module
- **THEN** the port token SHALL resolve to the mock implementation
- **AND** the test SHALL not depend on real infrastructure

### Requirement: Test Coverage Reporting

The library SHALL configure and enforce test coverage reporting for quality assurance.

#### Scenario: Generate coverage report
- **WHEN** tests are run with `bun test --coverage`
- **THEN** a coverage report SHALL be generated
- **AND** the report SHALL include all core library files

#### Scenario: Achieve minimum coverage threshold
- **WHEN** all tests are executed
- **THEN** code coverage for core components SHALL be greater than 80%
- **AND** uncovered lines SHALL be documented or justified

### Requirement: Test Utilities and Fixtures

The library SHALL provide reusable test utilities and fixtures for consistency and developer experience.

#### Scenario: Shared test fixtures
- **WHEN** writing tests for different components
- **THEN** shared fixtures SHALL be available in `tests/fixtures/`
- **AND** fixtures SHALL include mock tokens, ports, implementations, and adapters

#### Scenario: Test utilities for common patterns
- **WHEN** testing adapter behavior
- **THEN** helper functions SHALL be available for common assertions
- **AND** utilities SHALL reduce boilerplate in individual test files

### Requirement: Testing Documentation

The library SHALL document testing patterns and best practices for library consumers.

#### Scenario: Testing guide in documentation
- **WHEN** a developer needs to test their adapter
- **THEN** documentation SHALL provide clear examples of mock adapter creation
- **AND** documentation SHALL show `.overrideProvider()` patterns

#### Scenario: Test examples in codebase
- **WHEN** a developer explores the codebase
- **THEN** test files SHALL serve as examples of proper testing patterns
- **AND** tests SHALL follow NestJS testing best practices
