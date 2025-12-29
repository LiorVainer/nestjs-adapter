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
	const file = Bun.file(templatePath)
	const templateSource = await file.text()
	const template = Handlebars.compile(templateSource)
	return template(context)
}

export async function renderTemplateString(
	templateString: string,
	context: TemplateContext,
): Promise<string> {
	const template = Handlebars.compile(templateString)
	return template(context)
}
