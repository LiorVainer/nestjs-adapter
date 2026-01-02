import 'reflect-metadata'
import type { Provider, Type } from '@nestjs/common'
import {
	ADAPTER_IMPORTS_METADATA,
	ADAPTER_PROVIDERS_METADATA,
	PORT_IMPLEMENTATION_METADATA,
	PORT_TOKEN_METADATA,
} from './constants'
import type { AdapterModule } from './types'

/**
 * Abstract base class for building NestJS adapter modules following the Ports & Adapters pattern.
 *
 * Adapters are dynamic modules that provide a port token and hide infrastructure details.
 * This base class automatically handles provider registration, token aliasing, and exports
 * by reading metadata from the @Adapter decorator.
 *
 * @template TOptions - The options type for configuring this adapter
 *
 * @example
 * Basic adapter with decorator options:
 * ```typescript
 * @Adapter({
 *   portToken: STORAGE_PORT,
 *   implementation: S3Service,
 *   imports: [HttpModule],
 *   providers: [{ provide: 'CONFIG', useValue: {...} }]
 * })
 * export class S3Adapter extends AdapterBase<S3Options> {}
 * ```
 *
 * Advanced adapter with dynamic configuration:
 * ```typescript
 * @Adapter({
 *   portToken: STORAGE_PORT,
 *   implementation: S3Service
 * })
 * export class S3Adapter extends AdapterBase<S3Options> {
 *   protected imports(options: S3Options) {
 *     return [HttpModule.register({ timeout: options.timeout })]
 *   }
 *
 *   protected extraProviders(options: S3Options) {
 *     return [{ provide: 'S3_CONFIG', useValue: options }]
 *   }
 * }
 * ```
 */
export class AdapterBase<TOptions> {
	/**
	 * Optional hook to import other NestJS modules.
	 * Override this method to add module dependencies based on options.
	 *
	 * @param _options - The adapter configuration options
	 * @returns Array of modules to import
	 */
	protected imports(_options?: TOptions): unknown[] {
		return []
	}

	/**
	 * Optional hook to provide additional providers.
	 * Override this method to add helper services, factories, or initialization logic based on options.
	 *
	 * @param _options - The adapter configuration options
	 * @returns Array of additional providers
	 */
	protected extraProviders(_options: TOptions): Provider[] {
		return []
	}

	/**
	 * Synchronous registration method.
	 * Creates a dynamic module with the adapter's port token and implementation.
	 *
	 * @param options - The adapter configuration options
	 * @returns An AdapterModule with compile-time token proof
	 * @throws Error if @Adapter decorator is missing or incomplete
	 */
	static register<TToken, TOptions>(
		this: new () => AdapterBase<TOptions>,
		options: TOptions,
	): AdapterModule<TToken> {
		const instance = new this()

		// Read metadata from @Adapter decorator
		const token = Reflect.getMetadata(PORT_TOKEN_METADATA, this) as TToken
		const implementation = Reflect.getMetadata(
			PORT_IMPLEMENTATION_METADATA,
			this,
		) as Type<unknown>
		const decoratorImports =
			(Reflect.getMetadata(ADAPTER_IMPORTS_METADATA, this) as unknown[]) ?? []
		const decoratorProviders =
			(Reflect.getMetadata(ADAPTER_PROVIDERS_METADATA, this) as Provider[]) ??
			[]

		if (!token) {
			throw new Error(
				`${this.name} must be decorated with @Adapter() and specify 'portToken'`,
			)
		}
		if (!implementation) {
			throw new Error(
				`${this.name} must be decorated with @Adapter() and specify 'implementation'`,
			)
		}

		return {
			module: this,
			imports: [...decoratorImports, ...instance.imports(options)] as never[],
			providers: [
				implementation,
				{ provide: token as never, useExisting: implementation },
				...decoratorProviders,
				...instance.extraProviders(options),
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
	 * @throws Error if @Adapter decorator is missing or incomplete
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
		this: new () => AdapterBase<TOptions>,
		options: {
			imports?: unknown[]
			inject?: unknown[]
			useFactory: (...args: unknown[]) => TOptions | Promise<TOptions>
		},
	): AdapterModule<TToken> {
		const instance = new this()

		// Read metadata from @Adapter decorator
		const token = Reflect.getMetadata(PORT_TOKEN_METADATA, this) as TToken
		const implementation = Reflect.getMetadata(
			PORT_IMPLEMENTATION_METADATA,
			this,
		) as Type<unknown>
		const decoratorImports =
			(Reflect.getMetadata(ADAPTER_IMPORTS_METADATA, this) as unknown[]) ?? []
		const decoratorProviders =
			(Reflect.getMetadata(ADAPTER_PROVIDERS_METADATA, this) as Provider[]) ??
			[]

		if (!token) {
			throw new Error(
				`${this.name} must be decorated with @Adapter() and specify 'portToken'`,
			)
		}
		if (!implementation) {
			throw new Error(
				`${this.name} must be decorated with @Adapter() and specify 'implementation'`,
			)
		}

		return {
			module: this,
			imports: [
				...decoratorImports,
				...instance.imports(),
				...(options.imports ?? []),
			] as never[],
			providers: [
				implementation,
				{ provide: token as never, useExisting: implementation },
				...decoratorProviders,
				...instance.extraProviders({} as TOptions),
			],
			exports: [token as never],
			__provides: token,
		}
	}
}
