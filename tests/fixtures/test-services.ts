import { Injectable } from '@nestjs/common'
import type { TestApiPort, TestCachePort, TestStoragePort } from './test-ports'

/**
 * Mock implementation services for testing adapters.
 * These services provide concrete implementations of test port interfaces.
 */

@Injectable()
export class MockStorageService implements TestStoragePort {
	private storage = new Map<string, string>()

	async save(key: string, value: string): Promise<void> {
		this.storage.set(key, value)
	}

	async load(key: string): Promise<string | null> {
		return this.storage.get(key) ?? null
	}
}

@Injectable()
export class MockApiService implements TestApiPort {
	async fetch(_endpoint: string): Promise<Record<string, unknown>> {
		return { data: 'mock-response' }
	}
}

@Injectable()
export class MockCacheService implements TestCachePort {
	private cache = new Map<string, { value: string; expires: number }>()

	async set(key: string, value: string, ttl: number): Promise<void> {
		const expires = Date.now() + ttl * 1000
		this.cache.set(key, { value, expires })
	}

	async get(key: string): Promise<string | null> {
		const entry = this.cache.get(key)
		if (!entry) return null
		if (entry.expires < Date.now()) {
			this.cache.delete(key)
			return null
		}
		return entry.value
	}
}
