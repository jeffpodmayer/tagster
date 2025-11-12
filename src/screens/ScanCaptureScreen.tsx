import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Card,
  Menu,
  Divider,
  Chip,
  IconButton,
} from "react-native-paper";
import { useScans } from "../context/ScanContext";
import { useAppSettings } from "../context/AppContext";
import metadataJson from "../data/metadata.json";
import type { AppTheme } from "../styles/theme";
import { useTheme } from "react-native-paper";

const ScanCaptureScreen: React.FC = () => {
  const { addScan, scans } = useScans();
  const { settings } = useAppSettings();
  const theme = useTheme<AppTheme>();
  // Form state
  const [tagId, setTagId] = useState("");
  const [operator, setOperator] = useState(settings.defaultOperator || "");
  const [species, setSpecies] = useState<string | undefined>(undefined);
  const [site, setSite] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState("");

  // Menu visibility state
  const [speciesMenuVisible, setSpeciesMenuVisible] = useState(false);
  const [siteMenuVisible, setSiteMenuVisible] = useState(false);

  // Update operator when settings change
  useEffect(() => {
    if (settings.defaultOperator && !operator) {
      setOperator(settings.defaultOperator);
    }
  }, [settings.defaultOperator]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    card: {
      margin: theme.spacing.md,
      marginBottom: 0,
    },
    instructions: {
      textAlign: "center" as const,
      color: theme.colors.textSecondary,
    },
    input: {
      marginBottom: theme.spacing.md,
    },
    helpText: {
      color: theme.colors.textSecondary,
      fontStyle: "italic" as const,
    },
    dropdownButton: {
      marginBottom: theme.spacing.md,
      justifyContent: "flex-start" as const,
    },
    dropdownContent: {
      justifyContent: "flex-start" as const,
    },
    chip: {
      marginTop: theme.spacing.sm,
    },
    buttonContainer: {
      margin: theme.spacing.md,
    },
    saveButton: {
      marginBottom: 12,
      paddingVertical: 6,
    },
    clearButton: {
      paddingVertical: 6,
    },
    spacer: {
      height: theme.spacing.xl,
    },
  });

  /**
   * Duplicate the last entry's metadata
   */
  const handleDuplicateLastEntry = () => {
    if (scans.length === 0) {
      Alert.alert(
        "No Previous Scans",
        "There are no previous scans to duplicate."
      );
      return;
    }

    const lastScan = scans[0]; // scans are sorted newest first
    setOperator(lastScan.operator || settings.defaultOperator || "");
    setSpecies(lastScan.species);
    setSite(lastScan.site);
    setNotes(lastScan.notes || "");

    Alert.alert(
      "Success",
      "Duplicated metadata from last scan. Enter new tag ID."
    );
  };

  /**
   * Clear the form
   */
  const handleClearForm = () => {
    setTagId("");
    setOperator(settings.defaultOperator || "");
    setSpecies(undefined);
    setSite(undefined);
    setNotes("");
  };

  /**
   * Save the scan
   */
  const handleSaveScan = async () => {
    // Validation
    if (!tagId.trim()) {
      Alert.alert("Validation Error", "Tag ID is required");
      return;
    }

    try {
      await addScan({
        tagId: tagId.trim(),
        operator: operator.trim() || undefined,
        species,
        site,
        notes: notes.trim() || undefined,
      });

      Alert.alert("Success", "Scan saved successfully!", [
        {
          text: "New Scan",
          onPress: () => {
            setTagId("");
            setNotes("");
            // Keep operator, species, site for next scan
          },
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to save scan. Please try again.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Instructions */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="bodyMedium" style={styles.instructions}>
            📱 Enter tag information manually, or scan with BLE reader (coming
            soon).
          </Text>
        </Card.Content>
      </Card>

      {/* Tag ID Input - Most Important Field */}
      <Card style={styles.card}>
        <Card.Title title="🏷 Tag Information" />
        <Card.Content>
          <TextInput
            label="Tag ID *"
            value={tagId}
            onChangeText={setTagId}
            mode="outlined"
            placeholder="Enter tag ID"
            style={styles.input}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <Text variant="bodySmall" style={styles.helpText}>
            * Required field
          </Text>
        </Card.Content>
      </Card>

      {/* Metadata Fields */}
      <Card style={styles.card}>
        <Card.Title
          title="📝 Scan Metadata"
          right={(props) => (
            <IconButton
              {...props}
              icon="content-copy"
              onPress={handleDuplicateLastEntry}
            />
          )}
        />
        <Card.Content>
          {/* Operator */}
          <TextInput
            label="👤 Operator"
            value={operator}
            onChangeText={setOperator}
            mode="outlined"
            placeholder={settings.defaultOperator || "Enter operator name"}
            style={styles.input}
          />

          {/* Species Dropdown */}
          <Menu
            visible={speciesMenuVisible}
            onDismiss={() => setSpeciesMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setSpeciesMenuVisible(true)}
                style={styles.dropdownButton}
                contentStyle={styles.dropdownContent}
                icon="chevron-down"
              >
                {species || "Select Species"}
              </Button>
            }
          >
            {metadataJson.species.map((sp) => (
              <Menu.Item
                key={sp}
                onPress={() => {
                  setSpecies(sp);
                  setSpeciesMenuVisible(false);
                }}
                title={sp}
              />
            ))}
            <Divider />
            <Menu.Item
              onPress={() => {
                setSpecies(undefined);
                setSpeciesMenuVisible(false);
              }}
              title="Clear Selection"
            />
          </Menu>

          {/* Site Dropdown */}
          <Menu
            visible={siteMenuVisible}
            onDismiss={() => setSiteMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setSiteMenuVisible(true)}
                style={styles.dropdownButton}
                contentStyle={styles.dropdownContent}
                icon="chevron-down"
              >
                {site || "Select Site"}
              </Button>
            }
          >
            {metadataJson.sites.map((s) => (
              <Menu.Item
                key={s}
                onPress={() => {
                  setSite(s);
                  setSiteMenuVisible(false);
                }}
                title={s}
              />
            ))}
            <Divider />
            <Menu.Item
              onPress={() => {
                setSite(undefined);
                setSiteMenuVisible(false);
              }}
              title="Clear Selection"
            />
          </Menu>

          {/* Notes */}
          <TextInput
            label="📝 Notes"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            placeholder="Additional observations..."
            style={styles.input}
            multiline
            numberOfLines={3}
          />

          {/* GPS Status */}
          {settings.enableGPS && (
            <Chip icon="map-marker" style={styles.chip}>
              GPS Enabled (Location will be captured)
            </Chip>
          )}
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSaveScan}
          style={styles.saveButton}
          icon="content-save"
          disabled={!tagId.trim()}
        >
          Save Scan
        </Button>

        <Button
          mode="outlined"
          onPress={handleClearForm}
          style={styles.clearButton}
        >
          Clear Form
        </Button>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

export default ScanCaptureScreen;
