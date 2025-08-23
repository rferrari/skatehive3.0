import { Box, Button, HStack, IconButton, Text } from "@chakra-ui/react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  RefObject,
  Dispatch,
  SetStateAction,
} from "react";
import { FiMaximize, FiMinimize, FiVolume2, FiVolumeX } from "react-icons/fi";
import { LuPause, LuPlay, LuRotateCw } from "react-icons/lu";
import { useInView } from "react-intersection-observer";
import LogoMatrix from "../graphics/LogoMatrix";

type RendererProps = {
  src?: string;
  loop?: boolean;
  [key: string]: any;
};

// Define interface for VideoControls props
interface VideoControlsProps {
  isPlaying: boolean;
  handlePlayPause: () => void;
  volume: number;
  setVolume: Dispatch<SetStateAction<number>>;
  showVolumeSlider: boolean;
  setShowVolumeSlider: Dispatch<SetStateAction<boolean>>;
  handleVolumeToggle: () => void;
  isFullscreen: boolean;
  handleFullscreenToggle: () => void;
  progress: number;
  handleProgressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  handleMouseLeave: () => void;
  hoverTime: number | null;
  videoDuration: number | undefined;
  progressSliderStyle: React.CSSProperties;
  volumeSliderStyle: React.CSSProperties;
  videoRef: RefObject<HTMLVideoElement>;
}

// Memoized LoadingComponent to prevent unnecessary re-renders
const MemoizedLoadingComponent = React.memo(LogoMatrix);

// Extract VideoControls to a separate component to prevent unnecessary re-renders
const VideoControls = React.memo(
  ({
    isPlaying,
    handlePlayPause,
    volume,
    setVolume,
    showVolumeSlider,
    setShowVolumeSlider,
    handleVolumeToggle,
    isFullscreen,
    handleFullscreenToggle,
    progress,
    handleProgressChange,
    handleMouseMove,
    handleMouseLeave,
    hoverTime,
    videoDuration,
    progressSliderStyle,
    volumeSliderStyle,
    videoRef,
  }: VideoControlsProps) => {
    // Check if video has ended (progress is at or very close to 100%)
    const isVideoEnded = progress >= 99.9;

    return (
      <Box
        position="absolute"
        bottom={4}
        left={0}
        right={0}
        px={4}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        zIndex={3}
      >
        <HStack gap={0}>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handlePlayPause();
            }}
            size="md"
            p={2}
            variant={"ghost"}
            color={"white"}
            _hover={{ bg: "transparent", color: "limegreen" }}
            zIndex={3}
          >
            {isVideoEnded ? (
              <LuRotateCw />
            ) : isPlaying ? (
              <LuPause />
            ) : (
              <LuPlay />
            )}
          </Button>
          <Box display="flex" alignItems="center" position="relative">
            <IconButton
              aria-label="Volume"
              onClick={(e) => {
                e.stopPropagation();
                handleVolumeToggle();
              }}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
              p={2}
              variant={"ghost"}
              color={"white"}
              _hover={{ bg: "transparent", color: "limegreen" }}
              size="md"
              zIndex={3}
            >
              {volume === 0 ? <FiVolumeX /> : <FiVolume2 />}
            </IconButton>
            {showVolumeSlider && (
              <Box
                position="absolute"
                bottom="100%"
                left="50%"
                transform="translate(-50%, -8px)"
                zIndex={4}
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => {
                    const newVolume = parseFloat(e.target.value);
                    setVolume(newVolume);
                    if (videoRef.current) {
                      videoRef.current.volume = newVolume;
                      // Unmute when user adjusts volume above 0, mute when at 0
                      videoRef.current.muted = newVolume === 0;
                    }
                  }}
                  style={volumeSliderStyle}
                />
              </Box>
            )}
          </Box>
          <IconButton
            aria-label="Fullscreen"
            onClick={(e) => {
              e.stopPropagation();
              handleFullscreenToggle();
            }}
            p={2}
            variant={"ghost"}
            color={"white"}
            _hover={{ bg: "transparent", color: "limegreen" }}
            size="md"
            zIndex={3}
          >
            {isFullscreen ? <FiMinimize /> : <FiMaximize />}
          </IconButton>
        </HStack>

        <Box position="relative" flex="1" mx={4}>
          <input
            type="range"
            min="0"
            max="100"
            value={Number.isFinite(progress) ? progress : 0}
            onChange={handleProgressChange}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={progressSliderStyle}
          />

          <style jsx>{`
            input[type="range"]::-webkit-slider-runnable-track {
              -webkit-appearance: none;
              height: 8px;
              background: transparent;
            }
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              height: 24px;
              width: 24px;
              background: url("/images/skateboardloader.webp") no-repeat center;
              background-size: contain;
              border: none;
              border-radius: 0%;
              cursor: pointer;
              margin-top: -16px;
              box-shadow: none;
            }
          `}</style>

          {hoverTime !== null && videoDuration && (
            <Box
              position="absolute"
              top="-25px"
              left={`${(hoverTime / videoDuration) * 100}%`}
              transform="translateX(-50%)"
              bg="black"
              color="white"
              p={1}
              rounded="md"
              fontSize="xs"
            >
              {new Date(hoverTime * 1000).toISOString().substr(11, 8)}
            </Box>
          )}
        </Box>
      </Box>
    );
  }
);

// Memoize common styles outside the component
const VIDEO_STYLE = {
  background: "transparent",
  marginBottom: "20px",
  width: "100%",
  zIndex: 2,
};

const BASE_SLIDER_STYLE = {
  WebkitAppearance: "none" as React.CSSProperties["WebkitAppearance"],
  height: "8px",
  borderRadius: "4px",
  outline: "none",
  cursor: "pointer",
};

const VideoRenderer = ({ src, ...props }: RendererProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHorizontal, setIsHorizontal] = useState(false);
  const [volume, setVolume] = useState(() => {
    // Always start muted for autoplay, but check if user has volume preference stored for later use
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("videoVolume");
      // Store the preference but start muted (0) for autoplay
      return 0; // Always start muted for autoplay
    }
    return 0; // Always start muted
  });
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [shouldLoop, setShouldLoop] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Use Intersection Observer to detect visibility
  const { ref: setVideoRef, inView: isInView } = useInView({ threshold: 0.5 });

  // Combined ref callback to handle both video ref and intersection observer
  const setRefs = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      setVideoRef(node);
    },
    [setVideoRef]
  );

  // Save volume preference (only when volume > 0)
  useEffect(() => {
    if (typeof window !== "undefined" && volume > 0) {
      localStorage.setItem("videoVolume", volume.toString());
    }
  }, [volume]);

  // Function to handle volume button click (toggle mute/unmute)
  const handleVolumeToggle = useCallback(() => {
    if (volume === 0) {
      // Unmute: restore to saved volume or default to 0.5
      const savedVolume =
        typeof window !== "undefined"
          ? localStorage.getItem("videoVolume")
          : null;
      const newVolume = savedVolume ? parseFloat(savedVolume) : 0.5;
      setVolume(newVolume);
      if (videoRef.current) {
        videoRef.current.volume = newVolume;
        videoRef.current.muted = false;
      }
    } else {
      // Mute
      setVolume(0);
      if (videoRef.current) {
        videoRef.current.muted = true;
      }
    }
  }, [volume]);

  const handleLoadedData = useCallback(() => {
    setIsVideoLoaded(true);
    setHasError(false);
    if (videoRef.current) {
      setIsHorizontal(
        videoRef.current.videoWidth > videoRef.current.videoHeight
      );
      // Ensure video starts muted for autoplay
      videoRef.current.muted = true;
      videoRef.current.volume = 0;
    }
  }, []);

  const handleVideoError = useCallback(() => {
    setHasError(true);
    setIsVideoLoaded(false);
    setIsPlaying(false);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current && !hasError) {
      if (progress >= 99.9) {
        // If video has ended, restart it
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {
          // Silent fail if play is blocked
        });
        setIsPlaying(true);
      } else {
        // Normal play/pause toggle
        if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
        } else {
          videoRef.current.play().catch(() => {
            // Silent fail if play is blocked
          });
          setIsPlaying(true);
        }
      }
    }
  }, [isPlaying, progress, hasError]);

  const handleFullscreenToggle = useCallback(() => {
    if (videoRef.current) {
      const videoElement = videoRef.current;
      if (document.fullscreenElement) {
        document.exitFullscreen
          ? document.exitFullscreen()
          : (document as any).webkitExitFullscreen?.();
      } else {
        videoElement.requestFullscreen
          ? videoElement.requestFullscreen()
          : (videoElement as any).webkitRequestFullscreen?.();
      }
      setIsFullscreen(!isFullscreen);
    }
  }, [isFullscreen]);

  const handleProgressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (videoRef.current) {
        // Make sure the duration is a valid finite number before calculating newTime
        const duration = videoRef.current.duration;
        if (Number.isFinite(duration) && duration > 0) {
          try {
            const newTime = (duration * parseFloat(e.target.value)) / 100;
            if (Number.isFinite(newTime)) {
              videoRef.current.currentTime = newTime;
            }
          } catch (error) {
            console.error("Error setting video time:", error);
          }
        }
        // Still update the progress state even if we couldn't set the currentTime
        setProgress(parseFloat(e.target.value));
      }
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (videoRef.current) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const newHoverTime = (x / rect.width) * videoRef.current.duration;
        setHoverTime(newHoverTime);
      }
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setHoverTime(null);
  }, []);

  const handleVideoEnded = useCallback(() => {
    if (isInView && videoRef.current && !hasError) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Silent fail if autoplay is blocked
      });
      setIsPlaying(true);
    }
  }, [isInView, hasError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handler = () => {
      if (video) {
        const newProgress = (video.currentTime / video.duration) * 100;
        setProgress(newProgress);
      }
    };

    video.addEventListener("timeupdate", handler);
    return () => {
      video.removeEventListener("timeupdate", handler);
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && !hasError) {
      if (isInView) {
        videoRef.current.play().catch(() => {
          // Silent fail if autoplay is blocked
        });
        setIsPlaying(true);
        setShouldLoop(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        setShouldLoop(false);
      }
    }
  }, [isInView, hasError]);

  // Memoize slider background to prevent re-computation on every render
  const sliderBackground = useMemo(
    () => `
        linear-gradient(
            to right,
            rgb(50,205,50) 0%,
            rgb(50,205,50) ${progress}%,
            #ccc ${progress}%,
            #ccc 100%
  )
  `,
    [progress]
  );

  const progressSliderStyle = useMemo(
    () => ({
      ...BASE_SLIDER_STYLE,
      width: "100%",
      background: sliderBackground,
      zIndex: 3,
    }),
    [sliderBackground]
  );

  const volumeSliderStyle = useMemo(
    () => ({
      ...BASE_SLIDER_STYLE,
      writingMode: "vertical-lr" as React.CSSProperties["writingMode"],
      WebkitAppearance:
        "slider-vertical" as React.CSSProperties["WebkitAppearance"],
      height: "80px",
      transform: "rotate(180deg)",
    }),
    []
  );

  return (
    <Box
      position="relative"
      display="flex"
      justifyContent="center"
      alignItems="center"
      paddingTop="10px"
      minWidth="100%"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <picture style={{ position: "relative", width: "100%", height: "100%" }}>
        <video
          {...props}
          ref={setRefs}
          src={src}
          muted={true} // Always start muted for autoplay
          controls={false}
          playsInline={true}
          autoPlay={true}
          loop={shouldLoop}
          preload="metadata"
          onLoadedData={handleLoadedData}
          onEnded={handleVideoEnded}
          onError={handleVideoError}
          onClick={(e) => e.stopPropagation()}
          style={VIDEO_STYLE}
        />
        {!isVideoLoaded && !hasError && (
          <Box
            position="absolute"
            top={0}
            left={0}
            width="100%"
            height="100%"
            zIndex={3}
            display="flex"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
          >
            <MemoizedLoadingComponent />
          </Box>
        )}
        {hasError && (
          <Box
            position="absolute"
            top={0}
            left={0}
            width="100%"
            height="100%"
            zIndex={3}
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="gray.800"
            borderRadius="md"
          >
            <Text color="gray.400" fontSize="sm" textAlign="center">
              Video failed to load
              <br />
              <Text as="span" fontSize="xs" color="gray.500">
                Please check your connection and try again
              </Text>
            </Text>
          </Box>
        )}
      </picture>
      {isHovered && (
        <VideoControls
          isPlaying={isPlaying}
          handlePlayPause={handlePlayPause}
          volume={volume}
          setVolume={setVolume}
          showVolumeSlider={showVolumeSlider}
          setShowVolumeSlider={setShowVolumeSlider}
          handleVolumeToggle={handleVolumeToggle}
          isFullscreen={isFullscreen}
          handleFullscreenToggle={handleFullscreenToggle}
          progress={progress}
          handleProgressChange={handleProgressChange}
          handleMouseMove={handleMouseMove}
          handleMouseLeave={handleMouseLeave}
          hoverTime={hoverTime}
          videoDuration={videoRef.current?.duration}
          progressSliderStyle={progressSliderStyle}
          volumeSliderStyle={volumeSliderStyle}
          videoRef={videoRef as React.RefObject<HTMLVideoElement>}
        />
      )}
    </Box>
  );
};

// Export with React.memo to prevent unnecessary re-renders
export default React.memo(VideoRenderer);
