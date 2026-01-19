"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export interface DevMetadataDialogProps {
    isOpen: boolean;
    onClose: () => void;
    comment: {
        author: string;
        permlink: string;
        title?: string;
        body?: string;
        parent_author?: string;
        parent_permlink?: string;
        json_metadata?:
        | string
        | {
            image?: string[];
            [key: string]: unknown;
        };
        created?: string;
        active_votes?: Array<{ voter: string; weight: number; rshares: string }>;
        children?: number;
        depth?: number;
        total_payout_value?: string;
        curator_payout_value?: string;
        pending_payout_value?: string;
        cashout_time?: string;
    };
}

// Only import and render in development mode
const DevMetadataDialogContent: ComponentType<DevMetadataDialogProps> = dynamic(
    () =>
        process.env.NODE_ENV === "development"
            ? import("./DevMetadataDialogContent").then((mod) => mod.default)
            : Promise.resolve(() => null),
    {
        ssr: false,
    }
);

export default function DevMetadataDialog(props: DevMetadataDialogProps) {
    // Don't render anything in production
    if (process.env.NODE_ENV !== "development") {
        return null;
    }

    return <DevMetadataDialogContent {...props} />;
}
