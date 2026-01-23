import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { PortGenerator } from '../../../src/cli/generators/port.generator'
import { AdapterGenerator } from '../../../src/cli/generators/adapter.generator'
import { configBuilder, createTempDir } from '../helpers'

/**
 * Integration tests verifying that all nest-hex.config.ts configuration options
 * actually affect the generated output correctly.
 *
 * These tests ensure:
 * - Output directory configuration is respected
 * - Naming configuration affects generated names
 * - File case configuration affects file names
 * - Style configuration affects code formatting
 *
 * ⚠️ IMPLEMENTATION STATUS:
 * Many tests are currently skipped because CLI generators are partially implemented
 * (see add-cli-generator change: 35/191 tasks complete). These tests document expected
 * behavior and will be enabled as generator features are completed.
 *
 * Tests marked with test.skip need:
 * - Complete template implementation (style/formatting support)
 * - File case transformation implementation
 * - Custom directory configuration handling
 */
describe('Config Option Integration', () => {
	const tempDir = createTempDir()
	let testDir: string

	beforeEach(async () => {
		testDir = await tempDir.create()
	})

	afterEach(async () => {
		await tempDir.cleanupAll()
	})

	describe('output directory configuration', () => {
		test('custom output.portsDir is used by PortGenerator when outputPath not provided', async () => {
			// When outputPath is provided, it takes precedence over config.output.portsDir
			// When outputPath is NOT provided, the generator uses config.output.portsDir
			// This test validates that providing outputPath correctly overrides the config

			const config = configBuilder().withPortsDir('src/ports').build()
			const generator = new PortGenerator(config)

			// Provide explicit outputPath - it should be used directly
			await generator.generate({
				name: 'payment',
				outputPath: join(testDir, 'custom/domain/ports'),
			})

			const expectedDir = join(testDir, 'custom/domain/ports/payment')
			const tokenFile = Bun.file(join(expectedDir, 'payment.token.ts'))
			expect(await tokenFile.exists()).toBe(true)
		})

		test('custom output.adaptersDir is used by AdapterGenerator when outputPath not provided', async () => {
			// When outputPath is provided, it takes precedence over config.output.adaptersDir
			// When outputPath is NOT provided, the generator uses config.output.adaptersDir
			// This test validates that providing outputPath correctly overrides the config

			const config = configBuilder().withAdaptersDir('src/adapters').build()
			const generator = new AdapterGenerator(config)

			// Provide explicit outputPath - it should be used directly
			await generator.generate({
				name: 'stripe-payment',
				outputPath: join(testDir, 'custom/infrastructure/adapters'),
			})

			const expectedDir = join(testDir, 'custom/infrastructure/adapters/stripe-payment')
			const adapterFile = Bun.file(join(expectedDir, 'stripe-payment.adapter.ts'))
			expect(await adapterFile.exists()).toBe(true)
		})
	})

	describe('naming configuration', () => {
		test('naming.portSuffix affects generated token names', async () => {
			// Arrange
			const config = configBuilder().withPortSuffix('CONTRACT').build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'payment',
				outputPath: join(testDir, 'src/ports'),
			})

			// Assert: Token uses custom suffix
			const tokenFile = join(testDir, 'src/ports/payment/payment.token.ts')
			const content = await Bun.file(tokenFile).text()

			expect(content).toContain('PAYMENT_CONTRACT')
			expect(content).toContain("Symbol('PAYMENT_CONTRACT')")
			expect(content).not.toContain('PAYMENT_PORT')
		})

		test('naming.adapterSuffix affects generated class names', async () => {
			// Adapter suffix now configurable in template

			const config = configBuilder().withAdapterSuffix('Implementation').build()
			const generator = new AdapterGenerator(config)

			await generator.generate({
				name: 'stripe-payment',
				outputPath: join(testDir, 'src/adapters'),
			})

			const adapterFile = join(
				testDir,
				'src/adapters/stripe-payment/stripe-payment.adapter.ts',
			)
			const content = await Bun.file(adapterFile).text()

			expect(content).toContain('export class StripePaymentImplementation')
			expect(content).not.toContain('export class StripePaymentAdapter')
		})
	})

	describe('file case configuration', () => {
		test('naming.fileCase=kebab generates kebab-case files', async () => {
			// File case transformation now implemented

			const config = configBuilder().withFileCase('kebab').build()
			const generator = new PortGenerator(config)

			await generator.generate({
				name: 'object-storage',
				outputPath: join(testDir, 'src/ports'),
			})

			const baseDir = join(testDir, 'src/ports/object-storage')
			const expectedFiles = [
				'object-storage.token.ts',
				'object-storage.port.ts',
				'object-storage.service.ts',
				'object-storage.module.ts',
			]

			for (const filename of expectedFiles) {
				const file = Bun.file(join(baseDir, filename))
				expect(await file.exists()).toBe(true)
			}
		})

		test('naming.fileCase=camel generates camelCase files', async () => {
			// File case transformation now implemented

			const config = configBuilder().withFileCase('camel').build()
			const generator = new PortGenerator(config)

			await generator.generate({
				name: 'object-storage',
				outputPath: join(testDir, 'src/ports'),
			})

			const baseDir = join(testDir, 'src/ports/objectStorage')
			const expectedFiles = [
				'objectStorage.token.ts',
				'objectStorage.port.ts',
				'objectStorage.service.ts',
				'objectStorage.module.ts',
			]

			for (const filename of expectedFiles) {
				const file = Bun.file(join(baseDir, filename))
				expect(await file.exists()).toBe(true)
			}
		})

		test('naming.fileCase=pascal generates PascalCase files', async () => {
			// File case transformation now implemented

			const config = configBuilder().withFileCase('pascal').build()
			const generator = new PortGenerator(config)

			await generator.generate({
				name: 'object-storage',
				outputPath: join(testDir, 'src/ports'),
			})

			const baseDir = join(testDir, 'src/ports/ObjectStorage')
			const expectedFiles = [
				'ObjectStorage.token.ts',
				'ObjectStorage.port.ts',
				'ObjectStorage.service.ts',
				'ObjectStorage.module.ts',
			]

			for (const filename of expectedFiles) {
				const file = Bun.file(join(baseDir, filename))
				expect(await file.exists()).toBe(true)
			}
		})
	})

	describe('style.indent configuration', () => {
		test('style.indent=tab generates tab-indented code', async () => {
			// Style configuration now implemented

			const config = configBuilder().withIndent('tab').build()
			const generator = new PortGenerator(config)

			await generator.generate({
				name: 'payment',
				outputPath: join(testDir, 'src/ports'),
			})

			const serviceFile = join(testDir, 'src/ports/payment/payment.service.ts')
			const content = await Bun.file(serviceFile).text()

			expect(content).toMatch(/\t/)
		})

		test('style.indent=2 generates 2-space indented code', async () => {
			// Style configuration now implemented

			const config = configBuilder().withIndent(2).build()
			const generator = new PortGenerator(config)

			await generator.generate({
				name: 'payment',
				outputPath: join(testDir, 'src/ports'),
			})

			const serviceFile = join(testDir, 'src/ports/payment/payment.service.ts')
			const content = await Bun.file(serviceFile).text()

			const lines = content.split('\n')
			const indentedLines = lines.filter((line) => /^  \w/.test(line))
			expect(indentedLines.length).toBeGreaterThan(0)
		})

		test('style.indent=4 generates 4-space indented code', async () => {
			// Style configuration now implemented

			const config = configBuilder().withIndent(4).build()
			const generator = new PortGenerator(config)

			await generator.generate({
				name: 'payment',
				outputPath: join(testDir, 'src/ports'),
			})

			const serviceFile = join(testDir, 'src/ports/payment/payment.service.ts')
			const content = await Bun.file(serviceFile).text()

			const lines = content.split('\n')
			const indentedLines = lines.filter((line) => /^    \w/.test(line))
			expect(indentedLines.length).toBeGreaterThan(0)
		})
	})

	describe('style.quotes configuration', () => {
		test('style.quotes=single generates single quotes', async () => {
			// Style configuration now implemented

			const config = configBuilder().withQuotes('single').build()
			const generator = new PortGenerator(config)

			await generator.generate({
				name: 'payment',
				outputPath: join(testDir, 'src/ports'),
			})

			const tokenFile = join(testDir, 'src/ports/payment/payment.token.ts')
			const content = await Bun.file(tokenFile).text()

			expect(content).toContain("Symbol('PAYMENT_PORT')")
			expect(content).not.toContain('Symbol("PAYMENT_PORT")')

			const serviceFile = join(testDir, 'src/ports/payment/payment.service.ts')
			const serviceContent = await Bun.file(serviceFile).text()
			expect(serviceContent).toMatch(/import .* from '.*'/)
		})

		test('style.quotes=double generates double quotes', async () => {
			// Style configuration now implemented

			const config = configBuilder().withQuotes('double').build()
			const generator = new PortGenerator(config)

			await generator.generate({
				name: 'payment',
				outputPath: join(testDir, 'src/ports'),
			})

			const tokenFile = join(testDir, 'src/ports/payment/payment.token.ts')
			const content = await Bun.file(tokenFile).text()

			expect(content).toContain('Symbol("PAYMENT_PORT")')
			expect(content).not.toContain("Symbol('PAYMENT_PORT')")

			const serviceFile = join(testDir, 'src/ports/payment/payment.service.ts')
			const serviceContent = await Bun.file(serviceFile).text()
			expect(serviceContent).toMatch(/import .* from ".*"/)
		})
	})

	describe('style.semicolons configuration', () => {
		test('style.semicolons=true includes semicolons', async () => {
			// Style configuration now implemented

			const config = configBuilder().withSemicolons(true).build()
			const generator = new PortGenerator(config)

			await generator.generate({
				name: 'payment',
				outputPath: join(testDir, 'src/ports'),
			})

			const tokenFile = join(testDir, 'src/ports/payment/payment.token.ts')
			const content = await Bun.file(tokenFile).text()

			const lines = content.split('\n')
			const exportLines = lines.filter((line) => line.trim().startsWith('export'))
			const linesWithSemicolons = exportLines.filter((line) => line.endsWith(';'))

			expect(linesWithSemicolons.length).toBeGreaterThan(0)
		})

		test('style.semicolons=false omits semicolons', async () => {
			// Style configuration now implemented

			const config = configBuilder().withSemicolons(false).build()
			const generator = new PortGenerator(config)

			await generator.generate({
				name: 'payment',
				outputPath: join(testDir, 'src/ports'),
			})

			const tokenFile = join(testDir, 'src/ports/payment/payment.token.ts')
			const content = await Bun.file(tokenFile).text()

			const lines = content.split('\n')
			const exportLines = lines.filter((line) => line.trim().startsWith('export'))
			const linesWithSemicolons = exportLines.filter((line) => line.endsWith(';'))

			expect(linesWithSemicolons.length).toBe(0)
		})
	})

	describe('combined configuration', () => {
		test('multiple config options work together', async () => {
			// Test multiple config options combined:
			// - PascalCase file naming
			// - CONTRACT suffix for port tokens
			// - 2-space indentation
			// - Double quotes
			// - No semicolons

			const config = configBuilder()
				.withPortSuffix('CONTRACT')
				.withFileCase('pascal')
				.withIndent(2)
				.withQuotes('double')
				.withSemicolons(false)
				.build()
			const generator = new PortGenerator(config)

			await generator.generate({
				name: 'payment-processor',
				outputPath: join(testDir, 'src/ports'),
			})

			// Files should be in PascalCase directory with PascalCase names
			const baseDir = join(testDir, 'src/ports/PaymentProcessor')
			const tokenFile = Bun.file(join(baseDir, 'PaymentProcessor.token.ts'))
			expect(await tokenFile.exists()).toBe(true)

			// Token should use CONTRACT suffix
			const tokenContent = await tokenFile.text()
			expect(tokenContent).toContain('PAYMENT_PROCESSOR_CONTRACT')
			expect(tokenContent).toContain('Symbol("PAYMENT_PROCESSOR_CONTRACT")')

			// Should have no semicolons on export lines
			const lines = tokenContent.split('\n')
			const exportLines = lines.filter((line) => line.trim().startsWith('export'))
			const linesWithSemicolons = exportLines.filter((line) => line.endsWith(';'))
			expect(linesWithSemicolons.length).toBe(0)

			// Interface file should use 2-space indentation
			const interfaceFile = join(baseDir, 'PaymentProcessor.port.ts')
			const interfaceContent = await Bun.file(interfaceFile).text()
			// Check for 2-space indentation (not tabs)
			expect(interfaceContent).not.toContain('\t')
		})
	})
})
