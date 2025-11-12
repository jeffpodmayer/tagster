import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";

/**
 * Custom spacing values
 * Consistent spacing throughout the app
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

/**
 * Light theme (default)
 * Extends React Native Paper's Material Design 3 theme
 */
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#06402B", // Purple for primary actions
    secondary: "#4CAF50", // Green for success/secondary
    error: "#d32f2f", // Red for errors/danger
    background: "#FFFFFF", // Light gray background
    surface: "#FFFFFF", // White cards/surfaces
    textSecondary: "#666666", // Gray for secondary text
  },
  spacing,
};

/**
 * Dark theme (for future use)
 * Will automatically work when you add dark mode toggle
 */
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#64B5F6", // Lighter blue for dark mode
    secondary: "#81C784", // Lighter green
    error: "#ef5350", // Lighter red
    background: "#121212", // Dark background
    surface: "#1E1E1E", // Dark cards
    textSecondary: "#AAAAAA", // Light gray text
  },
  spacing,
};

// Export light theme as default
export const theme = lightTheme;

// TypeScript: Extend the Paper theme type
export type AppTheme = typeof lightTheme;

declare global {
  namespace ReactNativePaper {
    interface ThemeColors {
      textSecondary: string;
    }
    interface Theme {
      spacing: typeof spacing;
    }
  }
}
