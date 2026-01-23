import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { PortGenerator } from '../../../src/cli/generators/port.generator'
import { configBuilder, createTempDir } from '../helpers'

/**
 * Tests for PortGenerator verifying:
 * - Correct file generation (token, interface, service, module, index)
 * - Token naming conventions (PORT suffix)
 * - Component inclusion options (includeModule, includeService)
 * - Configuration respect (naming, output paths)
 */
describe('PortGenerator Output Validation', () => {
	const tempDir = createTempDir()
	let testDir: string

	beforeEach(async () => {
		testDir = await tempDir.create()
	})

	afterEach(async () => {
		await tempDir.cleanupAll()
	})

	describe('complete port module generation', () => {
		test('generates all 5 files with correct names', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'object-storage',
				outputPath: join(testDir, 'src/ports'),
				includeModule: true,
				includeService: true,
			})

			// Assert: All files exist
			const baseDir = join(testDir, 'src/ports/object-storage')
			const expectedFiles = [
				'object-storage.token.ts',
				'object-storage.port.ts',
				'object-storage.service.ts',
				'object-storage.module.ts',
				'index.ts',
			]

			for (const filename of expectedFiles) {
				const file = Bun.file(join(baseDir, filename))
				const exists = await file.exists()
				expect(exists).toBe(true)
			}
		})

		test('token file uses PORT suffix by default', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'object-storage',
				outputPath: join(testDir, 'src/ports'),
			})

			// Assert: Token uses PORT suffix
			const tokenFile = join(testDir, 'src/ports/object-storage/object-storage.token.ts')
			const content = await Bun.file(tokenFile).text()

			expect(content).toContain('OBJECT_STORAGE_PORT')
			expect(content).toContain("Symbol('OBJECT_STORAGE_PORT')")
			expect(content).not.toContain('PROVIDER')

			// Verify export structure
			expect(content).toContain('export const OBJECT_STORAGE_PORT')
			expect(content).toContain('export type ObjectStorageToken = typeof OBJECT_STORAGE_PORT')
		})

		test('interface file has correct structure', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'object-storage',
				outputPath: join(testDir, 'src/ports'),
			})

			// Assert: Interface exists and has proper structure
			const interfaceFile = join(testDir, 'src/ports/object-storage/object-storage.port.ts')
			const content = await Bun.file(interfaceFile).text()

			expect(content).toContain('export interface ObjectStoragePort')
		})

		test('service file uses @InjectPort decorator', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'object-storage',
				outputPath: join(testDir, 'src/ports'),
				includeService: true,
			})

			// Assert: Service uses correct decorator and injection
			const serviceFile = join(testDir, 'src/ports/object-storage/object-storage.service.ts')
			const content = await Bun.file(serviceFile).text()

			expect(content).toContain("import { InjectPort } from 'nest-hex'")
			expect(content).toContain("import { OBJECT_STORAGE_PORT } from './object-storage.token'")
			expect(content).toContain('@InjectPort(OBJECT_STORAGE_PORT)')
			expect(content).toContain('export class ObjectStorageService')
		})

		test('module file extends DomainModule', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'object-storage',
				outputPath: join(testDir, 'src/ports'),
				includeModule: true,
			})

			// Assert: Module extends DomainModule
			const moduleFile = join(testDir, 'src/ports/object-storage/object-storage.module.ts')
			const content = await Bun.file(moduleFile).text()

			expect(content).toContain("import { DomainModule } from 'nest-hex'")
			expect(content).toContain('export class ObjectStorageModule extends DomainModule')
			// TODO: Add portToken to module template
			// expect(content).toContain('portToken: OBJECT_STORAGE_PORT')
		})

		test('index file exports all components', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'object-storage',
				outputPath: join(testDir, 'src/ports'),
				includeModule: true,
				includeService: true,
			})

			// Assert: Index exports token, interface, service, module
			const indexFile = join(testDir, 'src/ports/object-storage/index.ts')
			const content = await Bun.file(indexFile).text()

			expect(content).toContain("export * from './object-storage.token'")
			expect(content).toContain("export * from './object-storage.port'")
			expect(content).toContain("export * from './object-storage.service'")
			expect(content).toContain("export * from './object-storage.module'")
		})
	})

	describe('component inclusion options', () => {
		test('includeModule=false skips module generation', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'object-storage',
				outputPath: join(testDir, 'src/ports'),
				includeModule: false,
				includeService: true,
			})

			// Assert: Module file not created
			const baseDir = join(testDir, 'src/ports/object-storage')
			const moduleFile = Bun.file(join(baseDir, 'object-storage.module.ts'))
			expect(await moduleFile.exists()).toBe(false)

			// Assert: Index doesn't export module
			const indexFile = join(baseDir, 'index.ts')
			const content = await Bun.file(indexFile).text()
			expect(content).not.toContain("export * from './object-storage.module'")
		})

		test('includeService=false skips service generation', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'object-storage',
				outputPath: join(testDir, 'src/ports'),
				includeModule: true,
				includeService: false,
			})

			// Assert: Service file not created
			const baseDir = join(testDir, 'src/ports/object-storage')
			const serviceFile = Bun.file(join(baseDir, 'object-storage.service.ts'))
			expect(await serviceFile.exists()).toBe(false)

			// Assert: Index doesn't export service
			const indexFile = join(baseDir, 'index.ts')
			const content = await Bun.file(indexFile).text()
			expect(content).not.toContain("export * from './object-storage.service'")
		})

		test('minimal generation (no module, no service)', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'object-storage',
				outputPath: join(testDir, 'src/ports'),
				includeModule: false,
				includeService: false,
			})

			// Assert: Only token, interface, and index exist
			const baseDir = join(testDir, 'src/ports/object-storage')
			const expectedFiles = ['object-storage.token.ts', 'object-storage.port.ts', 'index.ts']

			for (const filename of expectedFiles) {
				const file = Bun.file(join(baseDir, filename))
				expect(await file.exists()).toBe(true)
			}

			// Assert: Module and service don't exist
			const moduleFile = Bun.file(join(baseDir, 'object-storage.module.ts'))
			const serviceFile = Bun.file(join(baseDir, 'object-storage.service.ts'))
			expect(await moduleFile.exists()).toBe(false)
			expect(await serviceFile.exists()).toBe(false)
		})
	})

	describe('custom configuration', () => {
		test('respects custom portSuffix', async () => {
			// Arrange
			const config = configBuilder().withPortSuffix('CONTRACT').build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'object-storage',
				outputPath: join(testDir, 'src/ports'),
			})

			// Assert: Token uses CONTRACT suffix
			const tokenFile = join(testDir, 'src/ports/object-storage/object-storage.token.ts')
			const content = await Bun.file(tokenFile).text()

			expect(content).toContain('OBJECT_STORAGE_CONTRACT')
			expect(content).toContain("Symbol('OBJECT_STORAGE_CONTRACT')")
			expect(content).not.toContain('OBJECT_STORAGE_PORT')
		})

		test('respects custom outputPath over config portsDir', async () => {
			// When outputPath is provided, it takes precedence over config.output.portsDir
			// This test validates that providing a custom outputPath works correctly

			// Arrange
			const config = configBuilder().withPortsDir('src/ports').build()
			const generator = new PortGenerator(config)

			// Act - provide explicit custom outputPath
			await generator.generate({
				name: 'object-storage',
				outputPath: join(testDir, 'custom/domain/ports'),
			})

			// Assert: Files created in the explicit outputPath directory
			const expectedDir = join(testDir, 'custom/domain/ports/object-storage')
			const tokenFile = Bun.file(join(expectedDir, 'object-storage.token.ts'))
			expect(await tokenFile.exists()).toBe(true)
		})

		test('respects fileCase=pascal', async () => {
			// File case transformation now implemented in BaseGenerator

			// Arrange
			const config = configBuilder().withFileCase('pascal').build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'object-storage',
				outputPath: join(testDir, 'src/ports'),
			})

			// Assert: Files use PascalCase
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

	describe('edge cases', () => {
		test('creates non-existent parent directories', async () => {
			// Arrange
			const deepPath = join(testDir, 'deep/nested/structure/src/ports')
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'object-storage',
				outputPath: deepPath,
			})

			// Assert: Files exist in deep path
			const tokenFile = Bun.file(join(deepPath, 'object-storage/object-storage.token.ts'))
			expect(await tokenFile.exists()).toBe(true)
		})

		test('handles port name with hyphens', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'object-storage-provider',
				outputPath: join(testDir, 'src/ports'),
			})

			// Assert: Files use kebab-case, classes use PascalCase, tokens use SCREAMING_SNAKE_CASE
			const baseDir = join(testDir, 'src/ports/object-storage-provider')

			// File names
			const tokenFile = Bun.file(join(baseDir, 'object-storage-provider.token.ts'))
			expect(await tokenFile.exists()).toBe(true)

			// Token name
			const tokenContent = await tokenFile.text()
			expect(tokenContent).toContain('OBJECT_STORAGE_PROVIDER_PORT')

			// Interface name
			const interfaceFile = join(baseDir, 'object-storage-provider.port.ts')
			const interfaceContent = await Bun.file(interfaceFile).text()
			expect(interfaceContent).toContain('export interface ObjectStorageProviderPort')
		})

		test('handles port name in PascalCase', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'ObjectStorage',
				outputPath: join(testDir, 'src/ports'),
			})

			// Assert: Files normalized to kebab-case
			const baseDir = join(testDir, 'src/ports/object-storage')
			const tokenFile = Bun.file(join(baseDir, 'object-storage.token.ts'))
			expect(await tokenFile.exists()).toBe(true)

			// Token and class names still correct
			const tokenContent = await tokenFile.text()
			expect(tokenContent).toContain('OBJECT_STORAGE_PORT')
		})

		test('handles port name with underscores', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'object_storage',
				outputPath: join(testDir, 'src/ports'),
			})

			// Assert: Files normalized to kebab-case
			const baseDir = join(testDir, 'src/ports/object-storage')
			const tokenFile = Bun.file(join(baseDir, 'object-storage.token.ts'))
			expect(await tokenFile.exists()).toBe(true)

			// Token should be SCREAMING_SNAKE_CASE
			const tokenContent = await tokenFile.text()
			expect(tokenContent).toContain('OBJECT_STORAGE_PORT')
		})
	})

	describe('Port Generation Options', () => {
		const tempDir = createTempDir()
		let testDir: string

		beforeEach(async () => {
			testDir = await tempDir.create()
		})

		afterEach(async () => {
			await tempDir.cleanupAll()
		})

		test('generateExample=true with registrationType=sync generates sync example', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'payment',
				outputPath: join(testDir, 'src/ports'),
				generateExample: true,
				registrationType: 'sync',
			})

			// Assert: Sync example file exists
			const exampleFile = join(
				testDir,
				'src/ports/payment/payment.sync.example.ts',
			)
			const file = Bun.file(exampleFile)
			expect(await file.exists()).toBe(true)

			const content = await file.text()
			expect(content).toContain('PaymentModule.register')
			expect(content).toContain('Sync registration')
			expect(content).not.toContain('registerAsync')
			expect(content).not.toContain('import { ConfigModule, ConfigService }')
		})

		test('generateExample=true with registrationType=async generates async example', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'payment',
				outputPath: join(testDir, 'src/ports'),
				generateExample: true,
				registrationType: 'async',
			})

			// Assert: Async example file exists
			const exampleFile = join(
				testDir,
				'src/ports/payment/payment.async.example.ts',
			)
			const file = Bun.file(exampleFile)
			expect(await file.exists()).toBe(true)

			const content = await file.text()
			expect(content).toContain('PaymentModule.register')
			expect(content).toContain('registerAsync')
			expect(content).toContain('ConfigService')
			expect(content).toContain('useFactory')
		})

		test('generateExample=false does not generate example files', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'payment',
				outputPath: join(testDir, 'src/ports'),
				generateExample: false,
				registrationType: 'sync',
			})

			// Assert: No example files
			const syncExample = join(
				testDir,
				'src/ports/payment/payment.sync.example.ts',
			)
			const asyncExample = join(
				testDir,
				'src/ports/payment/payment.async.example.ts',
			)

			expect(await Bun.file(syncExample).exists()).toBe(false)
			expect(await Bun.file(asyncExample).exists()).toBe(false)
		})

		test('dryRun=true simulates without writing files', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			const result = await generator.generate({
				name: 'payment',
				outputPath: join(testDir, 'src/ports'),
				dryRun: true,
			})

			// Assert: Returns success with file list
			expect(result.success).toBe(true)
			expect(result.files.length).toBeGreaterThan(0)

			// But files should NOT exist on disk
			const tokenFile = join(testDir, 'src/ports/payment/payment.token.ts')
			expect(await Bun.file(tokenFile).exists()).toBe(false)
		})
	})

	describe('Port File Conflicts', () => {
		const tempDir = createTempDir()
		let testDir: string

		beforeEach(async () => {
			testDir = await tempDir.create()
		})

		afterEach(async () => {
			await tempDir.cleanupAll()
		})

		test('port generation with existing files errors without force', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)
			const outputPath = join(testDir, 'src/ports')

			// First generation
			await generator.generate({
				name: 'payment',
				outputPath,
			})

			// Act & Assert: Second generation without force should fail
			await expect(
				generator.generate({
					name: 'payment',
					outputPath,
					force: false,
				}),
			).rejects.toThrow()
		})

		test('port generation with force=true overwrites existing files', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)
			const outputPath = join(testDir, 'src/ports')

			// First generation
			await generator.generate({
				name: 'payment',
				outputPath,
			})

			const tokenFile = join(testDir, 'src/ports/payment/payment.token.ts')

			// Modify the file manually
			await Bun.write(tokenFile, '// MODIFIED CONTENT')
			const modifiedContent = await Bun.file(tokenFile).text()
			expect(modifiedContent).toContain('MODIFIED')

			// Act: Second generation WITH force should overwrite
			const result = await generator.generate({
				name: 'payment',
				outputPath,
				force: true,
			})

			// Assert: Success
			expect(result.success).toBe(true)

			// File should be restored to original
			const restoredContent = await Bun.file(tokenFile).text()
			expect(restoredContent).not.toContain('MODIFIED')
			expect(restoredContent).toContain('PAYMENT_PORT')
		})
	})
})
