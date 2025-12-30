/**
 * S3 Object Storage Service
 *
 * This service implements the ObjectStoragePort port using AWS S3.
 * It contains all S3-specific infrastructure code and translates between
 * the domain interface and the AWS SDK.
 *
 * Key Points:
 * - Implements ObjectStoragePort interface
 * - Receives S3Options via constructor injection
 * - Contains all AWS S3 API integration logic
 * - Translates S3 responses to domain types
 */

import { Injectable } from '@nestjs/common'
import type {
	ObjectMetadata,
	ObjectStoragePort,
	UploadResult,
} from '../../object-storage.port'
import type { S3Options } from './s3.types'

/**
 * S3 implementation of the ObjectStoragePort port.
 *
 * This service handles all interactions with AWS S3, including:
 * - Uploading objects
 * - Downloading objects
 * - Managing object metadata
 * - Listing objects
 */
@Injectable()
export class S3ObjectStorageService implements ObjectStoragePort {
	constructor(private readonly options: S3Options) {
		console.log(
			`S3ObjectStorageService initialized: bucket=${options.bucket}, region=${options.region}`,
		)
	}

	/**
	 * Upload an object to S3.
	 */
	async upload(
		key: string,
		data: Buffer,
		_contentType?: string,
	): Promise<UploadResult> {
		console.log(`S3: Uploading object: ${key}`)

		// In a real implementation, you would:
		// const client = new S3Client({ region: this.options.region, ... });
		// await client.send(new PutObjectCommand({
		//   Bucket: this.options.bucket,
		//   Key: key,
		//   Body: data,
		//   ContentType: contentType,
		//   ACL: this.options.defaultAcl || 'private'
		// }));

		// Simulate S3 API call
		await this.simulateDelay(100)

		// Generate public URL if ACL is public-read
		const isPublic = this.options.defaultAcl === 'public-read'
		const url = isPublic ? this.generatePublicUrl(key) : undefined

		return {
			key,
			sizeBytes: data.length,
			url,
		}
	}

	/**
	 * Download an object from S3.
	 */
	async download(key: string): Promise<Buffer> {
		console.log(`S3: Downloading object: ${key}`)

		// In a real implementation:
		// const response = await client.send(new GetObjectCommand({
		//   Bucket: this.options.bucket,
		//   Key: key
		// }));
		// return Buffer.from(await response.Body.transformToByteArray());

		// Simulate S3 API call
		await this.simulateDelay(150)

		// Return mock data
		return Buffer.from(`Mock data for ${key}`)
	}

	/**
	 * Delete an object from S3.
	 */
	async delete(key: string): Promise<void> {
		console.log(`S3: Deleting object: ${key}`)

		// In a real implementation:
		// await client.send(new DeleteObjectCommand({
		//   Bucket: this.options.bucket,
		//   Key: key
		// }));

		// Simulate S3 API call
		await this.simulateDelay(80)
	}

	/**
	 * Check if an object exists in S3.
	 */
	async exists(key: string): Promise<boolean> {
		console.log(`S3: Checking existence of: ${key}`)

		// In a real implementation:
		// try {
		//   await client.send(new HeadObjectCommand({
		//     Bucket: this.options.bucket,
		//     Key: key
		//   }));
		//   return true;
		// } catch (error) {
		//   if (error.name === 'NotFound') return false;
		//   throw error;
		// }

		// Simulate S3 API call
		await this.simulateDelay(50)

		// Mock: objects starting with 'avatars/' exist
		return key.startsWith('avatars/')
	}

	/**
	 * Get object metadata from S3.
	 */
	async getMetadata(key: string): Promise<ObjectMetadata> {
		console.log(`S3: Getting metadata for: ${key}`)

		// In a real implementation:
		// const response = await client.send(new HeadObjectCommand({
		//   Bucket: this.options.bucket,
		//   Key: key
		// }));
		//
		// return {
		//   key,
		//   sizeBytes: response.ContentLength,
		//   contentType: response.ContentType,
		//   lastModified: response.LastModified,
		//   etag: response.ETag
		// };

		// Simulate S3 API call
		await this.simulateDelay(60)

		return {
			key,
			sizeBytes: 1024,
			contentType: 'application/octet-stream',
			lastModified: new Date(),
			etag: '"abc123"',
		}
	}

	/**
	 * List objects in S3 with a given prefix.
	 */
	async list(prefix = '', _maxResults = 1000): Promise<ObjectMetadata[]> {
		console.log(`S3: Listing objects with prefix: ${prefix}`)

		// In a real implementation:
		// const response = await client.send(new ListObjectsV2Command({
		//   Bucket: this.options.bucket,
		//   Prefix: prefix,
		//   MaxKeys: maxResults
		// }));
		//
		// return (response.Contents || []).map(obj => ({
		//   key: obj.Key,
		//   sizeBytes: obj.Size,
		//   lastModified: obj.LastModified,
		//   etag: obj.ETag
		// }));

		// Simulate S3 API call
		await this.simulateDelay(200)

		// Return mock list
		return [
			{
				key: `${prefix}file1.txt`,
				sizeBytes: 512,
				lastModified: new Date(),
				contentType: 'text/plain',
			},
			{
				key: `${prefix}file2.jpg`,
				sizeBytes: 2048,
				lastModified: new Date(),
				contentType: 'image/jpeg',
			},
		]
	}

	/**
	 * Generate a public URL for an object.
	 */
	private generatePublicUrl(key: string): string {
		if (this.options.publicUrlBase) {
			return `${this.options.publicUrlBase}/${key}`
		}

		// Default S3 URL format
		if (this.options.endpoint) {
			return `${this.options.endpoint}/${this.options.bucket}/${key}`
		}

		return `https://${this.options.bucket}.s3.${this.options.region}.amazonaws.com/${key}`
	}

	/**
	 * Simulate network delay for demo purposes.
	 */
	private async simulateDelay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}
}

/**
 * Real-World Implementation Notes:
 *
 * 1. **AWS SDK Integration**: Install @aws-sdk/client-s3 and use S3Client
 *
 * 2. **Error Handling**: Wrap S3 calls in try-catch and translate AWS errors
 *    to domain-friendly errors
 *
 * 3. **Streaming**: For large files, use streams instead of Buffers:
 *    - Use stream.Readable for uploads
 *    - Stream downloads directly to response
 *
 * 4. **Retries**: Configure exponential backoff for transient errors
 *
 * 5. **Presigned URLs**: Add a method to generate temporary download URLs:
 *    async getPresignedUrl(key: string, expiresIn: number): Promise<string>
 *
 * 6. **Multipart Uploads**: For files >100MB, use multipart upload API
 *
 * 7. **Connection Pooling**: Reuse S3Client instance across requests
 */
