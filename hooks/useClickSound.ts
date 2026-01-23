'use client';

import { useEffect, useRef } from 'react';
import { useSoundSettings } from '@/contexts/SoundSettingsContext';

export function useClickSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { soundEnabled } = useSoundSettings();

  useEffect(() => {
    // Create audio element
    const audio = new Audio('/bip.mp3');
    audio.volume = 0.5; // Set volume to 50%
    audioRef.current = audio;

    // Add click event listener to document
    const handleClick = () => {
      if (audioRef.current && soundEnabled) {
        // Reset the audio to the beginning and play
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          // Silently fail if audio can't be played (e.g., user hasn't interacted with page yet)
        });
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [soundEnabled]);
}
