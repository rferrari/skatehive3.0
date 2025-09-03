import HiveClient from '@/lib/hive/hiveclient';

/**
 * Check if a Hive account exists
 * @param username The username to check
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise<boolean> - true if account exists, false otherwise
 */
export async function checkHiveAccountExists(username: string, signal?: AbortSignal): Promise<boolean> {
  if (!username || typeof username !== 'string') {
    return false;
  }

  const trimmed = username.trim().toLowerCase();
  
  // Basic format validation
  if (trimmed.length < 3 || trimmed.length > 16) {
    return false;
  }

  if (!/^[a-z][a-z0-9.-]*[a-z0-9]$/.test(trimmed)) {
    return false;
  }

  try {
    // Check if the request was aborted before making the API call
    if (signal?.aborted) {
      throw new Error('Request was aborted');
    }

    const accounts = await HiveClient.database.getAccounts([trimmed]);
    
    // Check if the request was aborted after the API call
    if (signal?.aborted) {
      throw new Error('Request was aborted');
    }
    
    return accounts.length > 0;
  } catch (error) {
    if (signal?.aborted || (error instanceof Error && error.message === 'Request was aborted')) {
      throw error; // Re-throw abort errors
    }
    console.error('Error checking account existence:', error);
    return false;
  }
}

/**
 * Validate Hive username format according to Hive rules
 * @param username The username to validate
 * @returns Object with validation result and error message
 */
export function validateHiveUsernameFormat(username: string): { 
  isValid: boolean; 
  error: string | null; 
} {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Username is required' };
  }

  const trimmed = username.trim().toLowerCase();

  // Length validation (3-16 characters)
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }
  if (trimmed.length > 16) {
    return { isValid: false, error: 'Username must be at most 16 characters' };
  }

  // Start/End validation: must start with lowercase letter, end with letter or digit
  if (!/^[a-z]/.test(trimmed)) {
    return { isValid: false, error: 'Username must start with a lowercase letter' };
  }
  if (!/[a-z0-9]$/.test(trimmed)) {
    return { isValid: false, error: 'Username must end with a lowercase letter or digit' };
  }

  // Allowed characters: only lowercase letters, digits, hyphens, and periods
  if (!/^[a-z0-9.-]+$/.test(trimmed)) {
    return { 
      isValid: false, 
      error: 'Username can only contain lowercase letters, digits, hyphens (-), and periods (.)' 
    };
  }

  // Hyphens and periods adjacency: cannot be adjacent to each other or to themselves
  if (/[.-]{2,}/.test(trimmed)) {
    return { isValid: false, error: 'Hyphens and periods cannot be adjacent to each other or to themselves' };
  }

  // Segments validation: if username includes periods, each dot-separated segment must be at least 3 characters long
  if (trimmed.includes('.')) {
    const segments = trimmed.split('.');
    for (const segment of segments) {
      if (segment.length < 3) {
        return { isValid: false, error: 'Each segment separated by periods must be at least 3 characters long' };
      }
    }
  }

  return { isValid: true, error: null };
}

/**
 * Clean and normalize a Hive username
 * @param username The username to clean
 * @returns Cleaned username
 */
export function cleanHiveUsername(username: string): string {
  if (!username || typeof username !== 'string') {
    return '';
  }

  return username.trim().toLowerCase().replace(/^@/, '');
}
