import { Adapter, Port } from '../../src'
import {
	MockApiService,
	MockCacheService,
	MockStorageService,
} from './test-services'
import {
	TEST_API_TOKEN,
	TEST_CACHE_TOKEN,
	TEST_STORAGE_TOKEN,
} from './test-tokens'

/**
 * Mock adapter modules for testing.
 * These adapters use the @Port decorator pattern and can be used in tests.
 */

export type TestStorageOptions = {
	prefix?: string
}

@Port({
	token: TEST_STORAGE_TOKEN,
	implementation: MockStorageService,
})
export class TestStorageAdapter extends Adapter<TestStorageOptions> {}

export type TestApiOptions = {
	baseUrl: string
	timeout?: number
}

@Port({
	token: TEST_API_TOKEN,
	implementation: MockApiService,
})
export class TestApiAdapter extends Adapter<TestApiOptions> {}

export type TestCacheOptions = {
	defaultTtl: number
}

@Port({
	token: TEST_CACHE_TOKEN,
	implementation: MockCacheService,
})
export class TestCacheAdapter extends Adapter<TestCacheOptions> {}
