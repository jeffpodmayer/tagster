import React, { useState, useEffect, useRef } from "react";
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
  List,
} from "react-native-paper";
import { useScans } from "../context/ScanContext";
import { useAppSettings } from "../context/AppContext";
import { useBLE } from "../context/BLEContext";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { RootTabParamList } from "../navigation/AppNavigator";
import metadataJson from "../data/metadata.json";
import type { AppTheme } from "../styles/theme";
import { useTheme } from "react-native-paper";
import { BLEDeviceModal } from "../components/BLEDeviceModal";
import { ConnectReaderFAB } from "../components/ConnectReaderFAB";
import * as Location from "expo-location";

type NavigationProp = BottomTabNavigationProp<RootTabParamList, "Scan">;

const ScanCaptureScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { addScan, scans } = useScans();
  const { settings } = useAppSettings();
  const theme = useTheme<AppTheme>();
  const {
    isConnected,
    lastTagId,
    connectedDevice,
    discover,
    readCharacteristic,
    exportDiscovery,
  } = useBLE();

  // Track the last tag ID we've already processed (prevents duplicate alerts)
  const lastProcessedTagRef = useRef<string | null>(null);

  // Form state
  const [tagId, setTagId] = useState("");
  const [operator, setOperator] = useState(settings.defaultOperator || "");
  const [species, setSpecies] = useState<string | undefined>(undefined);
  const [site, setSite] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState("");

  // GPS state
  const [gpsLatitude, setGpsLatitude] = useState<number | undefined>(undefined);
  const [gpsLongitude, setGpsLongitude] = useState<number | undefined>(
    undefined
  );
  const [gpsTimestamp, setGpsTimestamp] = useState<string | undefined>(
    undefined
  );

  // Menu visibility state
  const [speciesMenuVisible, setSpeciesMenuVisible] = useState(false);
  const [siteMenuVisible, setSiteMenuVisible] = useState(false);

  // BLE modal state
  const [bleModalVisible, setBleModalVisible] = useState(false);

  // Accordion state
  const [tagExpanded, setTagExpanded] = useState(true);

  // Update operator when settings change
  useEffect(() => {
    if (settings.defaultOperator && !operator) {
      setOperator(settings.defaultOperator);
    }
  }, [settings.defaultOperator]);

  /// Auto-populate tag ID when BLE device sends data
  useEffect(() => {
    if (
      lastTagId &&
      lastTagId !== tagId &&
      lastTagId !== lastProcessedTagRef.current &&
      tagId.trim() === ""
    ) {
      console.log("[ScanCapture] Received tag ID from BLE:", lastTagId);
      setTagId(lastTagId);
      Alert.alert("Tag Scanned! 🏷️", `Tag ID: ${lastTagId}\n\nReady to save!`);
      lastProcessedTagRef.current = lastTagId;
    }
  }, [lastTagId, tagId]); // Only run when lastTagId changes

  // Reset processed tag when user clears the input
  useEffect(() => {
    if (!tagId) {
      lastProcessedTagRef.current = null;
    }
  }, [tagId]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    card: {
      margin: theme.spacing.md,
      marginBottom: 0,
    },
    accordion: {
      margin: theme.spacing.xs,
      marginBottom: 0,
    },
    instructions: {
      textAlign: "center" as const,
      color: theme.colors.textSecondary,
    },
    input: {
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    helpText: {
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
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
    readButtonContainer: {
      marginBottom: theme.spacing.md,
      alignItems: "center",
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
        latitude: gpsLatitude || undefined,
        longitude: gpsLongitude || undefined,
      });

      Alert.alert("Success", "Scan saved successfully!", [
        {
          text: "New Scan",
          onPress: () => {
            setTagId("");
            setNotes("");
            setGpsLatitude(undefined);
            setGpsLongitude(undefined);
            setGpsTimestamp(undefined);
            // Keep operator, species, site for next scan
          },
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to save scan. Please try again.");
    }
  };

  /**
   * NEW: Handle tag read from button
   */
  const handleTagRead = (receivedTagId: string) => {
    console.log("[ScanCapture] Tag received from button:", receivedTagId);
    setTagId(receivedTagId);
    Alert.alert(
      "Tag Scanned! 🏷️",
      `Tag ID: ${receivedTagId}\n\nReady to save!`
    );
  };

  const handleCaptureGPS = async () => {
    try {
      // Request permission first
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to capture GPS coordinates."
        );
        return;
      }

      // Get current position (removed loading alert for smoother UX)
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Update state with captured data
      setGpsLatitude(location.coords.latitude);
      setGpsLongitude(location.coords.longitude);
      setGpsTimestamp(new Date().toISOString());

      // Success feedback with accuracy info
      Alert.alert(
        "GPS Captured ✓",
        `Lat: ${location.coords.latitude.toFixed(
          6
        )}\nLong: ${location.coords.longitude.toFixed(
          6
        )}\nAccuracy: ${location.coords.accuracy?.toFixed(1)}m`
      );
    } catch (error) {
      console.error("[GPS] Capture failed:", error);
      Alert.alert(
        "GPS Error",
        "Unable to capture location. Please ensure GPS is enabled and you have a clear view of the sky."
      );
    }
  };

  /**
   * Render the screen
   */
  return (
    <>
      <ScrollView style={styles.container}>
        {/* Instructions / Connection Status */}
        <Card style={styles.card}>
          <Card.Content>
            {!isConnected ? (
              <>
                <Text variant="bodyMedium" style={styles.instructions}>
                  📱 Connect via Bluetooth to a Tag reader to scan tags, or
                  enter manually below.
                </Text>
              </>
            ) : (
              <Text variant="bodyMedium" style={styles.instructions}>
                📡 Connected to {connectedDevice?.name || "reader"}.
                {lastTagId
                  ? `\n\nLast tag id shown here!{lastTagId}`
                  : "\n\nScan a tag with your reader!"}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Tag ID Input - Most Important Field */}
        <Card style={styles.card}>
          <List.Accordion
            title="🏷️ Tag Information"
            titleStyle={{ fontSize: 18, fontWeight: "bold" }}
            style={styles.accordion}
            expanded={tagExpanded}
            onPress={() => setTagExpanded(!tagExpanded)}
          >
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

              {/* Geolocation Section */}
              <View style={{ marginBottom: theme.spacing.md }}>
                <Text
                  variant="titleSmall"
                  style={{ marginBottom: 8, fontWeight: "bold" }}
                >
                  📍 Capture Location
                </Text>

                <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                  <Button
                    mode="contained-tonal"
                    icon="crosshairs-gps"
                    onPress={handleCaptureGPS}
                    style={{ flex: 1 }}
                  >
                    Capture Location
                  </Button>

                  {/* Show clear button only if GPS is captured */}
                  {gpsLatitude && gpsLongitude && (
                    <Button
                      mode="outlined"
                      icon="close"
                      onPress={() => {
                        setGpsLatitude(undefined);
                        setGpsLongitude(undefined);
                        setGpsTimestamp(undefined);
                        Alert.alert("GPS Cleared", "Location data removed");
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </View>

                {/* Display captured coordinates */}
                <View
                  style={{
                    backgroundColor: theme.colors.surfaceVariant,
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Latitude:{" "}
                    {gpsLatitude ? gpsLatitude.toFixed(6) : "Not captured"}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Longitude:{" "}
                    {gpsLongitude ? gpsLongitude.toFixed(6) : "Not captured"}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      marginTop: 4,
                    }}
                  >
                    Captured:{" "}
                    {gpsTimestamp
                      ? new Date(gpsTimestamp).toLocaleString()
                      : "Not captured"}
                  </Text>
                </View>
              </View>

              {isConnected && (
                <Card style={{ margin: 8, backgroundColor: "#FFF3CD" }}>
                  <Card.Content>
                    <Text style={{ fontWeight: "bold", marginBottom: 8 }}>
                      🔧 Device Setup
                    </Text>
                    <Button
                      mode="contained"
                      onPress={discover}
                      style={{ marginBottom: 8 }}
                    >
                      Run Discovery (Console)
                    </Button>
                    <Button
                      mode="contained"
                      onPress={async () => {
                        try {
                          await exportDiscovery();
                          Alert.alert("Success", "Discovery data exported!");
                        } catch (error: any) {
                          Alert.alert(
                            "Error",
                            error.message || "Export failed"
                          );
                        }
                      }}
                      icon="export"
                    >
                      Export Discovery Data
                    </Button>
                  </Card.Content>
                </Card>
              )}

              <Text variant="bodySmall" style={styles.helpText}>
                * Required field
              </Text>
            </Card.Content>
          </List.Accordion>
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

      {/* Connect Reader FAB - Only show when NOT connected */}
      {!isConnected && (
        <ConnectReaderFAB onPress={() => setBleModalVisible(true)} />
      )}

      {/* BLE Device Scanner Modal */}
      <BLEDeviceModal
        visible={bleModalVisible}
        onDismiss={() => setBleModalVisible(false)}
      />
    </>
  );
};

export default ScanCaptureScreen;
