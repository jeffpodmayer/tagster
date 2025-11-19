import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { FAB, useTheme } from "react-native-paper";
import type { AppTheme } from "../styles/theme";

interface ExportDataFABProps {
  onPress: () => void;
  disabled?: boolean;
  isExporting?: boolean;
}

export const ExportDataFAB: React.FC<ExportDataFABProps> = ({
  onPress,
  disabled = false,
  isExporting = false,
}) => {
  const theme = useTheme<AppTheme>();

  // Separate animation values for glow and float
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Pulsing glow animation (JS driver for shadow)
  useEffect(() => {
    if (disabled) return; // Don't animate when disabled

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: false, // Must be false for shadow
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, [disabled]);

  // Floating up and down animation (native driver for transform)
  useEffect(() => {
    if (disabled) return; // Don't animate when disabled

    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8, // Float up 8 pixels
          duration: 1000,
          useNativeDriver: true, // Can be true for transform
        }),
        Animated.timing(floatAnim, {
          toValue: 0, // Float back down
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    float.start();

    return () => float.stop();
  }, [disabled]);

  return (
    // Outer view: handles floating motion (native driver)
    <Animated.View
      style={{
        position: "absolute",
        right: theme.spacing.md,
        bottom: theme.spacing.md,
        transform: [{ translateY: floatAnim }],
      }}
    >
      {/* Inner view: handles glow effect (JS driver) */}
      <Animated.View
        style={{
          shadowColor: "#00E676", // Cyan-green glow
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: disabled ? 0 : glowAnim,
          shadowRadius: 20,
          elevation: 12,
        }}
      >
        <FAB
          icon="export"
          label={isExporting ? "Exporting..." : "Export Data"}
          style={{
            backgroundColor: theme.colors.primary,
          }}
          color={theme.colors.surface}
          onPress={onPress}
          disabled={disabled}
        />
      </Animated.View>
    </Animated.View>
  );
};
