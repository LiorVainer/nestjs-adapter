/**
 * Currency Rates Domain Service
 *
 * This service contains domain logic for currency operations.
 * It depends on the CurrencyRatesPort port, not on any specific adapter.
 */

import { Injectable } from '@nestjs/common'
import { InjectPort } from '../../src'
import type { CurrencyRatesPort, ExchangeRate } from './currency-rates.port'
import { CURRENCY_RATES_PROVIDER } from './currency-rates.token'

/**
 * Invoice line item for multi-currency calculations.
 */
export interface InvoiceLineItem {
	description: string
	amount: number
	currency: string
}

/**
 * Domain service for currency operations.
 *
 * This service provides business logic for currency conversions,
 * pricing calculations, and exchange rate management.
 */
@Injectable()
export class CurrencyRatesService {
	private readonly ratesPort: CurrencyRatesPort

	constructor(
		@InjectPort(CURRENCY_RATES_PROVIDER)
		ratesPort: CurrencyRatesPort,
	) {
		this.ratesPort = ratesPort
	}

	/**
	 * Convert a price from one currency to another.
	 *
	 * Domain logic: Rounds to 2 decimal places for display.
	 *
	 * @param price - Price in source currency
	 * @param from - Source currency code
	 * @param to - Target currency code
	 * @returns Converted price, rounded to 2 decimals
	 */
	async convertPrice(price: number, from: string, to: string): Promise<number> {
		if (from === to) {
			return price
		}

		const converted = await this.ratesPort.convert(price, from, to)

		// Domain rule: Always round currency to 2 decimals
		return Math.round(converted * 100) / 100
	}

	/**
	 * Calculate the total of an invoice in a target currency.
	 *
	 * Domain logic: Handles multi-currency line items.
	 *
	 * @param lineItems - Invoice line items in various currencies
	 * @param targetCurrency - Currency to total in
	 * @returns Total amount in target currency
	 */
	async calculateInvoiceTotal(
		lineItems: InvoiceLineItem[],
		targetCurrency: string,
	): Promise<number> {
		let total = 0

		for (const item of lineItems) {
			const convertedAmount = await this.convertPrice(
				item.amount,
				item.currency,
				targetCurrency,
			)
			total += convertedAmount
		}

		// Round final total to 2 decimals
		return Math.round(total * 100) / 100
	}

	/**
	 * Get the current exchange rate with metadata.
	 *
	 * @param from - Source currency
	 * @param to - Target currency
	 * @returns Exchange rate information
	 */
	async getExchangeRate(from: string, to: string): Promise<ExchangeRate> {
		return this.ratesPort.getRate(from, to)
	}

	/**
	 * Compare prices across currencies to find the best deal.
	 *
	 * Domain logic: Converts all prices to a common currency for comparison.
	 *
	 * @param offers - Array of [price, currency] tuples
	 * @param comparisonCurrency - Currency to compare in (default: 'USD')
	 * @returns Index of the best (lowest) offer
	 */
	async findBestPrice(
		offers: Array<{ price: number; currency: string }>,
		comparisonCurrency = 'USD',
	): Promise<{ index: number; convertedPrice: number }> {
		if (offers.length === 0) {
			throw new Error('No offers provided')
		}

		let bestIndex = 0
		let bestPrice = Number.POSITIVE_INFINITY

		for (let i = 0; i < offers.length; i++) {
			const offer = offers[i]
			if (!offer) {
				continue
			}

			const converted = await this.convertPrice(
				offer.price,
				offer.currency,
				comparisonCurrency,
			)

			if (converted < bestPrice) {
				bestPrice = converted
				bestIndex = i
			}
		}

		return {
			index: bestIndex,
			convertedPrice: bestPrice,
		}
	}

	/**
	 * Format a price with currency symbol.
	 *
	 * Domain logic: Uses basic currency formatting.
	 *
	 * @param amount - Amount to format
	 * @param currency - Currency code
	 * @returns Formatted price string
	 */
	formatPrice(amount: number, currency: string): string {
		const symbols: Record<string, string> = {
			USD: '$',
			EUR: '€',
			GBP: '£',
			JPY: '¥',
		}

		const symbol = symbols[currency] ?? currency
		const formatted = amount.toFixed(2)

		return `${symbol}${formatted}`
	}

	/**
	 * Validate if a currency code is supported.
	 *
	 * @param currency - Currency code to validate
	 * @returns true if supported, false otherwise
	 */
	async isCurrencySupported(currency: string): Promise<boolean> {
		const supported = await this.ratesPort.getSupportedCurrencies()
		return supported.includes(currency.toUpperCase())
	}

	/**
	 * Get all supported currencies.
	 *
	 * @returns Array of currency codes
	 */
	async getSupportedCurrencies(): Promise<string[]> {
		return this.ratesPort.getSupportedCurrencies()
	}
}

/**
 * Why This Design?
 *
 * 1. **Business Logic Focus**: Contains domain-specific logic (rounding,
 *    multi-currency totals, formatting) separate from infrastructure.
 *
 * 2. **Adapter Independence**: Works with any rates provider (HTTP API,
 *    database cache, mock service) without code changes.
 *
 * 3. **Testability**: Easy to test with mock CurrencyRatesPort.
 *
 * Example Test:
 * ```typescript
 * const mockPort: CurrencyRatesPort = {
 *   convert: jest.fn().mockResolvedValue(85.5),
 *   getRate: jest.fn(),
 *   getRates: jest.fn(),
 *   getSupportedCurrencies: jest.fn()
 * };
 *
 * const service = new CurrencyRatesService(mockPort);
 * const result = await service.convertPrice(100, 'USD', 'EUR');
 *
 * expect(result).toBe(85.5);
 * expect(mockPort.convert).toHaveBeenCalledWith(100, 'USD', 'EUR');
 * ```
 */
