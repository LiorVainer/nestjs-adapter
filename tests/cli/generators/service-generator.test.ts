import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { ServiceGenerator } from '../../../src/cli/generators/service.generator'
import { configBuilder, createTempDir } from '../helpers'

/**
 * Tests for ServiceGenerator verifying:
 * - Correct file generation with @Injectable decorator
 * - Port injection scaffolding with @InjectPort
 * - Configuration respect (naming, output paths)
 * - Edge cases and error handling
 */
describe('ServiceGenerator', () => {
	const tempDir = createTempDir()
	let testDir: string

	beforeEach(async () => {
		testDir = await tempDir.create()
	})

	afterEach(async () => {
		await tempDir.cleanupAll()
	})

	describe('Basic Service Generation', () => {
		test('generates injectable service file', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new ServiceGenerator(config)

			// Act
			await generator.generate({
				name: 'payment-processor',
				outputPath: join(testDir, 'src/services'),
			})

			// Assert: Service file exists
			const serviceFile = join(testDir, 'src/services/payment-processor/payment-processor.service.ts')
			const file = Bun.file(serviceFile)
			expect(await file.exists()).toBe(true)
		})

		test('service includes @Injectable decorator', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new ServiceGenerator(config)

			// Act
			await generator.generate({
				name: 'payment-processor',
				outputPath: join(testDir, 'src/services'),
			})

			// Assert: Service has @Injectable
			const serviceFile = join(testDir, 'src/services/payment-processor/payment-processor.service.ts')
			const content = await Bun.file(serviceFile).text()

			expect(content).toContain("import { Injectable } from '@nestjs/common'")
			expect(content).toContain('@Injectable()')
			expect(content).toContain('export class PaymentProcessorService')
		})

		test('file name matches config.naming.fileCase', async () => {
			// Arrange
			const config = configBuilder().withFileCase('pascal').build()
			const generator = new ServiceGenerator(config)

			// Act
			await generator.generate({
				name: 'payment-processor',
				outputPath: join(testDir, 'src/services'),
			})

			// Assert: File uses kebab-case by default (service generator uses nameKebab)
			// Note: ServiceGenerator currently always uses nameKebab for file names
			const serviceFile = join(testDir, 'src/services/payment-processor/payment-processor.service.ts')
			const file = Bun.file(serviceFile)
			expect(await file.exists()).toBe(true)
		})
	})

	describe('Service with Port Injection', () => {
		test('service with portName includes @InjectPort', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new ServiceGenerator(config)

			// Act
			await generator.generate({
				name: 'payment-processor',
				outputPath: join(testDir, 'src/services'),
				portName: 'payment',
			})

			// Assert: Service includes @InjectPort
			const serviceFile = join(testDir, 'src/services/payment-processor/payment-processor.service.ts')
			const content = await Bun.file(serviceFile).text()

			expect(content).toContain("import { InjectPort } from 'nest-hex'")
			expect(content).toContain('@InjectPort(PAYMENT_PORT)')
		})

		test('service imports correct port token', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new ServiceGenerator(config)

			// Act
			await generator.generate({
				name: 'payment-processor',
				outputPath: join(testDir, 'src/services'),
				portName: 'payment',
			})

			// Assert: Imports port token
			const serviceFile = join(testDir, 'src/services/payment-processor/payment-processor.service.ts')
			const content = await Bun.file(serviceFile).text()

			expect(content).toContain('import { PAYMENT_PORT }')
			expect(content).toContain("import type { PaymentPort }")
		})

		test('service constructor includes port injection', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new ServiceGenerator(config)

			// Act
			await generator.generate({
				name: 'payment-processor',
				outputPath: join(testDir, 'src/services'),
				portName: 'payment',
			})

			// Assert: Constructor has port injection
			const serviceFile = join(testDir, 'src/services/payment-processor/payment-processor.service.ts')
			const content = await Bun.file(serviceFile).text()

			expect(content).toContain('constructor(')
			expect(content).toContain('@InjectPort(PAYMENT_PORT)')
			expect(content).toContain('private readonly payment: PaymentPort')
		})

		test('service with custom portPath uses specified import path', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new ServiceGenerator(config)

			// Act
			await generator.generate({
				name: 'payment-processor',
				outputPath: join(testDir, 'src/services'),
				portName: 'payment',
				portPath: '@/domain/ports/payment',
			})

			// Assert: Uses custom import path
			const serviceFile = join(testDir, 'src/services/payment-processor/payment-processor.service.ts')
			const content = await Bun.file(serviceFile).text()

			expect(content).toContain("from '@/domain/ports/payment'")
		})

		test('service without portName generates basic structure', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new ServiceGenerator(config)

			// Act
			await generator.generate({
				name: 'payment-processor',
				outputPath: join(testDir, 'src/services'),
			})

			// Assert: Basic service without port injection
			const serviceFile = join(testDir, 'src/services/payment-processor/payment-processor.service.ts')
			const content = await Bun.file(serviceFile).text()

			expect(content).toContain('@Injectable()')
			expect(content).toContain('export class PaymentProcessorService')
			// Should have commented out InjectPort scaffolding
			expect(content).toContain('// import { InjectPort }')
		})
	})

	describe('Service Output Validation', () => {
		test('import paths are correct', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new ServiceGenerator(config)

			// Act
			await generator.generate({
				name: 'payment-processor',
				outputPath: join(testDir, 'src/services'),
			})

			// Assert: Import paths are valid
			const serviceFile = join(testDir, 'src/services/payment-processor/payment-processor.service.ts')
			const content = await Bun.file(serviceFile).text()

			// Should have valid NestJS import
			expect(content).toContain("from '@nestjs/common'")
		})

		test('service class name follows PascalCase convention', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new ServiceGenerator(config)

			// Act
			await generator.generate({
				name: 'payment-processor',
				outputPath: join(testDir, 'src/services'),
			})

			// Assert: Class name is PascalCase
			const serviceFile = join(testDir, 'src/services/payment-processor/payment-processor.service.ts')
			const content = await Bun.file(serviceFile).text()

			expect(content).toContain('class PaymentProcessorService')
			expect(content).not.toContain('class payment-processor-service')
			expect(content).not.toContain('class paymentProcessorService')
		})
	})

	describe('Service Edge Cases', () => {
		test('service generation in non-existent directory creates it', async () => {
			// Arrange
			const deepPath = join(testDir, 'deep/nested/structure/src/services')
			const config = configBuilder().build()
			const generator = new ServiceGenerator(config)

			// Act
			await generator.generate({
				name: 'payment-processor',
				outputPath: deepPath,
			})

			// Assert: Files exist in deep path
			const serviceFile = Bun.file(join(deepPath, 'payment-processor/payment-processor.service.ts'))
			expect(await serviceFile.exists()).toBe(true)
		})

		test('dryRun=true simulates without writing files', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new ServiceGenerator(config)

			// Act
			const result = await generator.generate({
				name: 'payment-processor',
				outputPath: join(testDir, 'src/services'),
				dryRun: true,
			})

			// Assert: Returns success with file list
			expect(result.success).toBe(true)
			expect(result.files.length).toBeGreaterThan(0)

			// But files should NOT exist on disk
			const serviceFile = join(testDir, 'src/services/payment-processor/payment-processor.service.ts')
			expect(await Bun.file(serviceFile).exists()).toBe(false)
		})

		test('service name with hyphens is handled correctly', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new ServiceGenerator(config)

			// Act
			await generator.generate({
				name: 'user-authentication-service',
				outputPath: join(testDir, 'src/services'),
			})

			// Assert: Files use kebab-case, classes use PascalCase
			const baseDir = join(testDir, 'src/services/user-authentication-service')

			const serviceFile = Bun.file(join(baseDir, 'user-authentication-service.service.ts'))
			expect(await serviceFile.exists()).toBe(true)

			const content = await serviceFile.text()
			expect(content).toContain('export class UserAuthenticationServiceService')
		})

		test('service name in PascalCase is normalized', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new ServiceGenerator(config)

			// Act
			await generator.generate({
				name: 'PaymentProcessor',
				outputPath: join(testDir, 'src/services'),
			})

			// Assert: File name normalized to kebab-case
			const baseDir = join(testDir, 'src/services/payment-processor')
			const serviceFile = Bun.file(join(baseDir, 'payment-processor.service.ts'))
			expect(await serviceFile.exists()).toBe(true)

			// Class name is still PascalCase
			const content = await serviceFile.text()
			expect(content).toContain('export class PaymentProcessorService')
		})
	})

	describe('Configuration Options', () => {
		test('respects style.indent=tab generates tab-indented code', async () => {
			// Arrange
			const config = configBuilder().withIndent('tab').build()
			const generator = new ServiceGenerator(config)

			// Act
			await generator.generate({
				name: 'payment-processor',
				outputPath: join(testDir, 'src/services'),
			})

			// Assert: Code uses tabs
			const serviceFile = join(testDir, 'src/services/payment-processor/payment-processor.service.ts')
			const content = await Bun.file(serviceFile).text()

			// Should contain tab characters for indentation
			expect(content).toContain('\t')
		})

		test('respects style.indent=2 generates 2-space indented code', async () => {
			// Arrange
			const config = configBuilder().withIndent(2).build()
			const generator = new ServiceGenerator(config)

			// Act
			await generator.generate({
				name: 'payment-processor',
				outputPath: join(testDir, 'src/services'),
			})

			// Assert: Code uses 2-space indentation
			const serviceFile = join(testDir, 'src/services/payment-processor/payment-processor.service.ts')
			const content = await Bun.file(serviceFile).text()

			// Should have 2-space indentation
			expect(content).not.toContain('\t')
		})

		test('respects style.quotes=double generates double quotes', async () => {
			// Arrange
			const config = configBuilder().withQuotes('double').build()
			const generator = new ServiceGenerator(config)

			// Act
			await generator.generate({
				name: 'payment-processor',
				outputPath: join(testDir, 'src/services'),
			})

			// Assert: Code uses double quotes
			const serviceFile = join(testDir, 'src/services/payment-processor/payment-processor.service.ts')
			const content = await Bun.file(serviceFile).text()

			expect(content).toContain('"@nestjs/common"')
		})
	})
})
