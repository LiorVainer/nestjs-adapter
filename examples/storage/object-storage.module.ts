/**
 * Object Storage Port Module
 *
 * This port module provides object storage capabilities to the application.
 * It extends PortModule to accept any adapter that provides OBJECT_STORAGE_PROVIDER.
 *
 * Key Points:
 * - Extends PortModule<typeof ObjectStorageService>
 * - Uses register({ adapter }) to accept an adapter module
 * - Type-safe: only accepts adapters providing OBJECT_STORAGE_PROVIDER
 */

import { Module } from '@nestjs/common'
import { PortModule } from '../../src'
import type { ObjectStorageService } from './object-storage.service'

/**
 * Port module for object storage.
 *
 * This module provides the ObjectStorageService which contains domain logic
 * for managing file uploads, downloads, and organization.
 *
 * Usage:
 * ```typescript
 * import { S3Adapter } from './adapters/s3/s3.adapter';
 *
 * @Module({
 *   imports: [
 *     ObjectStorageModule.register({
 *       adapter: S3Adapter.register({
 *         bucket: 'my-bucket',
 *         region: 'us-east-1',
 *       })
 *     })
 *   ]
 * })
 * class AppModule {}
 * ```
 */
@Module({})
export class ObjectStorageModule extends PortModule<
	typeof ObjectStorageService
> {}

/**
 * What Happens When You Call ObjectStorageModule.register({ adapter })?
 *
 * 1. TypeScript verifies that `adapter` is an AdapterModule<typeof OBJECT_STORAGE_PROVIDER>
 *
 * 2. FeatureModule.register() creates a DynamicModule:
 *    {
 *      module: ObjectStorageModule,
 *      imports: [adapter],  // The S3/Azure/GCS/etc adapter module
 *      providers: [ObjectStorageService],
 *      exports: [ObjectStorageService]
 *    }
 *
 * 3. NestJS wires everything together:
 *    - The adapter module provides OBJECT_STORAGE_PROVIDER token
 *    - ObjectStorageService injects OBJECT_STORAGE_PROVIDER via @InjectPort
 *    - The service receives the adapter's implementation
 *
 * Result: ObjectStorageService works with any compatible adapter!
 */

/**
 * Benefits of This Pattern:
 *
 * 1. **Swappable Infrastructure**: Change from S3 to Azure Blob Storage by
 *    swapping the adapter at the app module level. No changes to this module.
 *
 * 2. **Type Safety**: TypeScript ensures you pass an adapter that provides
 *    OBJECT_STORAGE_PROVIDER, not some incompatible adapter.
 *
 * 3. **Testability**: In tests, pass a mock adapter instead of the real S3 adapter.
 *
 * 4. **Separation of Concerns**:
 *    - This module: Domain logic (file validation, naming, stats)
 *    - Adapter: Infrastructure details (S3 API calls, credentials, retries)
 *
 * Example Usage in Tests:
 *
 * ```typescript
 * @Port({
 *   token: OBJECT_STORAGE_PROVIDER,
 *   implementation: MockObjectStorageService
 * })
 * class MockAdapterClass extends Adapter<{}> {}
 *
 * const mockAdapter = defineAdapter<typeof OBJECT_STORAGE_PROVIDER, {}>()(
 *   MockAdapterClass
 * );
 *
 * const module = await Test.createTestingModule({
 *   imports: [
 *     ObjectStorageModule.register({
 *       adapter: mockAdapter.register({})
 *     })
 *   ]
 * }).compile();
 *
 * const service = module.get(ObjectStorageService);
 * // service now uses MockObjectStorageService
 * ```
 */
