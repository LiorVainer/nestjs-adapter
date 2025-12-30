import { describe, expect, it, mock } from 'bun:test'
import { Test } from '@nestjs/testing'
import 'reflect-metadata'
import { Injectable } from '@nestjs/common'
import { Adapter, InjectPort, Port } from '../../src'
import type { TestStoragePort } from '../fixtures/test-ports'
import { TEST_STORAGE_TOKEN } from '../fixtures/test-tokens'

describe('Mock Adapter Patterns (Integration)', () => {
	describe('Mock adapter for testing', () => {
		@Injectable()
		class MockStorage implements TestStoragePort {
			async save(_key: string, _value: string): Promise<void> {
				// Mock implementation - does nothing
			}

			async load(_key: string): Promise<string | null> {
				return 'mocked-value'
			}
		}

		@Port({
			token: TEST_STORAGE_TOKEN,
			implementation: MockStorage,
		})
		class MockStorageAdapter extends Adapter<void> {}

		it('should use mock adapter in tests', async () => {
			@Injectable()
			class TestService {
				constructor(
					@InjectPort(TEST_STORAGE_TOKEN)
					private readonly storage: TestStoragePort,
				) {}

				async getData(key: string) {
					return this.storage.load(key)
				}
			}

			const module = await Test.createTestingModule({
				imports: [MockStorageAdapter.register(undefined)],
				providers: [TestService],
			}).compile()

			const service = module.get(TestService)
			const result = await service.getData('any-key')

			expect(result).toBe('mocked-value')
		})
	})

	describe('.overrideProvider() pattern', () => {
		it('should override port token with mock', async () => {
			const mockStorage: TestStoragePort = {
				save: mock(async () => {}),
				load: mock(async () => 'overridden-value'),
			}

			@Injectable()
			class TestService {
				constructor(
					@InjectPort(TEST_STORAGE_TOKEN)
					private readonly storage: TestStoragePort,
				) {}

				async getData(key: string) {
					return this.storage.load(key)
				}
			}

			const module = await Test.createTestingModule({
				providers: [
					TestService,
					{
						provide: TEST_STORAGE_TOKEN,
						useValue: mockStorage,
					},
				],
			}).compile()

			const service = module.get(TestService)
			const result = await service.getData('test-key')

			expect(result).toBe('overridden-value')
			expect(mockStorage.load).toHaveBeenCalledWith('test-key')
		})

		it('should override adapter provider in testing module', async () => {
			const mockImplementation: TestStoragePort = {
				save: mock(async () => {}),
				load: mock(async () => 'test-override'),
			}

			const module = await Test.createTestingModule({
				imports: [
					// Import real adapter
					(
						await import('../fixtures/test-adapters')
					).TestStorageAdapter.register({ prefix: 'real-' }),
				],
			})
				.overrideProvider(TEST_STORAGE_TOKEN)
				.useValue(mockImplementation)
				.compile()

			const instance = module.get<TestStoragePort>(TEST_STORAGE_TOKEN)
			const result = await instance.load('any-key')

			expect(result).toBe('test-override')
			expect(mockImplementation.load).toHaveBeenCalled()
		})
	})

	describe('Spy pattern', () => {
		it('should spy on adapter methods', async () => {
			const { TestStorageAdapter } = await import('../fixtures/test-adapters')
			const { MockStorageService } = await import('../fixtures/test-services')

			const module = await Test.createTestingModule({
				imports: [TestStorageAdapter.register({ prefix: 'spy-' })],
			}).compile()

			const storage = module.get(MockStorageService)
			const saveSpy = mock(() => storage.save('spy-key', 'spy-value'))

			await saveSpy()

			expect(saveSpy).toHaveBeenCalled()
		})
	})

	describe('Factory mock with dependencies', () => {
		it('should create mock with injected dependencies', async () => {
			const CONFIG = Symbol('CONFIG')

			const mockStorage: TestStoragePort = {
				save: mock(async () => {}),
				load: mock(async (key: string) => `config-${key}`),
			}

			const module = await Test.createTestingModule({
				providers: [
					{
						provide: CONFIG,
						useValue: { prefix: 'config-' },
					},
					{
						provide: TEST_STORAGE_TOKEN,
						useFactory: (config: { prefix: string }) => {
							// Could use config to customize mock behavior
							expect(config.prefix).toBe('config-')
							return mockStorage
						},
						inject: [CONFIG],
					},
				],
			}).compile()

			const storage = module.get<TestStoragePort>(TEST_STORAGE_TOKEN)
			const result = await storage.load('test')

			expect(result).toBe('config-test')
		})
	})
})
