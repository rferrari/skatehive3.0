'use client';

import React from 'react';
import { useClickSound } from '@/hooks/useClickSound';

export function ClickSoundProvider({ children }: { children: React.ReactNode }) {
  useClickSound();

  return <>{children}</>;
}
