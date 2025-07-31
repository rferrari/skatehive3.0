"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  VStack,
  Box,
} from "@chakra-ui/react";
import { FaSearch, FaUser, FaHome, FaTrophy, FaGift } from "react-icons/fa";
import { useRouter } from "next/navigation";

// Import smaller components
import SearchInput from "./search/SearchInput";
import LoadingState from "./search/LoadingState";
import SkaterResult from "./search/SkaterResult";
import PageResult from "./search/PageResult";
import SectionHeader from "./search/SectionHeader";
import SearchTips from "./search/SearchTips";
import NoResults from "./search/NoResults";

// Import types and constants
import {
  SkaterData,
  PageResult as PageResultType,
  SearchOverlayProps,
} from "./search/types";
import {
  STATIC_PAGES,
  COMMAND_PAGES,
  getPopularPages,
} from "./search/constants";

export default function SearchOverlay({
  isOpen,
  onClose,
  onOpenAirdrop,
}: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [skaters, setSkaters] = useState<SkaterData[]>([]);
  const [filteredPages, setFilteredPages] = useState<PageResultType[]>([]);
  const [topSkaters, setTopSkaters] = useState<SkaterData[]>([]);
  const [isLoadingTopSkaters, setIsLoadingTopSkaters] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const popularPages = getPopularPages();

  const fetchTopSkaters = useCallback(async () => {
    setIsLoadingTopSkaters(true);
    try {
      const res = await fetch("https://api.skatehive.app/api/skatehive", {
        next: { revalidate: 300 },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const sorted = data
            .sort((a, b) => (b.points || 0) - (a.points || 0))
            .slice(0, 5);
          setTopSkaters(sorted);
        }
      }
    } catch (error) {
      console.error("Error fetching top skaters:", error);
    } finally {
      setIsLoadingTopSkaters(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && topSkaters.length === 0) {
      const timer = setTimeout(() => {
        fetchTopSkaters();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, topSkaters.length, fetchTopSkaters]);

  const fetchSkaters = useCallback(async (searchTerm: string) => {
    if (searchTerm.startsWith("/") || searchTerm.length < 1) return;

    setIsLoading(true);
    try {
      const res = await fetch("https://api.skatehive.app/api/skatehive", {
        next: { revalidate: 300 },
      });
      if (res.ok) {
        const data = await res.json();
        setSkaters(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching skaters:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setFilteredPages([]);
      setSkaters([]);
      setHighlightedIndex(0);
      setIsLoading(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.startsWith("/")) {
      const searchTerm = query.slice(1).toLowerCase();
      const allPages = [...STATIC_PAGES, ...COMMAND_PAGES];
      const filtered = allPages.filter(
        (page) =>
          page.title.toLowerCase().includes(searchTerm) ||
          page.description.toLowerCase().includes(searchTerm) ||
          page.path.toLowerCase().includes(searchTerm)
      );
      setFilteredPages(filtered);
      setSkaters([]);
      setIsLoading(false);
    } else {
      debounceRef.current = setTimeout(() => {
        fetchSkaters(query);
      }, 300);
      setFilteredPages([]);
    }
    setHighlightedIndex(0);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, fetchSkaters]);

  const filteredSkaters = skaters.filter((skater) =>
    skater.hive_author.toLowerCase().includes(query.toLowerCase())
  );

  // Also search commands when not using "/" prefix
  const filteredCommands =
    !query.startsWith("/") && query.trim()
      ? COMMAND_PAGES.filter(
          (page) =>
            page.title.toLowerCase().includes(query.toLowerCase()) ||
            page.description.toLowerCase().includes(query.toLowerCase())
        )
      : [];

  const allResults = [
    ...filteredPages,
    ...filteredSkaters,
    ...filteredCommands,
  ];

  const initialSuggestions = useMemo(() => {
    return query ? allResults : [...popularPages, ...topSkaters];
  }, [query, allResults, popularPages, topSkaters]);

  const handleSelect = useCallback(
    (item: PageResultType | SkaterData) => {
      if ("hive_author" in item) {
        router.push(`/user/${item.hive_author}`);
      } else if (item.path.startsWith("command:")) {
        // Handle special commands
        const command = item.path.replace("command:", "");
        switch (command) {
          case "airdrop":
            if (onOpenAirdrop) {
              onOpenAirdrop();
            }
            break;
          default:
            console.warn(`Unknown command: ${command}`);
        }
      } else {
        router.push(item.path);
      }
      onClose();
      setQuery("");
    },
    [router, onClose, onOpenAirdrop]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < initialSuggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : initialSuggestions.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (initialSuggestions[highlightedIndex]) {
            handleSelect(initialSuggestions[highlightedIndex]);
          }
          break;
        case "Escape":
          onClose();
          setQuery("");
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, highlightedIndex, initialSuggestions, handleSelect, onClose]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setFilteredPages([]);
      setSkaters([]);
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      isCentered
      motionPreset="slideInBottom"
      blockScrollOnMount={false}
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent
        bg="background"
        borderRadius="lg"
        border="1px solid"
        borderColor="primary"
        maxW="500px"
        maxH="70vh"
        w="90vw"
        m={4}
        position="relative"
      >
        <ModalBody p={0}>
          <VStack spacing={0} align="stretch">
            {/* Search Input */}
            <SearchInput
              query={query}
              onQueryChange={setQuery}
              inputRef={inputRef}
            />

            {/* Loading State */}
            <LoadingState isLoading={isLoading} />

            {/* Results */}
            {(query || popularPages.length > 0) && !isLoading && (
              <Box
                maxH={{ base: "60vh", md: "400px" }}
                overflowY="auto"
                sx={{
                  "&::-webkit-scrollbar": {
                    width: "4px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    bg: "primary",
                    borderRadius: "2px",
                  },
                }}
              >
                <VStack spacing={0} align="stretch">
                  {/* Results Header */}
                  <SectionHeader
                    icon={
                      query
                        ? query.startsWith("/")
                          ? FaSearch
                          : filteredCommands.length > 0 &&
                            filteredSkaters.length === 0
                          ? FaGift
                          : FaUser
                        : FaHome
                    }
                    title={
                      query
                        ? query.startsWith("/")
                          ? "Pages & Features"
                          : filteredCommands.length > 0 &&
                            filteredSkaters.length === 0
                          ? "Commands"
                          : filteredCommands.length > 0
                          ? "Users & Commands"
                          : "Skatehive Users"
                        : "Quick Access"
                    }
                  />

                  {/* Initial Suggestions */}
                  {!query && (
                    <>
                      {popularPages.map((page, index) => (
                        <PageResult
                          key={`page-${page.path}`}
                          page={page}
                          index={index}
                          highlightedIndex={highlightedIndex}
                          onSelect={handleSelect}
                        />
                      ))}
                      {topSkaters.length > 0 && (
                        <>
                          <SectionHeader icon={FaTrophy} title="Top Skaters" />
                          {topSkaters.map((skater, skaterIndex) => (
                            <SkaterResult
                              key={`skater-${skater.id}-${skater.hive_author}`}
                              skater={skater}
                              index={skaterIndex + popularPages.length}
                              highlightedIndex={highlightedIndex}
                              onSelect={handleSelect}
                            />
                          ))}
                        </>
                      )}
                      {isLoadingTopSkaters && <LoadingState isLoading={true} />}
                    </>
                  )}

                  {/* Search Results */}
                  {query && (
                    <>
                      {!query.startsWith("/") && filteredSkaters.length > 0 && (
                        <>
                          {filteredSkaters.slice(0, 8).map((skater, index) => (
                            <SkaterResult
                              key={`skater-${skater.id}-${skater.hive_author}`}
                              skater={skater}
                              index={index}
                              highlightedIndex={highlightedIndex}
                              onSelect={handleSelect}
                            />
                          ))}
                        </>
                      )}
                      {!query.startsWith("/") &&
                        filteredCommands.length > 0 && (
                          <>
                            {filteredCommands.map((command, index) => (
                              <PageResult
                                key={`command-${command.path}`}
                                page={command}
                                index={
                                  index + filteredSkaters.slice(0, 8).length
                                }
                                highlightedIndex={highlightedIndex}
                                onSelect={handleSelect}
                              />
                            ))}
                          </>
                        )}
                      {query.startsWith("/") && filteredPages.length > 0 && (
                        <>
                          {filteredPages.map((page, index) => (
                            <PageResult
                              key={`page-${page.path}`}
                              page={page}
                              index={index}
                              highlightedIndex={highlightedIndex}
                              onSelect={handleSelect}
                            />
                          ))}
                        </>
                      )}
                      <NoResults
                        query={query}
                        hasPages={filteredPages.length > 0}
                        hasSkaters={
                          filteredSkaters.length > 0 ||
                          filteredCommands.length > 0
                        }
                      />
                    </>
                  )}
                </VStack>
              </Box>
            )}

            {/* Search Tips */}
            <SearchTips
              show={!query && popularPages.length === 0 && !isLoadingTopSkaters}
            />
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
