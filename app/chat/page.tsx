"use client";

import { useEffect, useRef, useState } from "react";

declare const StWidget: any;

export default function ChatPage() {
  const chatRef = useRef<HTMLDivElement | null>(null);
  const [debug, setDebug] = useState<string[]>([]);
  const widgetRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  const mountedRef = useRef(true);
  const [isLoading, setIsLoading] = useState(true);
  const [widgetReady, setWidgetReady] = useState(false);

  const log = (msg: string) => {
    console.log(msg);
    if (mountedRef.current) {
      setDebug((d) => [...d, msg]);
    }
  };

  useEffect(() => {
    // Run cleanup immediately when component mounts, before any other logic
    const emergencyCleanup = () => {
      try {
        const problematicKeys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key);
            if (value && value.startsWith("#")) {
              problematicKeys.push(key);
            }
          }
        }
        problematicKeys.forEach((key) => {
          localStorage.removeItem(key);
          log(`Emergency cleanup: removed key ${key}`);
        });
      } catch (e) {
        log(`Emergency cleanup failed: ${e}`);
      }
    };

    emergencyCleanup();

    const container = chatRef.current;
    if (!container) {
      log("Container not found");
      return;
    }

    // In development mode, React StrictMode will mount/unmount components twice
    // We need to check if a widget already exists in the container
    if (container.children.length > 0 && container.querySelector("iframe")) {
      log("Widget already exists in container, skipping initialization");
      setIsLoading(false);
      setWidgetReady(true);
      return;
    }

    if (isInitializedRef.current) {
      log("Already initialized, skipping");
      return;
    }

    log("Starting widget initialization");
    isInitializedRef.current = true;
    const scripts: HTMLScriptElement[] = [];

    const loadScript = (src: string) =>
      new Promise<HTMLScriptElement>((resolve, reject) => {
        // Check if script is already loaded
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          log(`Script already loaded: ${src}`);
          resolve(existing as HTMLScriptElement);
          return;
        }

        log(`Loading script: ${src}`);
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => {
          log(`Loaded script: ${src}`);
          resolve(s);
        };
        s.onerror = (e) => {
          log(`Failed to load script: ${src} - ${e}`);
          reject(e);
        };
        document.head.appendChild(s);
        scripts.push(s);
      });

    // More aggressive localStorage cleanup
    const cleanupLocalStorage = () => {
      try {
        log("Starting comprehensive localStorage cleanup");
        const keysToRemove: string[] = [];

        // Get all localStorage keys
        const allKeys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) allKeys.push(key);
        }

        log(`Found ${allKeys.length} localStorage keys to check`);

        allKeys.forEach((key) => {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              // Check for various corruption patterns
              const isCorrupted =
                value.trim().startsWith("#") || // Starts with #
                value.includes('#{"keys":') || // Contains #{"keys":
                (value.includes('{"keys":') && value.startsWith("#")) || // Specific pattern from error
                (!value.startsWith("{") &&
                  !value.startsWith("[") &&
                  !value.startsWith('"') &&
                  value.includes("{")); // Invalid JSON structure

              if (isCorrupted) {
                keysToRemove.push(key);
                log(
                  `Marking corrupted key for removal: ${key} (value starts with: ${value.substring(
                    0,
                    20
                  )}...)`
                );
              } else {
                // Try to parse as JSON to catch other corruption
                try {
                  JSON.parse(value);
                } catch (parseError) {
                  // If it's not valid JSON and not a simple string, it might be corrupted
                  if (value.includes("{") || value.includes("[")) {
                    keysToRemove.push(key);
                    log(`Marking unparseable JSON key for removal: ${key}`);
                  }
                }
              }
            }
          } catch (e) {
            keysToRemove.push(key);
            log(`Error checking key ${key}, marking for removal: ${e}`);
          }
        });

        // Remove all corrupted keys
        keysToRemove.forEach((key) => {
          try {
            localStorage.removeItem(key);
            log(`Successfully removed corrupted localStorage key: ${key}`);
          } catch (e) {
            log(`Failed to remove localStorage key ${key}: ${e}`);
          }
        });

        log(
          `localStorage cleanup complete. Removed ${keysToRemove.length} corrupted keys`
        );

        // Additional cleanup: Clear any keys that might be related to the chat widget
        const chatRelatedKeys = allKeys.filter(
          (key) =>
            key.toLowerCase().includes("chat") ||
            key.toLowerCase().includes("peakd") ||
            key.toLowerCase().includes("stwidget") ||
            key.toLowerCase().includes("stlib")
        );

        chatRelatedKeys.forEach((key) => {
          try {
            const value = localStorage.getItem(key);
            if (value && value.startsWith("#")) {
              localStorage.removeItem(key);
              log(`Removed chat-related corrupted key: ${key}`);
            }
          } catch (e) {
            log(`Error cleaning chat-related key ${key}: ${e}`);
          }
        });
      } catch (e) {
        log(`localStorage cleanup failed: ${e}`);
        // If all else fails, try to clear localStorage entirely (nuclear option)
        try {
          log("Attempting emergency localStorage clear");
          localStorage.clear();
          log("Emergency localStorage clear successful");
        } catch (clearError) {
          log(`Emergency clear also failed: ${clearError}`);
        }
      }
    };

    cleanupLocalStorage();

    // Fallback timeout to hide loading state even if widget fails
    const fallbackTimeout = setTimeout(() => {
      if (mountedRef.current && isLoading) {
        log("Fallback timeout: hiding loading state");
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    const initWidget = () => {
      if (!mountedRef.current) {
        log("Component unmounted, skipping widget initialization");
        return;
      }

      log("Attempting to create StWidget");
      log(`StWidget available: ${typeof StWidget}`);
      log(`Widget ref current: ${!!widgetRef.current}`);
      log(`Container available: ${!!container}`);

      if (typeof StWidget === "function" && !widgetRef.current && container) {
        try {
          // Only clear container if it's empty or doesn't have a valid widget
          if (!container.querySelector("iframe")) {
            container.innerHTML = "";
            log("Container cleared");
          } else {
            log("Container already has iframe, keeping it");
            setIsLoading(false);
            setWidgetReady(true);
            return;
          }

          widgetRef.current = new StWidget(
            "https://chat.peakd.com/t/hive-173115/0"
          );
          log("StWidget instance created");

          widgetRef.current.setProperties({
            allow_resize: true,
            use_dark_mode: true,
            defaultTheme: "Dark",
            "--appMessageFontFamily": "'Roboto'",
            onlyPrependCommunities: true,
            showSidebar: true,
          });
          log("Widget properties set");

          const element = widgetRef.current.createElement(
            "100%",
            "80vh",
            false,
            false
          );
          log("Widget element created");

          container.appendChild(element);
          log("Widget appended to container");

          // Mark widget as ready
          setWidgetReady(true);
          setIsLoading(false);
          log("Widget initialization complete");
        } catch (e) {
          log(`Error creating widget: ${e}`);
          console.error("Widget creation error:", e);
        }
      } else {
        log("StWidget constructor missing or widget already exists");
        log(`StWidget type: ${typeof StWidget}`);
        log(`Widget ref: ${!!widgetRef.current}`);
        log(`Container: ${!!container}`);
      }
    };

    // Add delay to ensure scripts are fully loaded and parsed
    const initWithDelay = () => {
      setTimeout(() => {
        if (mountedRef.current) {
          log("Delayed initialization starting");
          initWidget();
        } else {
          log("Component unmounted before delayed init");
        }
      }, 500);
    };

    // Check if StWidget is already available
    if (typeof StWidget === "function") {
      log("StWidget already available, initializing immediately");
      initWidget();
    } else {
      log("StWidget not available, loading scripts");
      // Load scripts sequentially
      loadScript("https://chat.peakd.com/stlib.js")
        .then(() => {
          log("stlib.js loaded, loading stwidget.js");
          return loadScript("https://chat.peakd.com/stwidget.js");
        })
        .then(() => {
          log("Both scripts loaded, initializing with delay");
          initWithDelay();
        })
        .catch((e) => {
          log(`Error loading scripts: ${e}`);
          console.error("Script loading error:", e);
        });
    }

    return () => {
      log("Cleanup function called");

      // Clear fallback timeout
      clearTimeout(fallbackTimeout);

      // In development mode, DON'T cleanup the widget to prevent destroying it
      // when React StrictMode remounts the component
      if (process.env.NODE_ENV === "development") {
        log("Development mode: skipping widget cleanup to preserve widget");
        mountedRef.current = false;
        isInitializedRef.current = false;
        return;
      }

      // Only cleanup in production mode
      log("Production mode: proceeding with cleanup");
      setTimeout(() => {
        if (!mountedRef.current) {
          log("Proceeding with cleanup after delay");
          mountedRef.current = false;

          if (container && container.innerHTML) {
            log("Clearing container");
            container.innerHTML = "";
          }

          if (widgetRef.current) {
            try {
              if (typeof widgetRef.current.cleanup === "function") {
                widgetRef.current.cleanup();
              }
              if (typeof widgetRef.current.destroy === "function") {
                widgetRef.current.destroy();
              }
            } catch (e) {
              log(`Error during widget cleanup: ${e}`);
            }
            widgetRef.current = null;
            log("Widget cleaned up");
          }

          isInitializedRef.current = false;
        } else {
          log("Component still mounted, skipping cleanup");
        }
      }, 1000);
    };
  }, []);

  // Set mounted ref to false on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <div className="p-4 max-w-full">
      <h1 className="text-2xl font-bold mb-4">SkateHive Chat</h1>

      {isLoading && (
        <div
          className="w-full border rounded-lg bg-gray-50 shadow-lg flex items-center justify-center"
          style={{ minHeight: "600px" }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading chat widget...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
          </div>
        </div>
      )}

      <div
        ref={chatRef}
        className={`w-full border rounded-lg shadow-lg ${
          widgetReady ? "bg-white" : "bg-gray-50"
        } ${isLoading ? "hidden" : ""}`}
        style={{ minHeight: "600px" }}
      />

      {process.env.NODE_ENV === "development" && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-600">
            Debug Info ({debug.length} messages) - Widget Ready:{" "}
            {widgetReady ? "Yes" : "No"}
          </summary>
          <pre className="mt-2 text-xs whitespace-pre-wrap bg-gray-100 p-2 rounded max-h-60 overflow-y-auto">
            {debug.join("\n")}
          </pre>
        </details>
      )}
    </div>
  );
}
