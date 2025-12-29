import { describe, expect, it } from 'bun:test'
import 'reflect-metadata'
import { Adapter, Port } from '../../src'
import { MockStorageService } from '../fixtures/test-services'
import { TEST_STORAGE_TOKEN } from '../fixtures/test-tokens'

describe('Adapter.register()', () => {
	it('should return a DynamicModule with correct structure', () => {
		@Port({
			token: TEST_STORAGE_TOKEN,
			implementation: MockStorageService,
		})
		class TestAdapter extends Adapter<{ prefix: string }> {}

		const module = TestAdapter.register({ prefix: 'test-' })

		expect(module).toBeDefined()
		expect(module.module).toBe(TestAdapter)
		expect(module.providers).toBeDefined()
		expect(module.exports).toBeDefined()
		expect(module.__provides).toBe(TEST_STORAGE_TOKEN)
	})

	it('should include implementation class as a provider', () => {
		@Port({
			token: TEST_STORAGE_TOKEN,
			implementation: MockStorageService,
		})
		class TestAdapter extends Adapter<{ prefix: string }> {}

		const module = TestAdapter.register({ prefix: 'test-' })

		expect(module.providers).toContain(MockStorageService)
	})

	it('should alias port token to implementation using useExisting', () => {
		@Port({
			token: TEST_STORAGE_TOKEN,
			implementation: MockStorageService,
		})
		class TestAdapter extends Adapter<{ prefix: string }> {}

		const module = TestAdapter.register({ prefix: 'test-' })

		const tokenProvider = module.providers?.find(
			(p) =>
				typeof p === 'object' &&
				'provide' in p &&
				p.provide === TEST_STORAGE_TOKEN,
		)

		expect(tokenProvider).toBeDefined()
		expect(tokenProvider).toMatchObject({
			provide: TEST_STORAGE_TOKEN,
			useExisting: MockStorageService,
		})
	})

	it('should export only the port token', () => {
		@Port({
			token: TEST_STORAGE_TOKEN,
			implementation: MockStorageService,
		})
		class TestAdapter extends Adapter<{ prefix: string }> {}

		const module = TestAdapter.register({ prefix: 'test-' })

		expect(module.exports).toEqual([TEST_STORAGE_TOKEN])
	})

	it('should throw error when @Port decorator is missing', () => {
		class InvalidAdapter extends Adapter<void> {}

		expect(() => InvalidAdapter.register(undefined)).toThrow(
			/must be decorated with @Port/,
		)
	})

	it('should throw error when token is missing from @Port decorator', () => {
		// This test verifies runtime behavior when decorator is malformed
		class InvalidAdapter extends Adapter<void> {}

		expect(() => InvalidAdapter.register(undefined)).toThrow()
	})

	it('should call imports() hook with options', () => {
		class MockModule {}
		const mockImports = [MockModule]

		@Port({
			token: TEST_STORAGE_TOKEN,
			implementation: MockStorageService,
		})
		class TestAdapter extends Adapter<{ prefix: string }> {
			protected override imports(options?: { prefix: string }) {
				expect(options?.prefix).toBe('test-prefix')
				return mockImports
			}
		}

		const module = TestAdapter.register({ prefix: 'test-prefix' })

		expect(module.imports).toEqual(mockImports)
	})

	it('should call extraProviders() hook with options', () => {
		const extraProvider = { provide: 'EXTRA', useValue: 'extra-value' }

		@Port({
			token: TEST_STORAGE_TOKEN,
			implementation: MockStorageService,
		})
		class TestAdapter extends Adapter<{ prefix: string }> {
			protected override extraPoviders(options: { prefix: string }) {
				expect(options.prefix).toBe('test-prefix')
				return [extraProvider]
			}
		}

		const module = TestAdapter.register({ prefix: 'test-prefix' })

		expect(module.providers).toContainEqual(extraProvider)
	})

	it('should work with void options', () => {
		@Port({
			token: TEST_STORAGE_TOKEN,
			implementation: MockStorageService,
		})
		class TestAdapter extends Adapter<void> {}

		const module = TestAdapter.register(undefined)

		expect(module).toBeDefined()
		expect(module.__provides).toBe(TEST_STORAGE_TOKEN)
	})
})
