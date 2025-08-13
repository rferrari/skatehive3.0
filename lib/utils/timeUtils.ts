/**
 * Format seconds into MM:SS format
 * @param seconds - Time in seconds
 * @returns Formatted time string (e.g., "1:23")
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Convert time string back to seconds
 * @param timeString - Time in MM:SS format
 * @returns Time in seconds
 */
export const parseTime = (timeString: string): number => {
  const [mins, secs] = timeString.split(':').map(Number);
  return mins * 60 + secs;
};

/**
 * Clamp a value between min and max
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};
