/**
 * Example 02: Decorator Basics (@Adapter)
 *
 * This example demonstrates how to use the @Adapter decorator
 * to declare which port token an adapter provides and which implementation class it uses.
 *
 * Key Points:
 * - @Adapter({ portToken, implementation }) declares both the port token and implementation in one decorator
 * - This decorator stores metadata that is read by AdapterBase.register() and registerAsync()
 * - Decorator must be applied to classes extending AdapterBase<TOptions>
 * - Single decorator is cleaner than having two separate decorators
 */

import { Injectable } from '@nestjs/common'
import { Adapter, AdapterBase } from '../src'

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

// Step 5: Create the adapter using @Adapter decorator
@Adapter({
	portToken: EMAIL_PROVIDER, // Declares: "I provide EMAIL_PROVIDER"
	implementation: SendGridService, // Declares: "I use SendGridService as implementation"
})
class SendGridAdapter extends AdapterBase<SendGridOptions> {
	// No additional code needed!
	// The @Adapter decorator tells AdapterBase.register() what to do.
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
 * 1. @Adapter stores both EMAIL_PROVIDER (portToken) and SendGridService (implementation) in class metadata
 * 2. AdapterBase.register() reads this metadata and creates:
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

@Adapter({
	portToken: EMAIL_PROVIDER, // Same token, different implementation!
	implementation: SmtpService,
})
class SmtpAdapter extends AdapterBase<SmtpOptions> {}

const smtpModule = SmtpAdapter.register({
	host: 'smtp.example.com',
	port: 587,
	username: 'user@example.com',
	password: 'password',
})

console.log('SMTP adapter module:', smtpModule)

/**
 * Why Use the @Adapter Decorator?
 *
 * Without the decorator, you'd need to manually specify the portToken and implementation
 * in every register() call. The @Adapter decorator eliminates this repetition:
 *
 * ❌ Without decorator (verbose):
 * AdapterBase.register({ portToken: EMAIL_PROVIDER, impl: SendGridService, options: {...} })
 *
 * ✅ With @Adapter decorator (concise, declarative):
 * SendGridAdapter.register({ apiKey: '...', fromEmail: '...' })
 *
 * Benefits:
 * - Declare once (at class level), use everywhere
 * - Type-safe metadata stored at compile time
 * - Cleaner, more maintainable code
 * - Single source of truth for adapter configuration
 */
