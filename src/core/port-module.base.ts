import 'reflect-metadata'
import { type DynamicModule, Module } from '@nestjs/common'
import type { AdapterModule } from './types'

/**
 * Abstract base class for building port modules following the Ports & Adapters pattern.
 *
 * Port modules expose domain services that consume ports (via adapters) through dependency injection.
 * This base class simplifies creating modules that accept and import adapter modules.
 *
 * @template _TService - The service class provided by this port module (used for type constraints)
 *
 * @example
 * ```typescript
 * const STORAGE_TOKEN = Symbol('STORAGE_PORT');
 *
 * @Injectable()
 * class FileService {
 *   constructor(
 *     @InjectPort(STORAGE_TOKEN)
 *     private storage: StoragePort,
 *   ) {}
 * }
 *
 * @Module({})
 * export class FileModule extends PortModule<typeof FileService> {}
 *
 * // Usage:
 * FileModule.register({
 *   adapter: S3Adapter.register({ bucket: 'my-bucket' })
 * })
 * ```
 */
@Module({})
export class PortModule<_TService> {
	/**
	 * Registers the port module with an adapter.
	 *
	 * @param config - Configuration object containing the adapter module
	 * @param config.adapter - An adapter module that provides the required port
	 * @returns A dynamic module that imports the adapter and provides the service
	 */
	static register<TToken>({
		adapter,
	}: {
		adapter?: AdapterModule<TToken>
	}): DynamicModule {
		return {
			module: PortModule,
			imports: adapter ? [adapter] : [],
		}
	}
}
