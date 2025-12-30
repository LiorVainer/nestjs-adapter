/**
 * Example 02: Decorator Basics (@Port)
 *
 * This example demonstrates how to use the @Port decorator
 * to declare which port token an adapter provides and which implementation class it uses.
 *
 * Key Points:
 * - @Port({ token, implementation }) declares both the port token and implementation in one decorator
 * - This decorator stores metadata that is read by Adapter.register() and registerAsync()
 * - Decorator must be applied to classes extending Adapter<TOptions>
 * - Single decorator is cleaner than having two separate decorators
 */

import { Injectable } from '@nestjs/common'
import { Adapter, Port } from '../src'

// Step 1: Define a port token
const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER')

// Step 2: Define the port interface (what the domain needs)
interface EmailPort {
	sendEmail(to: string, subject: string, body: string): Promise<void>
}

// Step 3: Define adapter options
interface SendGridOptions {
	apiKey: string
	fromEmail: string
}

// Step 4: Create the implementation service
@Injectable()
class SendGridService implements EmailPort {
	constructor(private readonly options: SendGridOptions) {}

	async sendEmail(to: string, subject: string, body: string): Promise<void> {
		console.log('SendGrid: Sending email via SendGrid API')
		console.log(`  API Key: ${this.options.apiKey}`)
		console.log(`  From: ${this.options.fromEmail}`)
		console.log(`  To: ${to}`)
		console.log(`  Subject: ${subject}`)
		console.log(`  Body: ${body}`)
		// In real implementation: call SendGrid API
	}
}

// Step 5: Create the adapter using @Port decorator
@Port({
	token: EMAIL_PROVIDER, // Declares: "I provide EMAIL_PROVIDER"
	implementation: SendGridService, // Declares: "I use SendGridService as implementation"
})
class SendGridAdapter extends Adapter<SendGridOptions> {
	// No additional code needed!
	// The @Port decorator tells Adapter.register() what to do.
}

// Usage Example:
const sendGridModule = SendGridAdapter.register({
	apiKey: 'sg-api-key-123',
	fromEmail: 'noreply@example.com',
})

console.log('SendGrid adapter module:', sendGridModule)

/**
 * What Happens Behind the Scenes:
 *
 * 1. @Port stores both EMAIL_PROVIDER (token) and SendGridService (implementation) in class metadata
 * 2. Adapter.register() reads this metadata and creates:
 *    {
 *      module: SendGridAdapter,
 *      providers: [
 *        SendGridService,  // The implementation
 *        { provide: EMAIL_PROVIDER, useExisting: SendGridService }  // Token alias
 *      ],
 *      exports: [EMAIL_PROVIDER],
 *      __provides: EMAIL_PROVIDER  // Compile-time type proof
 *    }
 */

/**
 * Alternative Implementation (SMTP):
 *
 * You can easily swap adapters by creating a different implementation:
 */

interface SmtpOptions {
	host: string
	port: number
	username: string
	password: string
}

@Injectable()
class SmtpService implements EmailPort {
	constructor(private readonly options: SmtpOptions) {}

	async sendEmail(to: string, subject: string, _body: string): Promise<void> {
		console.log('SMTP: Sending email via SMTP server')
		console.log(`  Host: ${this.options.host}:${this.options.port}`)
		console.log(`  User: ${this.options.username}`)
		console.log(`  To: ${to}`)
		console.log(`  Subject: ${subject}`)
		// In real implementation: connect to SMTP server
	}
}

@Port({
	token: EMAIL_PROVIDER, // Same token, different implementation!
	implementation: SmtpService,
})
class SmtpAdapter extends Adapter<SmtpOptions> {}

const smtpModule = SmtpAdapter.register({
	host: 'smtp.example.com',
	port: 587,
	username: 'user@example.com',
	password: 'password',
})

console.log('SMTP adapter module:', smtpModule)

/**
 * Why Use the @Port Decorator?
 *
 * Without the decorator, you'd need to manually specify the token and implementation
 * in every register() call. The @Port decorator eliminates this repetition:
 *
 * ❌ Without decorator (verbose):
 * Adapter.register({ token: EMAIL_PROVIDER, impl: SendGridService, options: {...} })
 *
 * ✅ With @Port decorator (concise, declarative):
 * SendGridAdapter.register({ apiKey: '...', fromEmail: '...' })
 *
 * Benefits:
 * - Declare once (at class level), use everywhere
 * - Type-safe metadata stored at compile time
 * - Cleaner, more maintainable code
 * - Single source of truth for adapter configuration
 */
