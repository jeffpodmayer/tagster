import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import Voice from "@react-native-voice/voice";

/**
 * Shape of the VoiceContext
 * This defines what's available to components that use useVoice()
 */
interface VoiceContextType {
  isRecording: boolean; // Whether Voice is currently recording (global state for Voice library)
  isButtonRecording: (buttonId: string) => boolean; // Check if a specific button is recording
  startRecording: (
    buttonId: string,
    callback: (text: string) => void
  ) => Promise<void>;
  stopRecording: (buttonId: string) => Promise<void>;
}

/**
 * Create the context with undefined default
 * We'll provide the real value in the Provider
 */
const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

/**
 * Props for the VoiceProvider component
 */
interface VoiceProviderProps {
  children: ReactNode; // Child components that can use this context
}

/**
 * VoiceProvider Component
 *
 * HOW IT WORKS:
 * 1. Sets up Voice event listeners ONCE when the provider mounts
 * 2. Maintains a registry of callbacks from all VoiceInputButton instances
 * 3. When Voice receives speech results, it calls ALL registered callbacks
 * 4. Only one Voice recording session can be active at a time (Voice library limitation)
 * 5. Multiple buttons can register callbacks, but only one recording session runs
 *
 * FLOW:
 * - Button 1 presses → calls startRecording("btn1", callback1)
 *   → If not recording: starts Voice, sets isRecording = true
 *   → Always: adds callback1 to registry
 *
 * - Button 2 presses (while recording) → calls startRecording("btn2", callback2)
 *   → Voice already recording, so doesn't start again
 *   → Adds callback2 to registry (now both buttons registered)
 *
 * - Voice.onSpeechResults fires → calls callback1(text) AND callback2(text)
 *   → Both buttons receive the transcription
 *
 * - Button 1 stops → calls stopRecording("btn1")
 *   → Removes callback1 from registry
 *   → If no other callbacks: stops Voice, sets isRecording = false
 *   → If other callbacks exist: keeps Voice running
 */
export const VoiceProvider: React.FC<VoiceProviderProps> = ({ children }) => {
  // Track if Voice is currently recording (global state for Voice library)
  const [isRecording, setIsRecording] = useState(false);

  // Track which specific buttons are recording (Set of button IDs)
  // This allows each button to show its own recording state independently
  // Using state so changes trigger re-renders in buttons
  const [recordingButtons, setRecordingButtons] = useState<Set<string>>(
    new Set()
  );

  // Registry of callbacks: Map<buttonId, callback>
  // This allows multiple buttons to receive transcription results
  const callbacksRef = useRef<Map<string, (text: string) => void>>(new Map());

  // Ref to prevent multiple simultaneous restart attempts
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Set up Voice event listeners ONCE when provider mounts
   * These listeners are shared by all VoiceInputButton instances
   */
  useEffect(() => {
    // When recording starts
    Voice.onSpeechStart = () => {
      setIsRecording(true);
      // No text to reset - we're streaming, not accumulating
    };

    // When speech results come in (fires multiple times as user speaks)
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        const latestText = e.value[e.value.length - 1];
        // Send to ALL active callbacks immediately (real-time streaming)
        callbacksRef.current.forEach((callback) => {
          callback(latestText);
        });
      }
    };

    // When recording ends (user stops speaking or error occurs)
    Voice.onSpeechEnd = () => {
      // Don't auto-stop - let buttons control when to stop
      // This allows continuous recording until user presses stop button
      // NO automatic restart - user controls start/stop via button press
    };

    // Handle errors
    Voice.onSpeechError = (e) => {
      // DEBUG: Log the actual error structure
      console.log("[VoiceContext] Error received:", JSON.stringify(e, null, 2));

      const errorCode = e?.error?.code;
      const errorMessage = e?.error?.message || "";

      // DEBUG: Log what we're checking
      console.log(
        "[VoiceContext] Checking error - code:",
        errorCode,
        "message:",
        errorMessage
      );

      // Don't clear recording buttons on "no speech detected" errors
      // These are expected when user hasn't started speaking yet
      if (
        errorCode === "1110" ||
        errorCode === "recognition_fail" ||
        errorMessage.includes("1110") ||
        errorMessage.includes("No speech detected")
      ) {
        // "No speech detected" - Voice stops automatically, restart it
        if (recordingButtons.size > 0) {
          // Clear any pending restart to prevent loops
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
          }

          // Restart after delay to avoid conflicts
          restartTimeoutRef.current = setTimeout(async () => {
            if (recordingButtons.size > 0) {
              try {
                await Voice.start("en-US");
              } catch (err: any) {
                // "Already running" means Voice is still active - that's good!
                if (
                  !err?.message?.includes("already") &&
                  !err?.code?.includes("already")
                ) {
                  // Real error - try once more
                  setTimeout(async () => {
                    if (recordingButtons.size > 0) {
                      try {
                        await Voice.start("en-US");
                      } catch {
                        // Silent fail
                      }
                    }
                  }, 500);
                }
              }
            }
          }, 300);
        }
        return;
      }

      // "Already started" is not an error - Voice is running, which is what we want
      if (
        errorMessage.includes("already started") ||
        errorMessage.includes("already running") ||
        errorCode === "already_started"
      ) {
        console.log("[VoiceContext] Voice already running - this is fine");
        return; // Don't treat as error
      }

      // For actual critical errors, stop everything
      console.error("[VoiceContext] Critical speech error:", e);
      setIsRecording(false);
      // Clear all recording buttons on critical error
      setRecordingButtons(new Set());
    };

    // Cleanup: remove listeners when provider unmounts
    return () => {
      Voice.removeAllListeners();
    };
  }, [recordingButtons.size]); // Include recordingButtons.size in deps

  /**
   * Check if a specific button is recording
   * @param buttonId - Unique identifier for the button
   * @returns true if this specific button is recording
   */
  const isButtonRecording = (buttonId: string): boolean => {
    return recordingButtons.has(buttonId);
  };

  /**
   * Start recording (or register callback if already recording)
   *
   * @param buttonId - Unique identifier for the button (e.g., "release-notes", "additional-notes")
   * @param callback - Function to call when transcription is complete
   */
  const startRecording = async (
    buttonId: string,
    callback: (text: string) => void
  ): Promise<void> => {
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/762a5187-e725-42d0-8faf-b1628f7b2491", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "VoiceContext.tsx:150",
        message: "startRecording called",
        data: {
          buttonId,
          currentIsRecording: isRecording,
          registeredCallbacks: Array.from(callbacksRef.current.keys()),
          recordingButtons: Array.from(recordingButtons),
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "post-fix",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion
    try {
      // Mark this button as recording (update state to trigger re-renders)
      setRecordingButtons((prev) => {
        const updated = new Set(prev);
        updated.add(buttonId);
        return updated;
      });

      // Always register the callback (even if already recording)
      // This allows multiple buttons to receive the same transcription
      callbacksRef.current.set(buttonId, callback);
      console.log(
        "[VoiceContext] Callback registered for button:",
        buttonId,
        "Total callbacks:",
        callbacksRef.current.size
      );
      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/762a5187-e725-42d0-8faf-b1628f7b2491",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "VoiceContext.tsx:168",
            message: "Button marked as recording and callback registered",
            data: {
              buttonId,
              registeredCallbacks: Array.from(callbacksRef.current.keys()),
              recordingButtons: Array.from(recordingButtons),
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "post-fix",
            hypothesisId: "A",
          }),
        }
      ).catch(() => {});
      // #endregion

      // Only start Voice if not already recording
      if (!isRecording) {
        // #region agent log
        fetch(
          "http://127.0.0.1:7242/ingest/762a5187-e725-42d0-8faf-b1628f7b2491",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "VoiceContext.tsx:190",
              message: "Starting Voice (not recording yet)",
              data: { buttonId },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "post-fix",
              hypothesisId: "C",
            }),
          }
        ).catch(() => {});
        // #endregion
        const isAvailable = await Voice.isAvailable();
        if (!isAvailable) {
          console.warn("[VoiceContext] Speech recognition not available");
          return;
        }
        await Voice.start("en-US");
        // isRecording will be set to true by Voice.onSpeechStart
      } else {
        // #region agent log
        fetch(
          "http://127.0.0.1:7242/ingest/762a5187-e725-42d0-8faf-b1628f7b2491",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "VoiceContext.tsx:207",
              message: "Voice already recording, just registered callback",
              data: { buttonId },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "post-fix",
              hypothesisId: "A",
            }),
          }
        ).catch(() => {});
        // #endregion
      }
    } catch (error: any) {
      console.error("[VoiceContext] Failed to start recording:", error);
      // If already recording, that's okay - callback is still registered
      if (error?.message?.includes("already")) {
        // Voice is already running, which is fine
        // Our callback is registered, so we'll still receive results
      }
    }
  };

  /**
   * Stop recording for a specific button
   * Text is streamed in real-time via onSpeechResults, so no text needs to be sent here
   *
   * @param buttonId - Unique identifier for the button
   */
  const stopRecordingWithText = async (buttonId: string): Promise<void> => {
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/762a5187-e725-42d0-8faf-b1628f7b2491", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "VoiceContext.tsx:320",
        message: "stopRecordingWithText called",
        data: {
          buttonId,
          recordingButtons: Array.from(recordingButtons),
          registeredCallbacks: Array.from(callbacksRef.current.keys()),
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "post-fix",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion
    try {
      // Remove button from recording set
      setRecordingButtons((prev) => {
        const updated = new Set(prev);
        updated.delete(buttonId);
        return updated;
      });

      // Remove callback
      callbacksRef.current.delete(buttonId);

      // If no more callbacks, stop Voice
      if (callbacksRef.current.size === 0) {
        await Voice.stop();
        setIsRecording(false);
        setRecordingButtons(new Set());
      }
      // No text to send - it was already streamed in real-time
    } catch (error) {
      console.error("[VoiceContext] Failed to stop recording:", error);
      setIsRecording(false);
      // Remove this button from recording set even on error
      setRecordingButtons((prev) => {
        const updated = new Set(prev);
        updated.delete(buttonId);
        return updated;
      });
    }
  };

  // Value provided to consuming components
  const value: VoiceContextType = {
    isRecording, // Keep for backward compatibility, but buttons should use isButtonRecording
    isButtonRecording, // New function to check per-button recording state
    startRecording,
    stopRecording: stopRecordingWithText, // Simplified - no text sending (streamed in real-time)
  };

  return (
    <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>
  );
};

/**
 * Hook to use the Voice context
 *
 * Usage in components:
 * const { isRecording, startRecording, stopRecording } = useVoice();
 *
 * @throws Error if used outside VoiceProvider
 */
export const useVoice = (): VoiceContextType => {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error("useVoice must be used within a VoiceProvider");
  }
  return context;
};
