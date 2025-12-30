/**
 * Template context types
 *
 * This is the context object passed to Handlebars templates.
 * It extends GeneratorContext with additional template-specific fields.
 */

import type { GeneratorContext } from './generator.types'

export interface TemplateContext extends GeneratorContext {
	[key: string]: unknown
}
