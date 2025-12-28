## ADDED Requirements

### Requirement: Decorator-Based Service Registration

Feature modules SHALL declare their service using the `@PortService` decorator instead of a protected static property.

#### Scenario: Basic feature module with decorator

- **WHEN** a developer creates a feature module
- **THEN** they SHALL use `@PortService(ServiceClass)` decorator
- **AND** the decorator SHALL be applied to the class extending FeatureModule
- **AND** the service SHALL be automatically registered when calling `.register()`

#### Scenario: Service metadata reading

- **WHEN** `FeatureModule.register()` is called
- **THEN** it SHALL read the service class from decorator metadata
- **AND** SHALL throw an error if `@PortService` decorator is missing
- **AND** SHALL provide the service in the returned dynamic module

#### Scenario: Type safety preserved

- **WHEN** using `@PortService` decorator
- **THEN** the type parameter `FeatureModule<typeof ServiceClass>` SHALL still be required
- **AND** TypeScript SHALL verify type consistency between decorator and type parameter
- **AND** the service SHALL be properly typed in the dynamic module

### Requirement: Consistent Decorator Pattern

The `@PortService` decorator SHALL follow the same pattern as adapter decorators for consistency.

#### Scenario: Decorator API consistency

- **WHEN** comparing `@PortService` with `@AdapterImpl`
- **THEN** both SHALL accept a service/implementation class as parameter
- **AND** both SHALL store metadata using reflect-metadata
- **AND** both SHALL be class decorators
- **AND** the API SHALL feel natural to developers familiar with adapter decorators

#### Scenario: Error messages consistency

- **WHEN** `@PortService` decorator is missing
- **THEN** the error message SHALL follow the pattern: "ClassName must be decorated with @PortService()"
- **AND** SHALL match the error message style of adapter decorators

### Requirement: Migration from Static Property

The library SHALL provide clear migration guidance from the old static property pattern to the new decorator pattern.

#### Scenario: Breaking change documentation

- **WHEN** upgrading to the version with `@PortService`
- **THEN** migration instructions SHALL be clearly documented
- **AND** SHALL show before/after code examples
- **AND** SHALL explain the benefits of the new approach

#### Scenario: Migration is straightforward

- **WHEN** migrating from `protected static service = ServiceClass`
- **THEN** developers SHALL only need to:
  1. Add `@PortService(ServiceClass)` decorator to the class
  2. Remove the `protected static service` property
- **AND** no changes to the `register()` call SHALL be required
- **AND** the type parameter SHALL remain the same

## MODIFIED Requirements

_No existing requirements are being modified (this is a new feature)._

## REMOVED Requirements

### Requirement: Static Service Property

**Reason**: Replaced with decorator-based approach for consistency and better developer experience.

**Migration**: Replace `protected static service = ServiceClass` with `@PortService(ServiceClass)` decorator.

The pattern of using `protected static service` property to declare the service SHALL be removed in favor of the `@PortService` decorator.

#### Scenario: Old API pattern (REMOVED)

- **WHEN** creating a feature module (old API)
- **THEN** developers would set `protected static service = ServiceClass`
- **AND** FeatureModule.register() would read from the static property

**Migration Example:**
```typescript
// OLD (REMOVED)
@Module({})
export class FileModule extends FeatureModule<typeof FileService> {
  protected static service = FileService
}

// NEW (USE THIS)
@Module({})
@PortService(FileService)
export class FileModule extends FeatureModule<typeof FileService> {}
```
