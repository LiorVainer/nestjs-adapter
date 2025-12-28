/**
 * Object Storage Port Token
 *
 * This file defines the port token for object storage capabilities.
 * Tokens are typically symbols to ensure uniqueness and prevent collisions.
 *
 * Best Practices:
 * - Use Symbol() for tokens to guarantee uniqueness
 * - Export both the token and its type using `typeof`
 * - Use descriptive names that reflect the port's purpose
 * - Keep tokens in a separate file for easy discovery
 */

/**
 * Port token for object storage provider.
 *
 * This token represents the abstract capability of storing and retrieving objects.
 * Different adapters (S3, Azure Blob, GCS, local filesystem) can provide this capability.
 */
export const OBJECT_STORAGE_PROVIDER = Symbol('OBJECT_STORAGE_PROVIDER')

/**
 * Type alias for the token.
 *
 * Use this in type signatures where you need to reference the token type:
 * - AdapterModule<typeof OBJECT_STORAGE_PROVIDER>
 * - defineAdapter<typeof OBJECT_STORAGE_PROVIDER, Options>()
 */
export type ObjectStorageToken = typeof OBJECT_STORAGE_PROVIDER
