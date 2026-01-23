/**
 * Base Generator
 *
 * Provides common functionality for all code generators.
 */

import { join } from 'node:path'
import { defaultConfig } from '../config/defaults'
import type {
	FileToGenerate,
	GeneratorContext,
	GeneratorOptions,
	GeneratorResult,
	NestHexConfig,
} from '../types'
import { writeFile } from '../utils/file-writer'
import { generateNameVariations } from '../utils/name-transformer'
import { resolvePath } from '../utils/path-resolver'
import { renderTemplate } from '../utils/template-renderer'

/**
 * Abstract base class for all generators.
 *
 * Provides common functionality like:
 * - Template rendering
 * - File writing
 * - Name transformations
 * - Path resolution
 */
export abstract class BaseGenerator {
	constructor(protected readonly config: NestHexConfig) {}

	/**
	 * Generate files based on the provided options.
	 *
	 * This is the main entry point for all generators.
	 */
	abstract generate(options: GeneratorOptions): Promise<GeneratorResult>

	/**
	 * Render a template with the given context.
	 *
	 * @param templatePath - Path to the Handlebars template file
	 * @param context - Template context
	 * @returns Rendered template content
	 */
	protected async renderTemplate(
		templatePath: string,
		context: GeneratorContext,
	): Promise<string> {
		return renderTemplate(templatePath, context)
	}

	/**
	 * Write a file to disk.
	 *
	 * @param filePath - Destination file path
	 * @param content - File content
	 * @param dryRun - If true, don't actually write the file
	 * @param force - If true, overwrite existing files
	 * @returns WriteResult indicating success and conflict status
	 */
	protected async writeFile(
		filePath: string,
		content: string,
		dryRun = false,
		force = false,
	): Promise<import('../utils/file-writer').WriteResult> {
		return writeFile(filePath, content, {
			dryRun,
			force,
		})
	}

	/**
	 * Generate all name variations for a given name.
	 *
	 * @param name - Original name
	 * @returns Object with all name case variations
	 */
	protected getNameVariations(
		name: string,
	): ReturnType<typeof generateNameVariations> {
		return generateNameVariations(name)
	}

	/**
	 * Resolve a path relative to the project root.
	 *
	 * @param relativePath - Relative path
	 * @returns Absolute path
	 */
	protected resolvePath(relativePath: string): string {
		return resolvePath(relativePath)
	}

	/**
	 * Get the template directory for a specific generator type.
	 *
	 * @param type - Generator type (port, adapter, service)
	 * @returns Absolute path to template directory
	 */
	protected getTemplateDir(
		type: 'port' | 'adapter' | 'service' | 'examples',
	): string {
		// Templates are located in src/cli/templates/
		const templatesRoot = join(__dirname, '..', 'templates')
		return join(templatesRoot, type)
	}

	/**
	 * Create a template context from generator options.
	 *
	 * @param options - Generator options
	 * @param additionalContext - Additional context to merge
	 * @returns Complete template context
	 */
	protected createTemplateContext(
		options: GeneratorOptions,
		additionalContext: Record<string, unknown> = {},
	): GeneratorContext {
		const names = this.getNameVariations(options.name)

		// Get configured file case
		const fileCase = (this.config.naming?.fileCase ??
			defaultConfig.naming.fileCase) as 'kebab' | 'camel' | 'pascal'

		// Get file name based on configured file case
		const fileName = this.getFileName(options.name, fileCase)

		return {
			...names,
			// Add "name*" aliases for template compatibility
			nameKebab: names.kebab,
			nameCamel: names.camel,
			namePascal: names.pascal,
			nameSnake: names.snake,
			nameScreamingSnake: names.screamingSnake,
			// Add fileName based on configured file case
			fileName,
			// Naming configuration - use defaults as fallback
			portSuffix: (this.config.naming?.portSuffix ??
				defaultConfig.naming.portSuffix) as string,
			adapterSuffix: (this.config.naming?.adapterSuffix ??
				defaultConfig.naming.adapterSuffix) as string,
			fileCase,
			// Style configuration - use defaults as fallback
			indent: (this.config.style?.indent ?? defaultConfig.style.indent) as
				| 'tab'
				| 2
				| 4,
			quotes: (this.config.style?.quotes ?? defaultConfig.style.quotes) as
				| 'single'
				| 'double',
			semicolons: (this.config.style?.semicolons ??
				defaultConfig.style.semicolons) as boolean,
			// Generator options
			includeModule: options.includeModule ?? true,
			includeService: options.includeService ?? true,
			registrationType: options.registrationType ?? 'sync',
			generateExample: options.generateExample ?? false,
			// Import paths
			coreImportPath: 'nest-hex',
			// Additional context
			...additionalContext,
		}
	}

	/**
	 * Get the file name based on the configured file case.
	 *
	 * @param name - Original name (kebab-case)
	 * @param fileCase - Desired file case
	 * @returns Transformed file name
	 */
	protected getFileName(
		name: string,
		fileCase: 'kebab' | 'camel' | 'pascal' = 'kebab',
	): string {
		const names = this.getNameVariations(name)
		switch (fileCase) {
			case 'camel':
				return names.camel
			case 'pascal':
				return names.pascal
			default:
				return names.kebab
		}
	}

	/**
	 * Apply style configuration to generated code.
	 *
	 * @param content - Generated code content
	 * @param context - Template context with style settings
	 * @returns Styled code content
	 */
	protected applyStyleConfig(
		content: string,
		context: GeneratorContext,
	): string {
		let styled = content

		// Apply quote style (single or double)
		if (context.quotes === 'double') {
			// Convert single quotes to double quotes in imports and strings
			// But preserve quotes in template literals and comments
			styled = styled.replace(
				/import\s+(.+?)\s+from\s+'([^']+)'/g,
				'import $1 from "$2"',
			)
			styled = styled.replace(/Symbol\('([^']+)'\)/g, 'Symbol("$1")')
		}

		// Apply semicolon preference
		if (context.semicolons) {
			// Add semicolons at end of lines that should have them
			// Match lines ending with: ), }, ], or identifier, but not already having semicolon
			styled = styled.replace(
				/^(export\s+.+?)(\s*)$/gm,
				(match, code, whitespace) => {
					const trimmed = code.trim()
					// Don't add to comments, empty lines, lines already ending with semicolon,
					// or lines ending with opening braces (interface/class declarations)
					if (
						trimmed.startsWith('//') ||
						trimmed === '' ||
						trimmed.endsWith(';') ||
						trimmed.endsWith('{')
					) {
						return match
					}
					return `${code};${whitespace}`
				},
			)
		} else {
			// Remove semicolons at end of lines
			styled = styled.replace(/;(\s*$)/gm, '$1')
		}

		// Apply indentation (tab vs spaces)
		if (context.indent !== 'tab') {
			const spaces = ' '.repeat(context.indent)
			// Replace tabs with configured number of spaces
			styled = styled.replace(/\t/g, spaces)
		}

		return styled
	}

	/**
	 * Generate files from a list of file specifications.
	 *
	 * @param files - Array of files to generate
	 * @param dryRun - If true, don't actually write files
	 * @param force - If true, overwrite existing files
	 * @returns Array of successfully generated file paths
	 * @throws Error if any files fail to write
	 */
	protected async generateFiles(
		files: FileToGenerate[],
		dryRun = false,
		force = false,
	): Promise<string[]> {
		const generatedFiles: string[] = []
		const failures: Array<{ path: string; error: string }> = []

		for (const file of files) {
			const result = await this.writeFile(
				file.path,
				file.content,
				dryRun,
				force,
			)

			if (result.success) {
				generatedFiles.push(file.path)
			} else {
				failures.push({
					path: file.path,
					error: result.message || 'Unknown error',
				})
				console.error(`Failed to write ${file.path}: ${result.message}`)
			}
		}

		// If any files failed, report them
		if (failures.length > 0) {
			const errorMsg =
				`Failed to generate ${failures.length} file(s):\n` +
				failures.map((f) => `  - ${f.path}: ${f.error}`).join('\n')
			throw new Error(errorMsg)
		}

		return generatedFiles
	}
}
