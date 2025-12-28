# @nestjs-adapters/core — Spec, Implementation, and Examples (AWS + HTTP)

A tiny, **class-based**, **NestJS-native** helper library for building **pluggable adapters** (Ports & Adapters / Hexagonal) with great DX.

This package standardizes:

1. **Adapter modules** that provide a “port” token and hide infrastructure details (AWS SDK, HTTP APIs, etc.).
2. **Feature modules** that accept an adapter module and expose a domain service.

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
  - [Feature module base](#feature-module-base)
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

### 3) Feature module
A module that imports an adapter module and exposes a **domain service**.

---

## Public API

Suggested exports:

- **Types:**
  - `AdapterModule<TToken>` — DynamicModule + proof it provides `TToken`.

- **Base Classes:**
  - `Adapter` — base class to build adapter modules with minimal repetition.
  - `FeatureModule` — base class to build feature modules that accept adapters.

- **Decorators:**
  - `@AdapterToken(token)` — Declares which port token the adapter provides.
  - `@AdapterImpl(ImplementationClass)` — Declares the concrete implementation class.
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
- Declare the capability token **once** using `@AdapterToken` decorator
- Declare the concrete implementation **once** using `@AdapterImpl` decorator
- Automatically:
  - register the implementation class
  - alias token -> implementation (`useExisting`)
  - export the token
- Provide both `register()` and `registerAsync()` with good DX
- Read metadata from decorators (not protected fields)

```ts
// src/core/adapter.base.ts
import { Provider, Type } from '@nestjs/common';
import { AdapterModule } from './types';
import { ADAPTER_TOKEN_METADATA, ADAPTER_IMPL_METADATA } from './constants';

export abstract class Adapter<TOptions> {
  /** Optional imports (can depend on options) */
  protected imports(_options?: TOptions): any[] {
    return [];
  }

  /** Optional extra providers (e.g., helper tokens, loggers, mappers) */
  protected extraProviders(_options: TOptions): Provider[] {
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

    // Read metadata from decorators
    const token = Reflect.getMetadata(ADAPTER_TOKEN_METADATA, this) as TToken;
    const implementation = Reflect.getMetadata(ADAPTER_IMPL_METADATA, this) as Type<unknown>;

    if (!token) {
      throw new Error(`${this.name} must be decorated with @AdapterToken()`);
    }
    if (!implementation) {
      throw new Error(`${this.name} must be decorated with @AdapterImpl()`);
    }

    return {
      module: this,
      imports: instance.imports(options),
      providers: [
        implementation,
        { provide: token, useExisting: implementation },
        ...instance.extraProviders(options),
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
   * 2) Add an adapter-specific options token + provider in `extraProviders()`,
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

    // Read metadata from decorators
    const token = Reflect.getMetadata(ADAPTER_TOKEN_METADATA, this) as TToken;
    const implementation = Reflect.getMetadata(ADAPTER_IMPL_METADATA, this) as Type<unknown>;

    if (!token) {
      throw new Error(`${this.name} must be decorated with @AdapterToken()`);
    }
    if (!implementation) {
      throw new Error(`${this.name} must be decorated with @AdapterImpl()`);
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
        ...instance.extraProviders({} as TOptions),
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
export const ADAPTER_TOKEN_METADATA = Symbol('ADAPTER_TOKEN_METADATA');
export const ADAPTER_IMPL_METADATA = Symbol('ADAPTER_IMPL_METADATA');
```

---

### Decorators

```ts
// src/core/decorators.ts
import { Inject } from '@nestjs/common';
import { Type } from '@nestjs/common';
import { ADAPTER_TOKEN_METADATA, ADAPTER_IMPL_METADATA } from './constants';

/**
 * Declares which port token the adapter provides.
 *
 * @example
 * @AdapterToken(OBJECT_STORAGE_PROVIDER)
 * class S3Adapter extends Adapter<S3Options> {}
 */
export function AdapterToken<TToken>(token: TToken): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(ADAPTER_TOKEN_METADATA, token, target);
  };
}

/**
 * Declares the concrete implementation class used by the adapter.
 *
 * @example
 * @AdapterImpl(S3ObjectStorageService)
 * class S3Adapter extends Adapter<S3Options> {}
 */
export function AdapterImpl(implementation: Type<unknown>): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(ADAPTER_IMPL_METADATA, implementation, target);
  };
}

/**
 * DX decorator for injecting a port token into services.
 * Shorthand for @Inject(TOKEN).
 *
 * @example
 * constructor(
 *   @InjectPort(OBJECT_STORAGE_PROVIDER)
 *   private readonly storage: ObjectStorageProvider,
 * ) {}
 */
export function InjectPort<TToken>(token: TToken): ParameterDecorator {
  return Inject(token);
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
 * export default defineAdapter<typeof STORAGE_TOKEN, S3Options>()(
 *   @AdapterToken(STORAGE_TOKEN)
 *   @AdapterImpl(S3Service)
 *   class S3Adapter extends Adapter<S3Options> {}
 * );
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

### Feature module base

Goals:
- Class-based feature module that:
  - has `@Module()` metadata
  - exposes a single domain service
  - imports the chosen adapter module

```ts
// src/core/feature-module.base.ts
import { DynamicModule, Module, Type } from '@nestjs/common';
import { AdapterModule } from './types';

@Module({})
export abstract class FeatureModule<TService, TToken> {
  protected static service: Type<any>;

  static register<TToken>(
    this: { service: Type<any> },
    options: { adapter: AdapterModule<TToken> },
  ): DynamicModule {
    return {
      module: this as any,
      imports: [options.adapter],
      providers: [this.service],
      exports: [this.service],
    };
  }
}
```

---

### Index exports

```ts
// src/index.ts
export { Adapter } from './core/adapter.base';
export { FeatureModule } from './core/feature-module.base';
export type { AdapterModule } from './core/types';
export { AdapterToken, AdapterImpl, InjectPort } from './core/decorators';
export { defineAdapter } from './core/define-adapter';
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
export interface ObjectStorageProvider {
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
import { InjectPort } from '@nestjs-adapters/core';
import { OBJECT_STORAGE_PROVIDER } from './object-storage.token';
import type { ObjectStorageProvider } from './object-storage.port';

@Injectable()
export class ObjectStorageService {
  constructor(
    @InjectPort(OBJECT_STORAGE_PROVIDER)
    private readonly storage: ObjectStorageProvider,
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

#### Feature module (accepts adapter)

```ts
// libs/storage/src/object-storage.module.ts
import { FeatureModule } from '@nestjs-adapters/core';
import { ObjectStorageService } from './object-storage.service';
import { OBJECT_STORAGE_PROVIDER } from './object-storage.token';

export class ObjectStorageModule extends FeatureModule<
  ObjectStorageService,
  typeof OBJECT_STORAGE_PROVIDER
> {
  protected static service = ObjectStorageService;
}
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
import { Adapter, AdapterToken, AdapterImpl, defineAdapter } from '@nestjs-adapters/core';
import { OBJECT_STORAGE_PROVIDER } from '../../object-storage.token';
import type { S3AdapterOptions } from './s3.types';
import { S3ObjectStorageService } from './s3.service';

export default defineAdapter<typeof OBJECT_STORAGE_PROVIDER, S3AdapterOptions>()(
  @AdapterToken(OBJECT_STORAGE_PROVIDER)
  @AdapterImpl(S3ObjectStorageService)
  class S3ObjectStorageAdapter extends Adapter<S3AdapterOptions> {
    /**
     * Use imports() if you need to import other Nest modules.
     * AWS SDK clients usually don't require Nest imports.
     */
    protected imports(_options?: S3AdapterOptions) {
      return [];
    }

    protected extraProviders(options: S3AdapterOptions) {
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
  },
);
```

> Tip: In a “real” adapter, you may prefer to inject an options token into `S3ObjectStorageService` rather than calling `init()`. Both are valid; this keeps the example concise.

---

### Example C: Random HTTP API adapter (currency rates)

#### Token + port

```ts
// libs/rates/src/currency-rates.token.ts
export const CURRENCY_RATES_PROVIDER = Symbol('CURRENCY_RATES_PROVIDER');

// libs/rates/src/currency-rates.port.ts
export interface CurrencyRatesProvider {
  getRate(input: { base: string; quote: string }): Promise<{ rate: number }>;
}
```

#### Domain service

```ts
// libs/rates/src/currency-rates.service.ts
import { Injectable } from '@nestjs/common';
import { InjectPort } from '@nestjs-adapters/core';
import { CURRENCY_RATES_PROVIDER } from './currency-rates.token';
import type { CurrencyRatesProvider } from './currency-rates.port';

@Injectable()
export class CurrencyRatesService {
  constructor(
    @InjectPort(CURRENCY_RATES_PROVIDER)
    private readonly provider: CurrencyRatesProvider,
  ) {}

  async convert(input: { amount: number; base: string; quote: string }) {
    const { rate } = await this.provider.getRate({ base: input.base, quote: input.quote });
    return { amount: input.amount * rate, rate };
  }
}
```

#### Feature module

```ts
// libs/rates/src/currency-rates.module.ts
import { FeatureModule } from '@nestjs-adapters/core';
import { CurrencyRatesService } from './currency-rates.service';
import { CURRENCY_RATES_PROVIDER } from './currency-rates.token';

export class CurrencyRatesModule extends FeatureModule<
  CurrencyRatesService,
  typeof CURRENCY_RATES_PROVIDER
> {
  protected static service = CurrencyRatesService;
}
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
import { Adapter, AdapterToken, AdapterImpl, defineAdapter } from '@nestjs-adapters/core';
import { CURRENCY_RATES_PROVIDER } from '../../currency-rates.token';
import type { HttpRatesOptions } from './http-rates.types';
import { HttpCurrencyRatesService } from './http-rates.service';

export default defineAdapter<typeof CURRENCY_RATES_PROVIDER, HttpRatesOptions>()(
  @AdapterToken(CURRENCY_RATES_PROVIDER)
  @AdapterImpl(HttpCurrencyRatesService)
  class HttpCurrencyRatesAdapter extends Adapter<HttpRatesOptions> {
    protected imports(options?: HttpRatesOptions) {
      return [
        HttpModule.register({
          baseURL: options?.baseUrl,
          timeout: options?.timeoutMs ?? 10_000,
          headers: options?.apiKey ? { 'x-api-key': options.apiKey } : undefined,
        }),
      ];
    }
  },
);
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
import { Adapter, AdapterToken, AdapterImpl, defineAdapter } from '@nestjs-adapters/core';
import { CURRENCY_RATES_PROVIDER } from './currency-rates.token';

class MockRatesProvider {
  async getRate() {
    return { rate: 2 };
  }
}

const MockRatesAdapter = defineAdapter<typeof CURRENCY_RATES_PROVIDER, void>()(
  @AdapterToken(CURRENCY_RATES_PROVIDER)
  @AdapterImpl(MockRatesProvider)
  class MockRatesAdapter extends Adapter<void> {},
);

CurrencyRatesModule.register({
  adapter: MockRatesAdapter.register(undefined),
});
```

Or override the token in Nest testing module:

```ts
.overrideProvider(CURRENCY_RATES_PROVIDER)
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
