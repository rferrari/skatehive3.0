"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  VStack,
  Text,
  Skeleton,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { EnhancedMarkdownRenderer } from "@/components/markdown/EnhancedMarkdownRenderer";

interface MarkdownCoinRendererProps {
  markdownIpfs?: string;
  altText: string;
}

/**
 * Component that fetches and renders markdown content from IPFS
 */
export const MarkdownCoinRenderer = React.memo<MarkdownCoinRendererProps>(
  ({ markdownIpfs, altText }) => {
    const [markdownContent, setMarkdownContent] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMarkdownContent = useCallback(async () => {
      if (!markdownIpfs) {
        setError("No markdown IPFS URL provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Handle IPFS URLs
        let contentUrl = markdownIpfs;
        if (markdownIpfs.startsWith("ipfs://")) {
          contentUrl = `https://ipfs.io/ipfs/${markdownIpfs.slice(7)}`;
        } else if (!markdownIpfs.startsWith("http")) {
          // If it's just a hash, add the gateway
          contentUrl = `https://ipfs.io/ipfs/${markdownIpfs}`;
        }

        const response = await fetch(contentUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch markdown: ${response.status}`);
        }

        const content = await response.text();
        setMarkdownContent(content);
      } catch (err) {
        console.error("Error fetching markdown content:", err);
        setError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        setIsLoading(false);
      }
    }, [markdownIpfs]);

    useEffect(() => {
      if (markdownIpfs) {
        fetchMarkdownContent();
      }
    }, [markdownIpfs, fetchMarkdownContent]);

    if (isLoading) {
      return (
        <VStack spacing={4} w="100%">
          <Skeleton height="40px" width="80%" />
          <Skeleton height="20px" width="100%" />
          <Skeleton height="20px" width="90%" />
          <Skeleton height="20px" width="95%" />
          <Skeleton height="300px" width="100%" />
        </VStack>
      );
    }

    if (error) {
      return (
        <Alert status="error">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold">Failed to load content</Text>
            <Text fontSize="sm">{error}</Text>
          </VStack>
        </Alert>
      );
    }

    if (!markdownContent) {
      return (
        <Alert status="warning">
          <AlertIcon />
          No content available
        </Alert>
      );
    }

    return (
      <Box w="100%" maxW="none">
        <EnhancedMarkdownRenderer content={markdownContent} />
      </Box>
    );
  }
);

MarkdownCoinRenderer.displayName = "MarkdownCoinRenderer";
