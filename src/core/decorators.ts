import 'reflect-metadata'
import type { DynamicModule, Provider, Type } from '@nestjs/common'
import { Inject } from '@nestjs/common'
import {
	ADAPTER_IMPORTS_METADATA,
	ADAPTER_PROVIDERS_METADATA,
	PORT_IMPLEMENTATION_METADATA,
	PORT_TOKEN_METADATA,
} from './constants'
import type { PortConfig } from './types.ts'

/**
 * Declares the adapter configuration (port token, implementation, imports, and extra providers).
 *
 * This decorator stores the port token, implementation class, optional imports, and
 * optional extra providers in metadata, which is read at runtime by the Adapter base
 * class's register() and registerAsync() methods.
 *
 * @param config - Adapter configuration object
 * @param config.portToken - The port token this adapter provides
 * @param config.implementation - The concrete implementation class that provides the port functionality
 * @param config.imports - Optional array of NestJS modules to import (module classes or DynamicModule objects)
 * @param config.providers - Optional array of additional providers to register
 *
 * @example
 * Basic adapter:
 * ```typescript
 * @Adapter({
 *   portToken: OBJECT_STORAGE_PORT,
 *   implementation: S3ObjectStorageService
 * })
 * class S3Adapter extends AdapterBase<S3Options> {}
 * ```
 *
 * @example
 * Adapter with imports and extra providers:
 * ```typescript
 * @Adapter({
 *   portToken: HTTP_CLIENT_PORT,
 *   implementation: AxiosHttpClient,
 *   imports: [HttpModule],
 *   providers: [{ provide: 'HTTP_CONFIG', useValue: { timeout: 5000 } }]
 * })
 * class AxiosAdapter extends AdapterBase<AxiosOptions> {}
 * ```
 */
export function Adapter<C extends PortConfig<any, any>>(config: {
	portToken: C['token']
	implementation: Type<C['port']>
	imports?: Array<Type<any> | DynamicModule | Promise<DynamicModule>>
	providers?: Provider[]
}): ClassDecorator {
	return (target) => {
		Reflect.defineMetadata(PORT_TOKEN_METADATA, config.portToken, target)
		Reflect.defineMetadata(
			PORT_IMPLEMENTATION_METADATA,
			config.implementation,
			target,
		)
		if (config.imports) {
			Reflect.defineMetadata(ADAPTER_IMPORTS_METADATA, config.imports, target)
		}
		if (config.providers) {
			Reflect.defineMetadata(
				ADAPTER_PROVIDERS_METADATA,
				config.providers,
				target,
			)
		}
	}
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
	return Inject(token as never)
}
