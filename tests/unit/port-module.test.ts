import { describe, expect, it } from 'bun:test'
import 'reflect-metadata'
import { PortModule } from '../../src'
import { TestStorageAdapter } from '../fixtures/test-adapters'

describe('PortModule.register()', () => {
	it('should return a DynamicModule with correct structure', () => {
		const module = PortModule.register({
			adapter: TestStorageAdapter.register({ prefix: 'test-' }),
		})

		expect(module).toBeDefined()
		expect(module.module).toBe(PortModule)
		expect(module.imports).toBeDefined()
	})

	it('should import the provided adapter module', () => {
		const adapterModule = TestStorageAdapter.register({ prefix: 'test-' })
		const module = PortModule.register({ adapter: adapterModule })

		expect(module.imports).toContain(adapterModule)
	})

	it('should work without an adapter', () => {
		const module = PortModule.register({})

		expect(module).toBeDefined()
		expect(module.module).toBe(PortModule)
		expect(module.imports).toEqual([])
	})

	it('should accept undefined adapter', () => {
		const module = PortModule.register({ adapter: undefined })

		expect(module).toBeDefined()
		expect(module.imports).toEqual([])
	})

	it('should be extensible by domain modules', () => {
		// Test that PortModule can be extended by custom modules
		class CustomPortModule extends PortModule<object> {}

		const module = CustomPortModule.register({
			adapter: TestStorageAdapter.register({ prefix: 'custom-' }),
		})

		expect(module).toBeDefined()
		expect(module.module).toBe(PortModule) // Still references base PortModule
	})
})
