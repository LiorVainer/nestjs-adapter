/**
 * HTTP Currency Rates Service
 *
 * This service implements the CurrencyRatesPort port using an HTTP API.
 * It demonstrates how to integrate with external RESTful services.
 */

import { Injectable } from '@nestjs/common'
import type {
	CurrencyRatesPort,
	ExchangeRate,
	RatesResponse,
} from '../../currency-rates.port'
import type { HttpRatesOptions } from './http-rates.types'

/**
 * HTTP implementation of the CurrencyRatesPort port.
 *
 * This service fetches real-time exchange rates from an HTTP API.
 * In a real implementation, you would use HttpService from @nestjs/axios.
 */
@Injectable()
export class HttpRatesService implements CurrencyRatesPort {
	private readonly apiUrl: string
	private readonly apiKey?: string
	private readonly timeoutMs: number
	private readonly maxRetries: number

	constructor(options: HttpRatesOptions) {
		this.apiUrl = options.apiUrl
		this.apiKey = options.apiKey
		this.timeoutMs = options.timeoutMs ?? 5000
		this.maxRetries = options.maxRetries ?? 3

		console.log(`HttpRatesService initialized: apiUrl=${this.apiUrl}`)
	}

	/**
	 * Get the exchange rate between two currencies.
	 */
	async getRate(from: string, to: string): Promise<ExchangeRate> {
		console.log(`HTTP: Getting rate ${from} -> ${to}`)

		// In a real implementation:
		// const response = await this.httpService.get(`${this.apiUrl}/convert`, {
		//   params: {
		//     from,
		//     to,
		//     amount: 1,
		//     access_key: this.apiKey
		//   },
		//   timeout: this.timeoutMs
		// }).toPromise();
		//
		// return {
		//   from,
		//   to,
		//   rate: response.data.result,
		//   timestamp: new Date(response.data.date)
		// };

		// Simulate API call
		await this.simulateDelay(100)

		// Mock exchange rates (EUR/USD ~ 0.85, GBP/USD ~ 0.73, etc.)
		const mockRates: Record<string, Record<string, number>> = {
			USD: { EUR: 0.85, GBP: 0.73, JPY: 110.5, CAD: 1.25 },
			EUR: { USD: 1.18, GBP: 0.86, JPY: 130.0, CAD: 1.47 },
			GBP: { USD: 1.37, EUR: 1.16, JPY: 151.0, CAD: 1.71 },
		}

		const rate = mockRates[from]?.[to] ?? 1 / (mockRates[to]?.[from] ?? 1)

		return {
			from,
			to,
			rate,
			timestamp: new Date(),
		}
	}

	/**
	 * Get all exchange rates for a base currency.
	 */
	async getRates(base: string): Promise<RatesResponse> {
		console.log(`HTTP: Getting all rates for ${base}`)

		// In a real implementation:
		// const response = await this.httpService.get(`${this.apiUrl}/latest`, {
		//   params: {
		//     base,
		//     access_key: this.apiKey
		//   },
		//   timeout: this.timeoutMs
		// }).toPromise();
		//
		// return {
		//   base,
		//   rates: response.data.rates,
		//   timestamp: new Date(response.data.date)
		// };

		// Simulate API call
		await this.simulateDelay(150)

		// Mock all rates
		const mockRates: Record<string, Record<string, number>> = {
			USD: { EUR: 0.85, GBP: 0.73, JPY: 110.5, CAD: 1.25, CHF: 0.92 },
			EUR: { USD: 1.18, GBP: 0.86, JPY: 130.0, CAD: 1.47, CHF: 1.08 },
			GBP: { USD: 1.37, EUR: 1.16, JPY: 151.0, CAD: 1.71, CHF: 1.26 },
		}

		return {
			base,
			rates: mockRates[base] ?? {},
			timestamp: new Date(),
		}
	}

	/**
	 * Convert an amount from one currency to another.
	 */
	async convert(amount: number, from: string, to: string): Promise<number> {
		console.log(`HTTP: Converting ${amount} ${from} -> ${to}`)

		if (from === to) {
			return amount
		}

		const { rate } = await this.getRate(from, to)
		return amount * rate
	}

	/**
	 * Get supported currency codes.
	 */
	async getSupportedCurrencies(): Promise<string[]> {
		console.log('HTTP: Getting supported currencies')

		// In a real implementation:
		// const response = await this.httpService.get(`${this.apiUrl}/symbols`, {
		//   params: { access_key: this.apiKey },
		//   timeout: this.timeoutMs
		// }).toPromise();
		//
		// return Object.keys(response.data.symbols);

		// Simulate API call
		await this.simulateDelay(80)

		return ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'AUD', 'NZD']
	}

	/**
	 * Simulate network delay for demo purposes.
	 */
	private async simulateDelay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}
}

/**
 * Real-World Implementation Notes:
 *
 * 1. **HTTP Module**: Import HttpModule and inject HttpService:
 *    ```typescript
 *    import { HttpService } from '@nestjs/axios';
 *    import { firstValueFrom } from 'rxjs';
 *
 *    constructor(
 *      private readonly httpService: HttpService,
 *      options: HttpRatesOptions
 *    ) {}
 *
 *    async getRate(from: string, to: string) {
 *      const response = await firstValueFrom(
 *        this.httpService.get(`${this.apiUrl}/latest`, {
 *          params: { base: from, symbols: to }
 *        })
 *      );
 *      return { ... };
 *    }
 *    ```
 *
 * 2. **Error Handling**: Wrap HTTP calls in try-catch and handle common errors:
 *    - Network timeouts
 *    - API rate limits
 *    - Invalid currency codes
 *    - API service downtime
 *
 * 3. **Retries**: Implement exponential backoff for transient failures
 *
 * 4. **Caching**: Cache rates for a few minutes to reduce API calls:
 *    ```typescript
 *    @Injectable()
 *    class CachedHttpRatesService {
 *      private cache = new Map<string, { data: ExchangeRate, expiresAt: number }>();
 *
 *      async getRate(from: string, to: string) {
 *        const cacheKey = `${from}-${to}`;
 *        const cached = this.cache.get(cacheKey);
 *
 *        if (cached && Date.now() < cached.expiresAt) {
 *          return cached.data;
 *        }
 *
 *        const rate = await this.fetchFromApi(from, to);
 *        this.cache.set(cacheKey, {
 *          data: rate,
 *          expiresAt: Date.now() + 5 * 60 * 1000  // 5 minutes
 *        });
 *
 *        return rate;
 *      }
 *    }
 *    ```
 *
 * 5. **Popular APIs**:
 *    - exchangerate.host (free, no API key)
 *    - exchangeratesapi.io (requires API key)
 *    - openexchangerates.org (requires API key)
 *    - fixer.io (requires API key)
 */
