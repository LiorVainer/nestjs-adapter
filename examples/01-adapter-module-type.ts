/**
 * Example 01: Understanding AdapterModule<TToken>
 *
 * This example demonstrates the AdapterModule<TToken> type, which is the core
 * type-safety mechanism in nest-hex. It carries compile-time proof that
 * an adapter provides a specific token.
 *
 * Key Points:
 * - AdapterModule<TToken> extends DynamicModule with a __provides field
 * - The __provides field exists only for TypeScript structural typing
 * - This enables compile-time verification without runtime overhead
 * - Feature modules can require adapters with specific tokens
 */

import type { AdapterModule } from '../src/core/types'

// Example: Define a port token for object storage
const OBJECT_STORAGE_PROVIDER = Symbol('OBJECT_STORAGE_PROVIDER')

// Example: An adapter module that provides OBJECT_STORAGE_PROVIDER
const s3AdapterModule: AdapterModule<typeof OBJECT_STORAGE_PROVIDER> = {
	module: class S3Adapter {},
	imports: [],
	providers: [
		// The implementation class
		class S3Service {},
		// Token alias pointing to implementation
		{
			provide: OBJECT_STORAGE_PROVIDER,
			useExisting: class S3Service {},
		},
	],
	exports: [OBJECT_STORAGE_PROVIDER],
	// Compile-time proof this adapter provides OBJECT_STORAGE_PROVIDER
	__provides: OBJECT_STORAGE_PROVIDER,
}

// Example: Type safety in action
function acceptsStorageAdapter(
	adapter: AdapterModule<typeof OBJECT_STORAGE_PROVIDER>,
): void {
	console.log('Received adapter providing OBJECT_STORAGE_PROVIDER:', adapter)
}

// ✅ Type-safe: s3AdapterModule provides the correct token
acceptsStorageAdapter(s3AdapterModule)

// Example: Different token for a different port
const CURRENCY_RATES_PROVIDER = Symbol('CURRENCY_RATES_PROVIDER')

const _httpRatesModule: AdapterModule<typeof CURRENCY_RATES_PROVIDER> = {
	module: class HttpRatesAdapter {},
	imports: [],
	providers: [
		class HttpRatesService {},
		{
			provide: CURRENCY_RATES_PROVIDER,
			useExisting: class HttpRatesService {},
		},
	],
	exports: [CURRENCY_RATES_PROVIDER],
	__provides: CURRENCY_RATES_PROVIDER,
}

// ❌ Type error: httpRatesModule provides CURRENCY_RATES_PROVIDER, not OBJECT_STORAGE_PROVIDER
// Uncommenting the line below will cause a TypeScript error:
// acceptsStorageAdapter(httpRatesModule);

/**
 * Why This Matters:
 *
 * Without AdapterModule<TToken>, you could accidentally pass the wrong adapter
 * to a feature module. For example:
 *
 * FileModule.register({ adapter: httpRatesModule })  // Wrong adapter!
 *
 * With AdapterModule<TToken>, TypeScript catches this at compile time:
 *
 * FileModule.register({ adapter: httpRatesModule })
 *                                  ^^^^^^^^^^^^^^^^
 * Type 'AdapterModule<typeof CURRENCY_RATES_PROVIDER>' is not assignable to
 * type 'AdapterModule<typeof OBJECT_STORAGE_PROVIDER>'
 */
