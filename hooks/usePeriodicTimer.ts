import { useRef, useCallback, useEffect } from "react";

interface TimerConfig {
  initialDelay?: number;
  interval?: number;
  enabled?: boolean;
}

export function usePeriodicTimer(
  callback: () => void,
  { initialDelay, interval, enabled = true }: TimerConfig
) {
  const initialTimerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (initialTimerRef.current) {
      clearTimeout(initialTimerRef.current);
      initialTimerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimers = useCallback(() => {
    clearTimers();

    if (!enabled) return;

    // Set initial timer if specified
    if (initialDelay !== undefined) {
      initialTimerRef.current = setTimeout(() => {
        callback();
      }, initialDelay);
    }

    // Set interval timer if specified
    if (interval !== undefined) {
      intervalRef.current = setInterval(() => {
        callback();
      }, interval);
    }
  }, [callback, initialDelay, interval, enabled, clearTimers]);

  useEffect(() => {
    startTimers();
    return clearTimers;
  }, [startTimers, clearTimers]);

  return { clearTimers, restartTimers: startTimers };
}
