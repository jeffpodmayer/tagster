import React, { useRef, useEffect, useState } from "react";
import { IconButton } from "react-native-paper";
import { View } from "react-native";
import { theme } from "../styles/theme";
import { useVoice } from "../context/VoiceContext";

interface VoiceInputButtonProps {
  onTranscriptionComplete: (text: string) => void;
}

/**
 * VoiceInputButton Component
 *
 * HOW IT WORKS:
 * 1. Each button instance gets a unique ID (generated once on mount)
 * 2. Uses VoiceContext to manage recording (no direct Voice API calls)
 * 3. On press: calls context.startRecording() with its ID and callback
 * 4. Context handles all Voice event listeners and callback management
 * 5. On stop: calls context.stopRecording() which sends transcription to this button's callback
 * 6. Cleanup: unregisters itself when component unmounts
 *
 * BENEFITS:
 * - No conflicts between multiple buttons (context coordinates everything)
 * - All buttons share the same recording session
 * - Each button receives transcription results independently
 */
export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscriptionComplete,
}) => {
  // Get recording state and control methods from context
  const { isButtonRecording, startRecording, stopRecording } = useVoice();

  // Generate a unique ID for this button instance
  // This ID is used to register/unregister this button's callback in the context
  const buttonIdRef = useRef<string>(
    `voice-btn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  useEffect(() => {
    console.log(
      "[VoiceInputButton] Button mounted with ID:",
      buttonIdRef.current
    );
    return () => {
      console.log(
        "[VoiceInputButton] Button unmounting with ID:",
        buttonIdRef.current
      );
    };
  }, []);

  // Check if THIS specific button is recording (not global state)
  // This is calculated on each render to get the latest state
  const isThisButtonRecording = isButtonRecording(buttonIdRef.current);

  // Keep callback ref updated (in case parent component changes the callback)
  const callbackRef = useRef(onTranscriptionComplete);
  useEffect(() => {
    callbackRef.current = onTranscriptionComplete;
  }, [onTranscriptionComplete]);

  // Cleanup: unregister this button when component unmounts
  useEffect(() => {
    return () => {
      // If this button was recording, stop it
      if (isThisButtonRecording) {
        stopRecording(buttonIdRef.current).catch((error) => {
          console.error("[VoiceInputButton] Cleanup error:", error);
        });
      }
    };
  }, [isThisButtonRecording, stopRecording]); // Include dependencies

  /**
   * Handle button press
   * Toggles recording state for this button
   */
  const handlePress = async (): Promise<void> => {
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/762a5187-e725-42d0-8faf-b1628f7b2491", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "VoiceInputButton.tsx:64",
        message: "handlePress called",
        data: { buttonId: buttonIdRef.current, isThisButtonRecording },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "post-fix",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion
    if (isThisButtonRecording) {
      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/762a5187-e725-42d0-8faf-b1628f7b2491",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "VoiceInputButton.tsx:80",
            message: "Stopping recording",
            data: { buttonId: buttonIdRef.current },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "post-fix",
            hypothesisId: "B",
          }),
        }
      ).catch(() => {});
      // #endregion
      // Stop recording for this button
      // Context will send accumulated text to this button's callback
      await stopRecording(buttonIdRef.current);
    } else {
      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/762a5187-e725-42d0-8faf-b1628f7b2491",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "VoiceInputButton.tsx:102",
            message: "Starting recording",
            data: { buttonId: buttonIdRef.current },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "post-fix",
            hypothesisId: "C",
          }),
        }
      ).catch(() => {});
      // #endregion
      // Start recording (or register callback if already recording)
      // Context handles starting Voice if needed
      await startRecording(buttonIdRef.current, (text: string) => {
        // This callback is called by context when transcription is complete
        callbackRef.current(text);
      });
    }
  };

  // #region agent log
  useEffect(() => {
    fetch("http://127.0.0.1:7242/ingest/762a5187-e725-42d0-8faf-b1628f7b2491", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "VoiceInputButton.tsx:133",
        message: "Rendering button",
        data: {
          buttonId: buttonIdRef.current,
          isThisButtonRecording,
          willShowRed: isThisButtonRecording,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "post-fix",
        hypothesisId: "A",
      }),
    }).catch(() => {});
  }, [isThisButtonRecording]);
  // #endregion
  return (
    <View
      style={{
        width: 44,
        marginTop: 3,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: isThisButtonRecording ? "#FF0000" : theme.colors.outline,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: isThisButtonRecording ? "#FF0000" : "transparent",
      }}
    >
      <IconButton
        icon={isThisButtonRecording ? "stop-circle" : "microphone"}
        size={24}
        iconColor={isThisButtonRecording ? "#FFFFFF" : theme.colors.onSurface}
        onPress={handlePress}
        style={{ margin: 0 }}
      />
    </View>
  );
};
