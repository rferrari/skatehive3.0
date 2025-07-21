"use client";

import { useEffect, useState } from 'react';
import { useProfile, useSignIn } from '@farcaster/auth-kit';

interface FarcasterSession {
  fid: number;
  username: string;
  pfpUrl?: string;
  bio?: string;
  displayName?: string;
  timestamp: number;
}

const SESSION_KEY = 'farcaster_session';
const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export function useFarcasterSession() {
  const { isAuthenticated, profile } = useProfile();
  const [hasPersistedSession, setHasPersistedSession] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  // Save session to localStorage when authenticated
  useEffect(() => {
    if (isAuthenticated && profile?.fid && profile?.username) {
      const session: FarcasterSession = {
        fid: profile.fid,
        username: profile.username,
        pfpUrl: profile.pfpUrl,
        displayName: profile.displayName,
        timestamp: Date.now(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setHasPersistedSession(true);
      console.log('[FarcasterSession] Saved session:', session);
    }
  }, [isAuthenticated, profile]);

  // Restore session from localStorage on mount
  useEffect(() => {
    const restoreSession = () => {
      try {
        const savedSession = localStorage.getItem(SESSION_KEY);
        console.log('[FarcasterSession] Restoring session, found:', savedSession);
        if (savedSession) {
          const session: FarcasterSession = JSON.parse(savedSession);
          const isExpired = Date.now() - session.timestamp > SESSION_EXPIRY;
          
          if (isExpired) {
            console.log('[FarcasterSession] Session expired, removing');
            localStorage.removeItem(SESSION_KEY);
            setHasPersistedSession(false);
          } else {
            console.log('[FarcasterSession] Session restored:', session);
            setHasPersistedSession(true);
          }
        }
      } catch (error) {
        console.warn('Failed to restore Farcaster session:', error);
        localStorage.removeItem(SESSION_KEY);
      } finally {
        setIsRestoring(false);
      }
    };

    restoreSession();
  }, []);

  // Clear session on sign out
  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    setHasPersistedSession(false);
  };

  // Get persisted session data
  const getPersistedSession = (): FarcasterSession | null => {
    try {
      const savedSession = localStorage.getItem(SESSION_KEY);
      if (savedSession) {
        const session: FarcasterSession = JSON.parse(savedSession);
        const isExpired = Date.now() - session.timestamp > SESSION_EXPIRY;
        
        if (isExpired) {
          localStorage.removeItem(SESSION_KEY);
          return null;
        }
        return session;
      }
    } catch (error) {
      console.warn('Failed to get persisted session:', error);
    }
    return null;
  };

  return {
    isAuthenticated: isAuthenticated || hasPersistedSession,
    profile: (() => {
      // Prioritize Auth Kit profile if available
      if (isAuthenticated && profile) return profile;
      // Fall back to persisted session
      if (hasPersistedSession) return getPersistedSession();
      // No profile available
      return null;
    })(),
    hasPersistedSession,
    isRestoring,
    clearSession,
    getPersistedSession,
  };
}
