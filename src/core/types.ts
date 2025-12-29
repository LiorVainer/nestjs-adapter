import type { DynamicModule } from '@nestjs/common'

/**
 * A DynamicModule that carries a compile-time proof it provides `TToken`.
 *
 * The `__provides` field is used only for TypeScript structural typing to ensure
 * that feature modules receive adapters that provide the correct token type.
 * This enables compile-time type safety without runtime overhead.
 *
 * @template TToken - The token type that this adapter module provides
 *
 * @example
 * ```typescript
 * const s3Module: AdapterModule<typeof STORAGE_TOKEN> = S3Adapter.register(options);
 * // TypeScript ensures s3Module provides STORAGE_TOKEN
 * ```
 */
export type AdapterModule<TToken> = DynamicModule & {
	__provides: TToken
}

export type PortConfig<Token, Port> = {
	token: Token
	port: Port
}

/**
 * Type for an Adapter class returned by `defineAdapter()`.
 * Represents a class constructor with static `register` and `registerAsync` methods.
 *
 * @template TToken - The port token type this adapter provides
 * @template TOptions - The options type for configuring this adapter
 */
export type TypedAdapter<TToken, TOptions> = (new () => {
	imports(_options?: TOptions): unknown[]
}) & {
	register(options: TOptions): AdapterModule<TToken>
	registerAsync(asyncOptions: {
		imports?: unknown[]
		inject?: unknown[]
		useFactory: (...args: unknown[]) => TOptions | Promise<TOptions>
	}): AdapterModule<TToken>
}
