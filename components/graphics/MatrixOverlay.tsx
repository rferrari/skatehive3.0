import React, { useRef, useEffect } from "react";

const MatrixOverlay: React.FC<{ coverMode?: boolean }> = ({ coverMode = false }) => {
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
      "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズヅブプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
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
      // Restore a black background fill with low opacity so old characters fade out
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = fontSize + "px monospace";
      // Use theme primary color for matrix text
      let matrixColor = getComputedStyle(document.body).getPropertyValue('--chakra-colors-primary').trim() || '#00FF41';
      ctx.fillStyle = matrixColor;
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