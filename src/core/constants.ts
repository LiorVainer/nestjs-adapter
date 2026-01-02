/**
 * Metadata key for storing the port token in adapter class metadata.
 * Used by the @Adapter decorator to store which token the adapter provides.
 */
export const PORT_TOKEN_METADATA = Symbol('PORT_TOKEN_METADATA')

/**
 * Metadata key for storing the port implementation class in adapter class metadata.
 * Used by the @Adapter decorator to store the concrete implementation class.
 */
export const PORT_IMPLEMENTATION_METADATA = Symbol(
	'PORT_IMPLEMENTATION_METADATA',
)

/**
 * Metadata key for storing imports configuration in adapter class metadata.
 * Used by the @Adapter decorator to store modules to import.
 */
export const ADAPTER_IMPORTS_METADATA = Symbol('ADAPTER_IMPORTS_METADATA')

/**
 * Metadata key for storing extra providers in adapter class metadata.
 * Used by the @Adapter decorator to store additional providers.
 */
export const ADAPTER_PROVIDERS_METADATA = Symbol('ADAPTER_PROVIDERS_METADATA')
