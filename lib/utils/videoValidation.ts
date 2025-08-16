/**
 * Video file validation utilities
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateVideoDuration(
  duration: number,
  maxDurationSeconds?: number
): ValidationResult {
  if (maxDurationSeconds && duration > maxDurationSeconds) {
    return {
      isValid: false,
      error: `Video duration (${Math.round(duration)}s) exceeds maximum allowed (${maxDurationSeconds}s)`
    };
  }
  
  return { isValid: true };
}

export function validateVideoFile(file: File): ValidationResult {
  // Check if it's a video file
  if (!file.type.startsWith('video/')) {
    return {
      isValid: false,
      error: 'File must be a video'
    };
  }
  
  // Check file size (basic check)
  const maxSize = 100 * 1024 * 1024; // 100MB basic limit
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum: ${Math.round(maxSize / 1024 / 1024)}MB`
    };
  }
  
  return { isValid: true };
}

export function getVideoFileInfo(file: File) {
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    sizeMB: Math.round((file.size / 1024 / 1024) * 100) / 100,
    isIPhoneMov: file.name.toLowerCase().endsWith(".mov") && file.type === "video/quicktime",
    isAlreadyProcessed: file.name.includes("trimmed_") || 
                      file.type === "video/webm" ||
                      (file as any).fromTrimModal,
    hasExistingThumbnail: !!(file as any).thumbnailUrl
  };
}
