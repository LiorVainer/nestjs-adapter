import { describe, expect, it } from 'bun:test'
import 'reflect-metadata'
import { Adapter, defineAdapter, Port } from '../../src'
import { MockStorageService } from '../fixtures/test-services'
import { TEST_STORAGE_TOKEN } from '../fixtures/test-tokens'

describe('defineAdapter()', () => {
	it('should return the adapter class unchanged', () => {
		@Port({
			token: TEST_STORAGE_TOKEN,
			implementation: MockStorageService,
		})
		class TestAdapter extends Adapter<{ prefix: string }> {}

		const DefinedAdapter = defineAdapter<
			typeof TEST_STORAGE_TOKEN,
			{ prefix: string }
		>()(TestAdapter)

		expect(DefinedAdapter).toBe(TestAdapter)
	})

	it('should preserve adapter functionality', () => {
		@Port({
			token: TEST_STORAGE_TOKEN,
			implementation: MockStorageService,
		})
		class TestAdapter extends Adapter<{ prefix: string }> {}

		const DefinedAdapter = defineAdapter<
			typeof TEST_STORAGE_TOKEN,
			{ prefix: string }
		>()(TestAdapter)

		const module = DefinedAdapter.register({ prefix: 'test-' })

		expect(module).toBeDefined()
		expect(module.__provides).toBe(TEST_STORAGE_TOKEN)
	})

	it('should work with register() method', () => {
		@Port({
			token: TEST_STORAGE_TOKEN,
			implementation: MockStorageService,
		})
		class TestAdapter extends Adapter<{ prefix: string }> {}

		const DefinedAdapter = defineAdapter<
			typeof TEST_STORAGE_TOKEN,
			{ prefix: string }
		>()(TestAdapter)

		const module = DefinedAdapter.register({ prefix: 'test-' })

		expect(module.__provides).toBe(TEST_STORAGE_TOKEN)
		expect(module.module).toBe(TestAdapter)
	})

	it('should work with registerAsync() method', () => {
		@Port({
			token: TEST_STORAGE_TOKEN,
			implementation: MockStorageService,
		})
		class TestAdapter extends Adapter<{ prefix: string }> {}

		const DefinedAdapter = defineAdapter<
			typeof TEST_STORAGE_TOKEN,
			{ prefix: string }
		>()(TestAdapter)

		const module = DefinedAdapter.registerAsync({
			useFactory: () => ({ prefix: 'async-' }),
		})

		expect(module.__provides).toBe(TEST_STORAGE_TOKEN)
		expect(module.module).toBe(TestAdapter)
	})

	it('should be zero-cost at runtime (identity function)', () => {
		@Port({
			token: TEST_STORAGE_TOKEN,
			implementation: MockStorageService,
		})
		class TestAdapter extends Adapter<void> {}

		const DefinedAdapter = defineAdapter<typeof TEST_STORAGE_TOKEN, void>()(
			TestAdapter,
		)

		// Should be the exact same reference (identity function)
		expect(DefinedAdapter).toBe(TestAdapter)
		expect(Object.is(DefinedAdapter, TestAdapter)).toBe(true)
	})
})
