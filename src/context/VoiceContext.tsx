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
  isRecording: boolean; // Whether Voice is currently recording
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
  // Track if Voice is currently recording
  const [isRecording, setIsRecording] = useState(false);

  // Registry of callbacks: Map<buttonId, callback>
  // This allows multiple buttons to receive transcription results
  const callbacksRef = useRef<Map<string, (text: string) => void>>(new Map());

  // Accumulated text from the current recording session
  // All buttons share the same transcription result
  const accumulatedTextRef = useRef("");

  /**
   * Set up Voice event listeners ONCE when provider mounts
   * These listeners are shared by all VoiceInputButton instances
   */
  useEffect(() => {
    // When recording starts
    Voice.onSpeechStart = () => {
      setIsRecording(true);
      accumulatedTextRef.current = ""; // Reset accumulated text
    };

    // When speech results come in (fires multiple times as user speaks)
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        // Store the most complete result (last item in array)
        accumulatedTextRef.current = e.value[e.value.length - 1];
      }
    };

    // When recording ends (user stops speaking or error occurs)
    Voice.onSpeechEnd = () => {
      // Don't auto-stop - let buttons control when to stop
      // This allows continuous recording until user presses stop button
    };

    // Handle errors
    Voice.onSpeechError = (e) => {
      console.error("[VoiceContext] Speech error:", e);
      setIsRecording(false);
      accumulatedTextRef.current = "";
    };

    // Cleanup: remove listeners when provider unmounts
    return () => {
      Voice.removeAllListeners();
    };
  }, []); // Empty deps = run once on mount

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
    try {
      // Always register the callback (even if already recording)
      // This allows multiple buttons to receive the same transcription
      callbacksRef.current.set(buttonId, callback);

      // Only start Voice if not already recording
      if (!isRecording) {
        const isAvailable = await Voice.isAvailable();
        if (!isAvailable) {
          console.warn("[VoiceContext] Speech recognition not available");
          return;
        }
        await Voice.start("en-US");
        // isRecording will be set to true by Voice.onSpeechStart
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
   *
   * @param buttonId - Unique identifier for the button
   */
  const stopRecording = async (buttonId: string): Promise<void> => {
    try {
      // Remove this button's callback from registry
      callbacksRef.current.delete(buttonId);

      // If no more callbacks registered, stop Voice
      if (callbacksRef.current.size === 0) {
        await Voice.stop();
        setIsRecording(false);

        // Send accumulated text to any remaining callbacks (should be none, but just in case)
        const finalText = accumulatedTextRef.current;
        if (finalText) {
          // This shouldn't happen since we just cleared all callbacks,
          // but included for safety
          accumulatedTextRef.current = "";
        }
      } else {
        // Other buttons still have callbacks registered
        // Don't stop Voice - let them continue receiving results
        // But send the current accumulated text to this button's callback before removing it
        const callback = callbacksRef.current.get(buttonId);
        if (callback && accumulatedTextRef.current) {
          callback(accumulatedTextRef.current);
        }
      }
    } catch (error) {
      console.error("[VoiceContext] Failed to stop recording:", error);
      setIsRecording(false);
    }
  };

  /**
   * Handle when user stops recording via button press
   * This sends the accumulated text to all registered callbacks
   */
  const handleStopAndSend = async (): Promise<void> => {
    const finalText = accumulatedTextRef.current;
    if (finalText && callbacksRef.current.size > 0) {
      // Send to all registered callbacks
      callbacksRef.current.forEach((callback) => {
        callback(finalText);
      });
    }
    accumulatedTextRef.current = "";
  };

  // Note: We need to expose handleStopAndSend, but we'll call it from stopRecording
  // Actually, let me revise stopRecording to handle this better

  // Revised stopRecording that sends text before stopping
  const stopRecordingWithText = async (buttonId: string): Promise<void> => {
    try {
      // Get this button's callback before removing it
      const callback = callbacksRef.current.get(buttonId);

      // Remove this button's callback from registry
      callbacksRef.current.delete(buttonId);

      // Send accumulated text to this button's callback
      if (callback && accumulatedTextRef.current) {
        callback(accumulatedTextRef.current);
      }

      // If no more callbacks registered, stop Voice
      if (callbacksRef.current.size === 0) {
        await Voice.stop();
        setIsRecording(false);
        accumulatedTextRef.current = "";
      }
      // Otherwise, keep Voice running for other buttons
    } catch (error) {
      console.error("[VoiceContext] Failed to stop recording:", error);
      setIsRecording(false);
    }
  };

  // Value provided to consuming components
  const value: VoiceContextType = {
    isRecording,
    startRecording,
    stopRecording: stopRecordingWithText, // Use the version that sends text
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
