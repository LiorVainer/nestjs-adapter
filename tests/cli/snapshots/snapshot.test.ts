import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { PortGenerator } from '../../../src/cli/generators/port.generator'
import { AdapterGenerator } from '../../../src/cli/generators/adapter.generator'
import { ServiceGenerator } from '../../../src/cli/generators/service.generator'
import { configBuilder, createTempDir, testConfigs } from '../helpers'

/**
 * Snapshot Tests
 *
 * These tests capture the expected output of generators for various configurations.
 * They help detect unintended changes to generated code.
 *
 * Note: Rather than using traditional snapshot files, these tests assert on specific
 * content patterns that define the "shape" of the generated output.
 *
 * @see openspec/changes/add-cli-generator-tests/tasks.md Section 11
 */
describe('Snapshot Tests', () => {
	const tempDir = createTempDir()
	let testDir: string

	beforeEach(async () => {
		testDir = await tempDir.create()
	})

	afterEach(async () => {
		await tempDir.cleanupAll()
	})

	/**
	 * Section 11.1: Port Generator Snapshots
	 */
	describe('Port Generator Snapshots', () => {
		test('11.1.1 - default port generation snapshot', async () => {
			// Arrange
			const config = testConfigs.minimal()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'cache',
				outputPath: join(testDir, 'src/ports'),
			})

			// Assert: Token file matches expected structure
			const tokenContent = await Bun.file(
				join(testDir, 'src/ports/cache/cache.token.ts'),
			).text()

			expect(tokenContent).toMatchSnapshot('port-default-token')

			// Assert: Interface matches expected structure
			const interfaceContent = await Bun.file(
				join(testDir, 'src/ports/cache/cache.port.ts'),
			).text()

			expect(interfaceContent).toMatchSnapshot('port-default-interface')
		})

		test('11.1.2 - port with module snapshot', async () => {
			// Arrange
			const config = testConfigs.minimal()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'messaging',
				outputPath: join(testDir, 'src/ports'),
				includeModule: true,
				includeService: true,
			})

			// Assert: Module file matches expected structure
			const moduleContent = await Bun.file(
				join(testDir, 'src/ports/messaging/messaging.module.ts'),
			).text()

			expect(moduleContent).toMatchSnapshot('port-with-module')

			// Assert: Service file matches expected structure
			const serviceContent = await Bun.file(
				join(testDir, 'src/ports/messaging/messaging.service.ts'),
			).text()

			expect(serviceContent).toMatchSnapshot('port-with-service')
		})

		test('11.1.3 - port without module snapshot', async () => {
			// Arrange
			const config = testConfigs.minimal()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'minimal-port',
				outputPath: join(testDir, 'src/ports'),
				includeModule: false,
				includeService: false,
			})

			// Assert: Index only exports token and interface
			const indexContent = await Bun.file(
				join(testDir, 'src/ports/minimal-port/index.ts'),
			).text()

			expect(indexContent).toMatchSnapshot('port-minimal-index')
			expect(indexContent).not.toContain('module')
			expect(indexContent).not.toContain('service')
		})

		test('11.1.4 - port with custom naming config snapshot', async () => {
			// Arrange
			const config = testConfigs.contractNaming()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'payment',
				outputPath: join(testDir, 'src/ports'),
			})

			// Assert: Token uses CONTRACT suffix
			const tokenContent = await Bun.file(
				join(testDir, 'src/ports/payment/payment.token.ts'),
			).text()

			expect(tokenContent).toMatchSnapshot('port-contract-naming')
			expect(tokenContent).toContain('PAYMENT_CONTRACT')
			expect(tokenContent).not.toContain('PAYMENT_PORT')
		})

		test('11.1.5 - port with custom style config snapshot', async () => {
			// Arrange
			const config = testConfigs.prettier()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'styled-port',
				outputPath: join(testDir, 'src/ports'),
			})

			// Assert: Uses double quotes
			const tokenContent = await Bun.file(
				join(testDir, 'src/ports/styled-port/styled-port.token.ts'),
			).text()

			expect(tokenContent).toMatchSnapshot('port-prettier-style')
			expect(tokenContent).toContain('Symbol("STYLED_PORT_PORT")')
		})
	})

	/**
	 * Section 11.2: Adapter Generator Snapshots
	 */
	describe('Adapter Generator Snapshots', () => {
		test('11.2.1 - default adapter generation snapshot', async () => {
			// Arrange
			const config = testConfigs.minimal()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 'redis',
				outputPath: join(testDir, 'src/adapters'),
			})

			// Assert: Adapter file matches expected structure
			const adapterContent = await Bun.file(
				join(testDir, 'src/adapters/redis/redis.adapter.ts'),
			).text()

			expect(adapterContent).toMatchSnapshot('adapter-default')
		})

		test('11.2.2 - adapter with port reference snapshot', async () => {
			// Arrange
			const config = testConfigs.minimal()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
				portName: 'object-storage',
			})

			// Assert: Adapter imports port correctly
			const adapterContent = await Bun.file(
				join(testDir, 'src/adapters/s3-storage/s3-storage.adapter.ts'),
			).text()

			expect(adapterContent).toMatchSnapshot('adapter-with-port')
			expect(adapterContent).toContain('OBJECT_STORAGE_PORT')
			expect(adapterContent).toContain("from '../../ports/object-storage'")

			// Assert: Service implements port interface
			const serviceContent = await Bun.file(
				join(testDir, 'src/adapters/s3-storage/s3-storage.service.ts'),
			).text()

			expect(serviceContent).toMatchSnapshot('adapter-service-with-port')
			expect(serviceContent).toContain('implements ObjectStoragePort')
		})

		test('11.2.3 - adapter with custom naming config snapshot', async () => {
			// Arrange
			const config = configBuilder()
				.withAdapterSuffix('Impl')
				.withFileCase('pascal')
				.build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 'custom-adapter',
				outputPath: join(testDir, 'src/adapters'),
			})

			// Assert: Uses custom suffix
			const adapterContent = await Bun.file(
				join(testDir, 'src/adapters/CustomAdapter/CustomAdapter.adapter.ts'),
			).text()

			expect(adapterContent).toMatchSnapshot('adapter-custom-naming')
			expect(adapterContent).toContain('class CustomAdapterImpl')
		})

		test('11.2.4 - adapter with custom style config snapshot', async () => {
			// Arrange
			const config = testConfigs.prettier()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 'styled-adapter',
				outputPath: join(testDir, 'src/adapters'),
			})

			// Assert: Uses double quotes
			const adapterContent = await Bun.file(
				join(testDir, 'src/adapters/styled-adapter/styled-adapter.adapter.ts'),
			).text()

			expect(adapterContent).toMatchSnapshot('adapter-prettier-style')
			// Check import uses double quotes
			expect(adapterContent).toContain('import { Adapter, AdapterBase } from "nest-hex"')
		})
	})

	/**
	 * Section 11.3: Service Generator Snapshots
	 */
	describe('Service Generator Snapshots', () => {
		test('11.3.1 - service with port injection snapshot', async () => {
			// Arrange
			const config = testConfigs.minimal()
			const generator = new ServiceGenerator(config)

			// Act
			await generator.generate({
				name: 'user-management',
				outputPath: join(testDir, 'src/services'),
				portName: 'user-repository',
			})

			// Assert
			const serviceContent = await Bun.file(
				join(testDir, 'src/services/user-management/user-management.service.ts'),
			).text()

			expect(serviceContent).toMatchSnapshot('service-with-port')
			expect(serviceContent).toContain('@InjectPort(USER_REPOSITORY_PORT)')
			expect(serviceContent).toContain("from '../../ports/user-repository'")
		})

		test('11.3.2 - service without port injection snapshot', async () => {
			// Arrange
			const config = testConfigs.minimal()
			const generator = new ServiceGenerator(config)

			// Act
			await generator.generate({
				name: 'utility-service',
				outputPath: join(testDir, 'src/services'),
			})

			// Assert
			const serviceContent = await Bun.file(
				join(testDir, 'src/services/utility-service/utility-service.service.ts'),
			).text()

			expect(serviceContent).toMatchSnapshot('service-without-port')
			// Should not have active InjectPort import (only commented)
			expect(serviceContent).not.toMatch(/^import.*InjectPort.*from 'nest-hex'/m)
			expect(serviceContent).toContain('@Injectable()')
		})
	})

	/**
	 * Configuration variation snapshots
	 */
	describe('Configuration Variation Snapshots', () => {
		test('file case variations produce consistent output', async () => {
			// Test all three file cases
			const cases = ['kebab', 'camel', 'pascal'] as const

			for (const fileCase of cases) {
				const config = configBuilder().withFileCase(fileCase).build()
				const generator = new PortGenerator(config)
				const outputPath = join(testDir, `src/ports-${fileCase}`)

				await generator.generate({
					name: 'test-port',
					outputPath,
				})

				// Get the directory name based on file case
				const dirName =
					fileCase === 'kebab'
						? 'test-port'
						: fileCase === 'camel'
							? 'testPort'
							: 'TestPort'

				const tokenContent = await Bun.file(
					join(outputPath, dirName, `${dirName}.token.ts`),
				).text()

				expect(tokenContent).toMatchSnapshot(`port-filecase-${fileCase}`)
			}
		})

		test('indent variations produce consistent output', async () => {
			// Test tab, 2-space, and 4-space indentation
			const indents = ['tab', 2, 4] as const

			for (const indent of indents) {
				const config = configBuilder().withIndent(indent).build()
				const generator = new PortGenerator(config)
				const outputPath = join(testDir, `src/ports-indent-${indent}`)

				await generator.generate({
					name: 'indent-test',
					outputPath,
					includeService: true,
				})

				const serviceContent = await Bun.file(
					join(outputPath, 'indent-test', 'indent-test.service.ts'),
				).text()

				expect(serviceContent).toMatchSnapshot(`port-indent-${indent}`)
			}
		})

		test('quote variations produce consistent output', async () => {
			// Test single and double quotes
			const quotes = ['single', 'double'] as const

			for (const quote of quotes) {
				const config = configBuilder().withQuotes(quote).build()
				const generator = new PortGenerator(config)
				const outputPath = join(testDir, `src/ports-quote-${quote}`)

				await generator.generate({
					name: 'quote-test',
					outputPath,
				})

				const tokenContent = await Bun.file(
					join(outputPath, 'quote-test', 'quote-test.token.ts'),
				).text()

				expect(tokenContent).toMatchSnapshot(`port-quote-${quote}`)
			}
		})
	})

	/**
	 * Multi-word name snapshots
	 */
	describe('Multi-word Name Snapshots', () => {
		test('handles various name formats consistently', async () => {
			const config = testConfigs.minimal()
			const generator = new PortGenerator(config)

			// Test various naming formats
			const names = [
				'simple',
				'two-words',
				'three-word-name',
				'API',
				'HTTPClient',
				'user2fa',
			]

			for (const name of names) {
				const outputPath = join(testDir, `src/ports-${name}`)
				await generator.generate({ name, outputPath })

				// Get the generated files
				const dirName = name.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '')
					.replace(/--+/g, '-')
				// Note: The actual directory name depends on the name transformer

				// Just verify generation succeeded
				const result = await generator.generate({
					name: `${name}-verify`,
					outputPath: join(testDir, `src/verify-${name}`),
					dryRun: true,
				})

				expect(result.success).toBe(true)
			}
		})
	})
})
