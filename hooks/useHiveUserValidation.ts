import { useState, useCallback, useRef } from 'react';
import HiveClient from '@/lib/hive/hiveclient';
import { validateHiveUsernameFormat, checkHiveAccountExists, cleanHiveUsername } from '@/lib/utils/hiveAccountUtils';

interface ValidationResult {
  isValid: boolean;
  isLoading: boolean;
  exists: boolean | null;
  error: string | null;
}

interface UserSearchResult {
  username: string;
  reputation: number;
  followers?: number;
  following?: number;
}

/**
 * Hook for validating and searching Hive usernames
 */
export function useHiveUserValidation() {
  const [validationCache, setValidationCache] = useState<Map<string, ValidationResult>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Validate username format according to Hive rules
   */
  const validateUsernameFormat = useCallback((username: string): { isValid: boolean; error: string | null } => {
    return validateHiveUsernameFormat(username);
  }, []);

  /**
   * Check if username exists on Hive blockchain
   */
  const checkUsernameExists = useCallback(async (username: string): Promise<boolean> => {
    return await checkHiveAccountExists(username);
  }, []);

  /**
   * Validate username format and existence
   */
  const validateUsername = useCallback(async (username: string): Promise<ValidationResult> => {
    const trimmed = cleanHiveUsername(username);

    // Check cache first
    if (validationCache.has(trimmed)) {
      return validationCache.get(trimmed)!;
    }

    // Format validation
    const formatValidation = validateUsernameFormat(trimmed);
    if (!formatValidation.isValid) {
      const result: ValidationResult = {
        isValid: false,
        isLoading: false,
        exists: null,
        error: formatValidation.error
      };
      
      // Cache format errors
      setValidationCache(prev => new Map(prev).set(trimmed, result));
      return result;
    }

    // Set loading state
    const loadingResult: ValidationResult = {
      isValid: false,
      isLoading: true,
      exists: null,
      error: null
    };
    setValidationCache(prev => new Map(prev).set(trimmed, loadingResult));

    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const exists = await checkUsernameExists(trimmed);
      
      const result: ValidationResult = {
        isValid: exists,
        isLoading: false,
        exists,
        error: exists ? null : 'Username not found on Hive blockchain'
      };

      // Cache result
      setValidationCache(prev => new Map(prev).set(trimmed, result));
      return result;

    } catch (error) {
      const result: ValidationResult = {
        isValid: false,
        isLoading: false,
        exists: null,
        error: error instanceof Error ? error.message : 'Validation failed'
      };

      // Cache error
      setValidationCache(prev => new Map(prev).set(trimmed, result));
      return result;
    }
  }, [validationCache, validateUsernameFormat, checkUsernameExists]);

  /**
   * Search for usernames that start with the given query
   */
  const searchUsernames = useCallback(async (query: string, limit: number = 5): Promise<UserSearchResult[]> => {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      // This is a simplified search - in a real implementation you might want to use
      // a dedicated search API or maintain a user index
      const searchQuery = cleanHiveUsername(query);
      
      // For now, we'll just validate the exact query and return it if valid
      const validation = await validateUsername(searchQuery);
      
      if (validation.isValid && validation.exists) {
        // Try to get more user info
        try {
          const accounts = await HiveClient.database.getAccounts([searchQuery]);
          if (accounts.length > 0) {
            const account = accounts[0];
            return [{
              username: account.name,
              reputation: typeof account.reputation === 'number' ? account.reputation : parseInt(String(account.reputation)) || 0,
            }];
          }
        } catch (error) {
          console.warn('Failed to get detailed user info:', error);
          // Still return the username if it exists
          return [{
            username: searchQuery,
            reputation: 0,
          }];
        }
      }

      return [];
    } catch (error) {
      console.error('Error searching usernames:', error);
      return [];
    }
  }, [validateUsername]);

  /**
   * Clear validation cache
   */
  const clearCache = useCallback(() => {
    setValidationCache(new Map());
  }, []);

  /**
   * Get cached validation result
   */
  const getCachedValidation = useCallback((username: string): ValidationResult | null => {
    return validationCache.get(cleanHiveUsername(username)) || null;
  }, [validationCache]);

  return {
    validateUsername,
    validateUsernameFormat,
    searchUsernames,
    getCachedValidation,
    clearCache,
  };
}
