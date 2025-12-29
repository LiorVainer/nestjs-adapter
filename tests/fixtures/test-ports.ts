/**
 * Test port interfaces for use in unit and integration tests.
 * These interfaces define the contracts for mock adapters.
 */

export interface TestStoragePort {
	save(key: string, value: string): Promise<void>
	load(key: string): Promise<string | null>
}

export interface TestApiPort {
	fetch(endpoint: string): Promise<Record<string, unknown>>
}

export interface TestCachePort {
	set(key: string, value: string, ttl: number): Promise<void>
	get(key: string): Promise<string | null>
}
