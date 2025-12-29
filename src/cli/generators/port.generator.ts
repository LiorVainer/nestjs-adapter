/**
 * Port Generator
 *
 * Generates port files (interface, service, module, token).
 */

import { join } from 'node:path'
import type {
	FileToGenerate,
	GeneratorOptions,
	GeneratorResult,
} from '../types'
import { BaseGenerator } from './base.generator'

/**
 * Generator for creating port files.
 *
 * Generates:
 * - Port interface (domain contract)
 * - Port token (dependency injection token)
 * - Port service (optional - domain service using the port)
 * - Port module (optional - feature module wrapper)
 * - Index file (barrel exports)
 */
export class PortGenerator extends BaseGenerator {
	/**
	 * Generate all port files.
	 */
	async generate(options: GeneratorOptions): Promise<GeneratorResult> {
		const context = this.createTemplateContext(options)
		const templateDir = this.getTemplateDir('port')

		// Determine output directory
		const outputDir =
			options.outputPath ||
			this.resolvePath(this.config.output?.portsDir || 'src/ports')
		const portDir = join(outputDir, context.nameKebab)

		// Generate file list
		const files: FileToGenerate[] = []

		// 1. Port interface (always generated)
		const interfaceContent = await this.renderTemplate(
			join(templateDir, 'interface.hbs'),
			context,
		)
		files.push({
			path: join(portDir, `${context.nameKebab}.port.ts`),
			content: interfaceContent,
		})

		// 2. Port token (always generated)
		const tokenContent = await this.renderTemplate(
			join(templateDir, 'token.hbs'),
			context,
		)
		files.push({
			path: join(portDir, `${context.nameKebab}.token.ts`),
			content: tokenContent,
		})

		// 3. Port service (optional based on includeService option)
		if (context.includeService) {
			const serviceContent = await this.renderTemplate(
				join(templateDir, 'service.hbs'),
				context,
			)
			files.push({
				path: join(portDir, `${context.nameKebab}.service.ts`),
				content: serviceContent,
			})
		}

		// 4. Port module (optional based on includeModule option)
		if (context.includeModule) {
			const moduleContent = await this.renderTemplate(
				join(templateDir, 'module.hbs'),
				context,
			)
			files.push({
				path: join(portDir, `${context.nameKebab}.module.ts`),
				content: moduleContent,
			})
		}

		// 5. Index file (barrel export)
		const indexContent = await this.renderTemplate(
			join(templateDir, 'index.hbs'),
			context,
		)
		files.push({
			path: join(portDir, 'index.ts'),
			content: indexContent,
		})

		// Generate all files
		const generatedFiles = await this.generateFiles(files, options.dryRun)

		return {
			success: true,
			files: generatedFiles,
			message: `Successfully generated port files for ${context.namePascal}`,
		}
	}
}
