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
    let themeFrame = 0;

    // Set canvas size
    const setCanvasSize = () => {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    setCanvasSize();

    const letters =
      "アァカサタナハマヤャラワガザダバパキシチヒミリギジビツヌムルグズヅエケセテネヘレヱゼデペオコホヨロヲボポABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ΘΨΟΠΣΔΦΓΛΞ";
    const fontSize = 16;
    let columns = Math.floor((canvas?.width || 0) / fontSize);
    let drops = Array(columns).fill(1);

    let fadeStyle: string | CanvasGradient = "rgba(0,0,0,0.1)";
    let textColor = "#212121";

    const updateThemeColors = () => {
      if (!ctx || !canvas) return;
      const bgColor = getComputedStyle(document.body)
        .getPropertyValue("--chakra-colors-background")
        .trim();

      if (bgColor.startsWith("linear-gradient")) {
        const match = bgColor.match(
          /linear-gradient\(45deg,\s*(#[0-9a-fA-F]{6}),\s*(#[0-9a-fA-F]{6})/
        );
        if (match) {
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
        const hex = bgColor.replace("#", "");
        const normalized = hex.length === 3
          ? hex
              .split("")
              .map((x) => x + x)
              .join("")
          : hex;
        if (normalized.length === 6) {
          const r = parseInt(normalized.substring(0, 2), 16);
          const g = parseInt(normalized.substring(2, 4), 16);
          const b = parseInt(normalized.substring(4, 6), 16);
          fadeStyle = `rgba(${r},${g},${b},0.1)`;
        }
      } else if (bgColor) {
        fadeStyle = bgColor;
      }

      textColor =
        getComputedStyle(document.body)
          .getPropertyValue("--chakra-colors-text")
          .trim() || "#212121";
    };

    const resetColumns = () => {
      columns = Math.floor((canvas?.width || 0) / fontSize);
      drops = Array(columns).fill(1);
    };

    updateThemeColors();

    // Use ResizeObserver for parent/container size changes
    const resizeObserver = new window.ResizeObserver(() => {
      setCanvasSize();
      resetColumns();
      updateThemeColors();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    function draw() {
      if (!ctx || !canvas) return;
      frame += 1;
      if (frame % 6 !== 0) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      themeFrame += 1;
      if (themeFrame % 120 === 0) {
        updateThemeColors();
      }

      ctx.fillStyle = fadeStyle;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = fontSize + "px monospace";
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
      resetColumns();
      updateThemeColors();
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
