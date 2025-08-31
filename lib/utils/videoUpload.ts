/**
 * Clean video upload utilities - Step 1
 */

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Check if file is MP4
 */
export function isMP4(file: File): boolean {
  return file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4');
}

/**
 * Validate video file
 */
export function validateVideo(file: File): { valid: boolean; error?: string } {
  if (!file.type.startsWith('video/')) {
    return { valid: false, error: 'File must be a video' };
  }
  
  // Basic size check (50MB limit for now)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large (max 50MB)' };
  }
  
  // Warn about large files that may process slowly
  const slowProcessingSize = 20 * 1024 * 1024; // 20MB
  if (file.size > slowProcessingSize) {
    console.warn(`⚠️ Large video file (${(file.size / 1024 / 1024).toFixed(1)}MB) - processing may take 2-3 minutes`);
  }
  
  return { valid: true };
}

/**
 * Upload video directly to IPFS (for MP4 files)
 */
export async function uploadToIPFS(file: File, username: string = 'anonymous'): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('creator', username);

    const response = await fetch('/api/pinata', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.IpfsHash) {
      throw new Error('No IPFS hash returned');
    }

    return {
      success: true,
      url: `https://ipfs.skatehive.app/ipfs/${result.IpfsHash}`
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}
