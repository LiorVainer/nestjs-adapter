import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { writeFile } from '../../../src/cli/utils/file-writer'
import { createTempDir } from '../helpers'

/**
 * Unit tests for file writing utilities.
 * These utilities handle file creation with conflict detection and dry-run support.
 */
describe('File Writer Utilities', () => {
	const tempDir = createTempDir()
	let testDir: string

	beforeEach(async () => {
		testDir = await tempDir.create()
	})

	afterEach(async () => {
		await tempDir.cleanupAll()
	})

	describe('basic file writing', () => {
		test('writes file successfully to existing directory', async () => {
			const filePath = join(testDir, 'test.txt')
			const content = 'Hello, world!'

			const result = await writeFile(filePath, content)

			expect(result.success).toBe(true)
			expect(result.path).toBe(filePath)
			expect(result.existed).toBe(false)
			expect(result.written).toBe(true)
			expect(result.message).toBe('File created')

			// Verify file was actually written
			expect(existsSync(filePath)).toBe(true)
			const fileContent = await Bun.file(filePath).text()
			expect(fileContent).toBe(content)
		})

		test('creates parent directories if missing', async () => {
			const filePath = join(testDir, 'deep', 'nested', 'structure', 'test.txt')
			const content = 'Test content'

			const result = await writeFile(filePath, content)

			expect(result.success).toBe(true)
			expect(result.written).toBe(true)

			// Verify file was written in nested directory
			expect(existsSync(filePath)).toBe(true)
			const fileContent = await Bun.file(filePath).text()
			expect(fileContent).toBe(content)
		})

		test('writes empty content successfully', async () => {
			const filePath = join(testDir, 'empty.txt')
			const content = ''

			const result = await writeFile(filePath, content)

			expect(result.success).toBe(true)
			expect(result.written).toBe(true)

			const fileContent = await Bun.file(filePath).text()
			expect(fileContent).toBe('')
		})

		test('writes large content successfully', async () => {
			const filePath = join(testDir, 'large.txt')
			const content = 'x'.repeat(10000) // 10KB of data

			const result = await writeFile(filePath, content)

			expect(result.success).toBe(true)
			expect(result.written).toBe(true)

			const fileContent = await Bun.file(filePath).text()
			expect(fileContent).toBe(content)
		})
	})

	describe('conflict detection', () => {
		test('detects when file already exists', async () => {
			const filePath = join(testDir, 'existing.txt')

			// Write file first time
			await writeFile(filePath, 'First content')

			// Try to write again without force
			const result = await writeFile(filePath, 'Second content')

			expect(result.success).toBe(false)
			expect(result.existed).toBe(true)
			expect(result.written).toBe(false)
			expect(result.message).toBe('File already exists. Use --force to overwrite.')

			// Verify original content unchanged
			const fileContent = await Bun.file(filePath).text()
			expect(fileContent).toBe('First content')
		})

		test('force option overwrites existing file', async () => {
			const filePath = join(testDir, 'existing.txt')

			// Write file first time
			await writeFile(filePath, 'First content')

			// Overwrite with force
			const result = await writeFile(filePath, 'Second content', { force: true })

			expect(result.success).toBe(true)
			expect(result.existed).toBe(true)
			expect(result.written).toBe(true)
			expect(result.message).toBe('File overwritten')

			// Verify content was updated
			const fileContent = await Bun.file(filePath).text()
			expect(fileContent).toBe('Second content')
		})
	})

	describe('dry run mode', () => {
		test('simulates file creation without writing', async () => {
			const filePath = join(testDir, 'dry-run.txt')
			const content = 'Test content'

			const result = await writeFile(filePath, content, { dryRun: true })

			expect(result.success).toBe(true)
			expect(result.existed).toBe(false)
			expect(result.written).toBe(false)
			expect(result.message).toBe('Dry run - file not written')

			// Verify file was NOT actually written
			expect(existsSync(filePath)).toBe(false)
		})

		test('dry run reports existing file correctly', async () => {
			const filePath = join(testDir, 'existing.txt')

			// Create file first
			await writeFile(filePath, 'Original content')

			// Dry run with existing file
			const result = await writeFile(filePath, 'New content', { dryRun: true })

			expect(result.success).toBe(true)
			expect(result.existed).toBe(true)
			expect(result.written).toBe(false)
			expect(result.message).toBe('Dry run - file not written')

			// Verify original content unchanged
			const fileContent = await Bun.file(filePath).text()
			expect(fileContent).toBe('Original content')
		})

		test('dry run with force flag still does not write', async () => {
			const filePath = join(testDir, 'test.txt')

			const result = await writeFile(filePath, 'Content', {
				dryRun: true,
				force: true,
			})

			expect(result.success).toBe(true)
			expect(result.written).toBe(false)
			expect(existsSync(filePath)).toBe(false)
		})
	})

	describe('option combinations', () => {
		test('force=false, dryRun=false (default behavior)', async () => {
			const filePath = join(testDir, 'test.txt')

			// First write succeeds
			const result1 = await writeFile(filePath, 'Content 1', {
				force: false,
				dryRun: false,
			})
			expect(result1.success).toBe(true)
			expect(result1.written).toBe(true)

			// Second write fails (conflict)
			const result2 = await writeFile(filePath, 'Content 2', {
				force: false,
				dryRun: false,
			})
			expect(result2.success).toBe(false)
			expect(result2.written).toBe(false)
		})

		test('force=true, dryRun=false overwrites file', async () => {
			const filePath = join(testDir, 'test.txt')

			await writeFile(filePath, 'Content 1')

			const result = await writeFile(filePath, 'Content 2', {
				force: true,
				dryRun: false,
			})

			expect(result.success).toBe(true)
			expect(result.written).toBe(true)

			const content = await Bun.file(filePath).text()
			expect(content).toBe('Content 2')
		})

		test('force=false, dryRun=true simulates without error on existing', async () => {
			const filePath = join(testDir, 'test.txt')

			await writeFile(filePath, 'Content 1')

			const result = await writeFile(filePath, 'Content 2', {
				force: false,
				dryRun: true,
			})

			expect(result.success).toBe(true)
			expect(result.written).toBe(false)

			// Original content unchanged
			const content = await Bun.file(filePath).text()
			expect(content).toBe('Content 1')
		})
	})

	describe('result structure', () => {
		test('returns correct structure for new file', async () => {
			const filePath = join(testDir, 'test.txt')

			const result = await writeFile(filePath, 'Content')

			expect(result).toHaveProperty('success')
			expect(result).toHaveProperty('path')
			expect(result).toHaveProperty('existed')
			expect(result).toHaveProperty('written')
			expect(result).toHaveProperty('message')

			expect(typeof result.success).toBe('boolean')
			expect(typeof result.path).toBe('string')
			expect(typeof result.existed).toBe('boolean')
			expect(typeof result.written).toBe('boolean')
		})

		test('result includes correct path', async () => {
			const filePath = join(testDir, 'specific-path.txt')

			const result = await writeFile(filePath, 'Content')

			expect(result.path).toBe(filePath)
		})
	})

	describe('special characters and filenames', () => {
		test('handles filenames with spaces', async () => {
			const filePath = join(testDir, 'file with spaces.txt')

			const result = await writeFile(filePath, 'Content')

			expect(result.success).toBe(true)
			expect(existsSync(filePath)).toBe(true)
		})

		test('handles filenames with dots', async () => {
			const filePath = join(testDir, 'file.name.with.dots.txt')

			const result = await writeFile(filePath, 'Content')

			expect(result.success).toBe(true)
			expect(existsSync(filePath)).toBe(true)
		})

		test('handles content with special characters', async () => {
			const filePath = join(testDir, 'special.txt')
			const content = 'Hello\nWorld\t!\r\n"Quotes" and \'apostrophes\''

			const result = await writeFile(filePath, content)

			expect(result.success).toBe(true)

			const fileContent = await Bun.file(filePath).text()
			expect(fileContent).toBe(content)
		})

		test('handles unicode content', async () => {
			const filePath = join(testDir, 'unicode.txt')
			const content = '你好世界 🌍 مرحبا بالعالم'

			const result = await writeFile(filePath, content)

			expect(result.success).toBe(true)

			const fileContent = await Bun.file(filePath).text()
			expect(fileContent).toBe(content)
		})
	})

	describe('multiple writes', () => {
		test('writes multiple files to same directory', async () => {
			const files = ['file1.txt', 'file2.txt', 'file3.txt']

			for (const filename of files) {
				const result = await writeFile(join(testDir, filename), `Content of ${filename}`)
				expect(result.success).toBe(true)
			}

			// Verify all files exist
			for (const filename of files) {
				expect(existsSync(join(testDir, filename))).toBe(true)
			}
		})

		test('writes to deeply nested parallel directories', async () => {
			const paths = [
				join(testDir, 'a', 'b', 'c', 'file.txt'),
				join(testDir, 'a', 'b', 'd', 'file.txt'),
				join(testDir, 'a', 'e', 'f', 'file.txt'),
			]

			for (const filePath of paths) {
				const result = await writeFile(filePath, 'Content')
				expect(result.success).toBe(true)
			}

			// Verify all files exist
			for (const filePath of paths) {
				expect(existsSync(filePath)).toBe(true)
			}
		})
	})
})
