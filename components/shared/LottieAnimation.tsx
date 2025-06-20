import React, { useEffect, useRef } from 'react';
import { DotLottie } from '@lottiefiles/dotlottie-web';

interface LottieAnimationProps {
  src: string;
  width?: string;
  height?: string;
}

const LottieAnimation: React.FC<LottieAnimationProps> = ({ src, width = '300px', height = '300px' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const dotLottie = new DotLottie({
        autoplay: true,
        loop: true,
        canvas: canvasRef.current,
        src: src,
      });

      return () => {
        dotLottie.destroy();
      };
    }
  }, [src]);

  return <canvas ref={canvasRef} style={{ width, height }}></canvas>;
};

export default LottieAnimation; 