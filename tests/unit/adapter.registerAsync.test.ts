import { describe, expect, it } from 'bun:test'
import 'reflect-metadata'
import { Adapter, Port } from '../../src'
import { MockStorageService } from '../fixtures/test-services'
import { TEST_STORAGE_TOKEN } from '../fixtures/test-tokens'

describe('Adapter.registerAsync()', () => {
	it('should return a DynamicModule with correct structure', () => {
		@Port({
			token: TEST_STORAGE_TOKEN,
			implementation: MockStorageService,
		})
		class TestAdapter extends Adapter<{ prefix: string }> {}

		const module = TestAdapter.registerAsync({
			useFactory: () => ({ prefix: 'async-' }),
		})

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

		const module = TestAdapter.registerAsync({
			useFactory: () => ({ prefix: 'async-' }),
		})

		expect(module.providers).toContain(MockStorageService)
	})

	it('should alias port token to implementation using useExisting', () => {
		@Port({
			token: TEST_STORAGE_TOKEN,
			implementation: MockStorageService,
		})
		class TestAdapter extends Adapter<{ prefix: string }> {}

		const module = TestAdapter.registerAsync({
			useFactory: () => ({ prefix: 'async-' }),
		})

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

		const module = TestAdapter.registerAsync({
			useFactory: () => ({ prefix: 'async-' }),
		})

		expect(module.exports).toEqual([TEST_STORAGE_TOKEN])
	})

	it('should accept imports option', () => {
		class ConfigModule {}
		const mockImport = ConfigModule

		@Port({
			token: TEST_STORAGE_TOKEN,
			implementation: MockStorageService,
		})
		class TestAdapter extends Adapter<{ prefix: string }> {}

		const module = TestAdapter.registerAsync({
			imports: [mockImport],
			useFactory: () => ({ prefix: 'async-' }),
		})

		expect(module.imports).toContainEqual(mockImport)
	})

	it('should accept inject option for dependency injection', () => {
		const CONFIG_TOKEN = Symbol('CONFIG')

		@Port({
			token: TEST_STORAGE_TOKEN,
			implementation: MockStorageService,
		})
		class TestAdapter extends Adapter<{ prefix: string }> {}

		const module = TestAdapter.registerAsync({
			inject: [CONFIG_TOKEN],
			useFactory: (...args: unknown[]) => args[0] as { prefix: string },
		})

		expect(module).toBeDefined()
		// Note: actual DI resolution is tested in integration tests
	})

	it('should throw error when @Port decorator is missing', () => {
		class InvalidAdapter extends Adapter<void> {}

		expect(() =>
			InvalidAdapter.registerAsync({
				useFactory: () => undefined,
			}),
		).toThrow(/must be decorated with @Port/)
	})

	it('should merge imports from adapter imports() hook and options', () => {
		class OptionModule {}
		class AdapterModule {}
		const optionImports = [OptionModule]
		const adapterImports = [AdapterModule]

		@Port({
			token: TEST_STORAGE_TOKEN,
			implementation: MockStorageService,
		})
		class TestAdapter extends Adapter<{ prefix: string }> {
			protected override imports() {
				return adapterImports
			}
		}

		const module = TestAdapter.registerAsync({
			imports: optionImports,
			useFactory: () => ({ prefix: 'async-' }),
		})

		expect(module.imports).toContainEqual(optionImports[0])
		expect(module.imports).toContainEqual(adapterImports[0])
	})

	it('should work with async factory function', () => {
		@Port({
			token: TEST_STORAGE_TOKEN,
			implementation: MockStorageService,
		})
		class TestAdapter extends Adapter<{ prefix: string }> {}

		const module = TestAdapter.registerAsync({
			useFactory: async () => {
				// Simulate async operation
				await Promise.resolve()
				return { prefix: 'async-' }
			},
		})

		expect(module).toBeDefined()
		expect(module.__provides).toBe(TEST_STORAGE_TOKEN)
	})
})
