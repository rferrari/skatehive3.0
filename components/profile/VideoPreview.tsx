"use client";
import React, { useRef, useEffect, useState } from "react";
import { Box, Icon } from "@chakra-ui/react";
import { FaPlay } from "react-icons/fa";

interface VideoPreviewProps {
    src: string;
    onClick?: () => void;
}

export default function VideoPreview({ src, onClick }: VideoPreviewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Process video URL for better compatibility
    const getProcessedVideoUrl = (url: string) => {
        // Handle IPFS URLs
        if (url.includes('ipfs.skatehive.app')) {
            // Ensure proper IPFS gateway format
            return url.replace(/\/ipfs\//, '/ipfs/');
        }

        // Handle iframe embed URLs - these might need special processing
        if (url.includes('iframe') || url.includes('embed')) {
            // For now, return as-is, but we might need to extract the actual video URL
            console.log('Iframe video URL detected:', url);
        }

        return url;
    };

    const processedSrc = getProcessedVideoUrl(src);

    // Intersection Observer for auto-play when visible
    useEffect(() => {
        const currentVideo = videoRef.current;
        if (!currentVideo) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { threshold: 0.5 }
        );

        observer.observe(currentVideo);

        return () => {
            observer.disconnect();
        };
    }, []);

    // Auto-play when visible
    useEffect(() => {
        const currentVideo = videoRef.current;
        if (!currentVideo) return;

        if (isVisible && isLoaded && !hasError) {
            currentVideo.play().catch(() => {
                // Silent fail if autoplay is blocked
            });
        } else {
            currentVideo.pause();
        }
    }, [isVisible, isLoaded, hasError]);

    const handleLoadedData = () => {
        setIsLoaded(true);
        setHasError(false);
        console.log('Video loaded successfully:', processedSrc);
    };

    const handleError = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        setHasError(true);
        setIsLoaded(false);
        console.error('Video failed to load:', processedSrc, event);
    };

    return (
        <Box
            position="relative"
            width="100%"
            height="100%"
            cursor="pointer"
            onClick={onClick}
            _hover={{
                transform: "scale(1.02)",
                transition: "transform 0.2s",
            }}
        >
            <video
                ref={videoRef}
                src={processedSrc}
                muted
                loop
                playsInline
                preload="metadata"
                onLoadedData={handleLoadedData}
                onError={handleError}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "inherit",
                }}
            />

            {/* Play icon overlay */}
            <Box
                position="absolute"
                bottom={2}
                right={2}
                bg="blackAlpha.700"
                borderRadius="full"
                p={1}
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <Icon as={FaPlay} color="white" boxSize={3} />
            </Box>

            {/* Loading/Error state */}
            {(!isLoaded || hasError) && (
                <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    bg="blackAlpha.600"
                    borderRadius="full"
                    p={3}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Icon as={FaPlay} color="white" boxSize={6} />
                </Box>
            )}
        </Box>
    );
}
