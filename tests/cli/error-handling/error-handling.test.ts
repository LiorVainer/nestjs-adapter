import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { mkdir, writeFile as fsWriteFile, chmod } from 'node:fs/promises'
import { PortGenerator } from '../../../src/cli/generators/port.generator'
import { AdapterGenerator } from '../../../src/cli/generators/adapter.generator'
import { renderTemplate } from '../../../src/cli/utils/template-renderer'
import { writeFile } from '../../../src/cli/utils/file-writer'
import { configBuilder, createTempDir } from '../helpers'

/**
 * Error Handling Tests
 *
 * These tests verify:
 * - Input validation errors are clear and helpful
 * - File system errors are handled gracefully
 * - Template errors provide useful diagnostics
 *
 * @see openspec/changes/add-cli-generator-tests/tasks.md Section 10
 */
describe('Error Handling Tests', () => {
	const tempDir = createTempDir()
	let testDir: string

	beforeEach(async () => {
		testDir = await tempDir.create()
	})

	afterEach(async () => {
		await tempDir.cleanupAll()
	})

	/**
	 * Section 10.1: Input Validation
	 */
	describe('Input Validation', () => {
		test('10.1.1 - generates successfully with valid name', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			const result = await generator.generate({
				name: 'valid-port-name',
				outputPath: join(testDir, 'src/ports'),
			})

			// Assert
			expect(result.success).toBe(true)
		})

		test('10.1.2 - handles names with special formatting', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act: Generate with various name formats
			const result1 = await generator.generate({
				name: 'my-port',
				outputPath: join(testDir, 'src/ports'),
			})

			const result2 = await generator.generate({
				name: 'MyPort',
				outputPath: join(testDir, 'src/ports2'),
			})

			const result3 = await generator.generate({
				name: 'my_port',
				outputPath: join(testDir, 'src/ports3'),
			})

			// Assert: All should succeed
			expect(result1.success).toBe(true)
			expect(result2.success).toBe(true)
			expect(result3.success).toBe(true)
		})

		test('10.1.3 - creates output directory if it does not exist', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)
			const nonExistentPath = join(testDir, 'non', 'existent', 'path')

			// Act
			const result = await generator.generate({
				name: 'new-port',
				outputPath: nonExistentPath,
			})

			// Assert
			expect(result.success).toBe(true)
			expect(await Bun.file(join(nonExistentPath, 'new-port/new-port.token.ts')).exists()).toBe(true)
		})

		test('10.1.4 - error messages guide user to fix issues', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Pre-create a file to trigger conflict
			const portDir = join(testDir, 'src/ports/existing-port')
			await mkdir(portDir, { recursive: true })
			await fsWriteFile(join(portDir, 'existing-port.token.ts'), 'existing content')

			// Act & Assert
			try {
				await generator.generate({
					name: 'existing-port',
					outputPath: join(testDir, 'src/ports'),
				})
				expect.unreachable('Should have thrown an error')
			} catch (error) {
				expect(error).toBeInstanceOf(Error)
				const errorMsg = (error as Error).message
				expect(errorMsg).toContain('File already exists')
				expect(errorMsg).toContain('--force')
			}
		})
	})

	/**
	 * Section 10.2: File System Errors
	 */
	describe('File System Errors', () => {
		test('10.2.3 - error when file already exists (without --force)', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Pre-create a file
			const portDir = join(testDir, 'src/ports/conflict-port')
			await mkdir(portDir, { recursive: true })
			await fsWriteFile(join(portDir, 'conflict-port.token.ts'), 'existing content')

			// Act & Assert
			try {
				await generator.generate({
					name: 'conflict-port',
					outputPath: join(testDir, 'src/ports'),
				})
				expect.unreachable('Should have thrown an error')
			} catch (error) {
				expect(error).toBeInstanceOf(Error)
				expect((error as Error).message).toContain('File already exists')
			}
		})

		test('file writer detects conflicts correctly', async () => {
			// Arrange
			const existingFile = join(testDir, 'existing.ts')
			await fsWriteFile(existingFile, 'original content')

			// Act
			const result = await writeFile(existingFile, 'new content', {
				dryRun: false,
				force: false,
			})

			// Assert
			expect(result.success).toBe(false)
			expect(result.existed).toBe(true)
			expect(result.written).toBe(false)
			expect(result.message).toContain('File already exists')
		})

		test('file writer force option overwrites existing file', async () => {
			// Arrange
			const existingFile = join(testDir, 'existing.ts')
			await fsWriteFile(existingFile, 'original content')

			// Act
			const result = await writeFile(existingFile, 'new content', {
				dryRun: false,
				force: true,
			})

			// Assert
			expect(result.success).toBe(true)
			const newContent = await Bun.file(existingFile).text()
			expect(newContent).toBe('new content')
		})

		test('file writer dryRun does not write file', async () => {
			// Arrange
			const newFile = join(testDir, 'dry-run.ts')

			// Act
			const result = await writeFile(newFile, 'content', {
				dryRun: true,
				force: false,
			})

			// Assert
			expect(result.success).toBe(true)
			expect(result.written).toBe(false)
			expect(result.message).toContain('Dry run')
			expect(await Bun.file(newFile).exists()).toBe(false)
		})

		test('file writer creates parent directories', async () => {
			// Arrange
			const nestedFile = join(testDir, 'a', 'b', 'c', 'deep.ts')

			// Act
			const result = await writeFile(nestedFile, 'content', {
				dryRun: false,
				force: false,
			})

			// Assert
			expect(result.success).toBe(true)
			expect(await Bun.file(nestedFile).exists()).toBe(true)
		})
	})

	/**
	 * Section 10.3: Template Errors
	 */
	describe('Template Errors', () => {
		test('10.3.1 - error when template file is missing', async () => {
			// Act & Assert
			await expect(
				renderTemplate(join(testDir, 'non-existent-template.hbs'), {}),
			).rejects.toThrow('Template file not found')
		})

		test('10.3.2 - error when template syntax is invalid', async () => {
			// Arrange: Create template with invalid syntax
			const invalidTemplate = join(testDir, 'invalid.hbs')
			await fsWriteFile(invalidTemplate, '{{#if condition}missing end')

			// Act & Assert
			await expect(
				renderTemplate(invalidTemplate, {}),
			).rejects.toThrow('Failed to compile template')
		})

		test('10.3.3 - undefined variables render as empty string (Handlebars default)', async () => {
			// Arrange: Create template that references undefined variable
			const templateFile = join(testDir, 'undefined-var.hbs')
			await fsWriteFile(templateFile, 'Value: {{undefinedVariable}}')

			// Act
			const result = await renderTemplate(templateFile, {})

			// Assert: Handlebars renders undefined as empty string by default
			expect(result).toBe('Value: ')
		})

		test('error message includes template path', async () => {
			// Arrange
			const badPath = join(testDir, 'some', 'bad', 'path', 'template.hbs')

			// Act & Assert
			try {
				await renderTemplate(badPath, {})
				expect.unreachable('Should have thrown')
			} catch (error) {
				expect((error as Error).message).toContain('template.hbs')
			}
		})
	})

	/**
	 * Generator-level error handling
	 */
	describe('Generator Error Handling', () => {
		test('generator reports all failed files', async () => {
			// Arrange: Create multiple existing files
			const config = configBuilder().build()
			const generator = new PortGenerator(config)
			const portDir = join(testDir, 'src/ports/multi-conflict')
			await mkdir(portDir, { recursive: true })

			// Create multiple conflicting files
			await fsWriteFile(join(portDir, 'multi-conflict.port.ts'), 'existing')
			await fsWriteFile(join(portDir, 'multi-conflict.token.ts'), 'existing')

			// Act & Assert
			try {
				await generator.generate({
					name: 'multi-conflict',
					outputPath: join(testDir, 'src/ports'),
				})
				expect.unreachable('Should have thrown')
			} catch (error) {
				const msg = (error as Error).message
				// Should mention the failures
				expect(msg).toContain('Failed to generate')
			}
		})

		test('force option allows overwriting all files', async () => {
			// Arrange: Create existing files
			const config = configBuilder().build()
			const generator = new PortGenerator(config)
			const portDir = join(testDir, 'src/ports/force-overwrite')
			await mkdir(portDir, { recursive: true })

			await fsWriteFile(join(portDir, 'force-overwrite.token.ts'), 'old content')

			// Act
			const result = await generator.generate({
				name: 'force-overwrite',
				outputPath: join(testDir, 'src/ports'),
				force: true,
			})

			// Assert
			expect(result.success).toBe(true)
			const newContent = await Bun.file(join(portDir, 'force-overwrite.token.ts')).text()
			expect(newContent).not.toBe('old content')
			expect(newContent).toContain('FORCE_OVERWRITE_PORT')
		})

		test('dryRun reports what would be generated', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			const result = await generator.generate({
				name: 'dry-run-port',
				outputPath: join(testDir, 'src/ports'),
				dryRun: true,
			})

			// Assert: Should succeed without creating files
			expect(result.success).toBe(true)
			expect(result.files.length).toBeGreaterThan(0)

			// Files should not actually exist
			for (const file of result.files) {
				expect(await Bun.file(file).exists()).toBe(false)
			}
		})
	})

	/**
	 * Adapter-specific error handling
	 */
	describe('Adapter Error Handling', () => {
		test('adapter handles missing port gracefully', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)

			// Act: Generate adapter referencing non-existent port
			// The generator should still succeed - it just generates import paths
			const result = await generator.generate({
				name: 'orphan-adapter',
				outputPath: join(testDir, 'src/adapters'),
				portName: 'non-existent-port',
			})

			// Assert: Generation succeeds (import validation is runtime)
			expect(result.success).toBe(true)

			// The import path is generated even though port doesn't exist
			const adapterContent = await Bun.file(
				join(testDir, 'src/adapters/orphan-adapter/orphan-adapter.adapter.ts'),
			).text()
			expect(adapterContent).toContain('NON_EXISTENT_PORT_PORT')
		})

		test('adapter conflict detection works', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new AdapterGenerator(config)
			const adapterDir = join(testDir, 'src/adapters/conflict-adapter')
			await mkdir(adapterDir, { recursive: true })
			await fsWriteFile(join(adapterDir, 'conflict-adapter.adapter.ts'), 'existing')

			// Act & Assert
			try {
				await generator.generate({
					name: 'conflict-adapter',
					outputPath: join(testDir, 'src/adapters'),
				})
				expect.unreachable('Should have thrown')
			} catch (error) {
				expect((error as Error).message).toContain('File already exists')
			}
		})
	})

	/**
	 * Recovery and cleanup
	 */
	describe('Recovery and Cleanup', () => {
		test('partial failure does not leave corrupt state', async () => {
			// This tests that if generation fails partway through,
			// the files that were written are still valid

			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)
			const portDir = join(testDir, 'src/ports/partial-fail')
			await mkdir(portDir, { recursive: true })

			// Create a conflict on the third file (service.ts) but not the first two
			await fsWriteFile(join(portDir, 'partial-fail.service.ts'), 'existing service')

			// Act
			try {
				await generator.generate({
					name: 'partial-fail',
					outputPath: join(testDir, 'src/ports'),
					includeService: true,
				})
			} catch {
				// Expected to fail
			}

			// Assert: Files that were written before failure should be valid
			// (port.ts and token.ts should exist and be valid)
			const tokenFile = join(portDir, 'partial-fail.token.ts')
			if (await Bun.file(tokenFile).exists()) {
				const content = await Bun.file(tokenFile).text()
				expect(content).toContain('PARTIAL_FAIL_PORT')
			}
		})
	})
})
