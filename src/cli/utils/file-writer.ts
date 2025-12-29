/**
 * File writing utilities with conflict detection
 * Uses Bun's native APIs for faster performance
 */

export interface WriteOptions {
	force?: boolean
	dryRun?: boolean
}

export interface WriteResult {
	success: boolean
	path: string
	existed: boolean
	written: boolean
	message?: string
}

export async function writeFile(
	filePath: string,
	content: string,
	options: WriteOptions = {},
): Promise<WriteResult> {
	const { force = false, dryRun = false } = options

	// Check if file exists
	const file = Bun.file(filePath)
	const existed = await file.exists()

	// If file exists and not forcing, return conflict
	if (existed && !force && !dryRun) {
		return {
			success: false,
			path: filePath,
			existed: true,
			written: false,
			message: 'File already exists. Use --force to overwrite.',
		}
	}

	// Dry run - don't actually write
	if (dryRun) {
		return {
			success: true,
			path: filePath,
			existed,
			written: false,
			message: 'Dry run - file not written',
		}
	}

	try {
		// Bun.write automatically creates parent directories
		await Bun.write(filePath, content)

		return {
			success: true,
			path: filePath,
			existed,
			written: true,
			message: existed ? 'File overwritten' : 'File created',
		}
	} catch (error) {
		return {
			success: false,
			path: filePath,
			existed,
			written: false,
			message: `Failed to write file: ${error instanceof Error ? error.message : String(error)}`,
		}
	}
}

