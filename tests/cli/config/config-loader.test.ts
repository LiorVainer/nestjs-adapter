import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { writeFile, rm } from 'node:fs/promises'
import { loadConfig } from '../../../src/cli/config/loader'
import { defaultConfig } from '../../../src/cli/config/defaults'
import { createTempDir } from '../helpers'

/**
 * Tests for config loader verifying:
 * - Loading valid nest-hex.config.ts files
 * - Fallback to defaults when config missing
 * - Deep merge of partial configs with defaults
 * - Graceful handling of config errors
 * - Cross-platform path handling
 */
describe('Config Loader', () => {
	const tempDir = createTempDir()
	let testDir: string

	beforeEach(async () => {
		testDir = await tempDir.create()
	})

	afterEach(async () => {
		await tempDir.cleanupAll()
	})

	describe('valid config loading', () => {
		test('loads valid nest-hex.config.ts', async () => {
			// Arrange: Create a valid config file
			const configContent = `
				export default {
					output: {
						portsDir: 'custom/ports',
						adaptersDir: 'custom/adapters',
					},
					naming: {
						portSuffix: 'CONTRACT',
						adapterSuffix: 'Implementation',
						fileCase: 'pascal',
					},
					style: {
						indent: 2,
						quotes: 'double',
						semicolons: false,
					},
				}
			`
			await writeFile(join(testDir, 'nest-hex.config.ts'), configContent, 'utf-8')

			// Act: Load the config
			const config = await loadConfig(testDir)

			// Assert: Config is loaded correctly
			expect(config.output?.portsDir).toBe('custom/ports')
			expect(config.output?.adaptersDir).toBe('custom/adapters')
			expect(config.naming?.portSuffix).toBe('CONTRACT')
			expect(config.naming?.adapterSuffix).toBe('Implementation')
			expect(config.naming?.fileCase).toBe('pascal')
			expect(config.style?.indent).toBe(2)
			expect(config.style?.quotes).toBe('double')
			expect(config.style?.semicolons).toBe(false)
		})

		test('loads config with defineConfig-style pattern', async () => {
			// Arrange: Create config using the defineConfig pattern (inline function)
			// The defineConfig helper is just a type helper, so we test the pattern it enables
			const configContent = `
				// Define config inline (same pattern as defineConfig)
				const config = {
					output: {
						portsDir: 'src/domain/ports',
					},
					naming: {
						portSuffix: 'PORT',
					},
				}
				export default config
			`
			await writeFile(join(testDir, 'nest-hex.config.ts'), configContent, 'utf-8')

			// Act: Load the config
			const config = await loadConfig(testDir)

			// Assert: Config is loaded correctly
			expect(config.output?.portsDir).toBe('src/domain/ports')
			expect(config.naming?.portSuffix).toBe('PORT')
		})
	})

	describe('fallback to defaults', () => {
		test('returns default config when file missing', async () => {
			// Act: Load config from directory without config file
			const config = await loadConfig(testDir)

			// Assert: Returns default config
			expect(config).toEqual(defaultConfig)
			expect(config.output?.portsDir).toBe('src/ports')
			expect(config.output?.adaptersDir).toBe('src/adapters')
			expect(config.naming?.portSuffix).toBe('PORT')
			expect(config.naming?.adapterSuffix).toBe('Adapter')
			expect(config.naming?.fileCase).toBe('kebab')
			expect(config.style?.indent).toBe('tab')
			expect(config.style?.quotes).toBe('single')
			expect(config.style?.semicolons).toBe(true)
		})

		test('falls back to defaults on syntax error', async () => {
			// Arrange: Create config with syntax error
			const configContent = `
				export default {
					output: {
						portsDir: 'custom/ports',
						// Missing closing brace
					naming: {
						portSuffix: 'CONTRACT',
					},
				}
			`
			await writeFile(join(testDir, 'nest-hex.config.ts'), configContent, 'utf-8')

			// Act: Load the config (should not throw)
			const config = await loadConfig(testDir)

			// Assert: Falls back to defaults
			expect(config).toEqual(defaultConfig)
		})

		test('falls back to defaults on runtime error', async () => {
			// Arrange: Create config that throws at runtime
			const configContent = `
				throw new Error('Config initialization error')

				export default {
					output: {
						portsDir: 'custom/ports',
					},
				}
			`
			await writeFile(join(testDir, 'nest-hex.config.ts'), configContent, 'utf-8')

			// Act: Load the config (should not throw)
			const config = await loadConfig(testDir)

			// Assert: Falls back to defaults
			expect(config).toEqual(defaultConfig)
		})
	})

	describe('partial config merge', () => {
		test('deep merges partial config with defaults', async () => {
			// Arrange: Create partial config (only override some values)
			const configContent = `
				export default {
					naming: {
						portSuffix: 'CONTRACT',
					},
				}
			`
			await writeFile(join(testDir, 'nest-hex.config.ts'), configContent, 'utf-8')

			// Act: Load the config
			const config = await loadConfig(testDir)

			// Assert: Partial config merged with defaults
			expect(config.naming?.portSuffix).toBe('CONTRACT')
			// These should come from defaults
			expect(config.naming?.adapterSuffix).toBe('Adapter')
			expect(config.naming?.fileCase).toBe('kebab')
			expect(config.output?.portsDir).toBe('src/ports')
			expect(config.output?.adaptersDir).toBe('src/adapters')
			expect(config.style?.indent).toBe('tab')
			expect(config.style?.quotes).toBe('single')
			expect(config.style?.semicolons).toBe(true)
		})

		test('merges nested objects deeply', async () => {
			// Arrange: Override only one property in a nested object
			const configContent = `
				export default {
					output: {
						portsDir: 'custom/ports',
						// adaptersDir should come from defaults
					},
					style: {
						indent: 2,
						// quotes and semicolons should come from defaults
					},
				}
			`
			await writeFile(join(testDir, 'nest-hex.config.ts'), configContent, 'utf-8')

			// Act: Load the config
			const config = await loadConfig(testDir)

			// Assert: Deep merge preserves both custom and default values
			expect(config.output?.portsDir).toBe('custom/ports')
			expect(config.output?.adaptersDir).toBe('src/adapters') // from defaults
			expect(config.style?.indent).toBe(2)
			expect(config.style?.quotes).toBe('single') // from defaults
			expect(config.style?.semicolons).toBe(true) // from defaults
		})

		test('handles empty config object', async () => {
			// Arrange: Create empty config
			const configContent = 'export default {}'
			await writeFile(join(testDir, 'nest-hex.config.ts'), configContent, 'utf-8')

			// Act: Load the config
			const config = await loadConfig(testDir)

			// Assert: All values come from defaults
			expect(config).toEqual(defaultConfig)
		})
	})

	describe('cross-platform path handling', () => {
		test('handles forward slashes in config paths', async () => {
			// Arrange: Config with forward slashes (Unix-style)
			const configContent = `
				export default {
					output: {
						portsDir: 'src/domain/ports',
						adaptersDir: 'src/infrastructure/adapters',
					},
				}
			`
			await writeFile(join(testDir, 'nest-hex.config.ts'), configContent, 'utf-8')

			// Act: Load the config
			const config = await loadConfig(testDir)

			// Assert: Paths are preserved
			expect(config.output?.portsDir).toBe('src/domain/ports')
			expect(config.output?.adaptersDir).toBe('src/infrastructure/adapters')
		})

		test('handles backslashes in config paths', async () => {
			// Arrange: Config with backslashes (Windows-style)
			const configContent = `
				export default {
					output: {
						portsDir: 'src\\\\domain\\\\ports',
						adaptersDir: 'src\\\\infrastructure\\\\adapters',
					},
				}
			`
			await writeFile(join(testDir, 'nest-hex.config.ts'), configContent, 'utf-8')

			// Act: Load the config
			const config = await loadConfig(testDir)

			// Assert: Paths are preserved (with escaped backslashes)
			expect(config.output?.portsDir).toBe('src\\domain\\ports')
			expect(config.output?.adaptersDir).toBe('src\\infrastructure\\adapters')
		})

		test('handles absolute paths', async () => {
			// Arrange: Config with absolute path
			const absolutePath = join(testDir, 'custom', 'ports')
			const configContent = `
				export default {
					output: {
						portsDir: '${absolutePath.replace(/\\/g, '\\\\')}',
					},
				}
			`
			await writeFile(join(testDir, 'nest-hex.config.ts'), configContent, 'utf-8')

			// Act: Load the config
			const config = await loadConfig(testDir)

			// Assert: Absolute path is preserved
			expect(config.output?.portsDir).toBe(absolutePath)
		})
	})

	describe('template configuration', () => {
		test('loads custom template paths', async () => {
			// Arrange: Config with custom templates
			const configContent = `
				export default {
					templates: {
						portInterface: 'custom/templates/port.interface.hbs',
						portToken: 'custom/templates/port.token.hbs',
					},
				}
			`
			await writeFile(join(testDir, 'nest-hex.config.ts'), configContent, 'utf-8')

			// Act: Load the config
			const config = await loadConfig(testDir)

			// Assert: Template paths are loaded
			expect(config.templates?.portInterface).toBe(
				'custom/templates/port.interface.hbs',
			)
			expect(config.templates?.portToken).toBe('custom/templates/port.token.hbs')
		})
	})
})
