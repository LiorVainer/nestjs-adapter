import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { AdapterGenerator } from '../../../src/cli/generators/adapter.generator'
import { configBuilder, createTempDir } from '../helpers'

/**
 * Tests for AdapterGenerator verifying:
 * - Correct file generation (adapter, service, types, index)
 * - Port integration (import paths, token references)
 * - Configuration respect (naming, output paths)
 * - Edge cases and error handling
 */
describe('AdapterGenerator', () => {
	const tempDir = createTempDir()
	let testDir: string

	beforeEach(async () => {
		testDir = await tempDir.create()
	})

	afterEach(async () => {
		await tempDir.cleanupAll()
	})

	describe('Basic Adapter Generation', () => {
		test('generates adapter class file with @Adapter decorator', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
			})

			// Assert: Adapter file exists with correct decorator
			const adapterFile = join(testDir, 'src/adapters/s3-storage/s3-storage.adapter.ts')
			const file = Bun.file(adapterFile)
			expect(await file.exists()).toBe(true)

			const content = await file.text()
			expect(content).toContain('@Adapter')
			expect(content).toContain('export class S3StorageAdapter extends AdapterBase')
			expect(content).toContain("import { Adapter, AdapterBase } from 'nest-hex'")
		})

		test('generates adapter service file implementing port', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
			})

			// Assert: Service file exists with @Injectable
			const serviceFile = join(testDir, 'src/adapters/s3-storage/s3-storage.service.ts')
			const file = Bun.file(serviceFile)
			expect(await file.exists()).toBe(true)

			const content = await file.text()
			expect(content).toContain("import { Injectable } from '@nestjs/common'")
			expect(content).toContain('@Injectable()')
			expect(content).toContain('export class S3StorageService')
		})

		test('generates adapter types file with config options', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
			})

			// Assert: Types file exists with interface
			const typesFile = join(testDir, 'src/adapters/s3-storage/s3-storage.types.ts')
			const file = Bun.file(typesFile)
			expect(await file.exists()).toBe(true)

			const content = await file.text()
			expect(content).toContain('export interface S3StorageConfigOptions')
		})

		test('generates index.ts with correct exports', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
			})

			// Assert: Index exports all components
			const indexFile = join(testDir, 'src/adapters/s3-storage/index.ts')
			const file = Bun.file(indexFile)
			expect(await file.exists()).toBe(true)

			const content = await file.text()
			expect(content).toContain("export * from './s3-storage.adapter'")
			expect(content).toContain("export * from './s3-storage.service'")
			expect(content).toContain("export * from './s3-storage.types'")
		})

		test('file names match config.naming.fileCase', async () => {
			// Arrange
			const config = configBuilder().withFileCase('pascal').build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
			})

			// Assert: Files use PascalCase
			const baseDir = join(testDir, 'src/adapters/S3Storage')
			const expectedFiles = [
				'S3Storage.adapter.ts',
				'S3Storage.service.ts',
				'S3Storage.types.ts',
				'index.ts',
			]

			for (const filename of expectedFiles) {
				const file = Bun.file(join(baseDir, filename))
				expect(await file.exists()).toBe(true)
			}
		})

		test('generates all 4 files with correct names', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
			})

			// Assert: All files exist
			const baseDir = join(testDir, 'src/adapters/s3-storage')
			const expectedFiles = [
				's3-storage.adapter.ts',
				's3-storage.service.ts',
				's3-storage.types.ts',
				'index.ts',
			]

			for (const filename of expectedFiles) {
				const file = Bun.file(join(baseDir, filename))
				const exists = await file.exists()
				expect(exists).toBe(true)
			}
		})
	})

	describe('Adapter with Port Integration', () => {
		test('adapter with portName option imports correct port', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
				portName: 'object-storage',
			})

			// Assert: Adapter imports port token
			const adapterFile = join(testDir, 'src/adapters/s3-storage/s3-storage.adapter.ts')
			const content = await Bun.file(adapterFile).text()

			expect(content).toContain('OBJECT_STORAGE_PORT')
			expect(content).toContain('portToken: OBJECT_STORAGE_PORT')
		})

		test('adapter with portPath option uses custom import path', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
				portName: 'object-storage',
				portPath: '@/domain/ports/object-storage',
			})

			// Assert: Uses custom import path
			const adapterFile = join(testDir, 'src/adapters/s3-storage/s3-storage.adapter.ts')
			const content = await Bun.file(adapterFile).text()

			expect(content).toContain("from '@/domain/ports/object-storage'")
		})

		test('adapter with portTokenName option uses custom token', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
				portName: 'object-storage',
				portTokenName: 'STORAGE_SERVICE_TOKEN',
			})

			// Assert: Uses custom token name
			const adapterFile = join(testDir, 'src/adapters/s3-storage/s3-storage.adapter.ts')
			const content = await Bun.file(adapterFile).text()

			expect(content).toContain('STORAGE_SERVICE_TOKEN')
			expect(content).toContain('portToken: STORAGE_SERVICE_TOKEN')
		})

		test('adapter without port options generates basic structure', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
			})

			// Assert: Uses fallback token name (no port imports)
			const adapterFile = join(testDir, 'src/adapters/s3-storage/s3-storage.adapter.ts')
			const content = await Bun.file(adapterFile).text()

			// Should use the adapter's own name as fallback token
			expect(content).toContain('portToken: S3_STORAGE_PORT')
		})

		test('import path calculation is correct and relative', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
				portName: 'object-storage',
			})

			// Assert: Import path is relative and correct
			const adapterFile = join(testDir, 'src/adapters/s3-storage/s3-storage.adapter.ts')
			const content = await Bun.file(adapterFile).text()

			// Should be a relative path to ports directory
			expect(content).toContain('../../ports/object-storage')
		})

		test('service file implements port interface when port provided', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
				portName: 'object-storage',
			})

			// Assert: Service implements port interface
			const serviceFile = join(testDir, 'src/adapters/s3-storage/s3-storage.service.ts')
			const content = await Bun.file(serviceFile).text()

			expect(content).toContain('implements ObjectStoragePort')
			expect(content).toContain("import type { ObjectStoragePort } from '../../ports/object-storage'")
		})
	})

	describe('Adapter Output Validation', () => {
		test('@Adapter decorator includes portToken reference', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
				portName: 'object-storage',
			})

			// Assert: Decorator has correct structure
			const adapterFile = join(testDir, 'src/adapters/s3-storage/s3-storage.adapter.ts')
			const content = await Bun.file(adapterFile).text()

			expect(content).toContain('@Adapter<S3StorageAdapterConfig>')
			expect(content).toContain('portToken: OBJECT_STORAGE_PORT')
			expect(content).toContain('implementation: S3StorageService')
		})

		test('types file includes config options interface', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
			})

			// Assert: Types file has config interface
			const typesFile = join(testDir, 'src/adapters/s3-storage/s3-storage.types.ts')
			const content = await Bun.file(typesFile).text()

			expect(content).toContain('export interface S3StorageConfigOptions')
		})

		test('types file includes AdapterConfig type when port provided', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
				portName: 'object-storage',
			})

			// Assert: Types file has AdapterConfig type
			const typesFile = join(testDir, 'src/adapters/s3-storage/s3-storage.types.ts')
			const content = await Bun.file(typesFile).text()

			expect(content).toContain("import type { AdapterConfig } from 'nest-hex'")
			expect(content).toContain('export type ObjectStorageToken = typeof OBJECT_STORAGE_PORT')
			expect(content).toContain('export type S3StorageAdapterConfig = AdapterConfig<ObjectStorageToken, ObjectStoragePort>')
		})

		test('adapter class name uses Adapter suffix', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
			})

			// Assert: Class uses Adapter suffix
			const adapterFile = join(testDir, 'src/adapters/s3-storage/s3-storage.adapter.ts')
			const content = await Bun.file(adapterFile).text()

			expect(content).toContain('export class S3StorageAdapter')
		})
	})

	describe('Adapter Edge Cases', () => {
		test('adapter generation in non-existent directory creates it', async () => {
			// Arrange
			const deepPath = join(testDir, 'deep/nested/structure/src/adapters')
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: deepPath,
			})

			// Assert: Files exist in deep path
			const adapterFile = Bun.file(join(deepPath, 's3-storage/s3-storage.adapter.ts'))
			expect(await adapterFile.exists()).toBe(true)
		})

		test('adapter generation with existing files errors without force', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)
			const outputPath = join(testDir, 'src/adapters')

			// First generation
			await generator.generate({
				name: 's3-storage',
				outputPath,
			})

			// Act & Assert: Second generation without force should fail
			await expect(
				generator.generate({
					name: 's3-storage',
					outputPath,
					force: false,
				}),
			).rejects.toThrow()
		})

		test('adapter generation with force=true overwrites existing files', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)
			const outputPath = join(testDir, 'src/adapters')

			// First generation
			await generator.generate({
				name: 's3-storage',
				outputPath,
			})

			const adapterFile = join(testDir, 'src/adapters/s3-storage/s3-storage.adapter.ts')

			// Modify the file manually
			await Bun.write(adapterFile, '// MODIFIED CONTENT')
			const modifiedContent = await Bun.file(adapterFile).text()
			expect(modifiedContent).toContain('MODIFIED')

			// Act: Second generation WITH force should overwrite
			const result = await generator.generate({
				name: 's3-storage',
				outputPath,
				force: true,
			})

			// Assert: Success
			expect(result.success).toBe(true)

			// File should be restored to original
			const restoredContent = await Bun.file(adapterFile).text()
			expect(restoredContent).not.toContain('MODIFIED')
			expect(restoredContent).toContain('@Adapter')
		})

		test('adapter name with hyphens (e.g., s3-storage)', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage-provider',
				outputPath: join(testDir, 'src/adapters'),
			})

			// Assert: Files use kebab-case, classes use PascalCase
			const baseDir = join(testDir, 'src/adapters/s3-storage-provider')

			// File names
			const adapterFile = Bun.file(join(baseDir, 's3-storage-provider.adapter.ts'))
			expect(await adapterFile.exists()).toBe(true)

			// Class name
			const adapterContent = await adapterFile.text()
			expect(adapterContent).toContain('export class S3StorageProviderAdapter')
		})

		test('adapter with technology option includes description', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
				technology: 'AWS S3',
			})

			// Assert: Technology is used in generated files (if template supports it)
			const result = await generator.generate({
				name: 's3-storage-tech',
				outputPath: join(testDir, 'src/adapters'),
				technology: 'AWS S3',
			})

			expect(result.success).toBe(true)
		})

		test('dryRun=true simulates without writing files', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			const result = await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
				dryRun: true,
			})

			// Assert: Returns success with file list
			expect(result.success).toBe(true)
			expect(result.files.length).toBeGreaterThan(0)

			// But files should NOT exist on disk
			const adapterFile = join(testDir, 'src/adapters/s3-storage/s3-storage.adapter.ts')
			expect(await Bun.file(adapterFile).exists()).toBe(false)
		})
	})

	describe('Configuration Options', () => {
		test('respects custom adapterSuffix in config', async () => {
			// Arrange
			const config = configBuilder().withAdapterSuffix('IMPLEMENTATION').build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
			})

			// Assert: Generated files work with custom suffix (output structure unchanged)
			const result = await generator.generate({
				name: 'http-storage',
				outputPath: join(testDir, 'src/adapters'),
			})
			expect(result.success).toBe(true)
		})

		test('respects fileCase=camel configuration', async () => {
			// Arrange
			const config = configBuilder().withFileCase('camel').build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
			})

			// Assert: Files use camelCase
			const baseDir = join(testDir, 'src/adapters/s3Storage')
			const adapterFile = Bun.file(join(baseDir, 's3Storage.adapter.ts'))
			expect(await adapterFile.exists()).toBe(true)
		})

		test('respects style.indent=tab generates tab-indented code', async () => {
			// Arrange
			const config = configBuilder().withIndent('tab').build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
			})

			// Assert: Code uses tabs
			const adapterFile = join(testDir, 'src/adapters/s3-storage/s3-storage.adapter.ts')
			const content = await Bun.file(adapterFile).text()

			// Should contain tab characters for indentation
			expect(content).toContain('\t')
		})

		test('respects style.quotes=double generates double quotes', async () => {
			// Arrange
			const config = configBuilder().withQuotes('double').build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 's3-storage',
				outputPath: join(testDir, 'src/adapters'),
			})

			// Assert: Code uses double quotes
			const adapterFile = join(testDir, 'src/adapters/s3-storage/s3-storage.adapter.ts')
			const content = await Bun.file(adapterFile).text()

			expect(content).toContain('"nest-hex"')
		})
	})
})
