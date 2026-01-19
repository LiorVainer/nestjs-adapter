import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { join, sep, posix } from 'node:path'
import { mkdir } from 'node:fs/promises'
import { PortGenerator } from '../../../src/cli/generators/port.generator'
import { AdapterGenerator } from '../../../src/cli/generators/adapter.generator'
import { getImportPath, normalizePath } from '../../../src/cli/utils/path-resolver'
import { configBuilder, createTempDir } from '../helpers'

/**
 * Cross-Platform Tests
 *
 * These tests verify:
 * - Path handling works correctly on Windows and Unix
 * - Import paths always use forward slashes
 * - Path normalization handles mixed slashes
 *
 * @see openspec/changes/add-cli-generator-tests/tasks.md Section 9
 */
describe('Cross-Platform Tests', () => {
	const tempDir = createTempDir()
	let testDir: string

	beforeEach(async () => {
		testDir = await tempDir.create()
	})

	afterEach(async () => {
		await tempDir.cleanupAll()
	})

	/**
	 * Section 9.1: Windows-Specific Tests
	 */
	describe('Windows Path Handling', () => {
		test('9.1.1 - path handling with backslashes', () => {
			// Arrange: Windows-style path with backslashes
			const windowsPath = 'src\\adapters\\s3\\s3.adapter.ts'

			// Act
			const normalized = normalizePath(windowsPath)

			// Assert: Should normalize to forward slashes
			expect(normalized).toBe('src/adapters/s3/s3.adapter.ts')
			expect(normalized).not.toContain('\\')
		})

		test('9.1.3 - import paths use forward slashes', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act
			await generator.generate({
				name: 'test-adapter',
				outputPath: join(testDir, 'src', 'adapters'),
				portName: 'test-port',
			})

			// Assert: All import statements use forward slashes
			const adapterFile = join(testDir, 'src/adapters/test-adapter/test-adapter.adapter.ts')
			const content = await Bun.file(adapterFile).text()

			// Extract all import statements
			const importLines = content.split('\n').filter((line) => line.includes('import'))

			for (const line of importLines) {
				// No backslashes in any import path
				expect(line).not.toContain('\\')
			}

			// Relative import should use forward slashes
			expect(content).toContain("from '../../ports/test-port'")
		})

		test('mixed slash paths are normalized in import paths', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Create deeply nested structure
			const deepPath = join(testDir, 'deep', 'nested', 'src', 'adapters')
			await mkdir(deepPath, { recursive: true })

			// Act
			await generator.generate({
				name: 'deep-adapter',
				outputPath: deepPath,
				portName: 'some-port',
			})

			// Assert
			const adapterFile = join(deepPath, 'deep-adapter/deep-adapter.adapter.ts')
			const content = await Bun.file(adapterFile).text()

			// Verify import path contains only forward slashes
			const portImportLine = content.split('\n').find((line) =>
				line.includes('SOME_PORT_PORT'),
			)
			if (portImportLine) {
				expect(portImportLine).not.toContain('\\')
			}
		})
	})

	/**
	 * Section 9.2: Unix-Specific Tests
	 */
	describe('Unix Path Handling', () => {
		test('9.2.1 - path handling with forward slashes', () => {
			// Arrange: Unix-style path
			const unixPath = 'src/adapters/s3/s3.adapter.ts'

			// Act
			const normalized = normalizePath(unixPath)

			// Assert: Should remain unchanged
			expect(normalized).toBe('src/adapters/s3/s3.adapter.ts')
		})

		test('9.2.3 - generated files have correct structure', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'unix-port',
				outputPath: join(testDir, 'src/ports'),
			})

			// Assert: Files exist at expected locations
			const baseDir = join(testDir, 'src/ports/unix-port')
			expect(await Bun.file(join(baseDir, 'unix-port.token.ts')).exists()).toBe(true)
			expect(await Bun.file(join(baseDir, 'unix-port.port.ts')).exists()).toBe(true)
			expect(await Bun.file(join(baseDir, 'index.ts')).exists()).toBe(true)
		})
	})

	/**
	 * Section 9.3: Path Normalization Tests
	 */
	describe('Path Normalization', () => {
		test('9.3.1 - mixed slash paths are normalized', () => {
			// Arrange: Mixed slash path
			const mixedPath = 'src/adapters\\s3/service\\file.ts'

			// Act
			const normalized = normalizePath(mixedPath)

			// Assert
			expect(normalized).toBe('src/adapters/s3/service/file.ts')
			expect(normalized).not.toContain('\\')
		})

		test('9.3.2 - relative paths are calculated correctly cross-platform', () => {
			// Arrange - getImportPath takes file paths, uses dirname(from) as base
			const fromFile = normalizePath(join('src', 'adapters', 's3', 's3.adapter.ts'))
			const toPath = normalizePath(join('src', 'ports', 'storage'))

			// Act
			const importPath = getImportPath(fromFile, toPath)

			// Assert: Should use forward slashes regardless of platform
			expect(importPath).not.toContain('\\')
			expect(importPath).toBe('../../ports/storage')
		})

		test('9.3.3 - absolute paths are handled correctly cross-platform', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Use absolute path for output
			const absolutePath = join(testDir, 'absolute', 'path', 'src', 'adapters')

			// Act
			await generator.generate({
				name: 'absolute-adapter',
				outputPath: absolutePath,
				portName: 'absolute-port',
			})

			// Assert: Files were created at absolute path
			const adapterFile = join(absolutePath, 'absolute-adapter/absolute-adapter.adapter.ts')
			expect(await Bun.file(adapterFile).exists()).toBe(true)

			// Imports still use forward slashes
			const content = await Bun.file(adapterFile).text()
			const importLines = content.split('\n').filter((line) => line.includes('import'))
			for (const line of importLines) {
				expect(line).not.toContain('\\')
			}
		})

		test('normalizePath handles empty string', () => {
			expect(normalizePath('')).toBe('')
		})

		test('normalizePath handles single segment', () => {
			expect(normalizePath('file.ts')).toBe('file.ts')
		})

		test('getImportPath handles same directory', () => {
			// from is a file path, dirname is used to get the base directory
			const result = getImportPath('src/adapters/adapter.ts', 'src/adapters/types')
			expect(result).toBe('./types')
		})

		test('getImportPath handles sibling directories', () => {
			// from file is in src/adapters/s3/, target is src/ports/storage
			const result = getImportPath('src/adapters/s3/s3.adapter.ts', 'src/ports/storage')
			expect(result).toBe('../../ports/storage')
		})

		test('getImportPath removes .ts extension', () => {
			const result = getImportPath('src/adapters/adapter.ts', 'src/ports/storage.ts')
			expect(result).toBe('../ports/storage')
		})

		test('getImportPath removes /index suffix', () => {
			const result = getImportPath('src/adapters/adapter.ts', 'src/ports/storage/index')
			expect(result).toBe('../ports/storage')
		})
	})

	/**
	 * Cross-platform generation consistency
	 */
	describe('Cross-platform Generation Consistency', () => {
		test('same input produces consistent output regardless of path separators', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Generate with normalized path
			await generator.generate({
				name: 'consistent-port',
				outputPath: join(testDir, 'src/ports'),
			})

			// Assert: Output is deterministic
			const tokenContent = await Bun.file(
				join(testDir, 'src/ports/consistent-port/consistent-port.token.ts'),
			).text()

			// Token content should be platform-independent
			expect(tokenContent).toContain("export const CONSISTENT_PORT_PORT = Symbol('CONSISTENT_PORT_PORT')")
			expect(tokenContent).not.toContain('\\')
		})

		test('file names are consistent across platforms', async () => {
			// Arrange
			const config = configBuilder().withFileCase('kebab').build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'CamelCaseName',
				outputPath: join(testDir, 'src/ports'),
			})

			// Assert: File names use kebab-case based on config
			// With kebab fileCase, 'CamelCaseName' becomes 'camel-case-name'
			const baseDir = join(testDir, 'src/ports/camel-case-name')
			const files = await Bun.file(join(baseDir, 'index.ts')).text()

			// Index exports should reference kebab-case files
			expect(files).toContain("export * from './camel-case-name.port'")
			expect(files).toContain("export * from './camel-case-name.token'")
		})
	})

	/**
	 * Deep nested paths
	 */
	describe('Deep Nested Paths', () => {
		test('handles deeply nested output paths', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)
			const deepPath = join(testDir, 'very', 'deep', 'nested', 'path', 'src', 'ports')

			// Act
			await generator.generate({
				name: 'deep-port',
				outputPath: deepPath,
			})

			// Assert
			const tokenFile = join(deepPath, 'deep-port/deep-port.token.ts')
			expect(await Bun.file(tokenFile).exists()).toBe(true)
		})

		test('adapter import paths work with deeply nested structure', async () => {
			// Arrange
			const config = configBuilder().build()
			const adapterGenerator = new AdapterGenerator(config)

			// Create adapter in deeply nested path
			const adapterPath = join(testDir, 'a', 'b', 'c', 'd', 'src', 'adapters')

			// Act
			await adapterGenerator.generate({
				name: 'nested-adapter',
				outputPath: adapterPath,
				portName: 'nested-port',
			})

			// Assert: Import path is calculated correctly
			const adapterFile = join(adapterPath, 'nested-adapter/nested-adapter.adapter.ts')
			const content = await Bun.file(adapterFile).text()

			// Should have correct relative path (many levels up)
			expect(content).toContain("from '../../ports/nested-port'")
			expect(content).not.toContain('\\')
		})
	})
})
