"use client";
import React from "react";
import { ButtonGroup, IconButton, Tooltip } from "@chakra-ui/react";
import { FaTh, FaBars, FaBookOpen, FaVideo, FaCamera } from "react-icons/fa";

interface ViewModeSelectorProps {
    viewMode: "grid" | "list" | "magazine" | "videoparts" | "snaps";
    onViewModeChange: (mode: "grid" | "list" | "magazine" | "videoparts" | "snaps") => void;
    isMobile: boolean;
}

export default function ViewModeSelector({ viewMode, onViewModeChange, isMobile }: ViewModeSelectorProps) {
    const buttonStyle = {
        "&:hover": {
            boxShadow: "4px 4px 6px var(--chakra-colors-primary-alpha)",
        },
        "&:active": {
            transform: "translate(2px, 2px)",
            boxShadow: "2px 2px 3px var(--chakra-colors-primary-alpha)",
        },
    };

    return (
        <ButtonGroup isAttached variant="outline" size="sm" my={4} colorScheme="green">
            <Tooltip label="Snaps View" hasArrow>
                <IconButton
                    aria-label="Show Snaps"
                    icon={<FaCamera />}
                    onClick={() => onViewModeChange("snaps")}
                    isActive={viewMode === "snaps"}
                    sx={buttonStyle}
                />
            </Tooltip>
            <Tooltip label="Grid View" hasArrow>
                <IconButton
                    aria-label="Grid view"
                    icon={<FaTh />}
                    onClick={() => onViewModeChange("grid")}
                    isActive={viewMode === "grid"}
                    sx={buttonStyle}
                />
            </Tooltip>
            <Tooltip label="List View" hasArrow>
                <IconButton
                    aria-label="List view"
                    icon={<FaBars />}
                    onClick={() => onViewModeChange("list")}
                    isActive={viewMode === "list"}
                    sx={buttonStyle}
                />
            </Tooltip>
            {/* Hide Magazine button on mobile */}
            {!isMobile && (
                <Tooltip label="Magazine View" hasArrow>
                    <IconButton
                        aria-label="Show Magazine"
                        icon={<FaBookOpen />}
                        onClick={() => onViewModeChange("magazine")}
                        isActive={viewMode === "magazine"}
                        sx={buttonStyle}
                    />
                </Tooltip>
            )}
            <Tooltip label="Videoparts View" hasArrow>
                <IconButton
                    aria-label="Show Videoparts"
                    icon={<FaVideo />}
                    onClick={() => onViewModeChange("videoparts")}
                    isActive={viewMode === "videoparts"}
                    sx={buttonStyle}
                />
            </Tooltip>
        </ButtonGroup>
    );
}
