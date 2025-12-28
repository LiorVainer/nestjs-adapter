/**
 * App Module Example (Synchronous Registration)
 *
 * This example demonstrates how to wire feature modules and adapters together
 * in a NestJS application using synchronous register() methods.
 *
 * Key Points:
 * - Import feature modules using .register()
 * - Pass adapter modules to feature modules
 * - Configuration is provided directly (not via DI)
 * - Suitable for simple, static configuration
 */

import { Module } from '@nestjs/common'
import HttpRatesAdapter from '../rates/adapters/http/http-rates.adapter'
import { CurrencyRatesModule } from '../rates/currency-rates.module'
import S3Adapter from '../storage/adapters/s3/s3.adapter'
import { ObjectStorageModule } from '../storage/object-storage.module'

/**
 * Main application module.
 *
 * This module demonstrates the Ports & Adapters pattern in action:
 * - Feature modules (ObjectStorageModule, CurrencyRatesModule) contain domain logic
 * - Adapters (S3Adapter, HttpRatesAdapter) provide infrastructure implementations
 * - The app module wires them together
 */
@Module({
	imports: [
		// Object Storage: Use S3 adapter
		ObjectStorageModule.register({
			adapter: S3Adapter.register({
				bucket: 'my-app-uploads',
				region: 'us-east-1',
				// In production, get these from environment variables or config service
				accessKeyId: process.env.AWS_ACCESS_KEY_ID,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
				defaultAcl: 'public-read',
			}),
		}),

		// Currency Rates: Use HTTP adapter
		CurrencyRatesModule.register({
			adapter: HttpRatesAdapter.register({
				apiUrl: 'https://api.exchangerate.host',
				// Optional: API key if required by your chosen API
				apiKey: process.env.RATES_API_KEY,
				timeoutMs: 5000,
				maxRetries: 3,
			}),
		}),
	],
	controllers: [],
	providers: [],
})
export class AppModule {}

/**
 * What Happens Here?
 *
 * 1. S3Adapter.register() creates an AdapterModule that:
 *    - Provides OBJECT_STORAGE_PROVIDER token
 *    - Uses S3ObjectStorageService as the implementation
 *
 * 2. ObjectStorageModule.register({ adapter }) creates a DynamicModule that:
 *    - Imports the S3 adapter module
 *    - Provides ObjectStorageService (which injects OBJECT_STORAGE_PROVIDER)
 *    - Exports ObjectStorageService for use in other modules
 *
 * 3. Same process for CurrencyRatesModule with HttpRatesAdapter
 *
 * 4. Other modules can now inject ObjectStorageService or CurrencyRatesService
 */

/**
 * Swapping Adapters Example:
 *
 * The beauty of this pattern is that you can easily swap adapters without
 * changing any domain code. For example:
 *
 * Development Environment (use local filesystem):
 * ```typescript
 * ObjectStorageModule.register({
 *   adapter: FilesystemAdapter.register({
 *     basePath: './uploads'
 *   })
 * })
 * ```
 *
 * Testing Environment (use in-memory mock):
 * ```typescript
 * ObjectStorageModule.register({
 *   adapter: MockStorageAdapter.register({})
 * })
 * ```
 *
 * Production Environment (use S3):
 * ```typescript
 * ObjectStorageModule.register({
 *   adapter: S3Adapter.register({ ... })
 * })
 * ```
 *
 * The domain code (ObjectStorageService) never changes - it only knows about
 * the ObjectStoragePort interface, not about S3, filesystem, or mocks.
 */

/**
 * Using Services in Controllers:
 *
 * ```typescript
 * import { Controller, Post, UploadedFile } from '@nestjs/common';
 * import { ObjectStorageService } from '../storage/object-storage.service';
 * import { CurrencyRatesService } from '../rates/currency-rates.service';
 *
 * @Controller('files')
 * export class FilesController {
 *   constructor(
 *     private readonly storage: ObjectStorageService,
 *     private readonly rates: CurrencyRatesService,
 *   ) {}
 *
 *   @Post('upload')
 *   async uploadFile(@UploadedFile() file: Express.Multer.File) {
 *     const result = await this.storage.uploadDocument(
 *       'invoice',
 *       'inv-123',
 *       file.originalname,
 *       file.buffer,
 *       file.mimetype
 *     );
 *
 *     return { key: result };
 *   }
 *
 *   @Get('price')
 *   async getPrice() {
 *     const priceUSD = 100;
 *     const priceEUR = await this.rates.convertPrice(priceUSD, 'USD', 'EUR');
 *
 *     return {
 *       usd: priceUSD,
 *       eur: priceEUR
 *     };
 *   }
 * }
 * ```
 */
