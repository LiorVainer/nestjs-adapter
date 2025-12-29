/**
 * HTTP Currency Rates Adapter
 *
 * This adapter provides currency exchange rates using an HTTP API.
 * It demonstrates the decorator-driven API with optional custom hooks.
 */

import type { Provider } from '@nestjs/common'
import { Adapter, Port } from '../../../../src'
import { CURRENCY_RATES_PROVIDER } from '../../currency-rates.token'
import { HttpRatesService } from './http-rates.service'
import type { HttpRatesOptions } from './http-rates.types'

/**
 * HTTP adapter for currency exchange rates.
 *
 * This adapter fetches real-time rates from an HTTP API.
 *
 * Usage Example (Synchronous):
 * ```typescript
 * HttpRatesAdapter.register({
 *   apiUrl: 'https://api.exchangerate.host',
 *   apiKey: process.env.RATES_API_KEY,  // Optional
 *   timeoutMs: 5000,
 *   maxRetries: 3
 * })
 * ```
 *
 * Usage Example (Asynchronous with DI):
 * ```typescript
 * HttpRatesAdapter.registerAsync({
 *   imports: [ConfigModule],
 *   inject: [ConfigService],
 *   useFactory: (config: ConfigService) => ({
 *     apiUrl: config.get('RATES_API_URL'),
 *     apiKey: config.get('RATES_API_KEY'),
 *     timeoutMs: 5000
 *   })
 * })
 * ```
 */
@Port({
	token: CURRENCY_RATES_PROVIDER,
	implementation: HttpRatesService,
})
class HttpRatesAdapter extends Adapter<HttpRatesOptions> {
	/**
	 * Optional: Override imports() to add HttpModule dependency.
	 *
	 * In a real implementation, you would import HttpModule here:
	 */
	protected override imports(_options: HttpRatesOptions): unknown[] {
		// Example: Import HttpModule for making HTTP requests
		// return [HttpModule];

		// For this demo, we're not actually making HTTP requests
		return []
	}

	/**
	 * Optional: Override extraPoviders() to add helper providers.
	 *
	 * Example: Add a logger or retry handler:
	 */
	protected override extraPoviders(_options: HttpRatesOptions): Provider[] {
		// Example: Add a custom HTTP client with retry logic
		// return [
		//   {
		//     provide: 'HTTP_RETRY_HANDLER',
		//     useFactory: () => new RetryHandler(options.maxRetries)
		//   }
		// ];

		return []
	}
}

export default HttpRatesAdapter

/**
 * What This Adapter Provides:
 *
 * When you call HttpRatesAdapter.register(options), you get:
 *
 * {
 *   module: HttpRatesAdapter,
 *   imports: [HttpModule],  // If imports() is overridden
 *   providers: [
 *     HttpRatesService,  // The HTTP-based implementation
 *     {
 *       provide: CURRENCY_RATES_PROVIDER,
 *       useExisting: HttpRatesService
 *     }
 *   ],
 *   exports: [CURRENCY_RATES_PROVIDER],
 *   __provides: CURRENCY_RATES_PROVIDER
 * }
 */

/**
 * Alternative Implementations:
 *
 * You can create other adapters for different use cases:
 *
 * 1. **MockRatesAdapter** - Fixed mock rates for testing
 * 2. **DatabaseRatesAdapter** - Fetch rates from database cache
 * 3. **CompositeRatesAdapter** - Combine multiple sources with fallback
 * 4. **WebSocketRatesAdapter** - Real-time streaming rates
 *
 * All implement CurrencyRatesPort and provide CURRENCY_RATES_PROVIDER,
 * making them fully interchangeable!
 */

/**
 * Production Configuration Example:
 *
 * ```typescript
 * // config/app.config.ts
 * export default () => ({
 *   rates: {
 *     apiUrl: process.env.RATES_API_URL || 'https://api.exchangerate.host',
 *     apiKey: process.env.RATES_API_KEY,
 *     timeoutMs: parseInt(process.env.RATES_TIMEOUT_MS || '5000'),
 *     maxRetries: parseInt(process.env.RATES_MAX_RETRIES || '3')
 *   }
 * });
 *
 * // app.module.ts
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({
 *       load: [appConfig]
 *     }),
 *     CurrencyRatesModule.register({
 *       adapter: HttpRatesAdapter.registerAsync({
 *         imports: [ConfigModule],
 *         inject: [ConfigService],
 *         useFactory: (config: ConfigService) => config.get('rates')
 *       })
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
