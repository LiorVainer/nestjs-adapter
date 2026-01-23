/**
 * Summary Component
 *
 * Shows summary of generation results with badges for created components.
 */

import { relative } from 'node:path'
import { Badge, StatusMessage } from '@inkjs/ui'
import { Box, Text } from 'ink'

export interface SummaryProps {
	success: boolean
	filesGenerated: number
	totalFiles: number
	duration?: number
	outputPath?: string
	files?: string[]
	portFiles?: string[]
	adapterFiles?: string[]
	serviceFiles?: string[]
	tips?: string[]
	portName?: string
	adapterName?: string
	serviceName?: string
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
 * Formats duration in milliseconds to human-readable string.
 * Examples: "150ms", "1.5s", "2m 30s"
 */
function formatDuration(ms: number): string {
	if (ms < 1000) {
		return `${ms}ms`
	}

	if (ms < 60000) {
		return `${(ms / 1000).toFixed(1)}s`
	}

	const minutes = Math.floor(ms / 60000)
	const seconds = Math.floor((ms % 60000) / 1000)
	return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
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
	portFiles,
	adapterFiles,
	serviceFiles,
	tips,
	portName,
	adapterName,
	serviceName,
}: SummaryProps): JSX.Element {
	// Check if we should show grouped files (when separate file arrays are provided)
	const showGroupedFiles = portFiles || adapterFiles || serviceFiles

	// Helper function to render a list of files
	const renderFileList = (fileList: string[]) =>
		fileList.map((file, index) => {
			const relativePath = relative(process.cwd(), file)
			const fileUrl = toFileUrl(file)
			const linkText = createHyperlink(relativePath, fileUrl)

			return (
				// biome-ignore lint/suspicious/noArrayIndexKey: For Cli UI only
				<Box key={index} marginLeft={2}>
					<Text dimColor>• </Text>
					<Text color="cyan">{linkText}</Text>
				</Box>
			)
		})

	return (
		<Box flexDirection="column" gap={2}>
			<Box>
				{success ? (
					<StatusMessage variant="success">
						Successfully generated {filesGenerated}/{totalFiles} files
						{duration ? ` in ${formatDuration(duration)}` : ''}
					</StatusMessage>
				) : (
					<StatusMessage variant="error">Generation failed</StatusMessage>
				)}
			</Box>

			{outputPath && (
				<Box>
					<Text dimColor>Output: {outputPath}</Text>
				</Box>
			)}

			{/* Show grouped files when separate arrays are provided */}
			{showGroupedFiles ? (
				<Box flexDirection="column">
					{portFiles && portFiles.length > 0 && (
						<Box flexDirection="column" marginBottom={1}>
							<Box marginBottom={1}>
								<Badge color="blue">Port: {portName}</Badge>
							</Box>
							{renderFileList(portFiles)}
						</Box>
					)}

					{adapterFiles && adapterFiles.length > 0 && (
						<Box flexDirection="column">
							<Box marginBottom={1}>
								<Badge color="green">Adapter: {adapterName}</Badge>
							</Box>
							{renderFileList(adapterFiles)}
						</Box>
					)}

					{serviceFiles && serviceFiles.length > 0 && (
						<Box flexDirection="column">
							<Box marginBottom={1}>
								<Badge color="cyan">Service: {serviceName}</Badge>
							</Box>
							{renderFileList(serviceFiles)}
						</Box>
					)}
				</Box>
			) : (
				/* Show regular file list when only the files array is provided */
				files &&
				files.length > 0 && (
					<Box flexDirection="column" marginBottom={1}>
						<Text bold>📁 Generated files:</Text>
						{renderFileList(files)}
					</Box>
				)
			)}

			{tips && tips.length > 0 && (
				<Box flexDirection="column">
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
