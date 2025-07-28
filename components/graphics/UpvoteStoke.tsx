'use client'
import React, { useEffect, useRef, useState } from "react";
import { Text } from "@chakra-ui/react";
import { gsap } from "gsap";
import { useTheme } from "@/app/themeProvider";

/**
 * UpvoteStoke - A clean animation component for displaying estimated vote values
 * 
 * Usage:
 * ```tsx
 * const [stokeInstances, setStokeInstances] = useState([]);
 * 
 * // In your UpvoteButton onVoteSuccess callback:
 * onVoteSuccess={(estimatedValue?: number) => {
 *   if (estimatedValue) {
 *     const newInstance = {
 *       id: Date.now(),
 *       value: estimatedValue,
 *       isVisible: true
 *     };
 *     setStokeInstances(prev => [...prev, newInstance]);
 *     setTimeout(() => {
 *       setStokeInstances(prev => prev.filter(instance => instance.id !== newInstance.id));
 *     }, 2000);
 *   }
 * }}
 * 
 * // In your JSX:
 * {stokeInstances.map(instance => (
 *   <UpvoteStoke 
 *     key={instance.id}
 *     estimatedValue={instance.value} 
 *     isVisible={instance.isVisible} 
 *   />
 * ))}
 * ```
 */

interface UpvoteStokeProps {
  estimatedValue: number;
  isVisible?: boolean;
  duration?: number;
  className?: string;
}

const UpvoteStoke: React.FC<UpvoteStokeProps> = ({
  estimatedValue,
  isVisible = true,
  duration = 2,
  className = "",
}) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }

    // Reset animation
    gsap.set(containerRef.current, { 
      scale: 0,
      opacity: 0,
      y: 0
    });

    // Create new animation timeline
    const tl = gsap.timeline();
    animationRef.current = tl;
    
    // Animate everything together in one smooth motion
    tl.to(containerRef.current, {
      scale: 1,
      opacity: 1,
      y: -50,
      duration: 3,
      ease: "power2.out"
    })
    .to(containerRef.current, {
      scale: 0.8,
      opacity: 0,
      y: -120,
      duration: 1,
      ease: "power2.in"
    }, 3);

    // Cleanup
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
        animationRef.current = null;
      }
    };
  }, [estimatedValue, isVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
        animationRef.current = null;
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <Text
      ref={containerRef}
      position="fixed"
      top="50%"
      left="50%"
      transform="translate(-50%, -50%)"
      zIndex={9999}
      pointerEvents="none"
      fontSize="3xl"
      fontWeight="bold"
      color="primary"
      fontFamily={theme.fonts.body}
      letterSpacing="2px"
      className={className}
    >
      +${estimatedValue.toFixed(3)}
    </Text>
  );
};

export default UpvoteStoke; 