"use client";
import { useState, useEffect } from "react";

export default function useIsMobile() {
    const [isMobile, setIsMobile] = useState(() => {
        // Check if window is available (client-side) and get initial value
        if (typeof window !== 'undefined') {
            return window.innerWidth < 768;
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
                const mobile = window.innerWidth < 768;
                setIsMobile(mobile);
            }, 150); // 150ms debounce delay
        };

        // Set initial value
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);

        window.addEventListener("resize", handleResize);

        return () => {
            // Clear the debounce timer to prevent memory leaks
            clearTimeout(debounceTimer);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return isMobile;
}
