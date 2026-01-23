/**
 * Utility functions for clipboard operations to prevent duplicate error logs
 */

// Track last clipboard error to prevent duplicate logging
let lastClipboardError: string | null = null;
let lastClipboardErrorTime = 0;
const CLIPBOARD_ERROR_DEBOUNCE = 1000; // 1 second debounce

/**
 * Safely copy text to clipboard with consistent error handling
 * Prevents duplicate error logs by debouncing similar errors
 */
export async function safeCopyToClipboard(
  text: string,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    showToast?: (options: { title: string; description?: string; status: "success" | "error" }) => void;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await navigator.clipboard.writeText(text);
    
    if (options?.showToast) {
      options.showToast({
        title: options.successMessage || "Copied to clipboard",
        status: "success",
      });
    }
    
    // Reset error tracking on success
    lastClipboardError = null;
    lastClipboardErrorTime = 0;
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown clipboard error";
    const now = Date.now();
    
    // Check if this is a duplicate error within debounce period
    if (
      lastClipboardError === errorMessage && 
      now - lastClipboardErrorTime < CLIPBOARD_ERROR_DEBOUNCE
    ) {
      // Skip logging duplicate errors
      return { success: false, error: errorMessage };
    }
    
    // Update error tracking
    lastClipboardError = errorMessage;
    lastClipboardErrorTime = now;
    
    console.error("Clipboard error (deduped):", errorMessage);
    
    if (options?.showToast) {
      options.showToast({
        title: options.errorMessage || "Failed to copy",
        description: "Could not copy to clipboard",
        status: "error",
      });
    }
    
    return { success: false, error: errorMessage };
  }
}

/**
 * Check if clipboard API is available
 */
export function isClipboardAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'clipboard' in navigator;
}
