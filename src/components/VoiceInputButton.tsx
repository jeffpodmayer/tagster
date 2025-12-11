import React, { useRef, useEffect } from "react";
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
  const { isRecording, startRecording, stopRecording } = useVoice();

  // Generate a unique ID for this button instance
  // This ID is used to register/unregister this button's callback in the context
  const buttonIdRef = useRef<string>(
    `voice-btn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  // Keep callback ref updated (in case parent component changes the callback)
  const callbackRef = useRef(onTranscriptionComplete);
  useEffect(() => {
    callbackRef.current = onTranscriptionComplete;
  }, [onTranscriptionComplete]);

  // Cleanup: unregister this button when component unmounts
  useEffect(() => {
    return () => {
      // If this button was recording, stop it
      if (isRecording) {
        stopRecording(buttonIdRef.current).catch((error) => {
          console.error("[VoiceInputButton] Cleanup error:", error);
        });
      }
    };
  }, []); // Only run on unmount

  /**
   * Handle button press
   * Toggles recording state for this button
   */
  const handlePress = async (): Promise<void> => {
    if (isRecording) {
      // Stop recording for this button
      // Context will send accumulated text to this button's callback
      await stopRecording(buttonIdRef.current);
    } else {
      // Start recording (or register callback if already recording)
      // Context handles starting Voice if needed
      await startRecording(buttonIdRef.current, (text: string) => {
        // This callback is called by context when transcription is complete
        callbackRef.current(text);
      });
    }
  };

  return (
    <View
      style={{
        width: 44,
        marginTop: 3,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: isRecording ? "#FF0000" : theme.colors.outline,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: isRecording ? "#FF0000" : "transparent",
      }}
    >
      <IconButton
        icon={isRecording ? "stop-circle" : "microphone"}
        size={24}
        iconColor={isRecording ? "#FFFFFF" : theme.colors.onSurface}
        onPress={handlePress}
        style={{ margin: 0 }}
      />
    </View>
  );
};
