"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Box } from "@chakra-ui/react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: { r: number; g: number; b: number };
  opacity: number;
}

interface FallingJoint {
  id: number;
  x: number;
  y: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  opacity: number;
}

interface HZCEasterEggProps {
  onTrigger?: () => void;
}

const HZCEasterEgg: React.FC<HZCEasterEggProps> = ({ onTrigger }) => {
  const [isActive, setIsActive] = useState(false);
  const [fallingJoints, setFallingJoints] = useState<FallingJoint[]>([]);
  const [intensity, setIntensity] = useState(1);
  const intensityRef = useRef(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const typedKeysRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const jointIdRef = useRef(0);
  const jointIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep intensityRef in sync
  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  // Create a new particle
  const createParticle = useCallback((canvasWidth: number, canvasHeight: number): Particle => {
    const x = Math.random() * canvasWidth;
    
    // Gray smoke with slight variation
    const gray = Math.random() * 60 + 100; // Lighter gray range (100-160)
    const color = { r: gray, g: gray, b: gray + Math.random() * 10 };

    return {
      x,
      y: canvasHeight + Math.random() * 50,
      vx: (Math.random() - 0.5) * 1.5, // Gentler horizontal drift
      vy: -(Math.random() * 2 + 1), // Slower rise
      life: 0,
      maxLife: Math.random() * 200 + 150, // Longer life for smoother fade
      size: Math.random() * 80 + 60, // Much larger base size for soft clouds
      color,
      opacity: Math.random() * 0.25 + 0.15, // Lower opacity for layered effect
    };
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas - transparent background so website shows through
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Add new particles (fewer but larger for smooth smoke)
    for (let i = 0; i < 2; i++) {
      particlesRef.current.push(createParticle(canvas.width, canvas.height));
    }

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter((particle) => {
      particle.life++;
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Add gentle turbulence for organic movement
      particle.vx += (Math.random() - 0.5) * 0.1;
      particle.vy -= 0.005; // Very gentle upward acceleration
      
      // Expand size as it rises (smoke expands and disperses)
      particle.size += 0.5;
      
      // Calculate life progress
      const lifeProgress = particle.life / particle.maxLife;
      
      // Smooth fade curve - starts strong, fades gently
      const fadeMultiplier = 1 - Math.pow(lifeProgress, 0.7);
      const currentOpacity = particle.opacity * fadeMultiplier * intensityRef.current;
      
      const r = particle.color.r;
      const g = particle.color.g;
      const b = particle.color.b;

      // Draw single large soft smoke cloud with smooth gradient
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size
      );
      
      // Very soft gradient for cloud-like appearance
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${currentOpacity * 0.6})`);
      gradient.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, ${currentOpacity * 0.4})`);
      gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${currentOpacity * 0.2})`);
      gradient.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, ${currentOpacity * 0.05})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Keep particle if still alive
      return particle.life < particle.maxLife;
    });

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [createParticle]);

  // Start the effect
  const startEffect = useCallback(() => {
    setIsActive(true);
    setIntensity(1);
    particlesRef.current = [];
    setFallingJoints([]);
    jointIdRef.current = 0;
    onTrigger?.();

    // Start fading out after 7 seconds
    fadeIntervalRef.current = setTimeout(() => {
      // Gradually reduce intensity over remaining 8 seconds
      const fadeSteps = 16;
      const fadeInterval = 8000 / fadeSteps;
      let step = 0;
      
      const fade = setInterval(() => {
        step++;
        setIntensity(Math.max(0, 1 - (step / fadeSteps)));
        if (step >= fadeSteps) {
          clearInterval(fade);
        }
      }, fadeInterval);
    }, 7000);

    // Stop after 15 seconds
    timeoutRef.current = setTimeout(() => {
      setIsActive(false);
      setFallingJoints([]);
      setIntensity(1);
    }, 15000);
  }, [onTrigger]);

  // Spawn falling joints periodically
  useEffect(() => {
    if (!isActive) return;

    const spawnJoint = (isBig: boolean = false) => {
      // Only spawn if intensity is above threshold
      if (intensity < 0.2) return;
      
      // Big joints are much larger and slower, like they're close to the camera
      const size = isBig 
        ? Math.random() * 150 + 200  // 200-350px for big joints
        : Math.random() * 30 + 25;   // 25-55px for regular
      
      const speed = isBig
        ? Math.random() * 1 + 0.5    // Slower for parallax effect
        : Math.random() * 2 + 1;
      
      const newJoint: FallingJoint = {
        id: jointIdRef.current++,
        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
        y: isBig ? -300 : -50,       // Start higher for big ones
        speed,
        rotation: Math.random() * 360,
        rotationSpeed: isBig ? (Math.random() - 0.5) * 4 : (Math.random() - 0.5) * 8,
        size,
        opacity: isBig 
          ? (Math.random() * 0.3 + 0.5) * intensity  // Slightly transparent for depth
          : (Math.random() * 0.4 + 0.6) * intensity,
      };
      setFallingJoints(prev => [...prev, newJoint]);
    };

    // Spawn 2-3 big joints at the start
    const numBigJoints = Math.floor(Math.random() * 2) + 2; // 2 or 3
    for (let i = 0; i < numBigJoints; i++) {
      setTimeout(() => spawnJoint(true), i * 800); // Stagger them
    }

    // Spawn a joint every 400-800ms (casual rate)
    jointIntervalRef.current = setInterval(() => {
      spawnJoint(false);
    }, Math.random() * 400 + 400);

    // Initial spawn of regular joint
    spawnJoint(false);

    return () => {
      if (jointIntervalRef.current) {
        clearInterval(jointIntervalRef.current);
      }
    };
  }, [isActive]);

  // Update falling joints positions
  useEffect(() => {
    if (!isActive || fallingJoints.length === 0) return;

    const updateJoints = () => {
      setFallingJoints(prev => 
        prev
          .map(joint => ({
            ...joint,
            y: joint.y + joint.speed,
            rotation: joint.rotation + joint.rotationSpeed,
          }))
          .filter(joint => joint.y < (typeof window !== 'undefined' ? window.innerHeight + 100 : 1000))
      );
    };

    const intervalId = setInterval(updateJoints, 16); // ~60fps
    return () => clearInterval(intervalId);
  }, [isActive, fallingJoints.length > 0]);

  // Handle canvas resize
  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Start animation
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, animate]);

  // Keyboard listener for HZC + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (typedKeysRef.current.toUpperCase() === "HZC") {
          startEffect();
        }
        typedKeysRef.current = "";
      } else if (e.key.length === 1) {
        typedKeysRef.current += e.key;
        // Keep only last 3 characters
        if (typedKeysRef.current.length > 3) {
          typedKeysRef.current = typedKeysRef.current.slice(-3);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [startEffect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (jointIntervalRef.current) {
        clearInterval(jointIntervalRef.current);
      }
      if (fadeIntervalRef.current) {
        clearTimeout(fadeIntervalRef.current);
      }
    };
  }, []);

  if (!isActive) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      width="100vw"
      height="100vh"
      zIndex={9999}
      pointerEvents="none"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none",
        }}
      />
      {/* Falling spinning joints */}
      {fallingJoints.map(joint => (
        <Box
          key={joint.id}
          position="fixed"
          left={`${joint.x}px`}
          top={`${joint.y}px`}
          width={`${joint.size}px`}
          height={`${joint.size}px`}
          opacity={joint.opacity * intensity}
          transform={`rotate(${joint.rotation}deg)`}
          pointerEvents="none"
          zIndex={9999}
        >
          <img
            src="/images/spinning-joint-sm.gif"
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </Box>
      ))}
      {/* HZC Text in the center */}
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        fontSize={{ base: "60px", md: "120px" }}
        fontWeight="bold"
        fontFamily="'Joystix', monospace"
        color="white"
        textShadow="0 0 20px #ff6600, 0 0 40px #ff3300, 0 0 60px #ff0000"
        animation="hzc-pulse 1s ease-in-out infinite"
        userSelect="none"
        opacity={intensity}
        transition="opacity 0.5s ease-out"
      >
        HZC
      </Box>
      <style jsx global>{`
        @keyframes hzc-pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            text-shadow: 0 0 20px #ff6600, 0 0 40px #ff3300, 0 0 60px #ff0000;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            text-shadow: 0 0 30px #ff6600, 0 0 60px #ff3300, 0 0 90px #ff0000, 0 0 120px #ff6600;
          }
        }
      `}</style>
    </Box>
  );
};

export default HZCEasterEgg;
