/**
 * Metadata key for storing the port token in adapter class metadata.
 * Used by the @Port decorator to store which token the adapter provides.
 */
export const PORT_TOKEN_METADATA: unique symbol = Symbol('PORT_TOKEN_METADATA')

/**
 * Metadata key for storing the port implementation class in adapter class metadata.
 * Used by the @Port decorator to store the concrete implementation class.
 */
export const PORT_IMPLEMENTATION_METADATA: unique symbol = Symbol(
	'PORT_IMPLEMENTATION_METADATA',
)
