# nest-hex

> A tiny, **class-based**, **NestJS-native** library for building **pluggable adapters** following the Ports & Adapters (Hexagonal Architecture) pattern with minimal boilerplate.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is nest-hex?

**nest-hex** eliminates boilerplate when building NestJS applications with the Ports & Adapters (Hexagonal Architecture) pattern. It provides decorators and base classes that handle all the repetitive wiring, letting you focus on business logic.

### Why Hexagonal Architecture?

- 🧪 **Testable** - Mock infrastructure easily, test business logic in isolation
- 🔌 **Swappable** - Switch from S3 to Azure Blob Storage without touching domain code
- 🎯 **Clean** - Keep business logic free of infrastructure concerns
- 🌍 **Flexible** - Use different adapters for dev, test, and production

## Features

- 🎯 **Declarative** - Declare port tokens and implementations once using `@Adapter({ portToken, implementation })`
- 🏗️ **Class-based** - Standard NestJS dynamic modules, no function factories
- 🔒 **Type-safe** - Compile-time proof that adapters provide the correct port tokens
- ⚡ **Zero runtime overhead** - Uses TypeScript decorators and metadata
- 📦 **Tiny** - Core library under 1KB minified
- 🛠️ **Powerful CLI** - Generate ports, adapters, and services instantly

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

**Peer dependencies:**
```bash
npm install @nestjs/common @nestjs/core reflect-metadata
```

## Quick Start

### 1. Define a Port (Domain Interface)

```typescript
// storage.port.ts
export const STORAGE_PORT = Symbol('STORAGE_PORT')

export interface StoragePort {
  upload(key: string, data: Buffer): Promise<string>
  download(key: string): Promise<Buffer>
}
```

### 2. Create an Adapter (Infrastructure Implementation)

```typescript
// s3.adapter.ts
import { Injectable } from '@nestjs/common'
import { Adapter } from 'nest-hex'
import { STORAGE_PORT, type StoragePort } from './storage.port'

// Implementation service
@Injectable()
class S3Service implements StoragePort {
  constructor(private options: { bucket: string; region: string }) {}

  async upload(key: string, data: Buffer): Promise<string> {
    // AWS S3 upload logic here
    return `https://s3.amazonaws.com/${this.options.bucket}/${key}`
  }

  async download(key: string): Promise<Buffer> {
    // AWS S3 download logic here
    return Buffer.from('file contents')
  }
}

// Adapter module - single decorator declares everything!
@Adapter({
  portToken: STORAGE_PORT,
  implementation: S3Service
})
export class S3Adapter extends AdapterBase<{ bucket: string; region: string }> {}
```

### 3. Create a Domain Service

```typescript
// file.service.ts
import { Injectable } from '@nestjs/common'
import { InjectPort } from 'nest-hex'
import { STORAGE_PORT, type StoragePort } from './storage.port'

@Injectable()
export class FileService {
  constructor(
    @InjectPort(STORAGE_PORT)
    private readonly storage: StoragePort
  ) {}

  async uploadUserAvatar(userId: string, image: Buffer): Promise<string> {
    const key = `avatars/${userId}.jpg`
    return this.storage.upload(key, image)
  }
}
```

### 4. Create a Port Module

```typescript
// file.module.ts
import { Module } from '@nestjs/common'
import { PortModule } from 'nest-hex'
import { FileService } from './file.service'

@Module({})
export class FileModule extends PortModule<typeof FileService> {}
```

### 5. Wire It Up

```typescript
// app.module.ts
import { Module } from '@nestjs/common'
import { FileModule } from './file.module'
import { S3Adapter } from './s3.adapter'

@Module({
  imports: [
    FileModule.register({
      adapter: S3Adapter.register({
        bucket: process.env.S3_BUCKET || 'my-bucket',
        region: process.env.AWS_REGION || 'us-east-1'
      })
    })
  ]
})
export class AppModule {}
```

That's it! You now have a fully type-safe, pluggable storage adapter. 🎉

## CLI

Generate ports, adapters, and services instantly with the built-in CLI:

```bash
# Initialize configuration
npx nest-hex init

# Generate a port (domain interface)
npx nest-hex generate port ObjectStorage

# Generate an adapter for the port
npx nest-hex generate adapter S3 --port ObjectStorage

# Or generate both at once
npx nest-hex generate full ObjectStorage S3
```

**See [CLI Documentation](./docs/cli.md) for complete command reference, configuration options, and template customization.**

## Key Benefits

### Before (Manual Boilerplate)

```typescript
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
    }
  }
}
```

### After (With nest-hex)

```typescript
@Adapter({
  portToken: STORAGE_PORT,
  implementation: S3StorageService
})
export class S3Adapter extends AdapterBase<S3Options> {}
```

## Swappable Infrastructure

The real power: swap infrastructure without touching business logic.

```typescript
// Development: Use local filesystem
const adapter = process.env.NODE_ENV === 'production'
  ? S3Adapter.register({ bucket: 'prod-bucket', region: 'us-east-1' })
  : LocalStorageAdapter.register({ basePath: './uploads' })

@Module({
  imports: [FileModule.register({ adapter })]
})
export class AppModule {}
```

Your `FileService` business logic **never changes**. Only the adapter changes.

## Advanced Features

### Async Configuration with Dependency Injection

```typescript
@Module({
  imports: [
    FileModule.register({
      adapter: S3Adapter.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          bucket: config.get('S3_BUCKET')!,
          region: config.get('AWS_REGION')!
        })
      })
    })
  ]
})
export class AppModule {}
```

### Adapters with Dependencies

```typescript
@Adapter({
  portToken: HTTP_CLIENT_PORT,
  implementation: AxiosHttpClient,
  imports: [HttpModule],
  providers: [
    { provide: 'HTTP_CONFIG', useValue: { timeout: 5000 } }
  ]
})
export class AxiosAdapter extends AdapterBase<AxiosOptions> {}
```

### Mock Adapters for Testing

```typescript
@Injectable()
class MockStorageService implements StoragePort {
  async upload(key: string, data: Buffer): Promise<string> {
    return `mock://storage/${key}`
  }
  async download(key: string): Promise<Buffer> {
    return Buffer.from('mock data')
  }
}

@Adapter({
  portToken: STORAGE_PORT,
  implementation: MockStorageService
})
export class MockStorageAdapter extends AdapterBase<{}> {}

// Use in tests
const module = await Test.createTestingModule({
  imports: [
    FileModule.register({
      adapter: MockStorageAdapter.register({})
    })
  ]
}).compile()
```

## Documentation

📚 **Complete Documentation:**
- **[Library Documentation](./docs/library.md)** - Full API reference, architecture guide, advanced patterns, and examples
- **[CLI Documentation](./docs/cli.md)** - Complete CLI reference, configuration, templates, and best practices

📖 **Quick Links:**
- [Core Concepts](./docs/library.md#core-concepts) - Understand ports, adapters, and services
- [Why Hexagonal Architecture?](./docs/library.md#why-hexagonal-architecture) - Benefits with code examples
- [Architecture Overview](./docs/library.md#architecture-overview) - Visual diagrams
- [API Reference](./docs/library.md#api-reference) - Complete API documentation
- [Testing Guide](./docs/library.md#testing) - Mock adapters and integration testing
- [Migration Guide](./docs/library.md#migration-guide) - Upgrading from @Port to @Adapter

## Examples

See the [`examples/`](./examples) directory for complete working examples:

- **Object Storage** - S3 adapter with file upload/download
- **Currency Rates** - HTTP API adapter with rate conversion
- **Mock Patterns** - Testing with mock adapters

## License

MIT © [Your Name]

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and development process.

---

**Built with ❤️ for the NestJS community**
