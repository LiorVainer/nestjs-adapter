/**
 * Path resolution utilities
 */

import { dirname, join, relative, resolve } from 'node:path'

/**
 * Normalize path separators to forward slashes.
 * This ensures cross-platform compatibility for import statements.
 */
export function normalizePath(path: string): string {
	return path.replace(/\\/g, '/')
}

export function resolvePath(...segments: string[]): string {
	return resolve(...segments)
}

export function joinPaths(...segments: string[]): string {
	return join(...segments)
}

export function getRelativePath(from: string, to: string): string {
	const relativePath = relative(from, to)
	// Always use forward slashes in imports
	return relativePath.replace(/\\/g, '/')
}

export function getImportPath(from: string, to: string): string {
	const relPath = getRelativePath(dirname(from), to)
	// Remove file extension
	let result = relPath.replace(/\.(ts|js)$/, '')
	// Remove /index suffix (import from directory instead of index file)
	result = result.replace(/\/index$/, '')
	// Ensure it starts with ./ for relative imports
	return result.startsWith('.') ? result : `./${result}`
}
