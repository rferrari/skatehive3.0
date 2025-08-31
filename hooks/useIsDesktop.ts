import { useState, useEffect } from "react";
import { TOAST_CONFIG } from "@/constants/toastConfig";

// Custom hook to check if we're on desktop without SSR issues
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= TOAST_CONFIG.DESKTOP_BREAKPOINT);
    };

    if (typeof window !== "undefined") {
      checkDesktop();
      window.addEventListener("resize", checkDesktop);
      return () => window.removeEventListener("resize", checkDesktop);
    }
  }, []);

  return { isDesktop: isMounted && isDesktop, isMounted };
}
