"use client";

import React, { useState, useEffect, useRef } from "react";
import { SERVER_CONFIG, ServerKey } from "@/lib/utils/videoProcessing";

export interface TerminalLine {
  timestamp: Date;
  type: "info" | "success" | "error" | "warning" | "server";
  server?: ServerKey | "pinata";
  message: string;
  status?: "pending" | "trying" | "success" | "failed";
}

export interface VideoUploadTerminalProps {
  lines: TerminalLine[];
  isVisible: boolean;
  onClose?: () => void;
  debugMode?: boolean;
  progress?: number; // Real upload progress (0-100)
  stage?: string; // Current processing stage
  autoCloseOnSuccess?: boolean; // Auto-close terminal after success
  autoCloseDelay?: number; // Delay in seconds (default 10)
  errorDetails?: {
    errorType?: string;
    statusCode?: number;
    failedServer?: string;
    rawError?: string;
  };
}

// Fun loading messages to entertain users during upload
const funLoadingMessages = [
  "🛹 Waxing the digital ledge...",
  "🔥 Teaching pixels to kickflip...",
  "⚡ Summoning the skateboard gods...",
  "🎬 Your video is doing a manual across the internet...",
  "🌀 Converting gnarliness to bytes...",
  "💫 Spinning up the halfpipe servers...",
  "🎯 Landing this upload like a first try tre flip...",
  "🌊 Your clip is riding the data waves...",
  "🏆 Processing 100% pure skateboarding vibes...",
  "🔧 Tightening the truck bolts on your video...",
  "🎪 Your edit is doing a circus kickflip...",
  "🚀 Launching to IPFS at Mach shred...",
  "🧪 Distilling pure stoke into frames...",
  "🎸 Your video is shredding (literally)...",
  "🌈 Adding extra steeze to each pixel...",
  "🎭 Rehearsing the perfect upload...",
  "🦄 A wild skateboard video appears...",
  "🍕 Hold tight, this is better than waiting for pizza...",
  "⏳ Good things come to those who wait (and skate)...",
  "🔮 The upload oracle predicts: success!",
  "🎲 Rolling the dice on a clean upload...",
  "🧙 Casting upload spell... ✨",
  "🎪 The server is doing a circus kickflip with your file...",
];

// Animated skateboard loading bar - uses real progress from upload
const SkateboardLoader = ({ serverName, progress = 0, stage }: { serverName?: string; progress?: number; stage?: string }) => {
  const [skateFrame, setSkateFrame] = useState(0);
  const [lastProgress, setLastProgress] = useState(progress);
  const [stuckTime, setStuckTime] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  
  // Skateboard animation frames (spinning effect)
  const skateFrames = ['🛹', '🛹', '🛹', '💨🛹', '🛹', '✨🛹', '🛹', '🔥🛹'];
  
  useEffect(() => {
    // Track if progress is "stuck"
    if (progress !== lastProgress) {
      setLastProgress(progress);
      setStuckTime(0);
    }
    
    // Increment stuck time counter
    const stuckInterval = setInterval(() => {
      if (progress === lastProgress) {
        setStuckTime(prev => prev + 1);
      }
    }, 500);
    
    // Skateboard animation - spins faster when "stuck" (no progress for 2+ seconds)
    const spinDelay = stuckTime > 4 ? 100 : 200; // Faster when stuck
    const skateInterval = setInterval(() => {
      setSkateFrame(prev => (prev + 1) % skateFrames.length);
    }, spinDelay);
    
    // Rotate fun messages every 3 seconds
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % funLoadingMessages.length);
    }, 3000);
    
    return () => {
      clearInterval(stuckInterval);
      clearInterval(skateInterval);
      clearInterval(messageInterval);
    };
  }, [progress, lastProgress, stuckTime]);

  // Generate the loading bar
  const trackWidth = 24;
  const displayProgress = Math.min(progress, 100);
  const filledWidth = Math.floor((displayProgress / 100) * trackWidth);
  const skatePos = Math.max(0, Math.min(filledWidth, trackWidth - 1));
  
  const track = Array(trackWidth).fill('─').map((char, i) => {
    if (i === skatePos) return skateFrames[skateFrame];
    if (i < skatePos) return '█';
    return '░';
  }).join('');

  return (
    <div className="font-mono text-xs my-1">
      <div className="flex items-center gap-2">
        <span className="text-gray-500">[</span>
        <span className="text-green-400">{track}</span>
        <span className="text-gray-500">]</span>
        <span className="text-yellow-400">{Math.floor(displayProgress)}%</span>
      </div>
      <div className="text-gray-400 mt-0.5 animate-pulse">
        {funLoadingMessages[messageIndex]}
      </div>
    </div>
  );
};

const ServerIcon = ({ server, status }: { server: string; status?: string }) => {
  const icons: Record<string, string> = {
    oracle: "🔮",
    macmini: "🍎",
    pi: "🫐",
    pinata: "📌",
  };
  
  const statusIcons: Record<string, string> = {
    pending: "⏳",
    trying: "🔄",
    success: "✅",
    failed: "❌",
  };

  return (
    <span>
      {icons[server] || "🖥️"} {status && statusIcons[status]}
    </span>
  );
};

export const VideoUploadTerminal: React.FC<VideoUploadTerminalProps> = ({
  lines,
  isVisible,
  onClose,
  debugMode = false,
  progress = 0,
  stage,
  autoCloseOnSuccess = true,
  autoCloseDelay = 10,
  errorDetails,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Check if upload was FULLY successful (final success, not intermediate steps)
  const isFullyComplete = lines.some(l => 
    l.message.includes("Video ready!") || 
    l.message.includes("🎉") ||
    l.message.includes("IPFS CID:") ||
    l.message.includes("Upload complete") ||
    (l.type === "success" && l.message.includes("✓ IPFS upload successful"))
  );

  // Check if there was an error
  const hasError = lines.some(l => l.type === "error");

  // Auto-close countdown on success - only after FULL completion
  useEffect(() => {
    // Only start countdown if fully complete, no errors, auto-close enabled, and onClose provided
    if (isFullyComplete && !hasError && autoCloseOnSuccess && onClose && countdown === null) {
      setCountdown(autoCloseDelay);
    }
  }, [isFullyComplete, hasError, autoCloseOnSuccess, onClose, autoCloseDelay, countdown]);

  // Handle countdown timer
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && onClose) {
      onClose();
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [countdown, onClose]);

  // Cancel countdown if user interacts
  const cancelCountdown = () => {
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
    }
    setCountdown(null);
  };

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  if (!isVisible) return null;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getLineColor = (type: TerminalLine["type"]) => {
    switch (type) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      case "server":
        return "text-cyan-400";
      default:
        return "text-gray-300";
    }
  };

  return (
    <div className="w-full mt-2 bg-gray-900 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
          <span className="ml-2 text-xs text-gray-400 font-mono">
            upload-terminal
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Server Status Bar - dynamically ordered from SERVER_CONFIG */}
      <div className="px-3 py-1.5 bg-gray-800/50 border-b border-gray-700 flex gap-3 text-xs font-mono flex-wrap">
        <div className="flex items-center gap-1">
          <ServerIcon server="pinata" status={getServerStatus(lines, "pinata")} />
          <span className="text-gray-400">IPFS</span>
        </div>
        {SERVER_CONFIG.map((server) => (
          <div key={server.key} className="flex items-center gap-1">
            <ServerIcon server={server.key} status={getServerStatus(lines, server.key)} />
            <span className="text-gray-400">{server.name.split(' ')[0]}</span>
          </div>
        ))}
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="p-3 max-h-40 overflow-y-auto font-mono text-xs bg-black"
      >
        {lines.map((line, index) => (
          <div key={index} className={`${getLineColor(line.type)} mb-0.5`}>
            <span className="text-gray-500">[{formatTime(line.timestamp)}]</span>{" "}
            {line.server && <ServerIcon server={line.server} status={line.status} />}{" "}
            {line.message}
          </div>
        ))}
        
        {/* Show skateboard loader when any server is being tried */}
        {isLoading(lines) && (
          <div className="mt-1 mb-1">
            <SkateboardLoader serverName={getCurrentServer(lines)} progress={progress} stage={stage} />
          </div>
        )}
        
        {/* Auto-close countdown message on success */}
        {countdown !== null && countdown > 0 && (
          <div className="mt-2 text-gray-400">
            <span className="text-green-400">✨ Auto-closing in </span>
            <span className="text-yellow-400 font-bold">{countdown}</span>
            <span className="text-green-400"> seconds...</span>
            <button 
              onClick={cancelCountdown}
              className="ml-2 text-gray-500 hover:text-white underline"
            >
              [keep open]
            </button>
          </div>
        )}
        
        {/* Blinking cursor */}
        <span className="inline-block w-1.5 h-3 bg-green-400 animate-pulse" />
      </div>

      {/* Debug Panel (only in debug mode) */}
      {debugMode && errorDetails && (
        <div className="px-3 py-2 bg-gray-800 border-t border-gray-700">
          <div className="text-[10px] font-mono text-gray-400 mb-1">
            🔧 DEBUG
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
            <div>
              <span className="text-gray-500">type:</span>{" "}
              <span className="text-yellow-400">{errorDetails.errorType || "?"}</span>
            </div>
            <div>
              <span className="text-gray-500">code:</span>{" "}
              <span className="text-yellow-400">{errorDetails.statusCode || "?"}</span>
            </div>
            <div>
              <span className="text-gray-500">server:</span>{" "}
              <span className="text-yellow-400">{errorDetails.failedServer || "?"}</span>
            </div>
            <div className="col-span-2 truncate">
              <span className="text-gray-500">error:</span>{" "}
              <span className="text-red-400">{errorDetails.rawError || "?"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {onClose && (
        <div className="px-3 py-2 bg-gray-800 border-t border-gray-700 flex justify-between items-center">
          {/* Show countdown info or error state */}
          <div className="text-xs font-mono">
            {hasError ? (
              <span className="text-red-400">❌ Error occurred - terminal will stay open</span>
            ) : countdown !== null && countdown > 0 ? (
              <span className="text-green-400">
                🎉 Success! Closing in {countdown}s
              </span>
            ) : countdown === null && isFullyComplete ? (
              <span className="text-green-400">✅ Upload complete</span>
            ) : null}
          </div>
          
          <div className="flex gap-2">
            {countdown !== null && (
              <button
                onClick={cancelCountdown}
                className="px-3 py-1 text-xs font-mono bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
              >
                Keep Open
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1 text-xs font-mono bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              {hasError ? "Close" : "Dismiss"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper to determine server status from lines
function getServerStatus(
  lines: TerminalLine[],
  server: string
): "pending" | "trying" | "success" | "failed" | undefined {
  const serverLines = lines.filter((l) => l.server === server);
  if (serverLines.length === 0) return "pending";
  
  const lastLine = serverLines[serverLines.length - 1];
  return lastLine.status;
}

// Helper to check if any server is currently being tried (loading state)
function isLoading(lines: TerminalLine[]): boolean {
  if (lines.length === 0) return false;
  
  // Check if upload completed (success or error)
  const hasCompletion = lines.some(l => 
    l.message.includes("Video ready!") || 
    l.message.includes("🎉") ||
    l.message.includes("IPFS CID:") ||
    l.message.includes("✓ Transcoding successful") ||
    l.message.includes("✓ IPFS upload successful") ||
    (l.type === "error" && l.message.includes("failed"))
  );
  
  if (hasCompletion) return false;
  
  // Check if any server has "trying" status - use SERVER_CONFIG for order
  const allServers = ["pinata", ...SERVER_CONFIG.map(s => s.key)];
  for (const server of allServers) {
    const status = getServerStatus(lines, server);
    if (status === "trying") return true;
  }
  
  // Also check if last line indicates ongoing activity
  const lastLine = lines[lines.length - 1];
  if (lastLine.type === "info" && 
      (lastLine.message.includes("Uploading") || 
       lastLine.message.includes("Processing") ||
       lastLine.message.includes("Trying") ||
       lastLine.message.includes("Starting"))) {
    return true;
  }
  
  return false;
}

// Helper to get the name of the server currently being tried - uses SERVER_CONFIG
function getCurrentServer(lines: TerminalLine[]): string | undefined {
  // Build server names map dynamically from SERVER_CONFIG
  const serverNames: Record<string, string> = {
    pinata: "Pinata IPFS",
    ...Object.fromEntries(SERVER_CONFIG.map(s => [s.key, s.name]))
  };
  
  // Check in order: pinata first, then SERVER_CONFIG order
  const allServers = ["pinata", ...SERVER_CONFIG.map(s => s.key)];
  for (const server of allServers) {
    const status = getServerStatus(lines, server);
    if (status === "trying") return serverNames[server];
  }
  
  return undefined;
}

// Hook to manage terminal state
export function useUploadTerminal() {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<VideoUploadTerminalProps["errorDetails"]>();

  const addLine = (
    message: string,
    type: TerminalLine["type"] = "info",
    server?: TerminalLine["server"],
    status?: TerminalLine["status"]
  ) => {
    setLines((prev) => [
      ...prev,
      {
        timestamp: new Date(),
        type,
        server,
        message,
        status,
      },
    ]);
  };

  const clear = () => {
    setLines([]);
    setProgress(0);
    setStage('');
    setErrorDetails(undefined);
  };
  
  const updateProgress = (p: number, s?: string) => {
    setProgress(p);
    if (s) setStage(s);
  };

  const show = () => {
    setIsVisible(true);
  };

  const hide = () => {
    setIsVisible(false);
  };

  const setError = (details: VideoUploadTerminalProps["errorDetails"]) => {
    setErrorDetails(details);
  };

  return {
    lines,
    isVisible,
    progress,
    stage,
    errorDetails,
    addLine,
    clear,
    show,
    hide,
    setError,
    updateProgress,
  };
}

export default VideoUploadTerminal;
