# nest-hex — Spec, Implementation, and Examples (AWS + HTTP)

A tiny, **class-based**, **NestJS-native** helper library for building **pluggable adapters** (Ports & Adapters / Hexagonal) with great DX.

This package standardizes:

1. **Adapter modules** that provide a "port" token and hide infrastructure details (AWS SDK, HTTP APIs, etc.).
2. **Port modules** that accept an adapter module and expose a domain service.

It aims to be:
- **Declarative**: declare the capability token **once**.
- **Class-based**: no function factories required for feature modules.
- **Best practices**: no `process.env` inside libs; app owns configuration.
- **Type-safe**: adapters return a DynamicModule that “proves” which token they provide.

---

## Table of contents

- [Motivation](#motivation)
- [Core concepts](#core-concepts)
- [Public API](#public-api)
- [Implementation](#implementation)
  - [Types](#types)
  - [Adapter base](#adapter-base)
  - [Port module base](#port-module-base)
  - [Index exports](#index-exports)
- [Examples](#examples)
  - [Example A: Object Storage feature module (port)](#example-a-object-storage-feature-module-port)
  - [Example B: AWS S3 adapter](#example-b-aws-s3-adapter)
  - [Example C: Random HTTP API adapter (currency rates)](#example-c-random-http-api-adapter-currency-rates)
  - [Example D: App wiring](#example-d-app-wiring)
  - [Example E: Testing](#example-e-testing)
- [Guidelines & pitfalls](#guidelines--pitfalls)
- [Package notes](#package-notes)

---

## Motivation

In NestJS, adapters are usually **Dynamic Modules**. Boilerplate repeats:

- Register a concrete implementation class.
- Alias the “port” token to the implementation (`useExisting`).
- Export only the token (not provider objects).
- Provide `register()` and/or `registerAsync()` patterns.
- Keep the **app** responsible for configuration (`ConfigService` / `.env`), not the library.

This package gives you a consistent, reusable way to do it.

---

## Core concepts

### 1) Port token
A token (usually `Symbol()` or string) representing the domain interface (port).

Example:

```ts
export const OBJECT_STORAGE_PROVIDER = Symbol('OBJECT_STORAGE_PROVIDER');
```

### 2) Adapter module
A module that **provides** the token and hides infrastructure details (AWS clients, HTTP clients, auth headers, etc.).

### 3) Port module
A module that imports an adapter module and exposes a **domain service**.

---

## Public API

Suggested exports:

- **Types:**
  - `AdapterModule<TToken>` — DynamicModule + proof it provides `TToken`.

- **Base Classes:**
  - `Adapter` — base class to build adapter modules with minimal repetition.
  - `PortModule` — base class to build port modules that accept adapters.

- **Decorators:**
  - `@Port({ token, implementation })` — Declares which port token the adapter provides and its implementation class.
  - `@InjectPort(token)` — DX decorator for injecting a port token into services.

- **Helpers:**
  - `defineAdapter<TToken, TOptions>()` — Compile-time only helper that verifies adapter contract and enforces type safety (erased at runtime).

---

## Implementation

> Reference implementation you can place under `src/` for your npm package.

### Types

```ts
// src/core/types.ts
import { DynamicModule } from '@nestjs/common';

/**
 * A DynamicModule that carries a compile-time proof it provides `TToken`.
 * The `__provides` field is used only for TypeScript structural typing.
 */
export type AdapterModule<TToken> = DynamicModule & {
  __provides: TToken;
};
```

---

### Adapter base

Goals:
- Declare the capability token **once** using `@Port({ token, implementation })` decorator
- Automatically:
  - register the implementation class
  - alias token -> implementation (`useExisting`)
  - export the token
- Provide both `register()` and `registerAsync()` with good DX
- Read metadata from decorators (not protected fields)

```ts
// src/core/adapter.base.ts
import 'reflect-metadata';
import { Port, Type } from '@nestjs/common';
import { AdapterModule } from './types';
import { PORT_TOKEN_METADATA, PORT_IMPLEMENTATION_METADATA } from './constants';

export abstract class Adapter<TOptions> {
  /** Optional imports (can depend on options) */
  protected imports(_options?: TOptions): any[] {
    return [];
  }

  /** Optional extra providers (e.g., helper tokens, loggers, mappers) */
  protected extraPoviders(_options: TOptions): Port[] {
    return [];
  }

  /**
   * Sync registration (app already has options available).
   */
  static register<TToken, TOptions>(
    this: new () => Adapter<TOptions>,
    options: TOptions,
  ): AdapterModule<TToken> {
    const instance = new this();

    // Read metadata from @Port decorator
    const token = Reflect.getMetadata(PORT_TOKEN_METADATA, this) as TToken;
    const implementation = Reflect.getMetadata(PORT_IMPLEMENTATION_METADATA, this) as Type<unknown>;

    if (!token) {
      throw new Error(`${this.name} must be decorated with @Port() and specify 'token'`);
    }
    if (!implementation) {
      throw new Error(`${this.name} must be decorated with @Port() and specify 'implementation'`);
    }

    return {
      module: this,
      imports: instance.imports(options),
      providers: [
        implementation,
        { provide: token, useExisting: implementation },
        ...instance.extraPoviders(options),
      ],
      exports: [token],
      __provides: token,
    };
  }

  /**
   * Async registration (app provides options via DI).
   *
   * NOTE: The base version does not auto-create an options token.
   * If your adapter needs DI-resolved options, you can:
   * 1) Keep the adapter options sync (recommended), OR
   * 2) Add an adapter-specific options token + provider in `extraPoviders()`,
   *    and configure imports (like HttpModule.registerAsync) there.
   */
  static registerAsync<TToken, TOptions>(
    this: new () => Adapter<TOptions>,
    options: {
      imports?: any[];
      inject?: any[];
      useFactory: (...args: any[]) => TOptions | Promise<TOptions>;
    },
  ): AdapterModule<TToken> {
    const instance = new this();

    // Read metadata from @Port decorator
    const token = Reflect.getMetadata(PORT_TOKEN_METADATA, this) as TToken;
    const implementation = Reflect.getMetadata(PORT_IMPLEMENTATION_METADATA, this) as Type<unknown>;

    if (!token) {
      throw new Error(`${this.name} must be decorated with @Port() and specify 'token'`);
    }
    if (!implementation) {
      throw new Error(`${this.name} must be decorated with @Port() and specify 'implementation'`);
    }

    return {
      module: this,
      imports: [
        ...(options.imports ?? []),
        ...instance.imports(),
      ],
      providers: [
        implementation,
        { provide: token, useExisting: implementation },
        ...instance.extraPoviders({} as TOptions),
      ],
      exports: [token],
      __provides: token,
    };
  }
}
```

---

### Constants

```ts
// src/core/constants.ts
/**
 * Metadata key for storing the port token in adapter class metadata.
 * Used by the @Port decorator to store which token the adapter provides.
 */
export const PORT_TOKEN_METADATA: unique symbol = Symbol('PORT_TOKEN_METADATA');

/**
 * Metadata key for storing the port implementation class in adapter class metadata.
 * Used by the @Port decorator to store the concrete implementation class.
 */
export const PORT_IMPLEMENTATION_METADATA: unique symbol = Symbol('PORT_IMPLEMENTATION_METADATA');
```

---

### Decorators

```ts
// src/core/decorators.ts
import 'reflect-metadata';
import { Inject, Type } from '@nestjs/common';
import { PORT_TOKEN_METADATA, PORT_IMPLEMENTATION_METADATA } from './constants';

/**
 * Declares the port configuration for an adapter (token and implementation).
 *
 * This decorator stores both the port token and implementation class in metadata,
 * which is read at runtime by the Adapter base class's register() and registerAsync() methods.
 *
 * @param config - Port configuration object
 * @param config.token - The port token this adapter provides
 * @param config.implementation - The concrete implementation class that provides the port functionality
 *
 * @example
 * ```typescript
 * @Port({
 *   token: OBJECT_STORAGE_PROVIDER,
 *   implementation: S3ObjectStorageService
 * })
 * class S3Adapter extends Adapter<S3Options> {}
 * ```
 */
export function Port<TToken>(config: {
  token: TToken;
  implementation: Type<unknown>;
}): ClassDecorator {
  return (target: unknown) => {
    Reflect.defineMetadata(PORT_TOKEN_METADATA, config.token, target as object);
    Reflect.defineMetadata(
      PORT_IMPLEMENTATION_METADATA,
      config.implementation,
      target as object,
    );
  };
}

/**
 * DX decorator for injecting a port token into service constructors.
 * This is a shorthand for @Inject(token) that provides clearer semantics.
 *
 * @param token - The port token to inject
 *
 * @example
 * ```typescript
 * @Injectable()
 * class ObjectStorageService {
 *   constructor(
 *     @InjectPort(OBJECT_STORAGE_PROVIDER)
 *     private readonly storage: ObjectStoragePort,
 *   ) {}
 * }
 * ```
 */
export function InjectPort<TToken>(token: TToken): ParameterDecorator {
  return Inject(token as never);
}
```

---

### Helper: defineAdapter

```ts
// src/core/define-adapter.ts
import { Adapter } from './adapter.base';
import { AdapterModule } from './types';

/**
 * Compile-time only helper that verifies adapter contract and enforces type safety.
 * This function is an identity function that returns the class unchanged at runtime.
 * After TypeScript compilation, this helper is erased completely.
 *
 * @example
 * ```typescript
 * export default defineAdapter<typeof STORAGE_TOKEN, S3Options>()(
 *   @Port({
 *     token: STORAGE_TOKEN,
 *     implementation: S3Service
 *   })
 *   class S3Adapter extends Adapter<S3Options> {}
 * );
 * ```
 */
export function defineAdapter<TToken, TOptions>() {
  return <T extends new () => Adapter<TOptions>>(adapterClass: T): T & {
    register(options: TOptions): AdapterModule<TToken>;
    registerAsync(options: {
      imports?: any[];
      inject?: any[];
      useFactory: (...args: any[]) => TOptions | Promise<TOptions>;
    }): AdapterModule<TToken>;
  } => {
    return adapterClass as any;
  };
}
```

---

### Port module base

Goals:
- Class-based port module that:
  - has `@Module()` metadata
  - exposes a single domain service
  - imports the chosen adapter module

```ts
// src/core/port-module.base.ts
import { DynamicModule, Module } from '@nestjs/common';
import { AdapterModule } from './types';

/**
 * Abstract base class for building port modules that consume adapters.
 *
 * Port modules are domain-focused modules that:
 * - Accept an adapter module as a dependency
 * - Expose a domain service that uses the port token
 * - Remain independent of infrastructure details
 *
 * @template TService - The domain service type (for documentation only)
 *
 * @example
 * ```typescript
 * @Module({})
 * export class ObjectStorageModule extends PortModule<typeof ObjectStorageService> {}
 * ```
 */
@Module({})
export class PortModule<_TService> {
  static register<TToken>({
    adapter,
  }: {
    adapter?: AdapterModule<TToken>;
  }): DynamicModule {
    return {
      module: PortModule,
      imports: adapter ? [adapter] : [],
    };
  }
}
```

---

### Index exports

```ts
// src/index.ts
export { Adapter } from './core/adapter.base';
export { InjectPort, Port } from './core/decorators';
export { defineAdapter } from './core/define-adapter';
export { PortModule } from './core/port-module.base';
export type { AdapterModule } from './core/types';
```

---

## Examples

The examples below show **one AWS adapter** (S3) and **one HTTP adapter** (currency rates API).

> Note: These are intentionally “product-like” examples. Replace with your own ports/services.

---

### Example A: Object Storage feature module (port)

#### Token + port interface

```ts
// libs/storage/src/object-storage.token.ts
export const OBJECT_STORAGE_PROVIDER = Symbol('OBJECT_STORAGE_PROVIDER');

// libs/storage/src/object-storage.port.ts
export interface ObjectStoragePort {
  putObject(input: {
    bucket: string;
    key: string;
    body: Buffer;
    contentType?: string;
  }): Promise<{ etag?: string }>;

  getSignedGetUrl(input: {
    bucket: string;
    key: string;
    expiresInSeconds?: number;
  }): Promise<{ url: string }>;
}
```

#### Domain service (injects the port token)

```ts
// libs/storage/src/object-storage.service.ts
import { Injectable } from '@nestjs/common';
import { InjectPort } from 'nest-hex';
import { OBJECT_STORAGE_PROVIDER } from './object-storage.token';
import type { ObjectStoragePort } from './object-storage.port';

@Injectable()
export class ObjectStorageService {
  constructor(
    @InjectPort(OBJECT_STORAGE_PROVIDER)
    private readonly storage: ObjectStoragePort,
  ) {}

  uploadProfilePhoto(input: { userId: string; image: Buffer }) {
    const key = `profiles/${input.userId}.jpg`;
    return this.storage.putObject({
      bucket: 'my-app-bucket',
      key,
      body: input.image,
      contentType: 'image/jpeg',
    });
  }

  async getProfilePhotoUrl(userId: string) {
    const key = `profiles/${userId}.jpg`;
    const { url } = await this.storage.getSignedGetUrl({
      bucket: 'my-app-bucket',
      key,
      expiresInSeconds: 60,
    });
    return url;
  }
}
```

#### Port module (accepts adapter)

```ts
// libs/storage/src/object-storage.module.ts
import { Module } from '@nestjs/common';
import { PortModule } from 'nest-hex';
import { ObjectStorageService } from './object-storage.service';

@Module({})
export class ObjectStorageModule extends PortModule<typeof ObjectStorageService> {}
```

---

### Example B: AWS S3 adapter

#### Adapter options

```ts
// libs/storage/src/adapters/s3/s3.types.ts
export type S3AdapterOptions = {
  region: string;
  /**
   * Optional explicit credentials if you *don't* rely on default AWS chain.
   * Prefer to keep this in the app layer (ConfigService).
   */
  accessKeyId?: string;
  secretAccessKey?: string;
};
```

#### Adapter implementation service

```ts
// libs/storage/src/adapters/s3/s3.service.ts
import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type { S3AdapterOptions } from './s3.types';

@Injectable()
export class S3ObjectStorageService {
  private client!: S3Client;

  /**
   * You can initialize the AWS client in the constructor if you inject options,
   * or provide a setter/initializer. For brevity, this example uses an init method.
   */
  init(options: S3AdapterOptions) {
    this.client = new S3Client({
      region: options.region,
      credentials: options.accessKeyId && options.secretAccessKey
        ? { accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey }
        : undefined,
    });
  }

  async putObject(input: {
    bucket: string;
    key: string;
    body: Buffer;
    contentType?: string;
  }) {
    const res = await this.client.send(
      new PutObjectCommand({
        Bucket: input.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
    return { etag: res.ETag };
  }

  async getSignedGetUrl(input: {
    bucket: string;
    key: string;
    expiresInSeconds?: number;
  }) {
    const cmd = new GetObjectCommand({
      Bucket: input.bucket,
      Key: input.key,
    });

    const url = await getSignedUrl(this.client, cmd, {
      expiresIn: input.expiresInSeconds ?? 60,
    });

    return { url };
  }
}
```

#### Adapter module (decorator-driven; token declared once)

```ts
// libs/storage/src/adapters/s3/s3.adapter.ts
import { Adapter, Port, defineAdapter } from 'nest-hex';
import { OBJECT_STORAGE_PROVIDER } from '../../object-storage.token';
import type { S3AdapterOptions } from './s3.types';
import { S3ObjectStorageService } from './s3.service';

@Port({
  token: OBJECT_STORAGE_PROVIDER,
  implementation: S3ObjectStorageService,
})
class S3AdapterClass extends Adapter<S3AdapterOptions> {
  /**
   * Use imports() if you need to import other Nest modules.
   * AWS SDK clients usually don't require Nest imports.
   */
  protected imports(_options?: S3AdapterOptions) {
    return [];
  }

  protected extraPoviders(options: S3AdapterOptions) {
    // Initialize the AWS client after Nest constructs the service.
    // This uses a provider that runs once and calls `init()`.
    return [
      {
        provide: Symbol('S3_INIT'),
        useFactory: (svc: S3ObjectStorageService) => {
          svc.init(options);
          return true;
        },
        inject: [S3ObjectStorageService],
      },
    ];
  }
}

const S3Adapter = defineAdapter<typeof OBJECT_STORAGE_PROVIDER, S3AdapterOptions>()(
  S3AdapterClass,
);

export default S3Adapter;
```

> Tip: In a "real" adapter, you may prefer to inject an options token into `S3ObjectStorageService` rather than calling `init()`. Both are valid; this keeps the example concise.

---

### Example C: Random HTTP API adapter (currency rates)

#### Token + port

```ts
// libs/rates/src/currency-rates.token.ts
export const CURRENCY_RATES_PROVIDER = Symbol('CURRENCY_RATES_PROVIDER');

// libs/rates/src/currency-rates.port.ts
export interface CurrencyRatesPort {
  getRate(input: { base: string; quote: string }): Promise<{ rate: number }>;
}
```

#### Domain service

```ts
// libs/rates/src/currency-rates.service.ts
import { Injectable } from '@nestjs/common';
import { InjectPort } from 'nest-hex';
import { CURRENCY_RATES_PROVIDER } from './currency-rates.token';
import type { CurrencyRatesPort } from './currency-rates.port';

@Injectable()
export class CurrencyRatesService {
  constructor(
    @InjectPort(CURRENCY_RATES_PROVIDER)
    private readonly provider: CurrencyRatesPort,
  ) {}

  async convert(input: { amount: number; base: string; quote: string }) {
    const { rate } = await this.provider.getRate({ base: input.base, quote: input.quote });
    return { amount: input.amount * rate, rate };
  }
}
```

#### Port module

```ts
// libs/rates/src/currency-rates.module.ts
import { Module } from '@nestjs/common';
import { PortModule } from 'nest-hex';
import { CurrencyRatesService } from './currency-rates.service';

@Module({})
export class CurrencyRatesModule extends PortModule<typeof CurrencyRatesService> {}
```

#### HTTP adapter options

```ts
// libs/rates/src/adapters/http/http-rates.types.ts
export type HttpRatesOptions = {
  baseUrl: string;
  apiKey?: string;
  timeoutMs?: number;
};
```

#### HTTP adapter implementation service

```ts
// libs/rates/src/adapters/http/http-rates.service.ts
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HttpCurrencyRatesService {
  constructor(private readonly http: HttpService) {}

  async getRate(input: { base: string; quote: string }) {
    // Example endpoint shape. Adjust to your real API.
    const { data } = await firstValueFrom(
      this.http.get('/rate', {
        params: { base: input.base, quote: input.quote },
      }),
    );

    // Expect: { rate: number }
    return { rate: Number(data.rate) };
  }
}
```

#### Adapter module

```ts
// libs/rates/src/adapters/http/http-rates.adapter.ts
import { HttpModule } from '@nestjs/axios';
import { Adapter, Port, defineAdapter } from 'nest-hex';
import { CURRENCY_RATES_PROVIDER } from '../../currency-rates.token';
import type { HttpRatesOptions } from './http-rates.types';
import { HttpCurrencyRatesService } from './http-rates.service';

@Port({
  token: CURRENCY_RATES_PROVIDER,
  implementation: HttpCurrencyRatesService,
})
class HttpRatesAdapterClass extends Adapter<HttpRatesOptions> {
  protected imports(options?: HttpRatesOptions) {
    return [
      HttpModule.register({
        baseURL: options?.baseUrl,
        timeout: options?.timeoutMs ?? 10_000,
        headers: options?.apiKey ? { 'x-api-key': options.apiKey } : undefined,
      }),
    ];
  }
}

const HttpRatesAdapter = defineAdapter<typeof CURRENCY_RATES_PROVIDER, HttpRatesOptions>()(
  HttpRatesAdapterClass,
);

export default HttpRatesAdapter;
```

---

### Example D: App wiring

```ts
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ObjectStorageModule } from '@your-scope/storage';
import { S3ObjectStorageAdapter } from '@your-scope/storage';

import { CurrencyRatesModule } from '@your-scope/rates';
import { HttpCurrencyRatesAdapter } from '@your-scope/rates';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // AWS S3 adapter
    ObjectStorageModule.register({
      adapter: S3ObjectStorageAdapter.register({
        region: 'eu-west-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }),
    }),

    // Random HTTP API adapter
    CurrencyRatesModule.register({
      adapter: HttpCurrencyRatesAdapter.register({
        baseUrl: process.env.RATES_API_BASE_URL!,
        apiKey: process.env.RATES_API_KEY,
      }),
    }),
  ],
})
export class AppModule {}
```

---

### Example E: Testing

Mock adapter:

```ts
import { Adapter, Port, defineAdapter } from 'nest-hex';
import { CURRENCY_RATES_PROVIDER } from './currency-rates.token';

class MockRatesPort {
  async getRate() {
    return { rate: 2 };
  }
}

@Port({
  token: CURRENCY_RATES_PROVIDER,
  implementation: MockRatesPort,
})
class MockRatesAdapterClass extends Adapter<void> {}

const MockRatesAdapter = defineAdapter<typeof CURRENCY_RATES_PROVIDER, void>()(
  MockRatesAdapterClass,
);

CurrencyRatesModule.register({
  adapter: MockRatesAdapter.register(undefined),
});
```

Or override the token in Nest testing module:

```ts
.overridePort(CURRENCY_RATES_PROVIDER)
.useValue({ getRate: jest.fn().mockResolvedValue({ rate: 2 }) })
```

---

## Guidelines & pitfalls

### ✅ Export tokens, not provider objects
Correct:

```ts
exports: [CURRENCY_RATES_PROVIDER]
```

Incorrect:

```ts
exports: [{ provide: CURRENCY_RATES_PROVIDER, useExisting: HttpCurrencyRatesService }]
```

### ✅ `useExisting` requires the class provider to exist
The base `Adapter` always registers the concrete implementation class provider.

### ✅ App owns configuration
Avoid `process.env` inside reusable libs. Prefer:
- `register()` and pass resolved options from the app
- adapter-specific DI options token if you truly need `registerAsync`

### ✅ Keep adapters single-responsibility
Adapter modules are infrastructure. Controllers/routes belong to the app layer.

---

## Package notes

### Peer dependencies (recommended)

This package should declare NestJS libs as **peerDependencies** so consuming apps own versions:

- `@nestjs/common`
- `@nestjs/core`
- `reflect-metadata`

If your README includes examples that use these, they should be peers in the example packages:
- `@nestjs/axios`
- `@nestjs/config`
- `rxjs`
- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`

### TypeScript
Works best with TS 4.9+ (for `satisfies`), but not required.

---

## License
MIT recommended.
