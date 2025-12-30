/**
 * Adapter Generator
 *
 * Generates adapter files (adapter class, service implementation, types).
 */

import { basename, join } from 'node:path'
import type {
	FileToGenerate,
	GeneratorOptions,
	GeneratorResult,
} from '../types'
import { BaseGenerator } from './base.generator'

/**
 * Additional options for adapter generation.
 */
export interface AdapterGeneratorOptions extends GeneratorOptions {
	/**
	 * Name of the port this adapter implements.
	 * Used to generate correct imports and token references.
	 */
	portName?: string

	/**
	 * Path to the port interface file (for imports).
	 * If not provided, assumes standard structure.
	 */
	portPath?: string

	/**
	 * Technology or service being adapted (e.g., "AWS S3", "HTTP API").
	 * Used in documentation comments.
	 */
	technology?: string
}

/**
 * Generator for creating adapter files.
 *
 * Generates:
 * - Adapter class (extends Adapter base class with @Port decorator)
 * - Service implementation (implements the port interface)
 * - Types file (adapter configuration options)
 * - Index file (barrel exports)
 */
export class AdapterGenerator extends BaseGenerator {
	/**
	 * Generate all adapter files.
	 */
	async generate(options: AdapterGeneratorOptions): Promise<GeneratorResult> {
		// Get port name variations once if portName is provided
		const portNameVariations = options.portName
			? this.getNameVariations(options.portName)
			: undefined

		// Calculate import path from adapter to port directory
		let portImportPath: string | undefined
		if (portNameVariations && !options.portPath) {
			const portsDir = this.config.output?.portsDir || 'ports'
			const adaptersDir = this.config.output?.adaptersDir || 'adapters'

			// Extract base directory names to calculate relative path
			// e.g., 'src/ports' -> 'ports', 'src/adapters' -> 'adapters'
			const portsDirName = basename(portsDir)
			const _adaptersDirName = basename(adaptersDir)

			// Adapter is at: {adaptersDir}/{adapterName}/adapter.ts
			// Port is at: {portsDir}/{portName}/index.ts
			// From adapter directory, we need to go up 2 levels then into ports
			portImportPath = `../../${portsDirName}/${portNameVariations.kebab}`
		}

		const context = this.createTemplateContext(options, {
			portName: options.portName,
			portPath: options.portPath,
			technology: options.technology,
			// Infer port-related names if portName is provided
			...(portNameVariations
				? {
						portNameKebab: portNameVariations.kebab,
						portNamePascal: portNameVariations.pascal,
						portNameCamel: portNameVariations.camel,
						portNameScreamingSnake: portNameVariations.screamingSnake,
						portTokenName: `${portNameVariations.screamingSnake}_${this.config.naming?.portSuffix || 'PORT'}`,
						portInterfaceName: `${portNameVariations.pascal}Port`,
						// Import both token and interface from the port's index file
						portImportPath: options.portPath || portImportPath,
					}
				: {}),
		})

		const templateDir = this.getTemplateDir('adapter')

		// Determine output directory
		const outputDir =
			options.outputPath ||
			this.resolvePath(this.config.output?.adaptersDir || 'src/adapters')

		// Create adapter directory path
		// Always use flat structure: adapters/{adapterName}/
		// This makes the import path consistent: ../../ports/{portName}
		const adapterDir = join(outputDir, context.nameKebab)

		// Generate file list
		const files: FileToGenerate[] = []

		// 1. Adapter class (always generated)
		const adapterContent = await this.renderTemplate(
			join(templateDir, 'adapter.hbs'),
			context,
		)
		files.push({
			path: join(adapterDir, `${context.nameKebab}.adapter.ts`),
			content: adapterContent,
		})

		// 2. Service implementation (always generated)
		const serviceContent = await this.renderTemplate(
			join(templateDir, 'service.hbs'),
			context,
		)
		files.push({
			path: join(adapterDir, `${context.nameKebab}.service.ts`),
			content: serviceContent,
		})

		// 3. Types file (always generated)
		const typesContent = await this.renderTemplate(
			join(templateDir, 'types.hbs'),
			context,
		)
		files.push({
			path: join(adapterDir, `${context.nameKebab}.types.ts`),
			content: typesContent,
		})

		// 4. Index file (barrel export)
		const indexContent = await this.renderTemplate(
			join(templateDir, 'index.hbs'),
			context,
		)
		files.push({
			path: join(adapterDir, 'index.ts'),
			content: indexContent,
		})

		// Generate all files
		const generatedFiles = await this.generateFiles(files, options.dryRun)

		return {
			success: true,
			files: generatedFiles,
			message: `Successfully generated adapter files for ${context.namePascal}`,
		}
	}
}
