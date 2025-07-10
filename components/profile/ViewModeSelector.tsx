"use client";
import React from "react";
import { ButtonGroup, IconButton } from "@chakra-ui/react";
import { FaTh, FaBars, FaBookOpen, FaVideo } from "react-icons/fa";

interface ViewModeSelectorProps {
  viewMode: "grid" | "list" | "magazine" | "videoparts";
  onViewModeChange: (mode: "grid" | "list" | "magazine" | "videoparts") => void;
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
      <IconButton
        aria-label="Grid view"
        icon={<FaTh />}
        onClick={() => onViewModeChange("grid")}
        isActive={viewMode === "grid"}
        sx={buttonStyle}
      />
      <IconButton
        aria-label="List view"
        icon={<FaBars />}
        onClick={() => onViewModeChange("list")}
        isActive={viewMode === "list"}
        sx={buttonStyle}
      />
      {/* Hide Magazine button on mobile */}
      {!isMobile && (
        <IconButton
          aria-label="Show Magazine"
          icon={<FaBookOpen />}
          onClick={() => onViewModeChange("magazine")}
          isActive={viewMode === "magazine"}
          sx={buttonStyle}
        />
      )}
      <IconButton
        aria-label="Show Videoparts"
        icon={<FaVideo />}
        onClick={() => onViewModeChange("videoparts")}
        isActive={viewMode === "videoparts"}
        sx={buttonStyle}
      />
    </ButtonGroup>
  );
}
