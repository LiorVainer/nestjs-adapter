/**
 * Deep merge utility using native structuredClone
 *
 * Merges nested objects without mutation, preserving all nested properties.
 */

/**
 * Check if a value is a plain object (not array, null, or other types)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
	return (
		value !== null &&
		typeof value === 'object' &&
		!Array.isArray(value) &&
		Object.prototype.toString.call(value) === '[object Object]'
	)
}

/**
 * Deep merge two objects using structuredClone for immutability.
 *
 * @param target - Base object (will be cloned, not mutated)
 * @param source - Object to merge into target
 * @returns New merged object
 *
 * @example
 * const defaults = { a: 1, b: { c: 2, d: 3 } }
 * const overrides = { b: { c: 99 } }
 * const result = deepMerge(defaults, overrides)
 * // result: { a: 1, b: { c: 99, d: 3 } }
 */
export function deepMerge<T extends Record<string, unknown>>(
	target: T,
	source: Partial<T>,
): T {
	// Clone target to avoid mutation
	const result = structuredClone(target)

	// Merge source into result
	for (const key in source) {
		if (Object.hasOwn(source, key)) {
			const sourceValue = source[key]
			const targetValue = result[key]

			// If both values are plain objects, recursively merge
			if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
				result[key] = deepMerge(
					targetValue as Record<string, unknown>,
					sourceValue as Record<string, unknown>,
				) as T[Extract<keyof T, string>]
			} else if (sourceValue !== undefined) {
				// Otherwise, use source value (including arrays, primitives, null)
				result[key] = structuredClone(sourceValue) as T[Extract<
					keyof T,
					string
				>]
			}
		}
	}

	return result
}
