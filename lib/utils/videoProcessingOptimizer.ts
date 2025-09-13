/**
 * Video Processing Optimization Utilities
 * Consolidates common video processing logic and reduces duplication
 */

export interface ProcessingConfig {
  preferAPI: boolean;
  skipCompression: boolean;
  maxDurationSeconds?: number;
  userHP: number;
  username?: string;
  thumbnailUrl?: string;
}

export interface ProcessingDecision {
  method: 'api' | 'native' | 'skip';
  reason: string;
  shouldCompress: boolean;
  shouldResize: boolean;
  useIOSOptimized: boolean;
  priority: number; // Higher means higher priority
}

export interface DeviceCapabilities {
  isIOS: boolean;
  isAndroid: boolean;
  isOldAndroid: boolean;
  supportsFFmpeg: boolean;
  supportsMobileOptimization: boolean;
}

/**
 * Analyzes file and device to determine optimal processing strategy
 */
export function determineProcessingStrategy(
  file: File,
  deviceCapabilities: DeviceCapabilities,
  config: ProcessingConfig,
  apiAvailability: { primaryAPI: boolean; fallbackAPI: boolean }
): ProcessingDecision {
  const isMovFile = file.name.toLowerCase().endsWith(".mov") || file.type === "video/quicktime";
  const fileSizeMB = file.size / (1024 * 1024);
  const isLargeFile = fileSizeMB > 50;
  const isMediumFile = fileSizeMB > 12;
  
  // Check if APIs are available
  const hasAPIs = apiAvailability.primaryAPI || apiAvailability.fallbackAPI;
  
  console.log("🔍 Analyzing processing strategy:", {
    fileName: file.name,
    fileSizeMB: fileSizeMB.toFixed(2),
    isMovFile,
    hasAPIs,
    preferAPI: config.preferAPI,
    deviceCapabilities,
  });

  // API Processing Decision
  if (config.preferAPI && hasAPIs) {
    return {
      method: 'api',
      reason: 'External API processing preferred and available',
      shouldCompress: false, // API handles compression
      shouldResize: false,
      useIOSOptimized: false,
      priority: 100,
    };
  }

  // Android MP4 optimization
  if (deviceCapabilities.isAndroid && file.type === "video/mp4" && !isMovFile && fileSizeMB < 45) {
    return {
      method: 'skip',
      reason: 'Android MP4 file - no processing needed',
      shouldCompress: false,
      shouldResize: false,
      useIOSOptimized: false,
      priority: 90,
    };
  }

  // Native processing decisions
  const useIOSOptimized = deviceCapabilities.isIOS && isMovFile && fileSizeMB < 100;
  const shouldCompress = !config.skipCompression && fileSizeMB > 5 && !isLargeFile;
  const shouldResize = isMediumFile && shouldCompress;

  // Large file handling
  if (isLargeFile) {
    return {
      method: 'native',
      reason: 'Large file - using native processing with minimal compression',
      shouldCompress: false,
      shouldResize: false,
      useIOSOptimized,
      priority: 70,
    };
  }

  // iOS .MOV optimization
  if (useIOSOptimized) {
    return {
      method: 'native',
      reason: 'iOS .MOV file - using optimized processing',
      shouldCompress,
      shouldResize: false,
      useIOSOptimized: true,
      priority: 85,
    };
  }

  // Standard processing
  return {
    method: 'native',
    reason: 'Standard native processing',
    shouldCompress,
    shouldResize,
    useIOSOptimized: false,
    priority: 50,
  };
}

/**
 * Estimates processing time based on file and strategy
 */
export function estimateProcessingTime(
  file: File,
  decision: ProcessingDecision,
  deviceCapabilities: DeviceCapabilities
): number {
  const fileSizeMB = file.size / (1024 * 1024);
  
  if (decision.method === 'api') {
    // API processing is usually faster but depends on network
    return Math.max(10, fileSizeMB * 2); // 2 seconds per MB minimum 10s
  }
  
  if (decision.method === 'skip') {
    return 1; // Almost instant
  }
  
  // Native processing estimates
  let baseTime = fileSizeMB * 3; // 3 seconds per MB base
  
  if (decision.shouldCompress) {
    baseTime *= 1.5; // Compression adds time
  }
  
  if (decision.shouldResize) {
    baseTime *= 1.3; // Resizing adds time
  }
  
  if (deviceCapabilities.isOldAndroid) {
    baseTime *= 2; // Old Android is slower
  }
  
  if (decision.useIOSOptimized) {
    baseTime *= 0.8; // iOS optimization is faster
  }
  
  return Math.max(5, Math.round(baseTime)); // Minimum 5 seconds
}

/**
 * Gets user-friendly status message based on processing strategy
 */
export function getProcessingStatusMessage(
  decision: ProcessingDecision,
  progress: number,
  deviceCapabilities: DeviceCapabilities
): string {
  if (decision.method === 'api') {
    if (progress < 20) return "🚀 Sending to conversion API...";
    if (progress < 60) return "⚡ API processing video...";
    if (progress < 90) return "📤 API uploading result...";
    return "✅ API processing complete!";
  }
  
  if (decision.method === 'skip') {
    return "⚡ No processing needed - uploading directly...";
  }
  
  // Native processing messages
  if (decision.useIOSOptimized) {
    if (progress < 30) return "📱 iPhone video detected - optimizing...";
    if (progress < 70) return "🎬 Making iPhone video awesome...";
    return "✨ iPhone optimization complete!";
  }
  
  if (deviceCapabilities.isAndroid) {
    if (progress < 30) return "🤖 Processing Android video...";
    if (progress < 70) return "🔧 Android video optimization...";
    return "✅ Android processing complete!";
  }
  
  if (decision.shouldCompress && decision.shouldResize) {
    if (progress < 30) return "🔄 Compressing and resizing video...";
    if (progress < 70) return "⚙️ Advanced video optimization...";
    return "🎯 Compression complete!";
  }
  
  if (decision.shouldCompress) {
    if (progress < 30) return "🗜️ Compressing video...";
    if (progress < 70) return "📱 Video compression in progress...";
    return "✅ Compression complete!";
  }
  
  if (progress < 30) return "🎬 Processing video...";
  if (progress < 70) return "⚙️ Video optimization...";
  return "✅ Processing complete!";
}

/**
 * Validates file before processing
 */
export function validateVideoFile(file: File, config: ProcessingConfig): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fileSizeMB = file.size / (1024 * 1024);
  
  // File type validation
  if (!file.type.startsWith('video/')) {
    errors.push("File is not a video");
  }
  
  // Size validation based on user HP
  const maxSize = config.userHP >= 100 ? 200 : 150; // MB
  if (fileSizeMB > maxSize) {
    errors.push(`File too large (${fileSizeMB.toFixed(1)}MB). Maximum: ${maxSize}MB`);
  }
  
  // Warnings for large files
  if (fileSizeMB > 30) {
    warnings.push("Large files may take longer to process");
  }
  
  // Warnings for specific formats
  if (file.name.toLowerCase().endsWith('.mov')) {
    warnings.push(".MOV files will be converted to MP4 for better compatibility");
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Optimizes upload parameters based on file and device
 */
export function optimizeUploadParams(
  file: File,
  deviceCapabilities: DeviceCapabilities,
  config: ProcessingConfig
): {
  chunkSize: number;
  timeout: number;
  retries: number;
  endpoint: string;
} {
  const fileSizeMB = file.size / (1024 * 1024);
  const isMobile = deviceCapabilities.isAndroid || deviceCapabilities.isIOS;
  
  return {
    chunkSize: isMobile ? 10 * 1024 * 1024 : 10 * 1024 * 1024, // 10MB mobile, 10MB desktop
    timeout: isMobile ? 600000 : 480000, // 10min mobile, 8min desktop (increased for larger files)
    retries: fileSizeMB > 20 ? 5 : 3, // More retries for large files
    endpoint: isMobile ? "/api/pinata-mobile" : "/api/pinata",
  };
}

/**
 * Logs comprehensive processing analytics
 */
export function logProcessingAnalytics(
  file: File,
  decision: ProcessingDecision,
  deviceCapabilities: DeviceCapabilities,
  startTime: number,
  endTime: number,
  success: boolean,
  error?: string
): void {
  const analytics = {
    // File info
    fileName: file.name,
    fileSize: file.size,
    fileSizeMB: (file.size / (1024 * 1024)).toFixed(2),
    fileType: file.type,
    
    // Processing info
    processingMethod: decision.method,
    processingReason: decision.reason,
    shouldCompress: decision.shouldCompress,
    shouldResize: decision.shouldResize,
    useIOSOptimized: decision.useIOSOptimized,
    
    // Device info
    deviceCapabilities,
    
    // Performance info
    processingTimeMs: endTime - startTime,
    processingTimeSeconds: ((endTime - startTime) / 1000).toFixed(2),
    success,
    error,
    
    // Timestamp
    timestamp: new Date().toISOString(),
  };
  
  console.log("📊 Video Processing Analytics:", analytics);
  
  // In production, you might want to send this to an analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example: sendAnalytics('video_processing', analytics);
  }
}
