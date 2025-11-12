import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Switch,
  Card,
  Divider,
  List,
  Portal,
  Dialog,
  useTheme,
} from "react-native-paper";
import { useAppSettings } from "../context/AppContext";
import { useScans } from "../context/ScanContext";
import { getDatabaseStats } from "../utils/database";
import type { AppTheme } from "../styles/theme";

const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useAppSettings();
  const { deleteAllScans } = useScans();
  const theme = useTheme<AppTheme>();
  // Local state for input
  const [operatorInput, setOperatorInput] = useState(
    settings.defaultOperator || ""
  );
  const [clearDialogVisible, setClearDialogVisible] = useState(false);

  // Get database stats
  const stats = getDatabaseStats();

  // Create styles using theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    card: {
      margin: theme.spacing.md,
      marginBottom: 0,
    },
    dangerCard: {
      borderColor: theme.colors.error,
      borderWidth: 1,
    },
    dangerTitle: {
      color: theme.colors.error,
    },
    description: {
      marginBottom: theme.spacing.md,
      color: theme.colors.textSecondary,
    },
    input: {
      marginBottom: theme.spacing.md,
    },
    button: {
      marginTop: theme.spacing.sm,
    },
    helpText: {
      marginTop: theme.spacing.sm,
      color: theme.colors.textSecondary,
      fontStyle: "italic" as const,
    },
    spacer: {
      height: theme.spacing.xl,
    },
  });

  /**
   * Save operator name
   */
  const handleSaveOperator = async () => {
    try {
      await updateSettings({ defaultOperator: operatorInput.trim() });
      Alert.alert("Success", "Default operator saved!");
    } catch (error) {
      Alert.alert("Error", "Failed to save operator name");
    }
  };

  /**
   * Toggle GPS setting
   */
  const handleToggleGPS = async () => {
    try {
      await updateSettings({ enableGPS: !settings.enableGPS });
    } catch (error) {
      Alert.alert("Error", "Failed to update GPS setting");
    }
  };

  /**
   * Clear all scan data
   */
  const handleClearAllData = async () => {
    try {
      await deleteAllScans();
      setClearDialogVisible(false);
      Alert.alert("Success", "All scan data has been cleared");
    } catch (error) {
      Alert.alert("Error", "Failed to clear data");
    }
  };

  /**
   * Reset all settings to defaults
   */
  const handleResetSettings = async () => {
    try {
      await resetSettings();
      setOperatorInput("");
      Alert.alert("Success", "Settings reset to defaults");
    } catch (error) {
      Alert.alert("Error", "Failed to reset settings");
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Operator Settings */}
      <Card style={styles.card}>
        <Card.Title title="Operator Information" />
        <Card.Content>
          <Text variant="bodyMedium" style={styles.description}>
            Set a default operator name that will be auto-filled for new scans.
          </Text>
          <TextInput
            label="Default Operator Name"
            value={operatorInput}
            onChangeText={setOperatorInput}
            mode="outlined"
            style={styles.input}
            placeholder="Enter your name"
          />
          <Button
            mode="contained"
            onPress={handleSaveOperator}
            style={styles.button}
            disabled={!operatorInput.trim()}
          >
            Save Operator
          </Button>
        </Card.Content>
      </Card>

      {/* GPS Settings */}
      <Card style={styles.card}>
        <Card.Title title="GPS Settings" />
        <Card.Content>
          <List.Item
            title="Enable GPS Auto-Capture"
            description={
              settings.enableGPS
                ? "GPS will be captured automatically"
                : "GPS capture is disabled"
            }
            left={(props) => <List.Icon {...props} icon="map-marker" />}
            right={() => (
              <Switch
                value={settings.enableGPS}
                onValueChange={handleToggleGPS}
              />
            )}
          />
          <Text variant="bodySmall" style={styles.helpText}>
            When enabled, GPS coordinates will be automatically captured for
            each scan (requires location permissions).
          </Text>
        </Card.Content>
      </Card>

      {/* Database Statistics */}
      <Card style={styles.card}>
        <Card.Title title="Database Statistics" />
        <Card.Content>
          <List.Item
            title="Total Scans"
            description={`${stats.totalScans} scan${
              stats.totalScans !== 1 ? "s" : ""
            } in database`}
            left={(props) => <List.Icon {...props} icon="database" />}
          />
          <Divider />
          {stats.totalScans > 0 && (
            <>
              <List.Item
                title="Oldest Scan"
                description={
                  stats.oldestScan
                    ? new Date(stats.oldestScan).toLocaleDateString()
                    : "N/A"
                }
                left={(props) => <List.Icon {...props} icon="calendar-start" />}
              />
              <Divider />
              <List.Item
                title="Newest Scan"
                description={
                  stats.newestScan
                    ? new Date(stats.newestScan).toLocaleDateString()
                    : "N/A"
                }
                left={(props) => <List.Icon {...props} icon="calendar-end" />}
              />
            </>
          )}
        </Card.Content>
      </Card>

      {/* Metadata Customization */}
      <Card style={styles.card}>
        <Card.Title title="Metadata Options" />
        <Card.Content>
          <List.Item
            title="Species List"
            description={`${settings.customSpecies.length} species configured`}
            left={(props) => <List.Icon {...props} icon="fish" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title="Site List"
            description={`${settings.customSites.length} sites configured`}
            left={(props) => (
              <List.Icon {...props} icon="map-marker-multiple" />
            )}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <Text variant="bodySmall" style={styles.helpText}>
            Customization of species and sites coming soon.
          </Text>
        </Card.Content>
      </Card>

      {/* Danger Zone */}
      <Card style={[styles.card, styles.dangerCard]}>
        <Card.Title title="Danger Zone" titleStyle={styles.dangerTitle} />
        <Card.Content>
          <Button
            mode="outlined"
            onPress={() => setClearDialogVisible(true)}
            style={styles.button}
            textColor={theme.colors.error}
            disabled={stats.totalScans === 0}
          >
            Clear All Scan Data
          </Button>
          <Button
            mode="outlined"
            onPress={handleResetSettings}
            style={styles.button}
            textColor={theme.colors.error}
          >
            Reset All Settings
          </Button>
          <Text variant="bodySmall" style={styles.helpText}>
            ⚠️ These actions cannot be undone. All data will be permanently
            deleted.
          </Text>
        </Card.Content>
      </Card>

      {/* Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={clearDialogVisible}
          onDismiss={() => setClearDialogVisible(false)}
        >
          <Dialog.Title>Clear All Scan Data?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              This will permanently delete all {stats.totalScans} scan
              {stats.totalScans !== 1 ? "s" : ""} from the database. This action
              cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleClearAllData} textColor={theme.colors.error}>
              Delete All
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

export default SettingsScreen;
