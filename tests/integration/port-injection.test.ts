import { beforeEach, describe, expect, it } from 'bun:test'
import { Test, type TestingModule } from '@nestjs/testing'
import 'reflect-metadata'
import { Injectable, Module } from '@nestjs/common'
import { InjectPort, PortModule } from '../../src'
import { TestStorageAdapter } from '../fixtures/test-adapters'
import type { TestStoragePort } from '../fixtures/test-ports'
import { TEST_STORAGE_TOKEN } from '../fixtures/test-tokens'

describe('Port Token Injection (Integration)', () => {
	describe('@InjectPort decorator', () => {
		let module: TestingModule

		@Injectable()
		class StorageService {
			constructor(
				@InjectPort(TEST_STORAGE_TOKEN)
				private readonly storage: TestStoragePort,
			) {}

			async saveData(key: string, value: string) {
				await this.storage.save(key, value)
			}

			async loadData(key: string) {
				return this.storage.load(key)
			}
		}

		beforeEach(async () => {
			module = await Test.createTestingModule({
				imports: [TestStorageAdapter.register({ prefix: 'test-' })],
				providers: [StorageService],
			}).compile()
		})

		it('should inject port token into service constructor', () => {
			const service = module.get(StorageService)
			expect(service).toBeDefined()
		})

		it('should allow service to use injected port implementation', async () => {
			const service = module.get(StorageService)
			await service.saveData('test-key', 'test-value')
			const result = await service.loadData('test-key')

			expect(result).toBe('test-value')
		})

		it('should work with multiple services using same port', async () => {
			@Injectable()
			class FirstService {
				constructor(
					@InjectPort(TEST_STORAGE_TOKEN)
					private readonly storage: TestStoragePort,
				) {}

				async saveFirst() {
					await this.storage.save('first', 'first-value')
					return this.storage.load('first')
				}
			}

			@Injectable()
			class SecondService {
				constructor(
					@InjectPort(TEST_STORAGE_TOKEN)
					private readonly storage: TestStoragePort,
				) {}

				async saveSecond() {
					await this.storage.save('second', 'second-value')
					return this.storage.load('second')
				}
			}

			const multiModule = await Test.createTestingModule({
				imports: [TestStorageAdapter.register({ prefix: 'test-' })],
				providers: [FirstService, SecondService],
			}).compile()

			const first = multiModule.get(FirstService)
			const second = multiModule.get(SecondService)

			const result1 = await first.saveFirst()
			const result2 = await second.saveSecond()

			expect(result1).toBe('first-value')
			expect(result2).toBe('second-value')
		})
	})

	describe('PortModule with adapter', () => {
		it('should import adapter and make token available', async () => {
			@Module({
				providers: [],
			})
			class StorageFeatureModule extends PortModule<object> {}

			const module = await Test.createTestingModule({
				imports: [
					StorageFeatureModule.register({
						adapter: TestStorageAdapter.register({ prefix: 'feature-' }),
					}),
				],
			}).compile()

			const instance = module.get(TEST_STORAGE_TOKEN)
			expect(instance).toBeDefined()
		})

		it('should work with domain services alongside port module', async () => {
			@Injectable()
			class DomainService {
				constructor(
					@InjectPort(TEST_STORAGE_TOKEN)
					private readonly storage: TestStoragePort,
				) {}

				async storeData(data: string) {
					await this.storage.save('domain', data)
					return this.storage.load('domain')
				}
			}

			const module = await Test.createTestingModule({
				imports: [TestStorageAdapter.register({ prefix: 'domain-' })],
				providers: [DomainService],
			}).compile()

			const service = module.get(DomainService)
			const result = await service.storeData('domain-data')

			expect(result).toBe('domain-data')
		})
	})
})
