import React, { useState, useEffect, useRef } from "react";
import { IconButton } from "react-native-paper";
import Voice from "@react-native-voice/voice";
import { View } from "react-native";
import { theme } from "../styles/theme";

interface VoiceInputButtonProps {
  onTranscriptionComplete: (text: string) => void;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscriptionComplete,
}) => {
  const [isRecording, setIsRecording] = useState(false);

  const accumulatedTextRef = useRef("");

  useEffect(() => {
    Voice.onSpeechStart = () => {
      setIsRecording(true);
      accumulatedTextRef.current = ""; // Reset
    };

    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        // Always take the last (most complete) result
        accumulatedTextRef.current = e.value[e.value.length - 1];
      }
    };

    Voice.onSpeechError = (e) => {
      console.error("[Voice] Error:", e);
      setIsRecording(false);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [onTranscriptionComplete]);

  const handlePress = async () => {
    if (isRecording) {
      try {
        await Voice.stop();
        setIsRecording(false);
        // Send the accumulated text
        if (accumulatedTextRef.current) {
          onTranscriptionComplete(accumulatedTextRef.current);
          accumulatedTextRef.current = ""; // Reset
        }
      } catch (error) {
        console.error("[Voice] Failed to stop:", error);
        setIsRecording(false);
      }
    } else {
      try {
        await Voice.start("en-US");
      } catch (error) {
        console.error("[Voice] Failed to start:", error);
      }
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
