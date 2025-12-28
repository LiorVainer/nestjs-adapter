import 'reflect-metadata'
import type { Type } from '@nestjs/common'
import { Inject } from '@nestjs/common'
import { PORT_IMPLEMENTATION_METADATA, PORT_TOKEN_METADATA } from './constants'
import type { PortConfig } from './types.ts'

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
 *   token: OBJECT_STORAGE_PORT,
 *   implementation: S3ObjectStorageService
 * })
 * class S3Adapter extends Adapter<S3Options> {}
 * ```
 */
export function Port<C extends PortConfig<any, any>>(config: {
	token: C['token']
	implementation: Type<C['port']>
}): ClassDecorator {
	return (target) => {
		Reflect.defineMetadata(PORT_TOKEN_METADATA, config.token, target)
		Reflect.defineMetadata(
			PORT_IMPLEMENTATION_METADATA,
			config.implementation,
			target,
		)
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
