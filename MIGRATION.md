# Migration Guide

## Upgrading to v1.0.0

Version 1.0.0 introduces breaking changes to improve the developer experience and API clarity. This guide will help you migrate your existing code.

### Breaking Changes

#### 1. Decorator Renamed: `@Port` → `@Adapter`

The decorator has been renamed from `@Port` to `@Adapter` to better reflect its purpose.

**Before (v0.x):**
```typescript
import { Port, Adapter } from 'nest-hex'

@Port({
  token: STORAGE_TOKEN,
  implementation: S3StorageService,
})
class S3Adapter extends Adapter<S3Options> {}
```

**After (v1.x):**
```typescript
import { Adapter, AdapterBase } from 'nest-hex'

@Adapter({
  portToken: STORAGE_TOKEN,
  implementation: S3StorageService,
})
class S3Adapter extends AdapterBase<S3Options> {}
```

#### 2. Base Class Renamed: `Adapter` → `AdapterBase`

The base class has been renamed from `Adapter` to `AdapterBase` to avoid naming confusion with the decorator.

**Migration Steps:**

1. **Update imports:**
   ```typescript
   // Before
   import { Port, Adapter } from 'nest-hex'

   // After
   import { Adapter, AdapterBase } from 'nest-hex'
   ```

2. **Update decorator:**
   ```typescript
   // Before
   @Port({
     token: YOUR_TOKEN,
     implementation: YourService,
   })

   // After
   @Adapter({
     portToken: YOUR_TOKEN,
     implementation: YourService,
   })
   ```

3. **Update base class:**
   ```typescript
   // Before
   class YourAdapter extends Adapter<Options> {}

   // After
   class YourAdapter extends AdapterBase<Options> {}
   ```

#### 3. Parameter Renamed: `token` → `portToken`

The decorator parameter has been renamed from `token` to `portToken` for better clarity.

**Before (v0.x):**
```typescript
@Port({
  token: STORAGE_TOKEN,
  implementation: S3StorageService,
})
```

**After (v1.x):**
```typescript
@Adapter({
  portToken: STORAGE_TOKEN,
  implementation: S3StorageService,
})
```

### Complete Migration Example

**Before (v0.x):**
```typescript
import { Port, Adapter } from 'nest-hex'
import { STORAGE_TOKEN } from './storage.token'
import { S3StorageService } from './s3-storage.service'
import type { S3Options } from './s3.types'

@Port({
  token: STORAGE_TOKEN,
  implementation: S3StorageService,
})
export class S3Adapter extends Adapter<S3Options> {
  protected override imports(options: S3Options) {
    return [HttpModule]
  }

  protected override extraProviders(options: S3Options) {
    return [
      {
        provide: 'S3_CONFIG',
        useValue: options,
      },
    ]
  }
}
```

**After (v1.x):**
```typescript
import { Adapter, AdapterBase } from 'nest-hex'
import { STORAGE_TOKEN } from './storage.token'
import { S3StorageService } from './s3-storage.service'
import type { S3Options } from './s3.types'

@Adapter({
  portToken: STORAGE_TOKEN,
  implementation: S3StorageService,
})
export class S3Adapter extends AdapterBase<S3Options> {
  protected override imports(options: S3Options) {
    return [HttpModule]
  }

  protected override extraProviders(options: S3Options) {
    return [
      {
        provide: 'S3_CONFIG',
        useValue: options,
      },
    ]
  }
}
```

### Automated Migration

You can use find-and-replace in your IDE to speed up the migration:

1. **Find:** `from 'nest-hex'` with `import { Port, Adapter }`
   **Replace:** `from 'nest-hex'` with `import { Adapter, AdapterBase }`

2. **Find:** `@Port(`
   **Replace:** `@Adapter(`

3. **Find:** `extends Adapter<`
   **Replace:** `extends AdapterBase<`

4. **Find:** `token:` (within decorator)
   **Replace:** `portToken:`

### Testing Your Migration

After migrating, ensure everything works correctly:

```bash
# Check for TypeScript errors
bun run type-check

# Run linting
bun run lint

# Run tests
bun test

# Build your project
bun run build
```

### Need Help?

If you encounter any issues during migration:

1. Check the [full documentation](./docs/library.md)
2. Review the [examples](./examples/)
3. [Open an issue](https://github.com/LiorVainer/nest-hex/issues) if you need assistance

### What's New in v1.0.0

Beyond the breaking changes, v1.0.0 also includes:

- **Improved Documentation**: Comprehensive guides for library usage and CLI
- **Better Type Safety**: Enhanced TypeScript support throughout
- **Cleaner CLI Templates**: Generated code is more readable without comments
- **Hybrid Configuration**: Support for both static (decorator-based) and dynamic (hook-based) configuration
- **Migration Guide**: This guide to help you upgrade smoothly

Thank you for using nest-hex!
