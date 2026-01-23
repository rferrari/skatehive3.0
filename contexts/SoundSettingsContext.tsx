'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

interface SoundSettings {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  isHydrated: boolean;
}

const SoundSettingsContext = createContext<SoundSettings | undefined>(undefined);

export function SoundSettingsProvider({ children }: { children: React.ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('skatehive_sound_enabled');
      if (saved !== null) {
        setSoundEnabledState(saved === 'true');
      }
    } catch {
      // localStorage unavailable, use default
    }
    setIsHydrated(true);
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    try {
      localStorage.setItem('skatehive_sound_enabled', String(enabled));
    } catch {
      // localStorage unavailable, setting still works in memory
    }
  }, []);

  const value = useMemo(() => ({
    soundEnabled,
    setSoundEnabled,
    isHydrated,
  }), [soundEnabled, setSoundEnabled, isHydrated]);

  return (
    <SoundSettingsContext.Provider value={value}>
      {children}
    </SoundSettingsContext.Provider>
  );
}

export function useSoundSettings() {
  const context = useContext(SoundSettingsContext);
  if (context === undefined) {
    throw new Error('useSoundSettings must be used within SoundSettingsProvider');
  }
  return context;
}
