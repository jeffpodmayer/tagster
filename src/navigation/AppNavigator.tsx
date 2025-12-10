import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
// Import screens
import HomeScreen from "../screens/HomeScreen";
import ScanCaptureScreen from "../screens/CollectScreen";
import LogbookScreen from "../screens/LogbookScreen";
import SettingsScreen from "../screens/SettingsScreen";
import type { AppTheme } from "../styles/theme";
import CollectScreen from "../screens/CollectScreen";

/**
 * Define the navigation param list
 * This provides type safety for navigation
 */
export type RootTabParamList = {
  Home: undefined;
  Collect: undefined;
  Logbook: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * AppNavigator Component
 * Sets up bottom tab navigation
 */
export const AppNavigator: React.FC = () => {
  const theme = useTheme<AppTheme>();
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Collect"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            // Set icon based on route name
            if (route.name === "Home") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "Collect") {
              iconName = focused ? "add-circle" : "add-circle-outline";
            } else if (route.name === "Logbook") {
              iconName = focused ? "list" : "list-outline";
            } else if (route.name === "Settings") {
              iconName = focused ? "settings" : "settings-outline";
            } else {
              iconName = "help-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.surface,
          headerTitleStyle: {
            fontWeight: "bold",
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Dashboard" }}
        />
        <Tab.Screen
          name="Collect"
          component={CollectScreen}
          options={{ title: "Collect" }}
        />
        <Tab.Screen
          name="Logbook"
          component={LogbookScreen}
          options={{ title: "All Scans" }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: "Settings" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
