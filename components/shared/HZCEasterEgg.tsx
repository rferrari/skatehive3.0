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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const typedKeysRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const jointIdRef = useRef(0);
  const jointIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Create a new particle
  const createParticle = useCallback((canvasWidth: number, canvasHeight: number): Particle => {
    const x = Math.random() * canvasWidth;
    
    // Gray smoke with slight variation
    const gray = Math.random() * 100 + 80;
    const color = { r: gray, g: gray, b: gray + Math.random() * 20 };

    return {
      x,
      y: canvasHeight + Math.random() * 50,
      vx: (Math.random() - 0.5) * 2,
      vy: -(Math.random() * 3 + 1.5),
      life: 0,
      maxLife: Math.random() * 120 + 80,
      size: Math.random() * 25 + 15,
      color,
      opacity: Math.random() * 0.5 + 0.3,
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

    // Add new particles
    for (let i = 0; i < 4; i++) {
      particlesRef.current.push(createParticle(canvas.width, canvas.height));
    }

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter((particle) => {
      particle.life++;
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Add some turbulence
      particle.vx += (Math.random() - 0.5) * 0.2;
      particle.vy -= 0.01; // Accelerate upward slightly
      
      // Expand size as it rises (smoke expands)
      particle.size += 0.25;
      
      // Calculate life progress
      const lifeProgress = particle.life / particle.maxLife;
      
      // Fade out as particle ages
      const currentOpacity = particle.opacity * (1 - lifeProgress);
      
      // Use gray color directly
      const r = particle.color.r;
      const g = particle.color.g;
      const b = particle.color.b;

      // Draw particle with radial gradient for soft edges
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size
      );
      
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${currentOpacity})`);
      gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${currentOpacity * 0.5})`);
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
    particlesRef.current = [];
    setFallingJoints([]);
    jointIdRef.current = 0;
    onTrigger?.();

    // Stop after 30 seconds
    timeoutRef.current = setTimeout(() => {
      setIsActive(false);
      setFallingJoints([]);
    }, 30000);
  }, [onTrigger]);

  // Spawn falling joints periodically
  useEffect(() => {
    if (!isActive) return;

    const spawnJoint = () => {
      const newJoint: FallingJoint = {
        id: jointIdRef.current++,
        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
        y: -50,
        speed: Math.random() * 2 + 1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        size: Math.random() * 30 + 25,
        opacity: Math.random() * 0.4 + 0.6,
      };
      setFallingJoints(prev => [...prev, newJoint]);
    };

    // Spawn a joint every 400-800ms (casual rate)
    jointIntervalRef.current = setInterval(() => {
      spawnJoint();
    }, Math.random() * 400 + 400);

    // Initial spawn
    spawnJoint();

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
          position="absolute"
          left={`${joint.x}px`}
          top={`${joint.y}px`}
          width={`${joint.size}px`}
          height={`${joint.size}px`}
          opacity={joint.opacity}
          transform={`rotate(${joint.rotation}deg)`}
          pointerEvents="none"
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
