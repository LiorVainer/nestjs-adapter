/**
 * Template rendering utilities using Handlebars
 * Uses Bun's native file reading for better performance
 */

import Handlebars from 'handlebars'
import type { TemplateContext } from '../types'

export async function renderTemplate(
	templatePath: string,
	context: TemplateContext,
): Promise<string> {
	try {
		const file = Bun.file(templatePath)

		// Check if file exists before reading
		if (!(await file.exists())) {
			throw new Error(
				`Template file not found: ${templatePath}\n` +
					'Please ensure the template exists or report this as a bug.',
			)
		}

		const templateSource = await file.text()

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

export async function renderTemplateString(
	templateString: string,
	context: TemplateContext,
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
