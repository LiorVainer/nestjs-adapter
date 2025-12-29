/**
 * Path resolution utilities
 */

import { dirname, join, relative, resolve } from 'path'

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
	const withoutExt = relPath.replace(/\.(ts|js)$/, '')
	// Ensure it starts with ./ for relative imports
	return withoutExt.startsWith('.') ? withoutExt : `./${withoutExt}`
}
