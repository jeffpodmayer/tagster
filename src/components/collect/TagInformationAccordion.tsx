import React from "react";
import { View, Alert } from "react-native";
import {
  Card,
  List,
  TextInput,
  Text,
  Button,
  Card as CardComponent,
} from "react-native-paper";
import { useTheme } from "react-native-paper";
import type { AppTheme } from "../../styles/theme";
import * as Location from "expo-location";

interface TagInformationAccordionProps {
  expanded: boolean;
  onToggle: () => void;
  tagId: string;
  onTagIdChange: (value: string) => void;
  isConnected: boolean;
  onDiscover: () => void;
  onExportDiscovery: () => Promise<void>;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  gpsTimestamp: string | null;
  onGPSChange: (
    lat: number | null,
    long: number | null,
    timestamp: string | null
  ) => void;
  onCaptureGPS: () => Promise<void>;
  styles: any; // You can type this better later
}

export const TagInformationAccordion: React.FC<
  TagInformationAccordionProps
> = ({
  expanded,
  onToggle,
  tagId,
  onTagIdChange,
  isConnected,
  onDiscover,
  onExportDiscovery,
  gpsLatitude,
  gpsLongitude,
  gpsTimestamp,
  onGPSChange,
  onCaptureGPS,
  styles,
}) => {
  const theme = useTheme<AppTheme>();

  const handleClearGPS = () => {
    onGPSChange(null, null, null);
    Alert.alert("GPS Cleared", "Location data removed");
  };

  return (
    <Card style={styles.card}>
      <List.Accordion
        title="🏷️ Tag Information"
        titleStyle={{ fontSize: 18, fontWeight: "bold" }}
        style={styles.accordion}
        expanded={expanded}
        onPress={onToggle}
      >
        <CardComponent.Content>
          <TextInput
            label="Tag ID *"
            value={tagId}
            onChangeText={onTagIdChange}
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
                onPress={onCaptureGPS}
                style={{ flex: 1 }}
              >
                Capture Location
              </Button>

              {gpsLatitude && gpsLongitude && (
                <Button mode="outlined" icon="close" onPress={handleClearGPS}>
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
            <CardComponent style={{ margin: 8, backgroundColor: "#FFF3CD" }}>
              <CardComponent.Content>
                <Text style={{ fontWeight: "bold", marginBottom: 8 }}>
                  🔧 Device Setup
                </Text>
                <Button
                  mode="contained"
                  onPress={onDiscover}
                  style={{ marginBottom: 8 }}
                >
                  Run Discovery (Console)
                </Button>
                <Button
                  mode="contained"
                  onPress={async () => {
                    try {
                      await onExportDiscovery();
                      Alert.alert("Success", "Discovery data exported!");
                    } catch (error: any) {
                      Alert.alert("Error", error.message || "Export failed");
                    }
                  }}
                  icon="export"
                >
                  Export Discovery Data
                </Button>
              </CardComponent.Content>
            </CardComponent>
          )}

          <Text variant="bodySmall" style={styles.helpText}>
            * Required field
          </Text>
        </CardComponent.Content>
      </List.Accordion>
    </Card>
  );
};
