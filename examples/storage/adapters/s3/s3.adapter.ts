/**
 * S3 Object Storage Adapter
 *
 * This adapter provides object storage capabilities using AWS S3.
 * It uses the decorator-driven API for minimal boilerplate.
 *
 * Key Points:
 * - Extends Adapter<S3Options>
 * - Uses @Port to declare the token and implementation
 * - Provides compile-time type safety through static methods
 */

import { Adapter, Port } from '../../../../src'
import { OBJECT_STORAGE_PROVIDER } from '../../object-storage.token'
import { S3ObjectStorageService } from './s3.service'
import type { S3Options } from './s3.types'

/**
 * S3 adapter for object storage.
 *
 * This adapter implements the object storage port using AWS S3.
 *
 * Usage Example (Synchronous):
 * ```typescript
 * S3Adapter.register({
 *   bucket: 'my-app-uploads',
 *   region: 'us-east-1',
 *   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
 *   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
 *   defaultAcl: 'public-read'
 * })
 * ```
 *
 * Usage Example (Asynchronous with DI):
 * ```typescript
 * S3Adapter.registerAsync({
 *   imports: [ConfigModule],
 *   inject: [ConfigService],
 *   useFactory: (config: ConfigService) => ({
 *     bucket: config.get('S3_BUCKET'),
 *     region: config.get('AWS_REGION'),
 *     accessKeyId: config.get('AWS_ACCESS_KEY_ID'),
 *     secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY'),
 *     defaultAcl: 'public-read'
 *   })
 * })
 * ```
 */
@Port({
	token: OBJECT_STORAGE_PROVIDER,
	implementation: S3ObjectStorageService,
})
export class S3Adapter extends Adapter<S3Options> {
	// No additional code needed!
	// The decorators and base class handle everything:
	// - Token registration
	// - Implementation provider
	// - Export configuration
	// - Type safety
	/**
	 * Optional: Override imports() to add module dependencies.
	 *
	 * Uncomment this if your S3 service needs HttpModule or other modules:
	 */
	// protected override imports(options: S3Options): unknown[] {
	//   return [HttpModule];
	// }
	/**
	 * Optional: Override extraPoviders() to add helper services.
	 *
	 * Uncomment this if you need additional providers:
	 */
	// protected override extraPoviders(options: S3Options): Port[] {
	//   return [
	//     {
	//       provide: 'S3_CLIENT_FACTORY',
	//       useFactory: () => new S3Client({ region: options.region })
	//     }
	//   ];
	// }
}

export default S3Adapter

/**
 * What This Adapter Provides:
 *
 * When you call S3Adapter.register(options), you get an AdapterModule that:
 *
 * {
 *   module: S3Adapter,
 *   imports: [],
 *   providers: [
 *     S3ObjectStorageService,  // The implementation
 *     {
 *       provide: OBJECT_STORAGE_PROVIDER,  // The port token
 *       useExisting: S3ObjectStorageService  // Alias to implementation
 *     }
 *   ],
 *   exports: [OBJECT_STORAGE_PROVIDER],  // Export the token
 *   __provides: OBJECT_STORAGE_PROVIDER  // Compile-time type proof
 * }
 *
 * Any service that injects OBJECT_STORAGE_PROVIDER will receive an instance
 * of S3ObjectStorageService.
 */

/**
 * Alternative Adapters:
 *
 * You can easily create alternative implementations:
 *
 * - AzureBlobAdapter - Uses Azure Blob Storage
 * - GoogleCloudStorageAdapter - Uses GCS
 * - MinIOAdapter - Uses MinIO (self-hosted S3-compatible)
 * - FilesystemAdapter - Uses local filesystem (for development)
 *
 * All adapters implement the same ObjectStoragePort interface and
 * provide the same OBJECT_STORAGE_PROVIDER token, making them fully
 * interchangeable at the app module level.
 */
