'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface SoundSettings {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const SoundSettingsContext = createContext<SoundSettings | undefined>(undefined);

export function SoundSettingsProvider({ children }: { children: React.ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('skatehive_sound_enabled');
      if (saved !== null) {
        setSoundEnabledState(saved === 'true');
      }
    } catch {
      // localStorage unavailable, use default
    }
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    try {
      localStorage.setItem('skatehive_sound_enabled', String(enabled));
    } catch {
      // localStorage unavailable, setting still works in memory
    }
  }, []);

  return (
    <SoundSettingsContext.Provider value={{ soundEnabled, setSoundEnabled }}>
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
