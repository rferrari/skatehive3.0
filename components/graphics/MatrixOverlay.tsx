"use client";

import React, { useRef, useEffect } from "react";

const MatrixOverlay: React.FC<{ coverMode?: boolean }> = ({
  coverMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId: number;
    let frame = 0;

    // Set canvas size
    const setCanvasSize = () => {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    setCanvasSize();

    // Use ResizeObserver for parent/container size changes
    const resizeObserver = new window.ResizeObserver(() => {
      setCanvasSize();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // Matrix characters
    const letters =
      "アァカサタナハマヤャラワガザダバパキシチヒミリギジビツヌムルグズヅエケセテネヘレヱゼデペオコホヨロヲボポABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ΘΨΟΠΣΔΦΓΛΞ";
    const fontSize = 16;
    let columns = Math.floor((canvas?.width || 0) / fontSize);
    let drops = Array(columns).fill(1);

    function draw() {
      if (!ctx || !canvas) return;
      // Slow down animation: only draw every 6th frame
      frame++;
      if (frame % 6 !== 0) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }
      // Use theme background color for fade effect (linear-gradient)
      let bgColor = getComputedStyle(document.body)
        .getPropertyValue("--chakra-colors-background")
        .trim();
      let borderColor =
        getComputedStyle(document.body)
          .getPropertyValue("--chakra-colors-border")
          .trim() || "#e0e0e0";
      // If background is a gradient, use it as a fillStyle
      let fadeStyle: string | CanvasGradient = bgColor;
      if (bgColor.startsWith("linear-gradient")) {
        // Create a canvas gradient matching the CSS linear-gradient
        // For simplicity, parse the two color stops from the gradient string
        const match = bgColor.match(
          /linear-gradient\(45deg,\s*(#[0-9a-fA-F]{6}),\s*(#[0-9a-fA-F]{6})/
        );
        if (match && ctx) {
          const grad = ctx.createLinearGradient(
            0,
            0,
            canvas.width,
            canvas.height
          );
          grad.addColorStop(0, match[1]);
          grad.addColorStop(1, match[2]);
          fadeStyle = grad;
        }
      } else if (bgColor.startsWith("#")) {
        // fallback to rgba with alpha for solid color
        function hexToRgba(hex: string, alpha: number) {
          hex = hex.replace("#", "");
          if (hex.length === 3) {
            hex = hex
              .split("")
              .map((x: string) => x + x)
              .join("");
          }
          if (hex.length !== 6) return `rgba(0,0,0,${alpha})`;
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          return `rgba(${r},${g},${b},${alpha})`;
        }
        fadeStyle = hexToRgba(bgColor, 0.1);
      } else {
        fadeStyle = bgColor ? bgColor : "rgba(0,0,0,0.1)";
      }
      ctx.fillStyle = fadeStyle;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = fontSize + "px monospace";
      let textColor =
        getComputedStyle(document.body)
          .getPropertyValue("--chakra-colors-text")
          .trim() || "#212121";
      // Use theme text color for matrix text
      ctx.fillStyle = textColor;
      for (let i = 0; i < drops.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationFrameId = requestAnimationFrame(draw);
    }

    draw();

    // Handle resize
    const handleResize = () => {
      setCanvasSize();
      columns = Math.floor((canvas?.width || 0) / fontSize);
      drops = Array(columns).fill(1);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, [coverMode]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.95,
      }}
    />
  );
};

export default MatrixOverlay;
