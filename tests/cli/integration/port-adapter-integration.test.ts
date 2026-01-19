import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { PortGenerator } from '../../../src/cli/generators/port.generator'
import { AdapterGenerator } from '../../../src/cli/generators/adapter.generator'
import { ServiceGenerator } from '../../../src/cli/generators/service.generator'
import { configBuilder, createTempDir, testConfigs } from '../helpers'

/**
 * Integration tests for CLI generators.
 *
 * These tests verify:
 * - Full generation pipeline produces correct output
 * - Generated files compile together
 * - Port and adapter generators work together correctly
 * - Configuration variations produce expected results
 *
 * @see openspec/changes/add-cli-generator-tests/tasks.md Section 7
 */
describe('CLI Generator Integration Tests', () => {
	const tempDir = createTempDir()
	let testDir: string

	beforeEach(async () => {
		testDir = await tempDir.create()
	})

	afterEach(async () => {
		await tempDir.cleanupAll()
	})

	/**
	 * Section 7.1: End-to-End Port Generation
	 */
	describe('End-to-End Port Generation', () => {
		test('7.1.1 - full port generation pipeline (token, interface, service, module)', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			const result = await generator.generate({
				name: 'payment-gateway',
				outputPath: join(testDir, 'src/ports'),
				includeModule: true,
				includeService: true,
			})

			// Assert: Success result
			expect(result.success).toBe(true)
			expect(result.files.length).toBe(5) // token, interface, service, module, index

			// Assert: All files exist with expected content
			const baseDir = join(testDir, 'src/ports/payment-gateway')

			// Token file
			const tokenFile = join(baseDir, 'payment-gateway.token.ts')
			const tokenContent = await Bun.file(tokenFile).text()
			expect(tokenContent).toContain('export const PAYMENT_GATEWAY_PORT')
			expect(tokenContent).toContain("Symbol('PAYMENT_GATEWAY_PORT')")

			// Interface file
			const interfaceFile = join(baseDir, 'payment-gateway.port.ts')
			const interfaceContent = await Bun.file(interfaceFile).text()
			expect(interfaceContent).toContain('export interface PaymentGatewayPort')

			// Service file
			const serviceFile = join(baseDir, 'payment-gateway.service.ts')
			const serviceContent = await Bun.file(serviceFile).text()
			expect(serviceContent).toContain('@InjectPort(PAYMENT_GATEWAY_PORT)')
			expect(serviceContent).toContain('export class PaymentGatewayService')

			// Module file
			const moduleFile = join(baseDir, 'payment-gateway.module.ts')
			const moduleContent = await Bun.file(moduleFile).text()
			expect(moduleContent).toContain('export class PaymentGatewayModule extends DomainModule')

			// Index file
			const indexFile = join(baseDir, 'index.ts')
			const indexContent = await Bun.file(indexFile).text()
			expect(indexContent).toContain("export * from './payment-gateway.token'")
			expect(indexContent).toContain("export * from './payment-gateway.port'")
			expect(indexContent).toContain("export * from './payment-gateway.service'")
			expect(indexContent).toContain("export * from './payment-gateway.module'")
		})

		test('7.1.2 - generated files compile together as a unit', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'email-service',
				outputPath: join(testDir, 'src/ports'),
				includeModule: true,
				includeService: true,
			})

			// Assert: Files contain valid import references between each other
			const baseDir = join(testDir, 'src/ports/email-service')

			// Service imports token
			const serviceContent = await Bun.file(join(baseDir, 'email-service.service.ts')).text()
			expect(serviceContent).toContain("from './email-service.token'")

			// Index exports all without circular dependencies
			const indexContent = await Bun.file(join(baseDir, 'index.ts')).text()
			const exportCount = (indexContent.match(/export \* from/g) || []).length
			expect(exportCount).toBe(4) // token, port, service, module

			// All internal imports use relative paths
			expect(serviceContent).not.toContain('from "email-service')
			expect(serviceContent).not.toContain("from 'email-service")
		})

		test('7.1.3 - generated module can be imported via index', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'notification',
				outputPath: join(testDir, 'src/ports'),
				includeModule: true,
				includeService: true,
			})

			// Assert: Index exports the module correctly
			const indexContent = await Bun.file(
				join(testDir, 'src/ports/notification/index.ts'),
			).text()
			expect(indexContent).toContain("export * from './notification.module'")

			// Module has correct export
			const moduleContent = await Bun.file(
				join(testDir, 'src/ports/notification/notification.module.ts'),
			).text()
			expect(moduleContent).toContain('export class NotificationModule')
		})

		test('7.1.4 - generated port follows library conventions', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'cache',
				outputPath: join(testDir, 'src/ports'),
				includeModule: true,
				includeService: true,
			})

			const baseDir = join(testDir, 'src/ports/cache')

			// Assert: Token follows SCREAMING_SNAKE_CASE + _PORT suffix
			const tokenContent = await Bun.file(join(baseDir, 'cache.token.ts')).text()
			expect(tokenContent).toContain('CACHE_PORT')
			expect(tokenContent).not.toContain('CACHE_PROVIDER')

			// Assert: Interface follows PascalCase + Port suffix
			const interfaceContent = await Bun.file(join(baseDir, 'cache.port.ts')).text()
			expect(interfaceContent).toContain('interface CachePort')

			// Assert: Service uses InjectPort from nest-hex
			const serviceContent = await Bun.file(join(baseDir, 'cache.service.ts')).text()
			expect(serviceContent).toContain("import { InjectPort } from 'nest-hex'")

			// Assert: Module extends DomainModule from nest-hex
			const moduleContent = await Bun.file(join(baseDir, 'cache.module.ts')).text()
			expect(moduleContent).toContain("import { DomainModule } from 'nest-hex'")
			expect(moduleContent).toContain('extends DomainModule')
		})
	})

	/**
	 * Section 7.2: End-to-End Adapter Generation
	 */
	describe('End-to-End Adapter Generation', () => {
		test('7.2.1 - full adapter generation pipeline (adapter, service, types)', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			const result = await generator.generate({
				name: 'redis-cache',
				outputPath: join(testDir, 'src/adapters'),
			})

			// Assert: Success result
			expect(result.success).toBe(true)
			expect(result.files.length).toBe(4) // adapter, service, types, index

			// Assert: All files exist with expected content
			const baseDir = join(testDir, 'src/adapters/redis-cache')

			// Adapter file
			const adapterFile = join(baseDir, 'redis-cache.adapter.ts')
			const adapterContent = await Bun.file(adapterFile).text()
			expect(adapterContent).toContain('@Adapter')
			expect(adapterContent).toContain('export class RedisCacheAdapter extends AdapterBase')

			// Service file
			const serviceFile = join(baseDir, 'redis-cache.service.ts')
			const serviceContent = await Bun.file(serviceFile).text()
			expect(serviceContent).toContain('@Injectable()')
			expect(serviceContent).toContain('export class RedisCacheService')

			// Types file
			const typesFile = join(baseDir, 'redis-cache.types.ts')
			const typesContent = await Bun.file(typesFile).text()
			expect(typesContent).toContain('export interface RedisCacheConfigOptions')

			// Index file
			const indexFile = join(baseDir, 'index.ts')
			const indexContent = await Bun.file(indexFile).text()
			expect(indexContent).toContain("export * from './redis-cache.adapter'")
			expect(indexContent).toContain("export * from './redis-cache.service'")
			expect(indexContent).toContain("export * from './redis-cache.types'")
		})

		test('7.2.2 - generated adapter can reference existing port', async () => {
			// Arrange
			const config = configBuilder().build()
			const adapterGenerator = new AdapterGenerator(config)

			// Act
			await adapterGenerator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
				portName: 'object-storage',
			})

			// Assert: Adapter correctly imports port token
			const adapterFile = join(testDir, 'src/adapters/s3-storage/s3-storage.adapter.ts')
			const adapterContent = await Bun.file(adapterFile).text()

			expect(adapterContent).toContain('OBJECT_STORAGE_PORT')
			expect(adapterContent).toContain('portToken: OBJECT_STORAGE_PORT')
			expect(adapterContent).toContain("from '../../ports/object-storage'")
		})

		test('7.2.3 - generated adapter compiles and type-checks (valid structure)', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 'smtp-email',
				outputPath: join(testDir, 'src/adapters'),
				portName: 'email-service',
			})

			const baseDir = join(testDir, 'src/adapters/smtp-email')

			// Assert: Valid TypeScript structure
			const adapterContent = await Bun.file(join(baseDir, 'smtp-email.adapter.ts')).text()

			// Has proper class structure
			expect(adapterContent).toMatch(/export class \w+ extends AdapterBase/)
			expect(adapterContent).toMatch(/@Adapter<\w+>/)

			// Has proper imports
			expect(adapterContent).toContain("import { Adapter, AdapterBase } from 'nest-hex'")

			// Types file has valid exports
			const typesContent = await Bun.file(join(baseDir, 'smtp-email.types.ts')).text()
			expect(typesContent).toContain('export interface')
		})

		test('7.2.4 - generated adapter follows library conventions', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 'http-client',
				outputPath: join(testDir, 'src/adapters'),
				portName: 'api-client',
			})

			const baseDir = join(testDir, 'src/adapters/http-client')

			// Assert: Adapter uses @Adapter decorator
			const adapterContent = await Bun.file(join(baseDir, 'http-client.adapter.ts')).text()
			expect(adapterContent).toContain('@Adapter')
			expect(adapterContent).toContain('extends AdapterBase')

			// Assert: Service is injectable
			const serviceContent = await Bun.file(join(baseDir, 'http-client.service.ts')).text()
			expect(serviceContent).toContain("import { Injectable } from '@nestjs/common'")
			expect(serviceContent).toContain('@Injectable()')

			// Assert: Types define config options
			const typesContent = await Bun.file(join(baseDir, 'http-client.types.ts')).text()
			expect(typesContent).toContain('ConfigOptions')
		})
	})

	/**
	 * Section 7.3: Port + Adapter Integration
	 */
	describe('Port + Adapter Integration', () => {
		test('7.3.1 - generate port, then generate adapter for that port', async () => {
			// Arrange
			const config = configBuilder().build()
			const portGenerator = new PortGenerator(config)
			const adapterGenerator = new AdapterGenerator(config)

			// Act: Step 1 - Generate port
			const portResult = await portGenerator.generate({
				name: 'object-storage',
				outputPath: join(testDir, 'src/ports'),
				includeModule: true,
				includeService: true,
			})

			// Assert: Port generated successfully
			expect(portResult.success).toBe(true)

			// Act: Step 2 - Generate adapter for the port
			const adapterResult = await adapterGenerator.generate({
				name: 's3',
				outputPath: join(testDir, 'src/adapters'),
				portName: 'object-storage',
			})

			// Assert: Adapter generated successfully
			expect(adapterResult.success).toBe(true)

			// Assert: Both port and adapter files exist
			expect(
				await Bun.file(join(testDir, 'src/ports/object-storage/object-storage.token.ts')).exists(),
			).toBe(true)
			expect(
				await Bun.file(join(testDir, 'src/adapters/s3/s3.adapter.ts')).exists(),
			).toBe(true)
		})

		test('7.3.2 - verify adapter correctly imports port token', async () => {
			// Arrange
			const config = configBuilder().build()
			const portGenerator = new PortGenerator(config)
			const adapterGenerator = new AdapterGenerator(config)

			// Generate port first
			await portGenerator.generate({
				name: 'payment',
				outputPath: join(testDir, 'src/ports'),
			})

			// Generate adapter
			await adapterGenerator.generate({
				name: 'stripe',
				outputPath: join(testDir, 'src/adapters'),
				portName: 'payment',
			})

			// Assert: Adapter imports the port token correctly
			const adapterContent = await Bun.file(
				join(testDir, 'src/adapters/stripe/stripe.adapter.ts'),
			).text()

			// Import statement uses correct path
			expect(adapterContent).toContain("import { PAYMENT_PORT } from '../../ports/payment'")

			// Token is used in @Adapter decorator
			expect(adapterContent).toContain('portToken: PAYMENT_PORT')
		})

		test('7.3.3 - verify adapter service implements port interface', async () => {
			// Arrange
			const config = configBuilder().build()
			const portGenerator = new PortGenerator(config)
			const adapterGenerator = new AdapterGenerator(config)

			// Generate port
			await portGenerator.generate({
				name: 'message-queue',
				outputPath: join(testDir, 'src/ports'),
			})

			// Generate adapter
			await adapterGenerator.generate({
				name: 'rabbitmq',
				outputPath: join(testDir, 'src/adapters'),
				portName: 'message-queue',
			})

			// Assert: Service implements port interface
			const serviceContent = await Bun.file(
				join(testDir, 'src/adapters/rabbitmq/rabbitmq.service.ts'),
			).text()

			expect(serviceContent).toContain('implements MessageQueuePort')
			expect(serviceContent).toContain(
				"import type { MessageQueuePort } from '../../ports/message-queue'",
			)
		})

		test('7.3.4 - verify both compile together without errors (valid structure)', async () => {
			// Arrange
			const config = configBuilder().build()
			const portGenerator = new PortGenerator(config)
			const adapterGenerator = new AdapterGenerator(config)

			// Generate port with all components
			await portGenerator.generate({
				name: 'logging',
				outputPath: join(testDir, 'src/ports'),
				includeModule: true,
				includeService: true,
			})

			// Generate adapter for the port
			await adapterGenerator.generate({
				name: 'winston',
				outputPath: join(testDir, 'src/adapters'),
				portName: 'logging',
			})

			// Assert: Port files are valid
			const portDir = join(testDir, 'src/ports/logging')
			const adapterDir = join(testDir, 'src/adapters/winston')

			// All port files exist
			expect(await Bun.file(join(portDir, 'logging.token.ts')).exists()).toBe(true)
			expect(await Bun.file(join(portDir, 'logging.port.ts')).exists()).toBe(true)
			expect(await Bun.file(join(portDir, 'logging.service.ts')).exists()).toBe(true)
			expect(await Bun.file(join(portDir, 'logging.module.ts')).exists()).toBe(true)
			expect(await Bun.file(join(portDir, 'index.ts')).exists()).toBe(true)

			// All adapter files exist
			expect(await Bun.file(join(adapterDir, 'winston.adapter.ts')).exists()).toBe(true)
			expect(await Bun.file(join(adapterDir, 'winston.service.ts')).exists()).toBe(true)
			expect(await Bun.file(join(adapterDir, 'winston.types.ts')).exists()).toBe(true)
			expect(await Bun.file(join(adapterDir, 'index.ts')).exists()).toBe(true)

			// Cross-file references are correct
			const adapterContent = await Bun.file(join(adapterDir, 'winston.adapter.ts')).text()
			const serviceContent = await Bun.file(join(adapterDir, 'winston.service.ts')).text()

			// Adapter imports from port
			expect(adapterContent).toContain("from '../../ports/logging'")

			// Service implements port interface
			expect(serviceContent).toContain('implements LoggingPort')
		})
	})

	/**
	 * Section 7.4: Configuration Variations
	 */
	describe('Configuration Variations', () => {
		test('7.4.1 - test generation with all defaults', async () => {
			// Arrange - Use minimal config (all defaults)
			const config = testConfigs.minimal()
			const portGenerator = new PortGenerator(config)
			const adapterGenerator = new AdapterGenerator(config)

			// Act
			await portGenerator.generate({
				name: 'default-port',
				outputPath: join(testDir, 'src/ports'),
			})

			await adapterGenerator.generate({
				name: 'default-adapter',
				outputPath: join(testDir, 'src/adapters'),
			})

			// Assert: Default naming conventions used
			const tokenContent = await Bun.file(
				join(testDir, 'src/ports/default-port/default-port.token.ts'),
			).text()
			expect(tokenContent).toContain('DEFAULT_PORT_PORT') // kebab-case, PORT suffix

			// Assert: Default file case (kebab)
			expect(
				await Bun.file(join(testDir, 'src/ports/default-port/default-port.token.ts')).exists(),
			).toBe(true)
			expect(
				await Bun.file(join(testDir, 'src/adapters/default-adapter/default-adapter.adapter.ts')).exists(),
			).toBe(true)
		})

		test('7.4.2 - test generation with fully custom config', async () => {
			// Arrange - Use fully custom config
			const config = testConfigs.fullyCustom()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'custom-port',
				outputPath: join(testDir, 'custom/domain/contracts'),
			})

			// Assert: Custom naming conventions used
			// Note: With PascalCase, directory and file names become PascalCase
			const baseDir = join(testDir, 'custom/domain/contracts/CustomPort')

			// Token uses custom suffix (CONTRACT instead of PORT)
			const tokenContent = await Bun.file(join(baseDir, 'CustomPort.token.ts')).text()
			expect(tokenContent).toContain('CUSTOM_PORT_CONTRACT')

			// Files use double quotes (custom config)
			expect(tokenContent).toContain('"')
		})

		test('7.4.3 - test generation with partial custom config', async () => {
			// Arrange - Only customize some options
			const config = configBuilder()
				.withFileCase('pascal')
				.withIndent(2)
				// Keep other defaults
				.build()

			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'partial-custom',
				outputPath: join(testDir, 'src/ports'),
			})

			// Assert: Custom file case applied
			const baseDir = join(testDir, 'src/ports/PartialCustom')
			expect(await Bun.file(join(baseDir, 'PartialCustom.token.ts')).exists()).toBe(true)

			// Assert: Default port suffix still used
			const tokenContent = await Bun.file(join(baseDir, 'PartialCustom.token.ts')).text()
			expect(tokenContent).toContain('PARTIAL_CUSTOM_PORT')

			// Assert: Custom indent applied (2 spaces, no tabs)
			expect(tokenContent).not.toContain('\t')
		})

		test('7.4.4 - test multiple generations with same config', async () => {
			// Arrange
			const config = configBuilder().build()
			const portGenerator = new PortGenerator(config)
			const adapterGenerator = new AdapterGenerator(config)

			// Act: Generate multiple ports
			await portGenerator.generate({
				name: 'user-auth',
				outputPath: join(testDir, 'src/ports'),
			})
			await portGenerator.generate({
				name: 'payment',
				outputPath: join(testDir, 'src/ports'),
			})
			await portGenerator.generate({
				name: 'notification',
				outputPath: join(testDir, 'src/ports'),
			})

			// Act: Generate multiple adapters
			await adapterGenerator.generate({
				name: 'cognito',
				outputPath: join(testDir, 'src/adapters'),
				portName: 'user-auth',
			})
			await adapterGenerator.generate({
				name: 'stripe',
				outputPath: join(testDir, 'src/adapters'),
				portName: 'payment',
			})

			// Assert: All ports generated successfully
			expect(
				await Bun.file(join(testDir, 'src/ports/user-auth/user-auth.token.ts')).exists(),
			).toBe(true)
			expect(
				await Bun.file(join(testDir, 'src/ports/payment/payment.token.ts')).exists(),
			).toBe(true)
			expect(
				await Bun.file(join(testDir, 'src/ports/notification/notification.token.ts')).exists(),
			).toBe(true)

			// Assert: All adapters generated successfully
			expect(
				await Bun.file(join(testDir, 'src/adapters/cognito/cognito.adapter.ts')).exists(),
			).toBe(true)
			expect(
				await Bun.file(join(testDir, 'src/adapters/stripe/stripe.adapter.ts')).exists(),
			).toBe(true)

			// Assert: Each adapter references correct port
			const cognitoContent = await Bun.file(
				join(testDir, 'src/adapters/cognito/cognito.adapter.ts'),
			).text()
			expect(cognitoContent).toContain('USER_AUTH_PORT')

			const stripeContent = await Bun.file(
				join(testDir, 'src/adapters/stripe/stripe.adapter.ts'),
			).text()
			expect(stripeContent).toContain('PAYMENT_PORT')
		})

		test('7.4.5 - config change affects subsequent generations', async () => {
			// Arrange
			const kebabConfig = configBuilder().withFileCase('kebab').build()
			const pascalConfig = configBuilder().withFileCase('pascal').build()

			// Act: Generate with kebab config
			const kebabGenerator = new PortGenerator(kebabConfig)
			await kebabGenerator.generate({
				name: 'kebab-port',
				outputPath: join(testDir, 'src/ports'),
			})

			// Act: Generate with pascal config
			const pascalGenerator = new PortGenerator(pascalConfig)
			await pascalGenerator.generate({
				name: 'pascal-port',
				outputPath: join(testDir, 'src/ports'),
			})

			// Assert: Kebab uses kebab-case
			expect(
				await Bun.file(join(testDir, 'src/ports/kebab-port/kebab-port.token.ts')).exists(),
			).toBe(true)

			// Assert: Pascal uses PascalCase
			expect(
				await Bun.file(join(testDir, 'src/ports/PascalPort/PascalPort.token.ts')).exists(),
			).toBe(true)
		})
	})

	/**
	 * Additional Integration Tests: Service Generator with Port Injection
	 */
	describe('Service Generator with Port Injection', () => {
		test('generates service that injects a port', async () => {
			// Arrange
			const config = configBuilder().build()
			const portGenerator = new PortGenerator(config)
			const serviceGenerator = new ServiceGenerator(config)

			// Generate port first
			await portGenerator.generate({
				name: 'email',
				outputPath: join(testDir, 'src/ports'),
			})

			// Act: Generate service that uses the port
			await serviceGenerator.generate({
				name: 'notification',
				outputPath: join(testDir, 'src/services'),
				portName: 'email',
			})

			// Assert: Service imports and injects the port
			const serviceContent = await Bun.file(
				join(testDir, 'src/services/notification/notification.service.ts'),
			).text()

			expect(serviceContent).toContain('@InjectPort(EMAIL_PORT)')
			expect(serviceContent).toContain("from '../../ports/email'")
		})
	})

	/**
	 * Cross-Platform Path Handling
	 */
	describe('Cross-Platform Path Handling', () => {
		test('import paths always use forward slashes', async () => {
			// Arrange
			const config = configBuilder().build()
			const adapterGenerator = new AdapterGenerator(config)

			// Act
			await adapterGenerator.generate({
				name: 'test-adapter',
				outputPath: join(testDir, 'deep/nested/path/src/adapters'),
				portName: 'test-port',
			})

			// Assert: All import statements use forward slashes
			const adapterFile = join(
				testDir,
				'deep/nested/path/src/adapters/test-adapter/test-adapter.adapter.ts',
			)
			const content = await Bun.file(adapterFile).text()

			// No backslashes in import statements
			const importLines = content.split('\n').filter((line) => line.includes('import'))
			for (const line of importLines) {
				expect(line).not.toContain('\\')
			}

			// Forward slashes in relative imports
			expect(content).toContain("from '../../ports/test-port'")
		})
	})
})
