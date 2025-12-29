# nest-hex

> A tiny, **class-based**, **NestJS-native** helper library for building **pluggable adapters** following the Ports & Adapters (Hexagonal Architecture) pattern with minimal boilerplate and great developer experience.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why?

Building NestJS applications with the Ports & Adapters pattern involves repetitive boilerplate:

- Registering concrete implementation classes
- Aliasing port tokens to implementations (`useExisting`)
- Exporting only the port token (not provider objects)
- Supporting both `register()` and `registerAsync()` patterns
- Keeping the app responsible for configuration (no `process.env` in libraries)

This library provides base classes and decorators to eliminate this boilerplate while maintaining compile-time type safety.

## Features

- 🎯 **Declarative**: Declare port tokens and implementations once using `@Port({ token, implementation })`
- 🏗️ **Class-based**: Use standard NestJS dynamic modules, no function factories required
- 🔒 **Type-safe**: `AdapterModule<TToken>` carries compile-time proof of which token it provides
- ⚡ **Zero runtime overhead**: Uses TypeScript decorators and metadata, minimal abstraction
- 📦 **Tiny**: Core library is under 1KB minified
- 🧪 **Testable**: Easily mock adapters for testing

## Installation

```bash
npm install nest-hex
# or
yarn add nest-hex
# or
pnpm add nest-hex
# or
bun add nest-hex
```

### Peer Dependencies

```bash
npm install @nestjs/common @nestjs/core reflect-metadata
```

## Quick Start

### 1. Define a Port (Domain Interface)

```typescript
// storage.port.ts
export const STORAGE_PORT = Symbol('STORAGE_PORT');

export interface StoragePort {
  upload(file: Buffer, key: string): Promise<{ url: string }>;
  download(key: string): Promise<Buffer>;
}
```

### 2. Create an Adapter (Infrastructure Implementation)

```typescript
// s3.adapter.ts
import { Injectable } from '@nestjs/common';
import { Adapter, Port } from 'nest-hex';
import { STORAGE_PORT, type StoragePort } from './storage.port';

// Implementation service
@Injectable()
class S3StorageService implements StoragePort {
  async upload(file: Buffer, key: string) {
    // AWS S3 upload logic here
    return { url: `https://s3.amazonaws.com/bucket/${key}` };
  }

  async download(key: string) {
    // AWS S3 download logic here
    return Buffer.from('file contents');
  }
}

// Adapter configuration
interface S3Options {
  bucket: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

// Adapter module - single decorator declares everything!
@Port({
  token: STORAGE_PORT,
  implementation: S3StorageService,
})
export class S3Adapter extends Adapter<S3Options> {}
```

### 3. Create a Port Module (Domain Service)

```typescript
// storage.module.ts
import { Injectable, Module } from '@nestjs/common';
import { InjectPort, PortModule } from 'nest-hex';
import { STORAGE_PORT, type StoragePort } from './storage.port';

// Domain service that uses the port
@Injectable()
export class StorageService {
  constructor(
    @InjectPort(STORAGE_PORT)
    private readonly storage: StoragePort,
  ) {}

  async uploadUserAvatar(userId: string, image: Buffer) {
    const key = `avatars/${userId}.jpg`;
    return this.storage.upload(image, key);
  }

  async downloadUserAvatar(userId: string) {
    const key = `avatars/${userId}.jpg`;
    return this.storage.download(key);
  }
}

// Port module that accepts any adapter
@Module({})
export class StorageModule extends PortModule<typeof StorageService> {}
```

### 4. Wire It Up in Your App

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { StorageModule } from './storage/storage.module';
import S3Adapter from './storage/adapters/s3.adapter';

@Module({
  imports: [
    StorageModule.register({
      adapter: S3Adapter.register({
        bucket: 'my-app-uploads',
        region: 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }),
    }),
  ],
})
export class AppModule {}
```

That's it! You now have a fully type-safe, pluggable storage adapter. 🎉

## Key Benefits

### Before (Manual Boilerplate)

```typescript
// Lots of manual wiring...
@Module({})
export class S3StorageModule {
  static register(options: S3Options): DynamicModule {
    return {
      module: S3StorageModule,
      providers: [
        S3StorageService,
        { provide: STORAGE_PORT, useExisting: S3StorageService },
        // More boilerplate...
      ],
      exports: [STORAGE_PORT],
    };
  }
}
```

### After (With nest-hex)

```typescript
// Clean and declarative!
@Port({
  token: STORAGE_PORT,
  implementation: S3StorageService,
})
export class S3Adapter extends Adapter<S3Options> {}
```

## Advanced Usage

### Async Registration with Dependency Injection

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    StorageModule.register({
      adapter: S3Adapter.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          bucket: config.get('S3_BUCKET'),
          region: config.get('AWS_REGION'),
          accessKeyId: config.get('AWS_ACCESS_KEY_ID'),
          secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY'),
        }),
      }),
    }),
  ],
})
export class AppModule {}
```

### Custom Imports and Extra Ports

```typescript
@Port({
  token: HTTP_CLIENT_PORT,
  implementation: AxiosHttpClient,
})
class AxiosAdapterClass extends Adapter<AxiosOptions> {
  protected override imports(options: AxiosOptions) {
    return [
      HttpModule.register({
        baseURL: options.baseUrl,
        timeout: options.timeout,
      }),
    ];
  }

  protected override extraPoviders(options: AxiosOptions) {
    return [
      {
        provide: 'HTTP_CLIENT_CONFIG',
        useValue: options,
      },
    ];
  }
}
```

### Swapping Adapters

The beauty of the Ports & Adapters pattern is that you can easily swap implementations:

```typescript
// Development: Use filesystem storage
import FilesystemAdapter from './storage/adapters/filesystem.adapter';

// Production: Use AWS S3
import S3Adapter from './storage/adapters/s3.adapter';

const adapter = process.env.NODE_ENV === 'production'
  ? S3Adapter.register({ bucket: 'prod-bucket', region: 'us-east-1' })
  : FilesystemAdapter.register({ basePath: './uploads' });

@Module({
  imports: [
    StorageModule.register({ adapter }),
  ],
})
export class AppModule {}
```

### Testing with Mock Adapters

```typescript
import { Adapter, Port } from 'nest-hex';

class MockStorageService {
  async upload(file: Buffer, key: string) {
    return { url: `mock://storage/${key}` };
  }

  async download(key: string) {
    return Buffer.from('mock file contents');
  }
}

@Port({
  token: STORAGE_PORT,
  implementation: MockStorageService,
})
export class MockStorageAdapter extends Adapter<void> {}

// Use in tests
const module = await Test.createTestingModule({
  imports: [
    StorageModule.register({
      adapter: MockStorageAdapter.register(undefined),
    }),
  ],
}).compile();
```

## API Reference

### Core Classes

#### `Adapter<TOptions>`

Abstract base class for building adapter modules.

**Methods:**
- `static register<TToken, TOptions>(options: TOptions): AdapterModule<TToken>` - Synchronous registration
- `static registerAsync<TToken, TOptions>(config: AsyncConfig): AdapterModule<TToken>` - Async registration with DI

**Protected Hooks:**
- `protected imports(options?: TOptions): unknown[]` - Override to import other NestJS modules
- `protected extraPoviders(options: TOptions): Port[]` - Override to add additional providers

#### `PortModule<TService>`

Abstract base class for building port modules that consume adapters.

**Methods:**
- `static register<TToken>({ adapter }: { adapter?: AdapterModule<TToken> }): DynamicModule`

### Decorators

#### `@Port({ token, implementation })`

Class decorator that declares which port token an adapter provides and its implementation class.

**Parameters:**
- `token: TToken` - The port token (usually a Symbol)
- `implementation: Type<unknown>` - The concrete implementation class

**Example:**
```typescript
@Port({
  token: STORAGE_PORT,
  implementation: S3StorageService,
})
class S3Adapter extends Adapter<S3Options> {}
```

#### `@InjectPort(token)`

Parameter decorator for injecting a port token into service constructors.

**Example:**
```typescript
constructor(
  @InjectPort(STORAGE_PORT)
  private readonly storage: StoragePort,
) {}
```

### Types

#### `AdapterModule<TToken>`

A DynamicModule that carries compile-time proof it provides `TToken`.

```typescript
type AdapterModule<TToken> = DynamicModule & {
  __provides: TToken;
};
```

## Best Practices

### ✅ Do's

- **Export port tokens, not provider objects**
  ```typescript
  exports: [STORAGE_PORT]  // ✅ Correct
  ```

- **Keep configuration in the app layer**
  ```typescript
  // ✅ Good: App provides config
  S3Adapter.register({
    bucket: process.env.S3_BUCKET,
  })
  ```

- **Use `@InjectPort` for clarity**
  ```typescript
  @InjectPort(STORAGE_PORT)  // ✅ Clear intent
  ```

- **Create small, focused adapters**
  - One adapter = one infrastructure concern

### ❌ Don'ts

- **Don't export provider objects**
  ```typescript
  exports: [{ provide: STORAGE_PORT, useExisting: S3Service }]  // ❌ Wrong
  ```

- **Don't use `process.env` in adapters**
  ```typescript
  // ❌ Bad: Config hard-coded in adapter
  class S3Adapter {
    bucket = process.env.S3_BUCKET;
  }
  ```

- **Don't mix domain logic with adapters**
  - Adapters = infrastructure only
  - Domain logic = port modules/services

## Examples

See the [`examples/`](./examples) directory for complete working examples:

- **Object Storage** - S3 adapter with file upload/download
- **Currency Rates** - HTTP API adapter with rate conversion
- **Basic Examples** - Decorator usage patterns

## Documentation

- 📖 [Full Specification](./spec/spec.md) - Complete implementation guide with AWS S3 and HTTP API examples
- 🔧 [API Reference](#api-reference) - Detailed API documentation

## License

MIT

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.
