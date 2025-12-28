/**
 * Object Storage Domain Service
 *
 * This service contains domain logic for managing file uploads.
 * It depends on the ObjectStoragePort port, not on any specific adapter.
 *
 * Key Points:
 * - Injects the port using @InjectPort decorator
 * - Works with any adapter that implements ObjectStoragePort
 * - Contains business logic (validation, naming, etc.)
 * - Infrastructure-agnostic
 */

import { Injectable } from '@nestjs/common'
import { InjectPort } from '../../src'
import type { ObjectMetadata, ObjectStoragePort } from './object-storage.port'
import { OBJECT_STORAGE_PROVIDER } from './object-storage.token'

/**
 * Domain service for managing object storage.
 *
 * This service provides high-level operations for file management,
 * adding domain logic on top of the raw storage port.
 */
@Injectable()
export class ObjectStorageService {
	private readonly storage: ObjectStoragePort

	constructor(
		@InjectPort(OBJECT_STORAGE_PROVIDER)
		storage: ObjectStoragePort,
	) {
		this.storage = storage
	}

	/**
	 * Upload a user avatar image.
	 *
	 * This method demonstrates domain logic:
	 * - Validates file type
	 * - Generates a consistent naming scheme
	 * - Adds business-specific metadata
	 *
	 * @param userId - The user's unique identifier
	 * @param imageData - Avatar image data
	 * @param mimeType - MIME type of the image
	 * @returns Public URL of the uploaded avatar
	 */
	async uploadUserAvatar(
		userId: string,
		imageData: Buffer,
		mimeType: string,
	): Promise<string> {
		// Domain validation: only allow image types
		if (!mimeType.startsWith('image/')) {
			throw new Error(
				`Invalid avatar type: ${mimeType}. Only images are allowed.`,
			)
		}

		// Domain logic: generate consistent key naming
		const key = `avatars/${userId}.jpg`

		// Upload using the storage port
		const result = await this.storage.upload(key, imageData, mimeType)

		// Return public URL (or generate one if not provided)
		return result.url ?? `https://example.com/storage/${key}`
	}

	/**
	 * Upload a document for a specific entity.
	 *
	 * @param entityType - Type of entity (e.g., "invoice", "contract")
	 * @param entityId - Unique identifier of the entity
	 * @param filename - Original filename
	 * @param data - Document data
	 * @param contentType - MIME type
	 * @returns Object key for future retrieval
	 */
	async uploadDocument(
		entityType: string,
		entityId: string,
		filename: string,
		data: Buffer,
		contentType?: string,
	): Promise<string> {
		// Domain validation: sanitize filename
		const sanitized = this.sanitizeFilename(filename)

		// Domain logic: organize by entity type and ID
		const key = `documents/${entityType}/${entityId}/${sanitized}`

		const result = await this.storage.upload(key, data, contentType)
		return result.key
	}

	/**
	 * Get a document by its key.
	 *
	 * @param key - Document key
	 * @returns Document data
	 */
	async getDocument(key: string): Promise<Buffer> {
		return this.storage.download(key)
	}

	/**
	 * Delete a document.
	 *
	 * @param key - Document key
	 */
	async deleteDocument(key: string): Promise<void> {
		await this.storage.delete(key)
	}

	/**
	 * List all documents for an entity.
	 *
	 * @param entityType - Type of entity
	 * @param entityId - Entity identifier
	 * @returns Array of document metadata
	 */
	async listDocuments(
		entityType: string,
		entityId: string,
	): Promise<ObjectMetadata[]> {
		const prefix = `documents/${entityType}/${entityId}/`
		return this.storage.list(prefix)
	}

	/**
	 * Check if a document exists.
	 *
	 * @param key - Document key
	 * @returns true if exists, false otherwise
	 */
	async documentExists(key: string): Promise<boolean> {
		return this.storage.exists(key)
	}

	/**
	 * Get storage statistics for an entity.
	 *
	 * This demonstrates aggregating port operations into domain logic.
	 *
	 * @param entityType - Type of entity
	 * @param entityId - Entity identifier
	 * @returns Statistics about stored documents
	 */
	async getStorageStats(
		entityType: string,
		entityId: string,
	): Promise<{
		totalDocuments: number
		totalSizeBytes: number
		averageSizeBytes: number
	}> {
		const documents = await this.listDocuments(entityType, entityId)

		const totalDocuments = documents.length
		const totalSizeBytes = documents.reduce(
			(sum, doc) => sum + doc.sizeBytes,
			0,
		)
		const averageSizeBytes =
			totalDocuments > 0 ? totalSizeBytes / totalDocuments : 0

		return {
			totalDocuments,
			totalSizeBytes,
			averageSizeBytes,
		}
	}

	/**
	 * Domain helper: Sanitize filename for safe storage.
	 *
	 * @param filename - Original filename
	 * @returns Sanitized filename
	 */
	private sanitizeFilename(filename: string): string {
		// Remove or replace unsafe characters
		return filename
			.replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe chars with underscore
			.replace(/_+/g, '_') // Collapse multiple underscores
			.toLowerCase()
	}
}

/**
 * Why This Design?
 *
 * 1. **Domain Logic Separation**: The service contains business rules (validation,
 *    naming conventions, stats aggregation) separate from infrastructure.
 *
 * 2. **Infrastructure Independence**: Works with ANY storage adapter (S3, Azure,
 *    filesystem) without code changes.
 *
 * 3. **Testability**: Easy to test by mocking the ObjectStoragePort port.
 *
 * 4. **Single Responsibility**: The service focuses on domain logic, the adapter
 *    focuses on infrastructure integration.
 *
 * Example Test:
 *
 * ```typescript
 * const mockStorage: ObjectStoragePort = {
 *   upload: jest.fn().mockResolvedValue({ key: 'test.jpg', sizeBytes: 1024 }),
 *   download: jest.fn(),
 *   // ... other methods
 * };
 *
 * const service = new ObjectStorageService(mockStorage);
 * await service.uploadUserAvatar('user-123', buffer, 'image/jpeg');
 *
 * expect(mockStorage.upload).toHaveBeenCalledWith(
 *   'avatars/user-123.jpg',
 *   buffer,
 *   'image/jpeg'
 * );
 * ```
 */
