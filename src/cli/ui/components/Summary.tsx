/**
 * Summary Component
 *
 * Shows summary of generation results.
 */

import { relative } from 'node:path'
import { Box, Text } from 'ink'
import React from 'react'

export interface SummaryProps {
	success: boolean
	filesGenerated: number
	totalFiles: number
	duration?: number
	outputPath?: string
	files?: string[]
	tips?: string[]
}

/**
 * Converts Windows path to proper file:// URL format.
 * Windows: C:\path\to\file -> file:///C:/path/to/file
 * Unix: /path/to/file -> file:///path/to/file
 */
function toFileUrl(absolutePath: string): string {
	// Convert backslashes to forward slashes
	const normalizedPath = absolutePath.replace(/\\/g, '/')

	// For Windows paths (C:/...), add triple slash
	// For Unix paths (/...), add triple slash
	if (normalizedPath.match(/^[A-Za-z]:/)) {
		return `file:///${normalizedPath}`
	}
	return `file://${normalizedPath}`
}

/**
 * Creates a clickable hyperlink using OSC 8 ANSI escape codes.
 * Supported by modern terminals (VS Code, iTerm2, Windows Terminal, etc.)
 */
function createHyperlink(text: string, url: string): string {
	const OSC = '\u001B]'
	const BEL = '\u0007'
	const SEP = ';'

	return `${OSC}8${SEP}${SEP}${url}${BEL}${text}${OSC}8${SEP}${SEP}${BEL}`
}

/**
 * Shows generation summary with file counts and helpful tips.
 */
export function Summary({
	success,
	filesGenerated,
	totalFiles,
	duration,
	outputPath,
	files,
	tips,
}: SummaryProps) {
	return (
		<Box flexDirection="column" paddingY={1}>
			<Box marginBottom={1}>
				{success ? (
					<Text color="green" bold>
						✅ Successfully generated {filesGenerated}/{totalFiles} files
						{duration ? ` in ${(duration / 1000).toFixed(1)}s` : ''}
					</Text>
				) : (
					<Text color="red" bold>
						❌ Generation failed
					</Text>
				)}
			</Box>

			{outputPath && (
				<Box marginBottom={1}>
					<Text dimColor>Output: {outputPath}</Text>
				</Box>
			)}

			{files && files.length > 0 && (
				<Box flexDirection="column" marginTop={1} marginBottom={1}>
					<Text bold>📁 Generated files:</Text>
					{files.map((file, index) => {
						// Get relative path from project root
						const relativePath = relative(process.cwd(), file)

						// Create proper file:// URL for the absolute path
						const fileUrl = toFileUrl(file)

						// Create clickable link: display relative path, link to absolute path
						const linkText = createHyperlink(relativePath, fileUrl)

						return (
							// biome-ignore lint/suspicious/noArrayIndexKey: For Cli UI only
							<Box key={index} marginLeft={2}>
								<Text dimColor>• </Text>
								<Text color="cyan">{linkText}</Text>
							</Box>
						)
					})}
				</Box>
			)}

			{tips && tips.length > 0 && (
				<Box flexDirection="column" marginTop={1}>
					<Text bold>💡 Next steps:</Text>
					{tips.map((tip, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: For Cli UI only
						<Box key={index} marginLeft={2}>
							<Text>• {tip}</Text>
						</Box>
					))}
				</Box>
			)}
		</Box>
	)
}
