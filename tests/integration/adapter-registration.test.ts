import { beforeEach, describe, expect, it } from 'bun:test'
import { Test, type TestingModule } from '@nestjs/testing'
import 'reflect-metadata'
import { Injectable } from '@nestjs/common'
import { InjectPort } from '../../src'
import { TestApiAdapter, TestStorageAdapter } from '../fixtures/test-adapters'
import type { TestStoragePort } from '../fixtures/test-ports'
import { TEST_API_TOKEN, TEST_STORAGE_TOKEN } from '../fixtures/test-tokens'

describe('Adapter Registration (Integration)', () => {
	describe('register() - Synchronous', () => {
		let module: TestingModule

		beforeEach(async () => {
			module = await Test.createTestingModule({
				imports: [TestStorageAdapter.register({ prefix: 'test-' })],
			}).compile()
		})

		it('should provide the port token', () => {
			const instance = module.get(TEST_STORAGE_TOKEN)
			expect(instance).toBeDefined()
		})

		it('should resolve token to the implementation class', () => {
			const instance = module.get(TEST_STORAGE_TOKEN)
			expect(instance).toHaveProperty('save')
			expect(instance).toHaveProperty('load')
		})

		it('should inject the port token into services', async () => {
			@Injectable()
			class TestService {
				constructor(
					@InjectPort(TEST_STORAGE_TOKEN)
					private readonly storage: TestStoragePort,
				) {}

				async testStorage() {
					await this.storage.save('key', 'value')
					return this.storage.load('key')
				}
			}

			const serviceModule = await Test.createTestingModule({
				imports: [TestStorageAdapter.register({ prefix: 'test-' })],
				providers: [TestService],
			}).compile()

			const service = serviceModule.get(TestService)
			const result = await service.testStorage()

			expect(result).toBe('value')
		})

		it('should work with multiple adapters for different tokens', async () => {
			const multiModule = await Test.createTestingModule({
				imports: [
					TestStorageAdapter.register({ prefix: 'storage-' }),
					TestApiAdapter.register({ baseUrl: 'https://api.test.com' }),
				],
			}).compile()

			const storage = multiModule.get(TEST_STORAGE_TOKEN)
			const api = multiModule.get(TEST_API_TOKEN)

			expect(storage).toBeDefined()
			expect(api).toBeDefined()
			expect(storage).not.toBe(api)
		})
	})

	describe('registerAsync() - Asynchronous', () => {
		let module: TestingModule

		beforeEach(async () => {
			module = await Test.createTestingModule({
				imports: [
					TestStorageAdapter.registerAsync({
						useFactory: () => ({ prefix: 'async-' }),
					}),
				],
			}).compile()
		})

		it('should provide the port token', () => {
			const instance = module.get(TEST_STORAGE_TOKEN)
			expect(instance).toBeDefined()
		})

		it('should resolve options from factory', async () => {
			@Injectable()
			class TestService {
				constructor(
					@InjectPort(TEST_STORAGE_TOKEN)
					private readonly storage: TestStoragePort,
				) {}

				async testStorage() {
					await this.storage.save('async-key', 'async-value')
					return this.storage.load('async-key')
				}
			}

			const serviceModule = await Test.createTestingModule({
				imports: [
					TestStorageAdapter.registerAsync({
						useFactory: () => ({ prefix: 'async-' }),
					}),
				],
				providers: [TestService],
			}).compile()

			const service = serviceModule.get(TestService)
			const result = await service.testStorage()

			expect(result).toBe('async-value')
		})

		it('should support dependency injection in factory', async () => {
			const CONFIG_TOKEN = Symbol('CONFIG')
			const configProvider = {
				provide: CONFIG_TOKEN,
				useValue: { prefix: 'injected-' },
			}

			const diModule = await Test.createTestingModule({
				providers: [configProvider],
				imports: [
					TestStorageAdapter.registerAsync({
						inject: [CONFIG_TOKEN],
						useFactory: (...args: unknown[]) => args[0] as { prefix: string },
					}),
				],
			}).compile()

			const instance = diModule.get(TEST_STORAGE_TOKEN)
			expect(instance).toBeDefined()
		})

		it('should work with async factory function', async () => {
			const asyncModule = await Test.createTestingModule({
				imports: [
					TestStorageAdapter.registerAsync({
						useFactory: async () => {
							// Simulate async config loading
							await new Promise((resolve) => setTimeout(resolve, 10))
							return { prefix: 'delayed-' }
						},
					}),
				],
			}).compile()

			const instance = asyncModule.get(TEST_STORAGE_TOKEN)
			expect(instance).toBeDefined()
		})
	})

	describe('Token Aliasing', () => {
		it('should alias token to implementation using useExisting', async () => {
			const module = await Test.createTestingModule({
				imports: [TestStorageAdapter.register({ prefix: 'test-' })],
			}).compile()

			const byToken = module.get(TEST_STORAGE_TOKEN)
			const byClass = module.get(
				(await import('../fixtures/test-services')).MockStorageService,
			)

			// Should be the same instance due to useExisting
			expect(byToken).toBe(byClass)
		})
	})

	describe('Error Handling', () => {
		it('should throw error when adapter is not registered', async () => {
			const module = await Test.createTestingModule({
				providers: [],
			}).compile()

			expect(() => module.get(TEST_STORAGE_TOKEN)).toThrow()
		})
	})
})
