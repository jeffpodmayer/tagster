import React from "react";
import { View, FlatList } from "react-native";
import {
  Portal,
  Modal,
  Text,
  Card,
  Button,
  List,
  ActivityIndicator,
  useTheme,
} from "react-native-paper";
import { useBLE } from "../context/BLEContext";
import { Device } from "react-native-ble-plx";
import type { AppTheme } from "../styles/theme";

/**
 * Props for BLEDeviceModal
 */
interface BLEDeviceModalProps {
  visible: boolean;
  onDismiss: () => void;
}

/**
 * Reusable BLE Device Scanner Modal
 *
 * This modal handles:
 * - Scanning for nearby BLE devices
 * - Displaying discovered devices with signal strength
 * - Connecting to selected device
 * - Showing connection status
 *
 * Usage:
 * <BLEDeviceModal
 *   visible={modalVisible}
 *   onDismiss={() => setModalVisible(false)}
 * />
 */
export const BLEDeviceModal: React.FC<BLEDeviceModalProps> = ({
  visible,
  onDismiss,
}) => {
  const theme = useTheme<AppTheme>();

  const {
    isScanning,
    isConnected,
    connectedDevice,
    discoveredDevices,
    startScan,
    stopScan,
    connectToDevice,
  } = useBLE();

  /**
   * Start scan when modal opens
   */
  React.useEffect(() => {
    if (visible && !isConnected) {
      startScan();
    }
    return () => {
      if (visible) {
        stopScan();
      }
    };
  }, [visible]);

  /**
   * Handle device selection from list
   */
  const handleDeviceSelect = async (device: Device) => {
    await connectToDevice(device.id);
    // Keep modal open briefly to show success, then close
    setTimeout(() => {
      onDismiss();
    }, 1000);
  };

  /**
   * Render Device List Item with signal strength
   */
  const renderDeviceItem = ({ item }: { item: Device }) => {
    const rssi = item.rssi || 0;

    let signalEmoji = "";
    let signalColor = "";

    if (rssi > -60) {
      signalEmoji = "●";
      signalColor = "#4CAF50";
    } else if (rssi > -75) {
      signalEmoji = "●";
      signalColor = "#FFC107";
    } else {
      signalEmoji = "●";
      signalColor = "#F44336";
    }

    const deviceName = item.name || item.localName || "Unknown Device";

    return (
      <List.Item
        title={deviceName}
        description={`ID: ${item.id.substring(0, 18)}...`}
        right={(props) => (
          <Text
            style={{
              alignSelf: "center",
              color: signalColor,
              fontSize: 13,
              fontWeight: "600",
            }}
          >
            {signalEmoji}
          </Text>
        )}
        onPress={() => handleDeviceSelect(item)}
        style={{ paddingVertical: theme.spacing.sm }}
      />
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={{
          backgroundColor: theme.colors.background,
          padding: theme.spacing.lg,
          margin: theme.spacing.lg,
          borderRadius: 8,
          height: "80%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <Text
          variant="headlineSmall"
          style={{ marginBottom: theme.spacing.md, textAlign: "center" }}
        >
          📡 Devices
        </Text>

        {/* Connection Success Message */}
        {isConnected && connectedDevice && (
          <Card
            style={{
              marginBottom: theme.spacing.md,
              backgroundColor: theme.colors.primaryContainer,
            }}
          >
            <Card.Content>
              <Text variant="titleMedium" style={{ textAlign: "center" }}>
                ✅ Connected to {connectedDevice.name || "Reader"}
              </Text>
              <Text
                variant="bodySmall"
                style={{
                  textAlign: "center",
                  color: theme.colors.textSecondary,
                }}
              >
                You can now read tags from this reader!
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Scanning Indicator */}
        {isScanning && !isConnected && (
          <View style={{ marginVertical: theme.spacing.md }}>
            <ActivityIndicator size="large" />
            <Text style={{ textAlign: "center", marginTop: theme.spacing.sm }}>
              Scanning for devices...
            </Text>
          </View>
        )}

        {/* Device List */}
        {!isConnected && (
          <>
            <Text
              variant="bodyMedium"
              style={{
                marginBottom: theme.spacing.sm,
                color: theme.colors.textSecondary,
              }}
            >
              {discoveredDevices.length === 0 && !isScanning
                ? "No devices found. Make sure your device is powered on and nearby."
                : `Found ${discoveredDevices.length} device(s)`}
            </Text>

            <View style={{ flex: 1, marginBottom: theme.spacing.md }}>
              <FlatList
                data={discoveredDevices}
                renderItem={renderDeviceItem}
                keyExtractor={(item) => item.id}
                nestedScrollEnabled
                ListEmptyComponent={
                  !isScanning ? (
                    <Text
                      style={{
                        textAlign: "center",
                        padding: theme.spacing.xl,
                        color: theme.colors.textSecondary,
                      }}
                    >
                      No devices found yet.{"\n\n"}
                      For testing: Turn on your Bluetooth headphones.{"\n"}
                      For PIT tags: Turn on your PIT tag reader.
                    </Text>
                  ) : null
                }
              />
            </View>

            {/* Scan Controls */}
            {!isScanning ? (
              <Button
                mode="contained"
                onPress={startScan}
                icon="refresh"
                style={{ marginBottom: theme.spacing.sm }}
              >
                Scan Again
              </Button>
            ) : (
              <Button
                mode="outlined"
                onPress={stopScan}
                icon="stop"
                style={{ marginBottom: theme.spacing.sm }}
              >
                Stop Scanning
              </Button>
            )}
          </>
        )}

        {/* Close Button */}
        <Button mode="text" onPress={onDismiss}>
          Close
        </Button>
      </Modal>
    </Portal>
  );
};
