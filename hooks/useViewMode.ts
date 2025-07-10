"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function useViewMode() {
    const router = useRouter();

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

    // When viewMode changes, update the URL
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            params.set('view', viewMode);
            router.replace(`?${params.toString()}`);
        }
    }, [viewMode, router]);

    const closeMagazine = useCallback(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            params.set('view', 'grid');
            router.replace(`?${params.toString()}`);
        }
        setViewMode('grid');
    }, [router]);

    return {
        viewMode,
        handleViewModeChange,
        closeMagazine,
    };
}
