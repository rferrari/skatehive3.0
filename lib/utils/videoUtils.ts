/**
 * Video utilities index file
 * Exports all video-related utilities for easier imports
 */

// Video processing utilities
export {
  detectFFmpegSupport,
  loadFFmpeg,
  getFetchFile,
  compressVideo,
  convertToMp4,
  compressVideoFallback,
} from './videoProcessing';

// Video upload utilities
export {
  getVideoDuration,
  isMobileDevice,
  isIPhoneMov,
  isAlreadyProcessed,
  getFileSizeLimits,
  uploadWithProgress,
  uploadWithChunks,
  handleVideoUpload,
  type UploadResult,
} from './videoUploadUtils';

// Thumbnail utilities
export {
  generateThumbnailWithCanvas,
  generateThumbnailWithFFmpeg,
  uploadThumbnail,
  generateThumbnail,
} from './videoThumbnailUtils';

// Validation utilities
export {
  validateVideoDuration,
  validateVideoFile,
  getVideoFileInfo,
  type ValidationResult,
} from './videoValidation';
