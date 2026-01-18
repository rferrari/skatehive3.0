"use client";

import React, { useState } from "react";

/**
 * Demo component to preview all possible upload error messages
 * Access via: localStorage.setItem('SKATEHIVE_ERROR_DEMO', 'true') then refresh
 */

interface ErrorScenario {
  id: string;
  name: string;
  description: string;
  errorType: string;
  statusCode?: number;
  failedServer: string;
  rawError: string;
  uploadType: 'mp4_direct' | 'transcoding';
}

const ERROR_SCENARIOS: ErrorScenario[] = [
  // IPFS Direct Upload Errors (MP4)
  {
    id: 'ipfs_500',
    name: '📌 Pinata 500 Error',
    description: 'IPFS service internal error',
    errorType: 'ipfs_upload',
    statusCode: 500,
    failedServer: 'pinata',
    rawError: 'Upload failed: 500',
    uploadType: 'mp4_direct'
  },
  {
    id: 'ipfs_413',
    name: '📌 Pinata File Too Large',
    description: 'MP4 file exceeds size limit',
    errorType: 'file_too_large',
    statusCode: 413,
    failedServer: 'pinata',
    rawError: 'Upload failed: 413 - Request Entity Too Large',
    uploadType: 'mp4_direct'
  },
  {
    id: 'ipfs_403',
    name: '📌 Pinata Forbidden',
    description: 'JWT token expired or invalid',
    errorType: 'upload_rejected',
    statusCode: 403,
    failedServer: 'pinata',
    rawError: 'Upload failed: 403 - Forbidden',
    uploadType: 'mp4_direct'
  },
  {
    id: 'ipfs_timeout',
    name: '📌 Pinata Timeout',
    description: 'Upload took too long',
    errorType: 'timeout',
    failedServer: 'pinata',
    rawError: 'Request timed out after 120000ms',
    uploadType: 'mp4_direct'
  },
  {
    id: 'ipfs_connection',
    name: '📌 Pinata Connection Failed',
    description: 'Cannot reach IPFS service',
    errorType: 'connection',
    failedServer: 'pinata',
    rawError: 'Failed to fetch',
    uploadType: 'mp4_direct'
  },

  // Oracle Transcoder Errors
  {
    id: 'oracle_500',
    name: '🔮 Oracle 500 Error',
    description: 'Oracle server crashed',
    errorType: 'server_error',
    statusCode: 500,
    failedServer: 'oracle',
    rawError: 'Oracle (Primary) responded with 500: Internal Server Error',
    uploadType: 'transcoding'
  },
  {
    id: 'oracle_403',
    name: '🔮 Oracle Rejected',
    description: 'Oracle rejected the video format',
    errorType: 'upload_rejected',
    statusCode: 403,
    failedServer: 'oracle',
    rawError: 'Oracle (Primary) responded with 403: Upload rejected',
    uploadType: 'transcoding'
  },

  // Mac Mini Errors
  {
    id: 'macmini_500',
    name: '🍎 Mac Mini 500 Error',
    description: 'Mac Mini server crashed',
    errorType: 'server_error',
    statusCode: 500,
    failedServer: 'macmini',
    rawError: 'Mac Mini M4 (Secondary) responded with 500: ffmpeg crashed',
    uploadType: 'transcoding'
  },
  {
    id: 'macmini_timeout',
    name: '🍎 Mac Mini Timeout',
    description: 'Transcoding took too long',
    errorType: 'timeout',
    failedServer: 'macmini',
    rawError: 'Mac Mini M4 (Secondary) request timed out',
    uploadType: 'transcoding'
  },

  // Raspberry Pi Errors
  {
    id: 'pi_500',
    name: '🫐 Pi 500 Error',
    description: 'Raspberry Pi crashed',
    errorType: 'server_error',
    statusCode: 500,
    failedServer: 'pi',
    rawError: 'Raspberry Pi (Tertiary) responded with 500: Out of memory',
    uploadType: 'transcoding'
  },
  {
    id: 'pi_connection',
    name: '🫐 Pi Unreachable',
    description: 'Cannot connect to Pi',
    errorType: 'connection',
    failedServer: 'pi',
    rawError: 'Failed to fetch - net::ERR_CONNECTION_REFUSED',
    uploadType: 'transcoding'
  },

  // All Servers Failed
  {
    id: 'all_500',
    name: '💀 ALL SERVERS 500',
    description: 'Every transcoder returned 500',
    errorType: 'server_error',
    statusCode: 500,
    failedServer: 'all',
    rawError: 'Raspberry Pi (Tertiary) responded with 500: All transcoders failed',
    uploadType: 'transcoding'
  },
  {
    id: 'all_timeout',
    name: '💀 ALL SERVERS TIMEOUT',
    description: 'Every transcoder timed out',
    errorType: 'timeout',
    failedServer: 'all',
    rawError: 'All transcoding servers timed out',
    uploadType: 'transcoding'
  },
  {
    id: 'all_connection',
    name: '💀 ALL SERVERS UNREACHABLE',
    description: 'Cannot connect to any server',
    errorType: 'connection',
    failedServer: 'all',
    rawError: 'Failed to fetch - all servers unreachable',
    uploadType: 'transcoding'
  },

  // File validation errors
  {
    id: 'validation_size',
    name: '📁 File Too Large (validation)',
    description: 'File exceeds 500MB limit',
    errorType: 'validation',
    failedServer: 'none',
    rawError: 'File size exceeds 500MB limit',
    uploadType: 'mp4_direct'
  },
  {
    id: 'validation_format',
    name: '📁 Invalid Format',
    description: 'Unsupported video format',
    errorType: 'validation',
    failedServer: 'none',
    rawError: 'Unsupported video format: video/x-msvideo',
    uploadType: 'transcoding'
  },
];

// Server roasts for the demo
const serverRoasts: Record<string, string[]> = {
  oracle: [
    "🔮 The Oracle has spoken... and it said 'nope'.",
    "🔮 Oracle decided to take a cosmic nap.",
  ],
  macmini: [
    "🍎 Vlad's Mac Mini is being dramatic again. Go mock him on Discord!",
    "🍎 The M4 chip decided it needed a coffee break.",
  ],
  pi: [
    "🫐 The Raspberry Pi tried its best... but it's still a tiny computer.",
    "🫐 Pi is probably overheating in Vlad's closet.",
  ],
  pinata: [
    "📌 Pinata IPFS said 'no piñata for you today!'",
    "📌 The IPFS upload service is taking a siesta.",
  ],
  all: [
    "💀 ALL THREE SERVERS FAILED!",
    "🔥 Oracle, Mac Mini, AND Pi all crashed!",
    "☠️ Complete server meltdown!",
  ],
  none: [
    "📁 Your file didn't pass validation.",
  ]
};

const getStatusExplanation = (code?: number): string => {
  if (!code) return "";
  switch (code) {
    case 400: return "Bad Request - the video format might be corrupted";
    case 403: return "Forbidden - server rejected the upload (auth or format issue)";
    case 404: return "Not Found - endpoint is missing";
    case 413: return "File Too Large - your video is too thicc 🍑";
    case 500: return "Server Error - something broke on our end";
    case 502: return "Bad Gateway - server is having network issues";
    case 503: return "Service Unavailable - server is overloaded or down";
    case 504: return "Gateway Timeout - server took too long to respond";
    default: return `HTTP ${code}`;
  }
};

const getServerChainStatus = (failedServer: string, uploadType: string): string => {
  if (uploadType === 'mp4_direct') {
    return "📌 Pinata IPFS → ❌ (direct MP4 upload)";
  }
  if (failedServer === 'all') {
    return "🔮 Oracle → ❌ | 🍎 Mac Mini → ❌ | 🫐 Pi → ❌";
  }
  if (failedServer === 'oracle') {
    return "🔮 Oracle → ❌ (stopped early!)";
  }
  if (failedServer === 'macmini') {
    return "🔮 Oracle → ❌ | 🍎 Mac Mini → ❌ (stopped here)";
  }
  if (failedServer === 'pi') {
    return "🔮 Oracle → ❌ | 🍎 Mac Mini → ❌ | 🫐 Pi → ❌";
  }
  return "No servers tried";
};

const getActionableAdvice = (scenario: ErrorScenario): string => {
  if (scenario.uploadType === 'mp4_direct') {
    if (scenario.statusCode === 500) {
      return "💡 Try: The IPFS upload service had an issue. Try again in a moment, or try a smaller file.";
    }
    if (scenario.statusCode === 413 || scenario.errorType === 'file_too_large') {
      return "💡 Try: Your MP4 is too large. Compress it or trim it down.";
    }
    if (scenario.errorType === 'timeout') {
      return "💡 Try: Use a smaller file or check your internet connection.";
    }
    if (scenario.errorType === 'connection') {
      return "💡 Try: Check your internet connection and try again.";
    }
    return "💡 Try: Wait a moment and retry.";
  }

  if (scenario.statusCode === 403) {
    return "💡 Try: Use an MP4 file, or check if the video is corrupted.";
  }
  if (scenario.statusCode === 413 || scenario.errorType === 'file_too_large') {
    return "💡 Try: Compress your video or use a shorter clip (under 100MB works best).";
  }
  if (scenario.errorType === 'timeout') {
    return "💡 Try: Use a smaller file, check your internet, or try again in a few minutes.";
  }
  if (scenario.errorType === 'connection') {
    return "💡 Try: Check your internet connection and try again.";
  }
  if (scenario.errorType === 'server_error') {
    return "💡 Try: Wait a minute and try again. If it keeps failing, yell at Vlad on Discord.";
  }
  if (scenario.errorType === 'validation') {
    return "💡 Try: Use a different video format (MP4, MOV, WebM) or a smaller file.";
  }
  return "💡 Try: Use an MP4 file for direct upload (bypasses transcoding servers).";
};

const generateFullErrorMessage = (scenario: ErrorScenario): string => {
  const roasts = serverRoasts[scenario.failedServer] || serverRoasts.all;
  const roast = roasts[Math.floor(Math.random() * roasts.length)];
  const serverChain = getServerChainStatus(scenario.failedServer, scenario.uploadType);
  const statusExplanation = scenario.statusCode ? getStatusExplanation(scenario.statusCode) : null;
  const advice = getActionableAdvice(scenario);

  let message = roast;
  message += `\n\n📡 Servers tried:\n${serverChain}`;

  if (scenario.statusCode) {
    message += `\n\n❌ Error: ${statusExplanation}`;
  } else if (scenario.errorType) {
    message += `\n\n❌ Error type: ${scenario.errorType}`;
  }

  message += `\n📁 File: test-video.mov (45.2 MB, video/quicktime)`;
  message += `\n📝 Details: ${scenario.rawError}`;
  message += `\n\n${advice}`;

  return message;
};

export const ErrorDemoPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedScenario, setSelectedScenario] = useState<ErrorScenario | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState<string>("");

  const handleSelectScenario = (scenario: ErrorScenario) => {
    setSelectedScenario(scenario);
    setGeneratedMessage(generateFullErrorMessage(scenario));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-gray-900 rounded-lg shadow-2xl border border-gray-700 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">🧪 Error Message Demo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Scenario List */}
          <div className="w-1/3 border-r border-gray-700 overflow-y-auto">
            <div className="p-2 text-xs text-gray-400 bg-gray-800/50 sticky top-0">
              Click to preview error message
            </div>
            {ERROR_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleSelectScenario(scenario)}
                className={`w-full text-left px-3 py-2 border-b border-gray-800 hover:bg-gray-800 transition-colors ${selectedScenario?.id === scenario.id ? 'bg-gray-800 border-l-2 border-l-green-500' : ''
                  }`}
              >
                <div className="text-sm font-medium text-white">{scenario.name}</div>
                <div className="text-xs text-gray-400">{scenario.description}</div>
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="w-2/3 flex flex-col">
            {selectedScenario ? (
              <>
                {/* Error Details */}
                <div className="p-3 bg-gray-800/50 border-b border-gray-700">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div><span className="text-gray-500">errorType:</span> <span className="text-yellow-400">{selectedScenario.errorType}</span></div>
                    <div><span className="text-gray-500">statusCode:</span> <span className="text-yellow-400">{selectedScenario.statusCode || 'N/A'}</span></div>
                    <div><span className="text-gray-500">failedServer:</span> <span className="text-yellow-400">{selectedScenario.failedServer}</span></div>
                    <div><span className="text-gray-500">uploadType:</span> <span className="text-yellow-400">{selectedScenario.uploadType}</span></div>
                  </div>
                </div>

                {/* Generated Message Preview */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="text-xs text-gray-400 mb-2">📱 User sees this message:</div>
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-sm text-white whitespace-pre-wrap">
                    {generatedMessage}
                  </div>

                  {/* Regenerate button */}
                  <button
                    onClick={() => setGeneratedMessage(generateFullErrorMessage(selectedScenario))}
                    className="mt-3 px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                  >
                    🎲 Regenerate (randomize roast)
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select an error scenario to preview
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
          💡 To test real errors: Use a large file (500MB+), disconnect internet, or wait for server issues
        </div>
      </div>
    </div>
  );
};

export default ErrorDemoPanel;
