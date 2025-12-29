# Decorator‑Driven Adapter API (vNext)

This document summarizes the **new public API** for `nest-hex`, introducing:

- Declarative **decorators** for adapter metadata
- A compile‑time‑only **defineAdapter** helper for strong type safety
- No runtime behavior changes
- Full alignment with NestJS class‑based philosophy

---

## Why this change?

The previous API required:

- Overriding protected fields (`token`, `implementation`)
- Optional helper methods like `Adapter.forToken()`
- Extra exported variables to enforce type safety

The new API:

- Declares intent using decorators
- Keeps adapters **pure classes**
- Enforces correctness at **compile time**
- Adds **zero runtime cost**
- Improves readability and DX

---

## New Public API Surface

### Decorators

#### `@AdapterToken(token)`
Declares which **port token** the adapter provides.

```ts
@AdapterToken(OBJECT_STORAGE_PROVIDER)
```

---

#### `@AdapterImpl(ImplementationClass)`
Declares the **concrete implementation** class used by the adapter.

```ts
@AdapterImpl(S3ObjectStorageService)
```

---

#### `@InjectPort(token)`
DX decorator for injecting a port token into services.

```ts
constructor(
  @InjectPort(OBJECT_STORAGE_PROVIDER)
  private readonly storage: ObjectStoragePort,
) {}
```

---

### Helper

#### `defineAdapter<TToken, TOptions>()`

A **compile‑time only** helper that:

- Verifies the adapter class satisfies the adapter contract
- Ensures `register()` / `registerAsync()` signatures are correct
- Returns the class unchanged at runtime

```ts
export default defineAdapter<typeof TOKEN, Options>()(AdapterClass);
```

After TypeScript compilation, this helper is erased completely.

---

## Adapter Base (unchanged responsibility)

The `Adapter<TToken, TOptions>` base class still:

- Creates a `DynamicModule`
- Registers the implementation provider
- Aliases `token -> implementation` using `useExisting`
- Exports **only the port token**
- Preserves the typed `AdapterModule<TToken>` proof

The difference:
It now **reads metadata from decorators** instead of protected fields.

---

## Full Example

```ts
export default defineAdapter<typeof OBJECT_STORAGE_PROVIDER, S3AdapterOptions>()(
  @AdapterToken(OBJECT_STORAGE_PROVIDER)
  @AdapterImpl(S3ObjectStorageService)
  class S3ObjectStorageAdapter extends Adapter<
    typeof OBJECT_STORAGE_PROVIDER,
    S3AdapterOptions
  > {
    protected extraPoviders(options: S3AdapterOptions) {
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

### What this guarantees (compile time)

- `register(options)` **requires** `S3AdapterOptions`
- Returned module is `AdapterModule<typeof OBJECT_STORAGE_PROVIDER>`
- Adapter cannot be wired to the wrong feature module
- Adapter is a valid NestJS class
- No extra exported variables needed

---

## Why `defineAdapter` is acceptable in NestJS

- It does **not** participate in DI
- It does **not** register providers
- It does **not** create modules
- It does **not** wrap or replace the class
- It is erased after type‑checking

At runtime, the export is **just the class**.

This is comparable to NestJS utilities like `PartialType()` or `mixin()`,
but even lighter — it is a pure identity function.

---

## Migration Guide

### Before

```ts
export class S3Adapter extends Adapter.forToken(TOKEN)<Options> {
  protected implementation = Service;
}
```

### After

```ts
export default defineAdapter<typeof TOKEN, Options>()(
  @AdapterToken(TOKEN)
  @AdapterImpl(Service)
  class S3Adapter extends Adapter<typeof TOKEN, Options> {}
);
```

---

## Design Principles

- **Decorators describe intent**
- **Classes own behavior**
- **Helpers enforce correctness**
- **Apps own configuration**
- **No hidden NestJS magic**

---

## Summary

This change results in:

- Cleaner adapter declarations
- Stronger compile‑time guarantees
- Better readability in large codebases
- A minimal, future‑proof public API

No breaking changes to runtime behavior.
