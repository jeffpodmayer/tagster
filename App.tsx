import { useEffect } from "react";
import { initDatabase } from "./src/utils/database";
import { PaperProvider } from "react-native-paper";
import { ScanProvider } from "./src/context/ScanContext";
import { AppProvider } from "./src/context/AppContext";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { theme } from "./src/styles/theme";
import { BLEProvider } from "./src/context/BLEContext";
import { VoiceProvider } from "./src/context/VoiceContext";

/**
 * Main App Component
 * - Initializes database
 * - Wraps app in context providers
 * - Renders navigation
 */
export default function App() {
  useEffect(() => {
    // Initialize SQLite database on app start
    initDatabase();
  }, []);

  return (
    <PaperProvider theme={theme}>
      <AppProvider>
        <BLEProvider>
          <VoiceProvider>
            <ScanProvider>
              <AppNavigator />
            </ScanProvider>
          </VoiceProvider>
        </BLEProvider>
      </AppProvider>
    </PaperProvider>
  );
}
