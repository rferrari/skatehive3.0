/**
 * Video utilities index file
 * Exports all video-related utilities for easier imports
 */

// Video processing utilities
export {
  processVideoOnServer,
  type ProcessingResult,
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

// Video upload core utilities
export {
  uploadToIPFS,
  isMP4,
  validateVideo,
  type UploadResult as VideoUploadResult,
} from './videoUpload';
