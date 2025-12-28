/**
 * Currency Rates Port Interface
 *
 * This file defines the port interface for fetching currency exchange rates.
 * This is domain-focused and independent of how rates are actually fetched.
 */

/**
 * Currency exchange rate information.
 */
export interface ExchangeRate {
	/**
	 * Base currency code (e.g., 'USD')
	 */
	from: string

	/**
	 * Target currency code (e.g., 'EUR')
	 */
	to: string

	/**
	 * Exchange rate (e.g., 0.85 means 1 USD = 0.85 EUR)
	 */
	rate: number

	/**
	 * When this rate was last updated
	 */
	timestamp: Date
}

/**
 * Multiple exchange rates for a base currency.
 */
export interface RatesResponse {
	/**
	 * Base currency code
	 */
	base: string

	/**
	 * Exchange rates to other currencies
	 * Key: currency code, Value: exchange rate
	 */
	rates: Record<string, number>

	/**
	 * When these rates were last updated
	 */
	timestamp: Date
}

/**
 * Port interface for currency exchange rates.
 *
 * This interface defines what the domain needs for currency operations,
 * without specifying how rates are obtained (HTTP API, database, cache, etc.)
 */
export interface CurrencyRatesPort {
	/**
	 * Get the exchange rate between two currencies.
	 *
	 * @param from - Source currency code (e.g., 'USD')
	 * @param to - Target currency code (e.g., 'EUR')
	 * @returns Exchange rate information
	 * @throws Error if currencies are invalid or rates unavailable
	 */
	getRate(from: string, to: string): Promise<ExchangeRate>

	/**
	 * Get all exchange rates for a base currency.
	 *
	 * @param base - Base currency code (e.g., 'USD')
	 * @returns Rates to all available currencies
	 */
	getRates(base: string): Promise<RatesResponse>

	/**
	 * Convert an amount from one currency to another.
	 *
	 * @param amount - Amount in source currency
	 * @param from - Source currency code
	 * @param to - Target currency code
	 * @returns Converted amount in target currency
	 */
	convert(amount: number, from: string, to: string): Promise<number>

	/**
	 * Get a list of supported currency codes.
	 *
	 * @returns Array of currency codes (e.g., ['USD', 'EUR', 'GBP'])
	 */
	getSupportedCurrencies(): Promise<string[]>
}
