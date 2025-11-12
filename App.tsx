import { useEffect } from "react";
import { initDatabase } from "./src/utils/database";
import { PaperProvider } from "react-native-paper";
import { ScanProvider } from "./src/context/ScanContext";
import { AppProvider } from "./src/context/AppContext";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { theme } from "./src/styles/theme";

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
        <ScanProvider>
          <AppNavigator />
        </ScanProvider>
      </AppProvider>
    </PaperProvider>
  );
}
