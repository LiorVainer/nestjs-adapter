# Core API Specification

## ADDED Requirements

### Requirement: Adapter Decorator
The system SHALL provide a `@Adapter` decorator that declares adapter metadata including port token, implementation class, imports, and extra dependencies.

#### Scenario: Basic adapter declaration
- **GIVEN** a user wants to create an adapter for a storage port
- **WHEN** they use `@Adapter({ token: STORAGE_PORT, implementation: S3StorageService })`
- **THEN** the decorator SHALL register the token and implementation metadata

#### Scenario: Adapter with custom imports
- **GIVEN** a user needs to import HttpModule for their adapter
- **WHEN** they use `@Adapter({ token: HTTP_PORT, implementation: AxiosClient, imports: [HttpModule] })`
- **THEN** the imports SHALL be included in the module configuration

#### Scenario: Adapter with extra dependencies
- **GIVEN** a user needs additional providers beyond the implementation
- **WHEN** they use `@Adapter({ token: CACHE_PORT, implementation: RedisCache, providers: [RedisConnection] })`
- **THEN** the extra providers SHALL be registered in the module

### Requirement: Decorator Options Interface
The `@Adapter` decorator SHALL accept an options object with the following properties:
- `token` (required): The port token (Symbol or string)
- `implementation` (required): The implementation class
- `imports` (optional): Array of NestJS modules to import
- `providers` (optional): Array of additional providers to register

#### Scenario: Complete adapter with all options
- **GIVEN** a user wants full control over adapter configuration
- **WHEN** they specify token, implementation, imports, and providers
- **THEN** all options SHALL be properly configured in the resulting DynamicModule

### Requirement: InjectPort Decorator
The system SHALL provide an `@InjectPort` decorator for injecting port tokens in service constructors.

#### Scenario: Injecting a port in a service
- **GIVEN** a service needs to use a storage port
- **WHEN** they use `@InjectPort(STORAGE_PORT) private storage: StoragePort`
- **THEN** the port SHALL be properly injected via NestJS DI

## MODIFIED Requirements

None - this is the initial specification.

## REMOVED Requirements

None - this is the initial specification.
