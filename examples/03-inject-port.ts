/**
 * Example 03: Injecting Ports with @InjectPort
 *
 * This example demonstrates how to use the @InjectPort decorator to inject
 * port implementations into service constructors.
 *
 * Key Points:
 * - @InjectPort(token) is syntactic sugar for @Inject(token)
 * - It provides clearer semantics: "I'm injecting a port"
 * - Services depend on port interfaces, not concrete implementations
 * - Adapters can be swapped without changing service code
 */

import { Injectable } from '@nestjs/common'
import { InjectPort } from '../src'

// Step 1: Define port tokens
const LOGGER_PROVIDER = Symbol('LOGGER_PROVIDER')
const CACHE_PROVIDER = Symbol('CACHE_PROVIDER')

// Step 2: Define port interfaces
interface LoggerPort {
	log(message: string): void
	error(message: string, error?: Error): void
}

interface CachePort {
	get<T>(key: string): Promise<T | null>
	set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>
	delete(key: string): Promise<void>
}

// Step 3: Create a domain service that consumes ports
@Injectable()
class UserService {
	private readonly logger: LoggerPort
	private readonly cache: CachePort

	constructor(
		// Inject the logger port
		@InjectPort(LOGGER_PROVIDER)
		logger: LoggerPort,

		// Inject the cache port
		@InjectPort(CACHE_PROVIDER)
		cache: CachePort,
	) {
		this.logger = logger
		this.cache = cache
		this.logger.log('UserService initialized')
	}

	async getUser(userId: string): Promise<{ id: string; name: string } | null> {
		this.logger.log(`Fetching user: ${userId}`)

		// Try cache first
		const cached = await this.cache.get<{ id: string; name: string }>(
			`user:${userId}`,
		)
		if (cached) {
			this.logger.log(`Cache hit for user: ${userId}`)
			return cached
		}

		// Simulate fetching from database
		this.logger.log(`Cache miss for user: ${userId}, fetching from DB`)
		const user = { id: userId, name: `User ${userId}` }

		// Store in cache
		await this.cache.set(`user:${userId}`, user, 3600)
		this.logger.log(`Cached user: ${userId}`)

		return user
	}

	async deleteUser(userId: string): Promise<void> {
		this.logger.log(`Deleting user: ${userId}`)

		// Invalidate cache
		await this.cache.delete(`user:${userId}`)

		// Simulate deleting from database
		this.logger.log(`User deleted: ${userId}`)
	}
}

/**
 * Why @InjectPort Instead of @Inject?
 *
 * @InjectPort is semantically clearer:
 *
 * ✅ Clear intent:
 * @InjectPort(LOGGER_PROVIDER)
 * private readonly logger: LoggerPort
 *
 * vs.
 *
 * ❌ Less clear:
 * @Inject(LOGGER_PROVIDER)
 * private readonly logger: LoggerPort
 *
 * Both work the same way, but @InjectPort signals "this is a port from Hexagonal Architecture"
 * rather than just "this is a dependency".
 */

/**
 * Example: Multiple Services Using the Same Ports
 */

@Injectable()
class OrderService {
	private readonly logger: LoggerPort
	private readonly cache: CachePort

	constructor(
		@InjectPort(LOGGER_PROVIDER)
		logger: LoggerPort,

		@InjectPort(CACHE_PROVIDER)
		cache: CachePort,
	) {
		this.logger = logger
		this.cache = cache
		this.logger.log('OrderService initialized')
	}

	async getOrder(
		orderId: string,
	): Promise<{ id: string; total: number } | null> {
		this.logger.log(`Fetching order: ${orderId}`)

		const cached = await this.cache.get<{ id: string; total: number }>(
			`order:${orderId}`,
		)
		if (cached) {
			this.logger.log(`Cache hit for order: ${orderId}`)
			return cached
		}

		this.logger.log(`Cache miss for order: ${orderId}, fetching from DB`)
		const order = { id: orderId, total: 100 }

		await this.cache.set(`order:${orderId}`, order, 1800)
		return order
	}
}

/**
 * Benefits:
 *
 * 1. **Decoupling**: UserService and OrderService don't know about Redis, Winston, or any
 *    specific implementation. They only depend on the port interfaces.
 *
 * 2. **Testability**: You can easily mock the ports in tests without importing adapter code.
 *
 * 3. **Swappability**: Change from Winston to Pino, or Redis to Memcached, without touching
 *    service code. Just swap the adapter at the app module level.
 *
 * 4. **Clarity**: @InjectPort signals architectural intent and makes the Ports & Adapters
 *    pattern explicit in your codebase.
 */
