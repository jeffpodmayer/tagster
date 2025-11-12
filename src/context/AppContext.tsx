import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppSettings } from "../models/types";
import metadataJson from "../data/metadata.json";

/**
 * Storage key for AsyncStorage
 */
const SETTINGS_KEY = "@tagster_settings";

/**
 * Default settings on first app launch
 */
const DEFAULT_SETTINGS: AppSettings = {
  defaultOperator: undefined,
  enableGPS: false,
  customSpecies: metadataJson.species,
  customSites: metadataJson.sites,
};

/**
 * Shape of the AppContext
 */
interface AppContextType {
  settings: AppSettings;
  isLoading: boolean;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

/**
 * Create the context
 */
const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Props for AppProvider
 */
interface AppProviderProps {
  children: ReactNode;
}

/**
 * AppProvider Component
 * Manages app-wide settings and preferences
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Load settings from AsyncStorage on mount
   */
  useEffect(() => {
    loadSettings();
  }, []);

  /**
   * Load settings from storage
   */
  const loadSettings = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings(parsed);
        console.log("[AppContext] Loaded settings from storage");
      } else {
        console.log("[AppContext] No settings found, using defaults");
      }
    } catch (error) {
      console.error("[AppContext] Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update settings (merges with existing)
   */
  const updateSettings = async (
    updates: Partial<AppSettings>
  ): Promise<void> => {
    try {
      const newSettings = { ...settings, ...updates };

      // Save to state
      setSettings(newSettings);

      // Persist to storage
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));

      console.log("[AppContext] Settings updated:", updates);
    } catch (error) {
      console.error("[AppContext] Failed to update settings:", error);
      throw error;
    }
  };

  /**
   * Reset to default settings
   */
  const resetSettings = async (): Promise<void> => {
    try {
      setSettings(DEFAULT_SETTINGS);
      await AsyncStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(DEFAULT_SETTINGS)
      );
      console.log("[AppContext] Settings reset to defaults");
    } catch (error) {
      console.error("[AppContext] Failed to reset settings:", error);
      throw error;
    }
  };

  const value: AppContextType = {
    settings,
    isLoading,
    updateSettings,
    resetSettings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

/**
 * Custom hook to use AppContext
 * Usage: const { settings, updateSettings } = useAppSettings();
 */
export const useAppSettings = (): AppContextType => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppSettings must be used within an AppProvider");
  }

  return context;
};
