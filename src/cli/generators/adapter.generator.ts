/**
 * Adapter Generator
 *
 * Generates adapter files (adapter class, service implementation, types).
 */

import { join } from 'node:path'
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
		const context = this.createTemplateContext(options, {
			portName: options.portName,
			portPath: options.portPath,
			technology: options.technology,
			// Infer port-related names if portName is provided
			...(options.portName
				? {
						portNameKebab: this.getNameVariations(options.portName).kebab,
						portNamePascal: this.getNameVariations(options.portName).pascal,
						portNameCamel: this.getNameVariations(options.portName).camel,
						portNameScreamingSnake: this.getNameVariations(options.portName)
							.screamingSnake,
						portTokenName: `${this.getNameVariations(options.portName).screamingSnake}_${this.config.naming?.portSuffix || 'PORT'}`,
						portInterfaceName: `${this.getNameVariations(options.portName).pascal}Port`,
						portTokenImport:
							options.portPath ||
							`../../${this.getNameVariations(options.portName).kebab}/${this.getNameVariations(options.portName).kebab}.token`,
						portInterfaceImport:
							options.portPath ||
							`../../${this.getNameVariations(options.portName).kebab}/${this.getNameVariations(options.portName).kebab}.port`,
					}
				: {}),
		})

		const templateDir = this.getTemplateDir('adapter')

		// Determine output directory
		const outputDir =
			options.outputPath ||
			this.resolvePath(this.config.output?.adaptersDir || 'src/adapters')

		// Create adapter directory path
		// If portName is provided, nest under port directory: adapters/{portName}/{adapterName}/
		// Otherwise, flat structure: adapters/{adapterName}/
		const portNameKebab =
			typeof context.portNameKebab === 'string' ? context.portNameKebab : ''
		const adapterDir = options.portName
			? join(outputDir, portNameKebab, context.nameKebab)
			: join(outputDir, context.nameKebab)

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
