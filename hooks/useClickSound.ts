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
    const handleClick = (e: MouseEvent) => {
      if (!audioRef.current || !soundEnabled) return;

      // Check if the clicked element is a button or within a button
      const target = e.target as HTMLElement;
      const isButton = 
        target.tagName === 'BUTTON' || 
        target.closest('button') ||
        target.getAttribute('role') === 'button' ||
        target.closest('[role="button"]');

      if (isButton) {
        // Reset the audio to the beginning and play
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          // Silently fail if audio can't be played
        });
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [soundEnabled]);
}
