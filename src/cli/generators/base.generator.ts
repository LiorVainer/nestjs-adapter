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
	 * @returns WriteResult indicating success and conflict status
	 */
	protected async writeFile(
		filePath: string,
		content: string,
		dryRun = false,
	): Promise<import('../utils/file-writer').WriteResult> {
		return writeFile(filePath, content, {
			dryRun,
			force: false,
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

		return {
			...names,
			// Add "name*" aliases for template compatibility
			nameKebab: names.kebab,
			nameCamel: names.camel,
			namePascal: names.pascal,
			nameSnake: names.snake,
			nameScreamingSnake: names.screamingSnake,
			// Naming configuration - use defaults as fallback
			portSuffix: (this.config.naming?.portSuffix ??
				defaultConfig.naming.portSuffix) as string,
			adapterSuffix: (this.config.naming?.adapterSuffix ??
				defaultConfig.naming.adapterSuffix) as string,
			fileCase: (this.config.naming?.fileCase ??
				defaultConfig.naming.fileCase) as 'kebab' | 'camel' | 'pascal',
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
	 * Generate files from a list of file specifications.
	 *
	 * @param files - Array of files to generate
	 * @param dryRun - If true, don't actually write files
	 * @returns Array of successfully generated file paths
	 * @throws Error if any files fail to write
	 */
	protected async generateFiles(
		files: FileToGenerate[],
		dryRun = false,
	): Promise<string[]> {
		const generatedFiles: string[] = []
		const failures: Array<{ path: string; error: string }> = []

		for (const file of files) {
			const result = await this.writeFile(file.path, file.content, dryRun)

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
