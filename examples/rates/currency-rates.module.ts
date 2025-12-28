/**
 * Currency Rates Port Module
 *
 * This port module provides currency exchange rate capabilities.
 * It extends PortModule to accept any adapter that provides CURRENCY_RATES_PROVIDER.
 */

import { Module } from '@nestjs/common'
import { PortModule } from '../../src'
import type { CurrencyRatesService } from './currency-rates.service'

/**
 * Port module for currency exchange rates.
 *
 * This module provides the CurrencyRatesService which contains domain logic
 * for currency conversions, pricing calculations, and rate management.
 *
 * Usage:
 * ```typescript
 * import { HttpRatesAdapter } from './adapters/http/http-rates.adapter';
 *
 * @Module({
 *   imports: [
 *     CurrencyRatesModule.register({
 *       adapter: HttpRatesAdapter.register({
 *         apiUrl: 'https://api.exchangerate.host',
 *         apiKey: 'your-api-key',
 *       })
 *     })
 *   ]
 * })
 * class AppModule {}
 * ```
 */
@Module({})
export class CurrencyRatesModule extends PortModule<
	typeof CurrencyRatesService
> {}

/**
 * Swapping Adapters Example:
 *
 * Development (use mock data):
 * ```typescript
 * CurrencyRatesModule.register({
 *   adapter: MockRatesAdapter.register({})
 * })
 * ```
 *
 * Production (use HTTP API):
 * ```typescript
 * CurrencyRatesModule.register({
 *   adapter: HttpRatesAdapter.register({
 *     apiUrl: process.env.RATES_API_URL,
 *     apiKey: process.env.RATES_API_KEY
 *   })
 * })
 * ```
 *
 * With caching layer:
 * ```typescript
 * CurrencyRatesModule.register({
 *   adapter: CachedRatesAdapter.register({
 *     ttlSeconds: 3600,
 *     fallbackApiUrl: process.env.RATES_API_URL
 *   })
 * })
 * ```
 *
 * All adapters implement CurrencyRatesPort and provide CURRENCY_RATES_PROVIDER,
 * so they're fully interchangeable!
 */
