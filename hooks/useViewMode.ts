"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

export default function useViewMode() {
    const router = useRouter();
    const isInitialMount = useRef(true);

    // Get the initial view mode from the URL
    const getInitialViewMode = () => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const viewParam = params.get("view") ?? '';
            if (["grid", "list", "magazine", "videoparts", "snaps"].includes(viewParam)) {
                return viewParam as "grid" | "list" | "magazine" | "videoparts" | "snaps";
            }
        }
        return "snaps";
    };

    const [viewMode, setViewMode] = useState<"grid" | "list" | "magazine" | "videoparts" | "snaps">(getInitialViewMode);

    const handleViewModeChange = useCallback((mode: "grid" | "list" | "magazine" | "videoparts" | "snaps") => {
        setViewMode(mode);
        if (typeof window !== "undefined") {
            localStorage.setItem("profileViewMode", mode);
        }
    }, []);

    // When viewMode changes, update the URL (but not on initial mount)
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            params.set('view', viewMode);
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            
            // Use pushState instead of router to avoid page reloads
            window.history.pushState({}, '', newUrl);
        }
    }, [viewMode]);

    const closeMagazine = useCallback(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            params.set('view', 'grid');
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            
            // Use pushState instead of router to avoid page reloads
            window.history.pushState({}, '', newUrl);
        }
        setViewMode('grid');
    }, []);

    return {
        viewMode,
        handleViewModeChange,
        closeMagazine,
    };
}
