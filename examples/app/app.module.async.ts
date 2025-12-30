/**
 * App Module Example (Asynchronous Registration with DI)
 *
 * This example demonstrates how to wire feature modules and adapters together
 * using asynchronous registerAsync() methods with dependency injection.
 *
 * Key Points:
 * - Use registerAsync() for configuration via DI
 * - Inject ConfigService or other providers
 * - Factory functions receive injected dependencies
 * - Suitable for dynamic, environment-based configuration
 */

import type { DynamicModule } from '@nestjs/common'
import { Module } from '@nestjs/common'
import HttpRatesAdapter from '../rates/adapters/http/http-rates.adapter'
import { CurrencyRatesModule } from '../rates/currency-rates.module'
import S3Adapter from '../storage/adapters/s3/s3.adapter'
import { ObjectStorageModule } from '../storage/object-storage.module'

/**
 * Mock ConfigModule and ConfigService for demonstration.
 * In a real app, these come from @nestjs/config package.
 */
class ConfigModule {
	static forRoot(options: unknown): DynamicModule {
		return {
			module: ConfigModule,
			global: true,
			providers: [
				{
					provide: ConfigService,
					useValue: new ConfigService(options),
				},
			],
			exports: [ConfigService],
		}
	}
}

class ConfigService<T = unknown, K extends boolean = false> {
	constructor(private readonly options: unknown) {}

	get<P extends keyof T>(
		path: P,
		_options?: { infer: K },
	): K extends true ? T[P] : T[P] | undefined {
		// Simplified mock implementation
		return (this.options as Record<string, unknown>)[
			path as string
		] as K extends true ? T[P] : T[P] | undefined
	}
}

/**
 * Configuration type for type-safe config access.
 */
interface AppConfig {
	s3: {
		bucket: string
		region: string
		accessKeyId: string
		secretAccessKey: string
		defaultAcl: 'private' | 'public-read'
	}
	rates: {
		apiUrl: string
		apiKey?: string
		timeoutMs: number
		maxRetries: number
	}
}

/**
 * Configuration factory.
 *
 * In a real app, this would read from environment variables:
 */
const configFactory = (): AppConfig => ({
	s3: {
		bucket: process.env.S3_BUCKET ?? 'my-app-uploads',
		region: process.env.AWS_REGION ?? 'us-east-1',
		accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
		defaultAcl:
			(process.env.S3_DEFAULT_ACL as 'private' | 'public-read') ?? 'private',
	},
	rates: {
		apiUrl: process.env.RATES_API_URL ?? 'https://api.exchangerate.host',
		apiKey: process.env.RATES_API_KEY,
		timeoutMs: Number.parseInt(process.env.RATES_TIMEOUT_MS ?? '5000', 10),
		maxRetries: Number.parseInt(process.env.RATES_MAX_RETRIES ?? '3', 10),
	},
})

/**
 * Main application module with async configuration.
 */
@Module({
	imports: [
		// Load configuration
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configFactory],
		}),

		// Object Storage: Use S3 adapter with async config
		ObjectStorageModule.register({
			adapter: S3Adapter.registerAsync({
				// Import modules needed by the factory
				imports: [ConfigModule],
				// Inject dependencies
				inject: [ConfigService],
				// Factory function: receives injected ConfigService
				useFactory: (...args: unknown[]) => {
					// Cast to the expected type
					const config = args[0] as ConfigService<AppConfig, true>
					const s3Config = config.get('s3', { infer: true })

					// You can add logging, validation, or transformations here
					console.log(`Configuring S3 adapter: bucket=${s3Config.bucket}`)

					return {
						bucket: s3Config.bucket,
						region: s3Config.region,
						accessKeyId: s3Config.accessKeyId,
						secretAccessKey: s3Config.secretAccessKey,
						defaultAcl: s3Config.defaultAcl,
					}
				},
			}),
		}),

		// Currency Rates: Use HTTP adapter with async config
		CurrencyRatesModule.register({
			adapter: HttpRatesAdapter.registerAsync({
				imports: [ConfigModule],
				inject: [ConfigService],
				useFactory: (...args: unknown[]) => {
					// Cast to the expected type
					const config = args[0] as ConfigService<AppConfig, true>
					const ratesConfig = config.get('rates', { infer: true })

					console.log(
						`Configuring HTTP rates adapter: apiUrl=${ratesConfig.apiUrl}`,
					)

					return {
						apiUrl: ratesConfig.apiUrl,
						apiKey: ratesConfig.apiKey,
						timeoutMs: ratesConfig.timeoutMs,
						maxRetries: ratesConfig.maxRetries,
					}
				},
			}),
		}),
	],
	controllers: [],
	providers: [],
})
export class AppModuleAsync {}

/**
 * Why Use registerAsync()?
 *
 * Benefits:
 * 1. **Dependency Injection**: Access ConfigService, database, or any provider
 * 2. **Validation**: Validate configuration before creating adapters
 * 3. **Dynamic Config**: Load config from database, remote service, etc.
 * 4. **Type Safety**: TypeScript infers config types when using ConfigService
 * 5. **Testability**: Easy to mock ConfigService in tests
 *
 * Use Cases:
 * - Configuration from environment variables
 * - Configuration from database
 * - Configuration from remote config service (e.g., AWS SSM, Consul)
 * - Multi-tenant apps (different config per tenant)
 * - Feature flags (enable/disable adapters based on flags)
 */

/**
 * Advanced Example: Conditional Adapter Selection
 *
 * You can use the factory to choose different adapters based on environment:
 *
 * ```typescript
 * ObjectStorageModule.register({
 *   adapter: await (async () => {
 *     const config = app.get(ConfigService);
 *     const env = config.get('NODE_ENV');
 *
 *     if (env === 'development') {
 *       return FilesystemAdapter.register({ basePath: './uploads' });
 *     }
 *
 *     if (env === 'test') {
 *       return MockStorageAdapter.register({});
 *     }
 *
 *     return S3Adapter.registerAsync({
 *       imports: [ConfigModule],
 *       inject: [ConfigService],
 *       useFactory: (config) => config.get('s3')
 *     });
 *   })()
 * })
 * ```
 */

/**
 * Example: Multi-Tenant Configuration
 *
 * For multi-tenant apps, you can configure different S3 buckets per tenant:
 *
 * ```typescript
 * interface TenantConfig {
 *   tenantId: string;
 *   s3Bucket: string;
 *   s3Region: string;
 * }
 *
 * @Injectable()
 * class TenantConfigService {
 *   async getConfig(tenantId: string): Promise<TenantConfig> {
 *     // Fetch from database
 *     return db.tenantConfig.findOne({ tenantId });
 *   }
 * }
 *
 * // In your module:
 * S3Adapter.registerAsync({
 *   imports: [TenantModule],
 *   inject: [TenantConfigService, REQUEST],
 *   scope: Scope.REQUEST,  // Create new instance per request
 *   useFactory: async (tenantService, request) => {
 *     const tenantId = request.headers['x-tenant-id'];
 *     const config = await tenantService.getConfig(tenantId);
 *
 *     return {
 *       bucket: config.s3Bucket,
 *       region: config.s3Region,
 *       // ... other options
 *     };
 *   }
 * })
 * ```
 */

/**
 * Example: Configuration Validation
 *
 * You can validate configuration in the factory before creating the adapter:
 *
 * ```typescript
 * import { z } from 'zod';
 *
 * const S3ConfigSchema = z.object({
 *   bucket: z.string().min(1),
 *   region: z.string().regex(/^[a-z]{2}-[a-z]+-\d$/),
 *   accessKeyId: z.string().min(1),
 *   secretAccessKey: z.string().min(1)
 * });
 *
 * S3Adapter.registerAsync({
 *   imports: [ConfigModule],
 *   inject: [ConfigService],
 *   useFactory: (config: ConfigService) => {
 *     const rawConfig = config.get('s3');
 *
 *     // Validate config
 *     const validatedConfig = S3ConfigSchema.parse(rawConfig);
 *
 *     return validatedConfig;
 *   }
 * })
 * ```
 */
