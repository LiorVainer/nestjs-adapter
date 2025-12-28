# Change: Add @PortService Decorator for FeatureModule

## Why

The current FeatureModule API requires subclasses to set a protected static property to specify which service the module provides:

```typescript
@Module({})
export class FileModule extends FeatureModule<typeof FileService> {
  protected static service = FileService  // Verbose and inconsistent
}
```

This pattern is:
1. **Inconsistent** with the decorator-driven approach used for adapters (`@AdapterToken`, `@AdapterImpl`)
2. **Less discoverable** - decorators are more visible and conventional in NestJS
3. **Verbose** - requires both a type parameter AND a static property
4. **Less ergonomic** - developers must remember to set the static property

## What Changes

Introduce a `@PortService(ServiceClass)` decorator that allows feature modules to declare their service using decorator syntax, matching the adapter pattern:

**Before:**
```typescript
@Module({})
export class FileModule extends FeatureModule<typeof FileService> {
  protected static service = FileService
}
```

**After:**
```typescript
@Module({})
@PortService(FileService)
export class FileModule extends FeatureModule<typeof FileService> {}
```

**BREAKING**: This is a breaking change. Existing feature modules must migrate from the static property to the decorator.

## Impact

**Affected specs:**
- `feature-module` - Add decorator-based service registration

**Affected code:**
- `src/core/decorators.ts` - Add `@PortService` decorator
- `src/core/feature-module.base.ts` - Read service from metadata instead of static property
- `src/core/constants.ts` - Add `PROVIDER_SERVICE_METADATA` constant
- `src/index.ts` - Export `@PortService` decorator
- `examples/` - Update all feature module examples to use decorator

**Breaking changes:**
- **BREAKING**: Feature modules must use `@PortService(ServiceClass)` decorator instead of `protected static service = ServiceClass`

**Migration path:**
```typescript
// Old API
@Module({})
export class MyModule extends FeatureModule<typeof MyService> {
  protected static service = MyService
}

// New API
@Module({})
@PortService(MyService)
export class MyModule extends FeatureModule<typeof MyService> {}
```

**Benefits:**
- Consistent decorator-driven API across adapters and feature modules
- More concise and discoverable
- Better IDE support and autocompletion
- Aligns with NestJS conventions
