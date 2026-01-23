import { describe, expect, test } from 'bun:test'
import { join, sep } from 'node:path'
import {
	getImportPath,
	getRelativePath,
	joinPaths,
	resolvePath,
} from '../../../src/cli/utils/path-resolver'

/**
 * Unit tests for path resolution utilities.
 * These utilities handle cross-platform path operations and import path generation.
 */
describe('Path Resolver Utilities', () => {
	describe('resolvePath', () => {
		test('resolves absolute path from segments', () => {
			const result = resolvePath('src', 'ports', 'object-storage')
			expect(result).toContain('src')
			expect(result).toContain('ports')
			expect(result).toContain('object-storage')
		})

		test('handles single segment', () => {
			const result = resolvePath('src')
			expect(result).toContain('src')
		})

		test('resolves current directory with .', () => {
			const result = resolvePath('.')
			expect(result).toBeTruthy()
		})
	})

	describe('joinPaths', () => {
		test('joins multiple path segments', () => {
			const result = joinPaths('src', 'ports', 'object-storage')
			expect(result).toBe(`src${sep}ports${sep}object-storage`)
		})

		test('handles single segment', () => {
			const result = joinPaths('src')
			expect(result).toBe('src')
		})

		test('handles empty string segments', () => {
			const result = joinPaths('src', '', 'ports')
			expect(result).toBe(`src${sep}ports`)
		})
	})

	describe('getRelativePath', () => {
		test('calculates relative path between directories', () => {
			const from = join('src', 'adapters', 's3')
			const to = join('src', 'ports', 'object-storage')

			const result = getRelativePath(from, to)

			// Should go up and across
			expect(result).toContain('ports')
			expect(result).toContain('object-storage')
		})

		test('normalizes backslashes to forward slashes', () => {
			// Manually create path with backslashes to test normalization
			const from = 'src\\adapters\\s3'
			const to = 'src\\ports\\object-storage'

			const result = getRelativePath(from, to)

			// Should use forward slashes even on Windows
			expect(result).not.toContain('\\')
			expect(result).toMatch(/\//)
		})

		test('handles same directory', () => {
			const from = join('src', 'ports')
			const to = join('src', 'ports', 'object-storage.ts')

			const result = getRelativePath(from, to)

			expect(result).toBe('object-storage.ts')
		})

		test('handles upward traversal', () => {
			const from = join('src', 'adapters', 's3', 'nested')
			const to = join('src', 'ports')

			const result = getRelativePath(from, to)

			// Should have multiple ../ segments
			expect(result).toContain('..')
		})
	})

	describe('getImportPath', () => {
		test('calculates correct import path for TypeScript files', () => {
			const from = join('src', 'adapters', 's3', 's3.adapter.ts')
			const to = join('src', 'ports', 'object-storage', 'object-storage.token.ts')

			const result = getImportPath(from, to)

			// Should be relative path starting with ./or ../
			expect(result.startsWith('.')).toBe(true)
			// Should not have .ts extension
			expect(result.endsWith('.ts')).toBe(false)
			// Should contain the target path
			expect(result).toContain('ports')
			expect(result).toContain('object-storage')
		})

		test('removes .ts extension from import path', () => {
			const from = join('src', 'adapters', 's3.ts')
			const to = join('src', 'ports', 'storage.ts')

			const result = getImportPath(from, to)

			expect(result).not.toContain('.ts')
		})

		test('removes .js extension from import path', () => {
			const from = join('src', 'adapters', 's3.js')
			const to = join('src', 'ports', 'storage.js')

			const result = getImportPath(from, to)

			expect(result).not.toContain('.js')
		})

		test('ensures relative import starts with ./', () => {
			const from = join('src', 'adapters', 's3.ts')
			const to = join('src', 'adapters', 'local-fs.ts')

			const result = getImportPath(from, to)

			// Should start with ./ for same-directory imports
			expect(result.startsWith('.')).toBe(true)
		})

		test('uses forward slashes for imports', () => {
			const from = 'src\\adapters\\s3\\s3.adapter.ts'
			const to = 'src\\ports\\object-storage\\object-storage.token.ts'

			const result = getImportPath(from, to)

			// Import paths should always use forward slashes
			expect(result).not.toContain('\\')
		})

		test('handles sibling files in same directory', () => {
			const from = join('src', 'ports', 'object-storage', 'index.ts')
			const to = join('src', 'ports', 'object-storage', 'object-storage.token.ts')

			const result = getImportPath(from, to)

			expect(result).toBe('./object-storage.token')
		})

		test('handles parent directory imports', () => {
			const from = join('src', 'adapters', 's3', 's3.adapter.ts')
			const to = join('src', 'adapters', 'base.adapter.ts')

			const result = getImportPath(from, to)

			expect(result).toContain('..')
			expect(result).toContain('base.adapter')
		})
	})

	describe('cross-platform compatibility', () => {
		test('getRelativePath always returns forward slashes', () => {
			// Create paths using platform-specific separator
			const from = ['src', 'adapters', 's3'].join(sep)
			const to = ['src', 'ports', 'storage'].join(sep)

			const result = getRelativePath(from, to)

			// Count separators - should all be forward slashes
			const backslashes = (result.match(/\\/g) || []).length
			const forwardSlashes = (result.match(/\//g) || []).length

			expect(backslashes).toBe(0)
			expect(forwardSlashes).toBeGreaterThan(0)
		})

		test('getImportPath always returns forward slashes', () => {
			const from = ['src', 'adapters', 's3.ts'].join(sep)
			const to = ['src', 'ports', 'storage.ts'].join(sep)

			const result = getImportPath(from, to)

			expect(result).not.toContain('\\')
		})
	})

	describe('edge cases', () => {
		test('handles empty path segments gracefully', () => {
			const result = joinPaths('', 'src', '', 'ports', '')
			expect(result).toContain('src')
			expect(result).toContain('ports')
		})

		test('handles paths with dots', () => {
			const from = join('src', 'adapters', 's3.adapter.ts')
			const to = join('src', 'ports', 'object.storage.token.ts')

			const result = getImportPath(from, to)

			// Should only remove final .ts extension
			expect(result).toContain('object.storage.token')
			expect(result).not.toContain('.ts')
		})

		test('handles deeply nested paths', () => {
			const from = join('src', 'a', 'b', 'c', 'd', 'file.ts')
			const to = join('src', 'x', 'y', 'z', 'target.ts')

			const result = getImportPath(from, to)

			expect(result.startsWith('.')).toBe(true)
			expect(result).not.toContain('.ts')
		})
	})

	describe('real-world scenarios', () => {
		test('adapter importing port token', () => {
			// Typical: adapter in src/adapters/s3/ imports token from src/ports/object-storage/
			const adapterFile = join('src', 'adapters', 's3', 's3.adapter.ts')
			const tokenFile = join(
				'src',
				'ports',
				'object-storage',
				'object-storage.token.ts',
			)

			const result = getImportPath(adapterFile, tokenFile)

			// Should be: ../../ports/object-storage/object-storage.token
			expect(result).toContain('..')
			expect(result).toContain('ports/object-storage/object-storage.token')
			expect(result).not.toContain('.ts')
		})

		test('module importing sibling files', () => {
			// Typical: module importing token from same directory
			const moduleFile = join('src', 'ports', 'object-storage', 'object-storage.module.ts')
			const tokenFile = join('src', 'ports', 'object-storage', 'object-storage.token.ts')

			const result = getImportPath(moduleFile, tokenFile)

			// Should be: ./object-storage.token
			expect(result).toBe('./object-storage.token')
		})

		test('service importing port interface', () => {
			// Typical: adapter service importing port interface
			const serviceFile = join('src', 'adapters', 's3', 's3.service.ts')
			const interfaceFile = join('src', 'ports', 'object-storage', 'object-storage.port.ts')

			const result = getImportPath(serviceFile, interfaceFile)

			expect(result).toContain('..')
			expect(result).toContain('ports')
			expect(result).toContain('object-storage.port')
			expect(result).not.toContain('.ts')
		})
	})
})
