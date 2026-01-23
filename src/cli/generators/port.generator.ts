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

		// Get file case from config
		const fileCase = context.fileCase

		// Determine output directory
		const outputDir =
			options.outputPath ||
			this.resolvePath(this.config.output?.portsDir || 'src/ports')

		// Use configured file case for directory and file names
		const fileName = this.getFileName(options.name, fileCase)
		const portDir = join(outputDir, fileName)

		// Generate file list
		const files: FileToGenerate[] = []

		// 1. Port interface (always generated)
		let interfaceContent = await this.renderTemplate(
			join(templateDir, 'interface.hbs'),
			context,
		)
		interfaceContent = this.applyStyleConfig(interfaceContent, context)
		files.push({
			path: join(portDir, `${fileName}.port.ts`),
			content: interfaceContent,
		})

		// 2. Port token (always generated)
		let tokenContent = await this.renderTemplate(
			join(templateDir, 'token.hbs'),
			context,
		)
		tokenContent = this.applyStyleConfig(tokenContent, context)
		files.push({
			path: join(portDir, `${fileName}.token.ts`),
			content: tokenContent,
		})

		// 3. Port service (optional based on includeService option)
		if (context.includeService) {
			let serviceContent = await this.renderTemplate(
				join(templateDir, 'service.hbs'),
				context,
			)
			serviceContent = this.applyStyleConfig(serviceContent, context)
			files.push({
				path: join(portDir, `${fileName}.service.ts`),
				content: serviceContent,
			})
		}

		// 4. Port module (optional based on includeModule option)
		if (context.includeModule) {
			let moduleContent = await this.renderTemplate(
				join(templateDir, 'module.hbs'),
				context,
			)
			moduleContent = this.applyStyleConfig(moduleContent, context)
			files.push({
				path: join(portDir, `${fileName}.module.ts`),
				content: moduleContent,
			})
		}

		// 5. Index file (barrel export)
		let indexContent = await this.renderTemplate(
			join(templateDir, 'index.hbs'),
			context,
		)
		indexContent = this.applyStyleConfig(indexContent, context)
		files.push({
			path: join(portDir, 'index.ts'),
			content: indexContent,
		})

		// 6. Example files (optional based on generateExample and registrationType)
		if (context.generateExample && context.registrationType) {
			const exampleFileName =
				context.registrationType === 'sync'
					? `${fileName}.sync.example.ts`
					: `${fileName}.async.example.ts`

			const exampleTemplate =
				context.registrationType === 'sync'
					? 'port-sync.example.hbs'
					: 'port-async.example.hbs'

			let exampleContent = await this.renderTemplate(
				join(this.getTemplateDir('examples'), exampleTemplate),
				context,
			)
			exampleContent = this.applyStyleConfig(exampleContent, context)
			files.push({
				path: join(portDir, exampleFileName),
				content: exampleContent,
			})
		}

		// Generate all files
		const generatedFiles = await this.generateFiles(
			files,
			options.dryRun,
			options.force,
		)

		return {
			success: true,
			files: generatedFiles,
			message: `Successfully generated port files for ${context.namePascal}`,
		}
	}
}
