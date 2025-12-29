import 'reflect-metadata'
import type { Provider, Type } from '@nestjs/common'
import { PORT_IMPLEMENTATION_METADATA, PORT_TOKEN_METADATA } from './constants'
import type { AdapterModule } from './types'

/**
 * Abstract base class for building NestJS adapter modules following the Ports & Adapters pattern.
 *
 * Adapters are dynamic modules that provide a port token and hide infrastructure details.
 * This base class automatically handles provider registration, token aliasing, and exports
 * by reading metadata from the @Port decorator.
 *
 * @template TOptions - The options type for configuring this adapter
 *
 * @example
 * ```typescript
 * @Port({
 *   token: STORAGE_PORT,
 *   implementation: S3Service
 * })
 * export class S3Adapter extends Adapter<S3Options> {
 *   protected override imports(options: S3Options) {
 *     return []; // Optional: import other modules
 *   }
 *
 *   protected override extraPoviders(options: S3Options) {
 *     return []; // Optional: additional providers
 *   }
 * }
 * ```
 */
export class Adapter<TOptions> {
	/**
	 * Optional hook to import other NestJS modules.
	 * Override this method to add module dependencies.
	 *
	 * @param _options - The adapter configuration options
	 * @returns Array of modules to import
	 */
	protected imports(_options?: TOptions): unknown[] {
		return []
	}

	/**
	 * Optional hook to provide additional providers.
	 * Override this method to add helper services, factories, or initialization logic.
	 *
	 * @param _options - The adapter configuration options
	 * @returns Array of additional providers
	 */
	protected extraPoviders(_options: TOptions): Provider[] {
		return []
	}

	/**
	 * Synchronous registration method.
	 * Creates a dynamic module with the adapter's port token and implementation.
	 *
	 * @param options - The adapter configuration options
	 * @returns An AdapterModule with compile-time token proof
	 * @throws Error if @Port decorator is missing or incomplete
	 */
	static register<TToken, TOptions>(
		this: new () => Adapter<TOptions>,
		options: TOptions,
	): AdapterModule<TToken> {
		const instance = new this()

		// Read metadata from @Port decorator
		const token = Reflect.getMetadata(PORT_TOKEN_METADATA, this) as TToken
		const implementation = Reflect.getMetadata(
			PORT_IMPLEMENTATION_METADATA,
			this,
		) as Type<unknown>

		if (!token) {
			throw new Error(
				`${this.name} must be decorated with @Port() and specify 'token'`,
			)
		}
		if (!implementation) {
			throw new Error(
				`${this.name} must be decorated with @Port() and specify 'implementation'`,
			)
		}

		return {
			module: this,
			imports: instance.imports(options) as never[],
			providers: [
				implementation,
				{ provide: token as never, useExisting: implementation },
				...instance.extraPoviders(options),
			],
			exports: [token as never],
			__provides: token,
		}
	}

	/**
	 * Asynchronous registration method with dependency injection support.
	 * Creates a dynamic module where options are resolved via DI.
	 *
	 * @param options - Async configuration with factory, imports, and inject
	 * @returns An AdapterModule with compile-time token proof
	 * @throws Error if @Port decorator is missing or incomplete
	 *
	 * @example
	 * ```typescript
	 * S3Adapter.registerAsync({
	 *   imports: [ConfigModule],
	 *   inject: [ConfigService],
	 *   useFactory: (config) => config.get('s3'),
	 * })
	 * ```
	 */
	static registerAsync<TToken, TOptions>(
		this: new () => Adapter<TOptions>,
		options: {
			imports?: unknown[]
			inject?: unknown[]
			useFactory: (...args: unknown[]) => TOptions | Promise<TOptions>
		},
	): AdapterModule<TToken> {
		const instance = new this()

		// Read metadata from @Port decorator
		const token = Reflect.getMetadata(PORT_TOKEN_METADATA, this) as TToken
		const implementation = Reflect.getMetadata(
			PORT_IMPLEMENTATION_METADATA,
			this,
		) as Type<unknown>

		if (!token) {
			throw new Error(
				`${this.name} must be decorated with @Port() and specify 'token'`,
			)
		}
		if (!implementation) {
			throw new Error(
				`${this.name} must be decorated with @Port() and specify 'implementation'`,
			)
		}

		return {
			module: this,
			imports: [...(options.imports ?? []), ...instance.imports()] as never[],
			providers: [
				implementation,
				{ provide: token as never, useExisting: implementation },
				...instance.extraPoviders({} as TOptions),
			],
			exports: [token as never],
			__provides: token,
		}
	}
}
