/**
 * Object Storage Port Interface
 *
 * This file defines the port interface - the contract that any object storage
 * adapter must implement. This is part of the domain layer and should NOT
 * depend on any infrastructure details.
 *
 * Best Practices:
 * - Keep interfaces focused on domain needs
 * - Use domain language, not infrastructure language
 * - Don't expose implementation details
 * - Design for testability (easy to mock)
 */

/**
 * Result of uploading an object to storage.
 */
export interface UploadResult {
	/**
	 * Public URL where the object can be accessed.
	 * May be undefined if the object is not publicly accessible.
	 */
	url?: string

	/**
	 * Unique identifier for the stored object.
	 * Can be used to retrieve or delete the object later.
	 */
	key: string

	/**
	 * Size of the uploaded object in bytes.
	 */
	sizeBytes: number
}

/**
 * Metadata about a stored object.
 */
export interface ObjectMetadata {
	/**
	 * The object's unique key/path.
	 */
	key: string

	/**
	 * Size in bytes.
	 */
	sizeBytes: number

	/**
	 * MIME type of the object.
	 */
	contentType?: string

	/**
	 * When the object was last modified.
	 */
	lastModified: Date

	/**
	 * ETag or version identifier.
	 */
	etag?: string
}

/**
 * Port interface for object storage capabilities.
 *
 * This interface defines what the domain needs from object storage,
 * without specifying HOW it should be implemented.
 *
 * Adapters (S3, Azure Blob, GCS, filesystem) implement this interface.
 */
export interface ObjectStoragePort {
	/**
	 * Upload an object to storage.
	 *
	 * @param key - Unique identifier for the object (e.g., "uploads/avatar.jpg")
	 * @param data - Object data as a Buffer or stream
	 * @param contentType - MIME type of the object
	 * @returns Upload result with URL and metadata
	 */
	upload(key: string, data: Buffer, contentType?: string): Promise<UploadResult>

	/**
	 * Download an object from storage.
	 *
	 * @param key - Unique identifier of the object
	 * @returns Object data as a Buffer
	 * @throws Error if object doesn't exist
	 */
	download(key: string): Promise<Buffer>

	/**
	 * Delete an object from storage.
	 *
	 * @param key - Unique identifier of the object
	 * @returns void
	 */
	delete(key: string): Promise<void>

	/**
	 * Check if an object exists in storage.
	 *
	 * @param key - Unique identifier of the object
	 * @returns true if the object exists, false otherwise
	 */
	exists(key: string): Promise<boolean>

	/**
	 * Get metadata about an object without downloading it.
	 *
	 * @param key - Unique identifier of the object
	 * @returns Object metadata
	 * @throws Error if object doesn't exist
	 */
	getMetadata(key: string): Promise<ObjectMetadata>

	/**
	 * List objects with a given prefix.
	 *
	 * @param prefix - Key prefix to filter by (e.g., "uploads/")
	 * @param maxResults - Maximum number of results to return
	 * @returns Array of object metadata
	 */
	list(prefix?: string, maxResults?: number): Promise<ObjectMetadata[]>
}

/**
 * Why This Interface Design?
 *
 * 1. **Domain-focused**: Methods reflect what the domain needs (upload, download, delete)
 *    not how S3 or Azure work (putObject, getObject, etc.)
 *
 * 2. **Simple types**: Uses Buffer instead of streams for simplicity. For large files,
 *    you might want to add streaming methods as well.
 *
 * 3. **Testable**: Easy to create mock implementations for testing.
 *
 * 4. **Adapter-agnostic**: This interface works for S3, Azure Blob, GCS, or even
 *    a local filesystem adapter.
 */
