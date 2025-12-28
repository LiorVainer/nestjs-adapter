/**
 * S3 Adapter Types
 *
 * This file defines the configuration options for the S3 object storage adapter.
 * These options are infrastructure-specific and should NOT be exposed to the domain layer.
 */

/**
 * Configuration options for the S3 adapter.
 *
 * These options control how the adapter connects to and uses AWS S3.
 */
export interface S3Options {
	/**
	 * AWS S3 bucket name where objects will be stored.
	 *
	 * @example 'my-app-uploads'
	 */
	bucket: string

	/**
	 * AWS region where the bucket is located.
	 *
	 * @example 'us-east-1'
	 */
	region: string

	/**
	 * AWS access key ID for authentication.
	 *
	 * Optional: if not provided, uses AWS SDK default credential chain
	 * (environment variables, IAM role, etc.)
	 */
	accessKeyId?: string

	/**
	 * AWS secret access key for authentication.
	 *
	 * Optional: if not provided, uses AWS SDK default credential chain
	 */
	secretAccessKey?: string

	/**
	 * Optional endpoint override for S3-compatible services.
	 *
	 * Useful for:
	 * - LocalStack (local development)
	 * - MinIO (self-hosted S3-compatible storage)
	 * - DigitalOcean Spaces
	 *
	 * @example 'http://localhost:4566' (LocalStack)
	 * @example 'https://nyc3.digitaloceanspaces.com' (DO Spaces)
	 */
	endpoint?: string

	/**
	 * Whether to use path-style URLs instead of virtual-hosted-style URLs.
	 *
	 * Set to true for S3-compatible services that don't support virtual hosting.
	 *
	 * @default false
	 */
	forcePathStyle?: boolean

	/**
	 * Default ACL for uploaded objects.
	 *
	 * @example 'public-read' - Make objects publicly accessible
	 * @example 'private' - Objects accessible only with credentials
	 *
	 * @default 'private'
	 */
	defaultAcl?: 'private' | 'public-read' | 'public-read-write'

	/**
	 * Base URL for generating public URLs.
	 *
	 * If not provided, uses AWS S3 default URL format.
	 *
	 * @example 'https://cdn.example.com'
	 */
	publicUrlBase?: string
}

/**
 * Why These Options?
 *
 * These options are specific to AWS S3 infrastructure and should never leak
 * into the domain layer. The domain only knows about ObjectStoragePort
 * interface, not S3Options.
 *
 * Benefits:
 * - Domain code remains infrastructure-agnostic
 * - Easy to swap S3 for Azure Blob Storage (just change the adapter)
 * - Configuration is encapsulated in the adapter
 */
