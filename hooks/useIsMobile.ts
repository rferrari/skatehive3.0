"use client";
import { useState, useEffect } from "react";

// Enhanced mobile detection function
const detectMobileDevice = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    
    // User agent detection for actual mobile devices
    const userAgentMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );
    
    // Touch support detection
    const hasTouchSupport = 'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 || 
        (navigator as any).msMaxTouchPoints > 0;
    
    // Screen width detection (fallback for edge cases)
    const smallScreen = window.innerWidth < 768;
    
    // Device pixel ratio detection (mobile devices typically have higher DPR)
    const highDPR = window.devicePixelRatio > 1;
    
    // Orientation detection (mobile devices support orientation change)
    const hasOrientation = typeof window.orientation !== 'undefined';
    
    // Primary check: user agent
    if (userAgentMobile) return true;
    
    // Secondary check: combination of touch + small screen
    if (hasTouchSupport && smallScreen) return true;
    
    // Tertiary check: orientation support + touch + high DPR
    if (hasOrientation && hasTouchSupport && highDPR) return true;
    
    // Fallback to screen width only
    return smallScreen;
};

export default function useIsMobile() {
    const [isMobile, setIsMobile] = useState(() => {
        // Check if window is available (client-side) and get initial value
        if (typeof window !== 'undefined') {
            return detectMobileDevice();
        }
        // Fallback to false for SSR
        return false;
    });

    useEffect(() => {
        let debounceTimer: NodeJS.Timeout;

        const handleResize = () => {
            // Clear the previous timer
            clearTimeout(debounceTimer);

            // Set a new timer to debounce the resize event
            debounceTimer = setTimeout(() => {
                const mobile = detectMobileDevice();
                setIsMobile(mobile);
            }, 150); // 150ms debounce delay
        };

        // Set initial value
        const mobile = detectMobileDevice();
        setIsMobile(mobile);

        // Listen for both resize and orientation change events
        window.addEventListener("resize", handleResize);
        window.addEventListener("orientationchange", handleResize);

        return () => {
            // Clear the debounce timer to prevent memory leaks
            clearTimeout(debounceTimer);
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("orientationchange", handleResize);
        };
    }, []);

    return isMobile;
}
