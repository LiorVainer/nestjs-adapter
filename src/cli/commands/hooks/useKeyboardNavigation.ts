/**
 * Hook for handling keyboard navigation (Ctrl+Q for back)
 */

import { useInput } from 'ink'

interface UseKeyboardNavigationOptions {
	canNavigateBack: boolean
	onBack: () => void
}

export function useKeyboardNavigation({
	canNavigateBack,
	onBack,
}: UseKeyboardNavigationOptions): void {
	useInput((input, key) => {
		if (key.ctrl && input === 'q' && canNavigateBack) {
			onBack()
		}
	})
}
