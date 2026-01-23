import { readFile, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Helper utilities for comparing generated files against expected output.
 */

export interface FileComparisonResult {
	matches: boolean
	differences: string[]
}

/**
 * Compare generated file content with expected content.
 * Useful for snapshot-style testing without full snapshot infrastructure.
 */
export async function compareFileContent(
	filePath: string,
	expectedContent: string,
): Promise<FileComparisonResult> {
	const actualContent = await readFile(filePath, 'utf-8')
	const matches = actualContent === expectedContent

	if (matches) {
		return { matches: true, differences: [] }
	}

	// Calculate differences line by line
	const actualLines = actualContent.split('\n')
	const expectedLines = expectedContent.split('\n')
	const differences: string[] = []

	const maxLines = Math.max(actualLines.length, expectedLines.length)
	for (let i = 0; i < maxLines; i++) {
		const actualLine = actualLines[i] ?? ''
		const expectedLine = expectedLines[i] ?? ''

		if (actualLine !== expectedLine) {
			differences.push(
				`Line ${i + 1}:\n  Expected: ${expectedLine}\n  Actual:   ${actualLine}`,
			)
		}
	}

	return { matches: false, differences }
}

/**
 * Verify that a file contains specific patterns/strings.
 * More flexible than exact content matching.
 */
export async function fileContains(
	filePath: string,
	patterns: string[],
): Promise<boolean> {
	const content = await readFile(filePath, 'utf-8')

	for (const pattern of patterns) {
		if (!content.includes(pattern)) {
			return false
		}
	}

	return true
}

/**
 * Verify that a file does NOT contain specific patterns/strings.
 */
export async function fileNotContains(
	filePath: string,
	patterns: string[],
): Promise<boolean> {
	const content = await readFile(filePath, 'utf-8')

	for (const pattern of patterns) {
		if (content.includes(pattern)) {
			return false
		}
	}

	return true
}

/**
 * Extract and verify imports from a TypeScript file.
 */
export async function getImports(filePath: string): Promise<string[]> {
	const content = await readFile(filePath, 'utf-8')
	const importRegex = /^import\s+.+\s+from\s+['"](.+)['"]/gm
	const imports: string[] = []

	let match: RegExpExecArray | null
	while ((match = importRegex.exec(content)) !== null) {
		if (match[1]) {
			imports.push(match[1])
		}
	}

	return imports
}

/**
 * Verify file uses specific code style preferences.
 */
export interface CodeStyleCheck {
	indent?: 'tab' | 2 | 4
	quotes?: 'single' | 'double'
	semicolons?: boolean
}

export async function verifyCodeStyle(
	filePath: string,
	style: CodeStyleCheck,
): Promise<{ valid: boolean; violations: string[] }> {
	const content = await readFile(filePath, 'utf-8')
	const violations: string[] = []

	// Check indentation
	if (style.indent !== undefined) {
		const lines = content.split('\n')
		const indentedLines = lines.filter((line) => /^\s+\S/.test(line))

		if (style.indent === 'tab') {
			const hasSpaceIndent = indentedLines.some((line) => /^ +\S/.test(line))
			if (hasSpaceIndent) {
				violations.push('Found space indentation, expected tabs')
			}
		} else {
			const spaceCount = style.indent
			const hasTabIndent = indentedLines.some((line) => line.startsWith('\t'))
			if (hasTabIndent) {
				violations.push(`Found tab indentation, expected ${spaceCount} spaces`)
			}
		}
	}

	// Check quotes
	if (style.quotes !== undefined) {
		const stringRegex = style.quotes === 'single' ? /"[^"]*"/g : /'[^']*'/g
		const wrongQuotes = content.match(stringRegex)

		if (wrongQuotes && wrongQuotes.length > 0) {
			violations.push(
				`Found ${style.quotes === 'single' ? 'double' : 'single'} quotes, expected ${style.quotes}`,
			)
		}
	}

	// Check semicolons
	if (style.semicolons !== undefined) {
		const statements = content.split('\n').filter((line) => {
			const trimmed = line.trim()
			return (
				(trimmed.startsWith('export') ||
					trimmed.startsWith('import') ||
					trimmed.startsWith('const') ||
					trimmed.startsWith('let')) &&
				!trimmed.includes('{') // Skip opening braces
			)
		})

		if (style.semicolons) {
			const missingSemicolons = statements.filter(
				(line) => !line.trim().endsWith(';'),
			)
			if (missingSemicolons.length > 0) {
				violations.push(
					`Found ${missingSemicolons.length} statements missing semicolons`,
				)
			}
		} else {
			const extraSemicolons = statements.filter((line) =>
				line.trim().endsWith(';'),
			)
			if (extraSemicolons.length > 0) {
				violations.push(
					`Found ${extraSemicolons.length} statements with unexpected semicolons`,
				)
			}
		}
	}

	return {
		valid: violations.length === 0,
		violations,
	}
}

/**
 * Compare directory structure (file names and hierarchy) without checking content.
 */
export async function compareDirectoryStructure(
	actualDir: string,
	expectedFiles: string[],
): Promise<{ matches: boolean; missing: string[]; unexpected: string[] }> {
	const actualFiles: string[] = []

	async function walk(dir: string, relativePath = '') {
		const entries = await readdir(dir)

		for (const entry of entries) {
			const fullPath = join(dir, entry)
			const relPath = join(relativePath, entry)
			const stats = await stat(fullPath)

			if (stats.isDirectory()) {
				await walk(fullPath, relPath)
			} else {
				actualFiles.push(relPath.replace(/\\/g, '/')) // Normalize to forward slashes
			}
		}
	}

	await walk(actualDir)

	const normalizedExpected = expectedFiles.map((f) => f.replace(/\\/g, '/'))
	const missing = normalizedExpected.filter((f) => !actualFiles.includes(f))
	const unexpected = actualFiles.filter((f) => !normalizedExpected.includes(f))

	return {
		matches: missing.length === 0 && unexpected.length === 0,
		missing,
		unexpected,
	}
}
