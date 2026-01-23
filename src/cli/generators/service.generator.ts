/**
 * Service Generator
 *
 * Generates standalone services that consume existing ports via @InjectPort.
 */

import { basename, join } from 'node:path'
import type {
	FileToGenerate,
	GeneratorOptions,
	GeneratorResult,
} from '../types'
import { BaseGenerator } from './base.generator'

/**
 * Additional options for service generation.
 */
export interface ServiceGeneratorOptions extends GeneratorOptions {
	/**
	 * Name of the port this service injects.
	 * Used to generate correct imports and @InjectPort decorator.
	 */
	portName?: string

	/**
	 * Path to the port interface file (for imports).
	 * If not provided, assumes standard structure relative to services directory.
	 */
	portPath?: string
}

/**
 * Generator for creating standalone services.
 *
 * Generates:
 * - Injectable service that uses @InjectPort to inject an existing port
 * - Can be created with or without port injection scaffolding
 */
export class ServiceGenerator extends BaseGenerator {
	/**
	 * Generate service file.
	 */
	async generate(options: ServiceGeneratorOptions): Promise<GeneratorResult> {
		// Get port name variations if portName is provided
		const portNameVariations = options.portName
			? this.getNameVariations(options.portName)
			: undefined

		// Calculate import path from service to port directory
		let portImportPath: string | undefined
		if (portNameVariations && !options.portPath) {
			const portsDir = this.config.output?.portsDir || 'ports'

			// Extract base directory name to calculate relative path
			// e.g., 'src/ports' -> 'ports'
			const portsDirName = basename(portsDir)

			// Service is at: {servicesDir}/{serviceName}/service.ts
			// Port is at: {portsDir}/{portName}/index.ts
			// From service directory, we need to go up 2 levels then into ports
			portImportPath = `../../${portsDirName}/${portNameVariations.kebab}`
		}

		const context = this.createTemplateContext(options, {
			// Port-related context if portName is provided
			...(portNameVariations
				? {
						portName: portNameVariations.pascal,
						portNameCamel: portNameVariations.camel,
						portNameKebab: portNameVariations.kebab,
						portTokenName: portNameVariations.screamingSnake,
						portImportPath: options.portPath || portImportPath,
						portTokenImportPath: options.portPath || portImportPath,
					}
				: {}),
		})

		const templateDir = this.getTemplateDir('service')

		// Determine output directory
		const outputDir =
			options.outputPath ||
			this.resolvePath(this.config.output?.portsDir || 'src/services')
		const serviceDir = join(outputDir, context.nameKebab)

		// Generate file list
		const files: FileToGenerate[] = []

		// Service file
		let serviceContent = await this.renderTemplate(
			join(templateDir, 'injectable-service.hbs'),
			context,
		)
		serviceContent = this.applyStyleConfig(serviceContent, context)
		files.push({
			path: join(serviceDir, `${context.nameKebab}.service.ts`),
			content: serviceContent,
		})

		// Generate all files
		const generatedFiles = await this.generateFiles(
			files,
			options.dryRun,
			options.force,
		)

		return {
			success: true,
			files: generatedFiles,
			message: `Successfully generated ${generatedFiles.length} service file${generatedFiles.length !== 1 ? 's' : ''}`,
		}
	}
}
