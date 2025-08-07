"use client";
import React, { memo, useMemo, useCallback } from "react";
import { Tabs, TabList, Tab, Box } from "@chakra-ui/react";
import { FaTh, FaBars, FaBookOpen, FaVideo, FaCamera } from "react-icons/fa";

interface ViewModeSelectorProps {
  viewMode: "grid" | "list" | "magazine" | "videoparts" | "snaps";
  onViewModeChange: (
    mode: "grid" | "list" | "magazine" | "videoparts" | "snaps"
  ) => void;
  isMobile: boolean;
}

const viewModes = [
  { key: "snaps", label: "Snaps", icon: FaCamera },
  { key: "grid", label: "Grid", icon: FaTh },
  { key: "list", label: "List", icon: FaBars },
  { key: "magazine", label: "Magazine", icon: FaBookOpen },
  { key: "videoparts", label: "Videos", icon: FaVideo },
] as const;

const ViewModeSelector = memo(function ViewModeSelector({
  viewMode,
  onViewModeChange,
  isMobile,
}: ViewModeSelectorProps) {
  // Memoize available modes based on mobile state
  const availableModes = useMemo(
    () => (isMobile ? viewModes.filter((mode) => mode.key !== "magazine") : viewModes),
    [isMobile]
  );

  // Memoize current tab index
  const currentTabIndex = useMemo(
    () => availableModes.findIndex((mode) => mode.key === viewMode),
    [availableModes, viewMode]
  );

  const handleTabChange = useCallback((index: number) => {
    const modes = isMobile ? viewModes.filter((mode) => mode.key !== "magazine") : viewModes;
    const selectedMode = modes[index];
    onViewModeChange(selectedMode.key);
  }, [isMobile, onViewModeChange]);

  return (
    <Box my={4}>
      <Tabs
        index={currentTabIndex}
        onChange={handleTabChange}
        variant="enclosed"
        colorScheme="green"
        size="sm"
        isFitted={true}
      >
        <TabList>
          {availableModes.map((mode) => {
            const IconComponent = mode.icon;
            return (
              <Tab
                key={mode.key}
                _selected={{
                  color: "primary",
                  bg: "muted",
                  boxShadow: "md",
                }}
                _hover={{
                  bg: "muted.100",
                  transform: "translateY(-1px)",
                }}
                transition="all 0.2s"
                display="flex"
                alignItems="center"
                gap={2}
                px={isMobile ? 2 : 4}
                minW={isMobile ? "auto" : "80px"}
              >
                <IconComponent size={14} />
                {mode.label}
              </Tab>
            );
          })}
        </TabList>
      </Tabs>
    </Box>
  );
});

export default ViewModeSelector;
