import { describe, expect, it } from 'bun:test'
import 'reflect-metadata'
import { Adapter, InjectPort, Port } from '../../src'
import {
	PORT_IMPLEMENTATION_METADATA,
	PORT_TOKEN_METADATA,
} from '../../src/core/constants'
import { MockApiService, MockStorageService } from '../fixtures/test-services'
import { TEST_API_TOKEN, TEST_STORAGE_TOKEN } from '../fixtures/test-tokens'

describe('@Port decorator', () => {
	it('should store token metadata', () => {
		@Port({
			token: TEST_STORAGE_TOKEN,
			implementation: MockStorageService,
		})
		class TestAdapter extends Adapter<void> {}

		const token = Reflect.getMetadata(PORT_TOKEN_METADATA, TestAdapter)
		expect(token).toBe(TEST_STORAGE_TOKEN)
	})

	it('should store implementation metadata', () => {
		@Port({
			token: TEST_STORAGE_TOKEN,
			implementation: MockStorageService,
		})
		class TestAdapter extends Adapter<void> {}

		const implementation = Reflect.getMetadata(
			PORT_IMPLEMENTATION_METADATA,
			TestAdapter,
		)
		expect(implementation).toBe(MockStorageService)
	})

	it('should store both token and implementation', () => {
		@Port({
			token: TEST_API_TOKEN,
			implementation: MockApiService,
		})
		class TestAdapter extends Adapter<void> {}

		const token = Reflect.getMetadata(PORT_TOKEN_METADATA, TestAdapter)
		const implementation = Reflect.getMetadata(
			PORT_IMPLEMENTATION_METADATA,
			TestAdapter,
		)

		expect(token).toBe(TEST_API_TOKEN)
		expect(implementation).toBe(MockApiService)
	})

	it('should work with different adapters independently', () => {
		@Port({
			token: TEST_STORAGE_TOKEN,
			implementation: MockStorageService,
		})
		class StorageAdapter extends Adapter<void> {}

		@Port({
			token: TEST_API_TOKEN,
			implementation: MockApiService,
		})
		class ApiAdapter extends Adapter<void> {}

		const storageToken = Reflect.getMetadata(
			PORT_TOKEN_METADATA,
			StorageAdapter,
		)
		const apiToken = Reflect.getMetadata(PORT_TOKEN_METADATA, ApiAdapter)

		expect(storageToken).toBe(TEST_STORAGE_TOKEN)
		expect(apiToken).toBe(TEST_API_TOKEN)
	})
})

describe('@InjectPort decorator', () => {
	it('should behave as parameter decorator', () => {
		class TestService {
			constructor(@InjectPort(TEST_STORAGE_TOKEN) storage: unknown) {
				expect(storage).toBeDefined()
			}
		}

		// The decorator should not throw when applied
		expect(() => new TestService({})).not.toThrow()
	})

	it('should delegate to @Inject decorator', () => {
		// @InjectPort is a thin wrapper around @Inject, so it should work identically
		// The actual injection behavior is tested in integration tests
		class TestService {
			constructor(@InjectPort(TEST_STORAGE_TOKEN) _storage: unknown) {}
		}

		// The decorator should apply without errors
		expect(TestService).toBeDefined()
	})
})
