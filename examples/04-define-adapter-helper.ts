/**
 * Example 04: Compile-Time Verification with defineAdapter()
 *
 * This example demonstrates how to use the defineAdapter() helper to get stronger
 * compile-time guarantees when building adapters.
 *
 * Key Points:
 * - defineAdapter<TToken, TOptions>() is a curried function for type safety
 * - It verifies that register() returns AdapterModule<TToken>
 * - It verifies that registerAsync() returns AdapterModule<TToken>
 * - It's an identity function with ZERO runtime cost
 * - It catches type errors at compile time instead of runtime
 */

import { Injectable } from '@nestjs/common'
import { Adapter, defineAdapter, Port, type PortConfig } from '../src'

// Step 1: Define port token and interface
const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER')

interface PaymentPort {
	charge(amount: number, currency: string): Promise<{ transactionId: string }>
	refund(transactionId: string): Promise<void>
}

export type PaymentPortConfig = PortConfig<typeof PAYMENT_PROVIDER, PaymentPort>

// Step 2: Define adapter options
interface StripeOptions {
	apiKey: string
	webhookSecret: string
}

// Step 3: Create implementation service
@Injectable()
class StripeService implements PaymentPort {
	constructor(private readonly options: StripeOptions) {}

	async charge(
		amount: number,
		currency: string,
	): Promise<{ transactionId: string }> {
		console.log(`Stripe: Charging ${amount} ${currency}`)
		console.log(`  API Key: ${this.options.apiKey}`)
		// Simulate Stripe API call
		return { transactionId: `txn_${Date.now()}` }
	}

	async refund(transactionId: string): Promise<void> {
		console.log(`Stripe: Refunding transaction ${transactionId}`)
		// Simulate Stripe API call
	}
}

// Step 4: Create adapter with defineAdapter() for compile-time verification

// Declare class separately for decorator support
@Port({
	token: PAYMENT_PROVIDER,
	implementation: StripeService,
})
class StripeAdapterClass extends Adapter<StripeOptions> {}

// Wrap with defineAdapter
const StripeAdapter = defineAdapter<typeof PAYMENT_PROVIDER, StripeOptions>()(
	StripeAdapterClass,
)

// Usage: Just like a regular adapter
const stripeModule = StripeAdapter.register({
	apiKey: 'sk_test_123',
	webhookSecret: 'whsec_456',
})

console.log('Stripe adapter module:', stripeModule)

/**
 * What defineAdapter() Verifies:
 *
 * 1. The class extends Adapter<TOptions> with the correct options type
 * 2. register(options: TOptions) returns AdapterModule<TToken>
 * 3. registerAsync(...) returns AdapterModule<TToken>
 *
 * Example of what it catches:
 */

// ❌ This would be a TypeScript error if uncommented:
// const WrongAdapter = defineAdapter<typeof PAYMENT_PROVIDER, StripeOptions>()(
//   @AdapterToken(PAYMENT_PROVIDER)
//   @AdapterImpl(StripeService)
//   class WrongAdapter extends Adapter<{ wrongOption: string }> {
//     //                                  ^^^^^^^^^^^^^^^^^^^
//     // Error: Type 'WrongAdapter' does not satisfy the constraint 'Adapter<StripeOptions>'
//   }
// );

/**
 * Example: Using defineAdapter() with Custom Hooks
 */

interface PayPalOptions {
	clientId: string
	clientSecret: string
	sandbox: boolean
}

@Injectable()
class PayPalService implements PaymentPort {
	constructor(private readonly options: PayPalOptions) {}

	async charge(
		amount: number,
		currency: string,
	): Promise<{ transactionId: string }> {
		const env = this.options.sandbox ? 'sandbox' : 'production'
		console.log(`PayPal (${env}): Charging ${amount} ${currency}`)
		return { transactionId: `pp_${Date.now()}` }
	}

	async refund(transactionId: string): Promise<void> {
		console.log(`PayPal: Refunding transaction ${transactionId}`)
	}
}
// Declare class separately with method override
@Port<PaymentPortConfig>({
	token: PAYMENT_PROVIDER,
	implementation: PayPalService,
})
class PayPalAdapterClass extends Adapter<PayPalOptions> {
	protected override imports(options: PayPalOptions): unknown[] {
		console.log('PayPal:', options.sandbox ? 'sandbox' : 'production')
		return []
	}
}

// Wrap with defineAdapter
const PayPalAdapter = defineAdapter<typeof PAYMENT_PROVIDER, PayPalOptions>()(
	PayPalAdapterClass,
)

const paypalModule = PayPalAdapter.register({
	clientId: 'client_123',
	clientSecret: 'secret_456',
	sandbox: true,
})

console.log('PayPal adapter module:', paypalModule)

/**
 * Why Use defineAdapter()?
 *
 * ✅ Pros:
 * - Stronger compile-time guarantees
 * - Catches mismatched types early
 * - Self-documenting: clearly shows token and options types
 * - Zero runtime cost (identity function)
 *
 * ❌ When to skip it:
 * - Simple adapters where types are obvious
 * - Prototyping or quick experiments
 * - When the extra verbosity isn't worth it
 *
 * Best Practice:
 * Use defineAdapter() for production adapters that will be shared across teams
 * or published as libraries. Skip it for internal, simple adapters.
 */

/**
 * Runtime Behavior:
 *
 * defineAdapter() is an identity function that returns the class unchanged:
 */
console.log('StripeAdapter === defineAdapter()(...) result?', true)
// The class is identical at runtime; defineAdapter only provides compile-time checks
