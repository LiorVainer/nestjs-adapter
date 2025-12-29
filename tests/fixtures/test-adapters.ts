import { Adapter, type AdapterModule, defineAdapter, Port } from '../../src'
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
class TestStorageAdapterClass extends Adapter<TestStorageOptions> {}

export const TestStorageAdapter: typeof TestStorageAdapterClass & {
	register(
		options: TestStorageOptions,
	): AdapterModule<typeof TEST_STORAGE_TOKEN>
	registerAsync(asyncOptions: {
		imports?: unknown[]
		inject?: unknown[]
		useFactory: (
			...args: unknown[]
		) => TestStorageOptions | Promise<TestStorageOptions>
	}): AdapterModule<typeof TEST_STORAGE_TOKEN>
} = defineAdapter<typeof TEST_STORAGE_TOKEN, TestStorageOptions>()(
	TestStorageAdapterClass,
)

export type TestApiOptions = {
	baseUrl: string
	timeout?: number
}

@Port({
	token: TEST_API_TOKEN,
	implementation: MockApiService,
})
class TestApiAdapterClass extends Adapter<TestApiOptions> {}

export const TestApiAdapter: typeof TestApiAdapterClass & {
	register(options: TestApiOptions): AdapterModule<typeof TEST_API_TOKEN>
	registerAsync(asyncOptions: {
		imports?: unknown[]
		inject?: unknown[]
		useFactory: (...args: unknown[]) => TestApiOptions | Promise<TestApiOptions>
	}): AdapterModule<typeof TEST_API_TOKEN>
} = defineAdapter<typeof TEST_API_TOKEN, TestApiOptions>()(TestApiAdapterClass)

export type TestCacheOptions = {
	defaultTtl: number
}

@Port({
	token: TEST_CACHE_TOKEN,
	implementation: MockCacheService,
})
class TestCacheAdapterClass extends Adapter<TestCacheOptions> {}

export const TestCacheAdapter: typeof TestCacheAdapterClass & {
	register(options: TestCacheOptions): AdapterModule<typeof TEST_CACHE_TOKEN>
	registerAsync(asyncOptions: {
		imports?: unknown[]
		inject?: unknown[]
		useFactory: (
			...args: unknown[]
		) => TestCacheOptions | Promise<TestCacheOptions>
	}): AdapterModule<typeof TEST_CACHE_TOKEN>
} = defineAdapter<typeof TEST_CACHE_TOKEN, TestCacheOptions>()(
	TestCacheAdapterClass,
)
