# Core API - Port Terminology Standardization

## MODIFIED Requirements

### Requirement: Port Module Base Class
The library SHALL provide a `PortModule` base class (renamed from `FeatureModule`) that enables building domain modules following the Ports & Adapters pattern.

#### Scenario: Extending PortModule for domain service
- **GIVEN** a domain service class that consumes a port
- **WHEN** creating a feature module that extends `PortModule<typeof ServiceClass>`
- **THEN** the module can be registered with an adapter via `PortModule.register({ adapter })`

#### Scenario: Type-safe adapter acceptance
- **GIVEN** a port module extending `PortModule<typeof ServiceClass>`
- **WHEN** calling `register({ adapter: AdapterModule<TToken> })`
- **THEN** TypeScript enforces that the adapter provides the correct port token

### Requirement: Port Decorator
The library SHALL provide a `@Port` decorator (replaces `@AdapterToken` and `@AdapterImpl`) that declares both the port token and implementation class in a single decorator.

#### Scenario: Declaring port configuration on adapter
- **GIVEN** an adapter class extending `Adapter<OptionsType>`
- **WHEN** decorated with `@Port({ token: PORT_TOKEN, implementation: ImplementationClass })`
- **THEN** the adapter's `register()` method provides the specified port token and registers the implementation class

#### Scenario: Missing port decorator error
- **GIVEN** an adapter class not decorated with `@Port`
- **WHEN** calling `register()` or `registerAsync()`
- **THEN** an error is thrown with message "{AdapterName} must be decorated with @Port()"

#### Scenario: Missing token in port configuration
- **GIVEN** an adapter class decorated with `@Port({ implementation: ImplementationClass })`
- **WHEN** calling `register()` or `registerAsync()`
- **THEN** an error is thrown with message "{AdapterName} @Port decorator must specify 'token'"

#### Scenario: Missing implementation in port configuration
- **GIVEN** an adapter class decorated with `@Port({ token: PORT_TOKEN })`
- **WHEN** calling `register()` or `registerAsync()`
- **THEN** an error is thrown with message "{AdapterName} @Port decorator must specify 'implementation'"

### Requirement: Metadata Constants
The library SHALL use port-aligned metadata constant names for decorator metadata storage.

#### Scenario: Port token metadata constant
- **GIVEN** the `@Port` decorator
- **WHEN** storing port token metadata
- **THEN** it uses the constant `PORT_TOKEN_METADATA` (renamed from `ADAPTER_TOKEN_METADATA`)

#### Scenario: Port implementation metadata constant
- **GIVEN** the `@Port` decorator
- **WHEN** storing port implementation class metadata
- **THEN** it uses the constant `PORT_IMPLEMENTATION_METADATA` (renamed from `ADAPTER_IMPL_METADATA`)

### Requirement: Public API Exports
The library SHALL export renamed classes and decorators following port-centric terminology.

#### Scenario: Exported base classes
- **WHEN** importing from the library
- **THEN** `Adapter` and `PortModule` base classes are available

#### Scenario: Exported decorators
- **WHEN** importing from the library
- **THEN** `@Port` and `@InjectPort` decorators are available

#### Scenario: Exported types and helpers
- **WHEN** importing from the library
- **THEN** `AdapterModule<TToken>` type and `defineAdapter` helper are available

### Requirement: Backward Incompatibility
The library SHALL introduce breaking changes with clear migration paths for the terminology standardization.

#### Scenario: FeatureModule renamed to PortModule
- **GIVEN** existing code using `FeatureModule`
- **WHEN** upgrading to the new version
- **THEN** all references must be changed to `PortModule`

#### Scenario: AdapterToken and AdapterImpl replaced with Port decorator
- **GIVEN** existing code using `@AdapterToken(TOKEN)` and `@AdapterImpl(Implementation)`
- **WHEN** upgrading to the new version
- **THEN** both decorators must be replaced with single `@Port({ token: TOKEN, implementation: Implementation })`

## ADDED Requirements

### Requirement: Library README Documentation
The library SHALL include a comprehensive README.md that demonstrates the standardized port terminology.

#### Scenario: README includes quick start example
- **WHEN** reading the README
- **THEN** it includes code examples using `PortModule` and `@Port({ token, implementation })`

#### Scenario: README explains port terminology
- **WHEN** reading the README
- **THEN** it clearly explains the distinction between ports (domain interfaces) and adapters (infrastructure implementations)

#### Scenario: README provides migration guide
- **WHEN** reading the README
- **THEN** it includes a section on breaking changes with old → new name mappings
