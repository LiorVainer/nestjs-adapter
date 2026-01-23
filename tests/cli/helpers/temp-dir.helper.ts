import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

// Get project root directory (3 levels up from this file: tests/cli/helpers -> project root)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = join(__dirname, '..', '..', '..')
const TEMP_DIR_ROOT = join(PROJECT_ROOT, '.tmp-test')

/**
 * Helper for managing temporary test directories.
 * Provides isolated filesystem for each test with automatic cleanup.
 *
 * Temp directories are created in `.tmp-test/` within the project root
 * instead of the system temp folder to keep test artifacts contained.
 *
 * @example
 * ```typescript
 * import { createTempDir } from './helpers/temp-dir.helper'
 *
 * describe('my test', () => {
 *   const tempDir = createTempDir()
 *
 *   beforeEach(async () => {
 *     testDir = await tempDir.create()
 *   })
 *
 *   afterEach(async () => {
 *     await tempDir.cleanupAll()
 *   })
 * })
 * ```
 */
export function createTempDir() {
	const dirs: string[] = []

	return {
		/**
		 * Create a new temporary directory with unique name.
		 * Directory will be automatically cleaned up after test.
		 */
		async create(): Promise<string> {
			const dir = join(
				TEMP_DIR_ROOT,
				`nest-hex-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
			)
			await mkdir(dir, { recursive: true })
			dirs.push(dir)
			return dir
		},

		/**
		 * Manually cleanup a specific directory.
		 */
		async cleanup(dir: string): Promise<void> {
			await rm(dir, { recursive: true, force: true })
			const index = dirs.indexOf(dir)
			if (index > -1) {
				dirs.splice(index, 1)
			}
		},

		/**
		 * Cleanup all created directories and remove the root temp folder.
		 * Call this in afterEach or afterAll.
		 */
		async cleanupAll(): Promise<void> {
			await Promise.all(dirs.map((dir) => rm(dir, { recursive: true, force: true })))
			dirs.length = 0
			// Remove the entire .tmp-test root directory
			await rm(TEMP_DIR_ROOT, { recursive: true, force: true })
		},
	}
}
