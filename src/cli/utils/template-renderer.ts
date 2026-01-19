/**
 * Template rendering utilities using Handlebars
 * Uses Bun's native file reading when available for better performance
 */

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import Handlebars from 'handlebars'

/**
 * Render a Handlebars template with the given context.
 * Accepts any object as context - Handlebars will use available properties.
 */
export async function renderTemplate(
	templatePath: string,
	context: Record<string, unknown>,
): Promise<string> {
	try {
		// Check if file exists before reading - use Bun API if available
		const fileExists =
			typeof Bun !== 'undefined'
				? await Bun.file(templatePath).exists()
				: existsSync(templatePath)

		if (!fileExists) {
			throw new Error(
				`Template file not found: ${templatePath}\n` +
					'Please ensure the template exists or report this as a bug.',
			)
		}

		// Read template - use Bun API if available for better performance
		const templateSource =
			typeof Bun !== 'undefined'
				? await Bun.file(templatePath).text()
				: await readFile(templatePath, 'utf-8')

		try {
			const template = Handlebars.compile(templateSource)
			return template(context)
		} catch (compileError) {
			throw new Error(
				`Failed to compile template ${templatePath}: ` +
					`${compileError instanceof Error ? compileError.message : String(compileError)}\n` +
					'This may indicate invalid Handlebars syntax in the template.',
			)
		}
	} catch (error) {
		if (
			error instanceof Error &&
			error.message.includes('Template file not found')
		) {
			throw error // Re-throw our custom error
		}
		if (
			error instanceof Error &&
			error.message.includes('Failed to compile template')
		) {
			throw error // Re-throw compilation error
		}
		throw new Error(
			`Failed to read template ${templatePath}: ` +
				`${error instanceof Error ? error.message : String(error)}`,
		)
	}
}

/**
 * Render a template string with the given context.
 * Accepts any object as context - Handlebars will use available properties.
 */
export async function renderTemplateString(
	templateString: string,
	context: Record<string, unknown>,
): Promise<string> {
	try {
		const template = Handlebars.compile(templateString)
		return template(context)
	} catch (error) {
		throw new Error(
			'Failed to compile template string: ' +
				`${error instanceof Error ? error.message : String(error)}\n` +
				'This may indicate invalid Handlebars syntax.',
		)
	}
}
