import React, { useMemo, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Card,
  Button,
  List,
  Divider,
  useTheme,
} from "react-native-paper";
import type { AppTheme } from "../styles/theme";
import { useScans } from "../context/ScanContext";
import { useAppSettings } from "../context/AppContext";
import { useBLE } from "../context/BLEContext";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { RootTabParamList } from "../navigation/AppNavigator";
import { BLEDeviceModal } from "../components/BLEDeviceModal";
import { ConnectReaderFAB } from "../components/ConnectReaderFAB";

type NavigationProp = BottomTabNavigationProp<RootTabParamList, "Home">;

const HomeScreen: React.FC = () => {
  const theme = useTheme<AppTheme>();
  const navigation = useNavigation<NavigationProp>();
  const { scans } = useScans();
  const { settings } = useAppSettings();

  // ============ NEW: BLE HOOKS ============
  const {
    isScanning,
    isConnected,
    connectedDevice,
    discoveredDevices,
    bluetoothState,
    startScan,
    stopScan,
    connectToDevice,
    disconnect,
  } = useBLE();

  // ============ NEW: BLE UI STATE ============
  const [bleModalVisible, setBleModalVisible] = useState(false);

  // Create styles using theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: theme.spacing.md,
    },
    welcomeCard: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.primary,
    },
    welcomeContent: {
      padding: theme.spacing.md,
    },
    welcomeText: {
      color: "#fff",
      fontSize: 24,
      fontWeight: "bold",
    },
    welcomeSubtext: {
      color: "#fff",
      opacity: 0.9,
      marginTop: theme.spacing.xs,
    },
    statsRow: {
      flexDirection: "row",
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    statCard: {
      flex: 1,
    },
    statValue: {
      fontSize: 32,
      fontWeight: "bold",
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    sectionCard: {
      marginBottom: theme.spacing.md,
    },
    recentScanItem: {
      paddingVertical: theme.spacing.xs,
    },
    tagId: {
      fontWeight: "bold",
      color: theme.colors.primary,
    },
    timestamp: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    metadataChips: {
      flexDirection: "row",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
      flexWrap: "wrap",
    },
    emptyText: {
      textAlign: "center",
      color: theme.colors.textSecondary,
      padding: theme.spacing.lg,
    },
    actionButtons: {
      gap: theme.spacing.sm,
    },
    actionButton: {
      marginBottom: theme.spacing.sm,
    },
    bleStatus: {
      marginBottom: theme.spacing.md,
    },
    fab: {
      position: "absolute",
      margin: theme.spacing.md,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.primary,
    },

    modalContainer: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing.lg,
      margin: theme.spacing.lg,
      borderRadius: 8,
      maxHeight: "100%",
    },
    deviceItem: {
      paddingVertical: theme.spacing.sm,
    },
    emptyDeviceList: {
      textAlign: "center",
      padding: theme.spacing.xl,
      color: theme.colors.textSecondary,
    },
    scanningIndicator: {
      marginVertical: theme.spacing.md,
    },
    connectedChip: {
      marginTop: theme.spacing.sm,
    },
  });

  /**
   * Calculate today's scans
   */
  const todayScans = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return scans.filter((scan) => {
      const scanDate = new Date(scan.timestamp);
      scanDate.setHours(0, 0, 0, 0);
      return scanDate.getTime() === today.getTime();
    }).length;
  }, [scans]);

  /**
   * Get recent scans (last 5)
   */
  const recentScans = useMemo(() => scans.slice(0, 5), [scans]);

  /**
   * Format date for display
   */
  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  /**
   * Open BLE scanner modal
   */
  const handleOpenBleScanner = () => {
    setBleModalVisible(true);
    startScan();
  };

  /**
   * Close BLE modal
   */
  const handleCloseBleModal = () => {
    stopScan();
    setBleModalVisible(false);
  };

  /**
   * Handle disconnect
   */
  const handleDisconnect = async () => {
    await disconnect();
  };

  /**
   * Render BLE Status Card
   */
  const renderBleStatusCard = () => {
    // Not connected
    if (!isConnected) {
      return (
        <Card style={styles.bleStatus}>
          <Card.Content style={{ alignItems: "center" }}>
            <List.Item
              title="Bluetooth Status"
              description="Not connected"
              descriptionStyle={{ color: "red" }}
              left={(props) => <List.Icon {...props} icon="bluetooth-off" />}
            />
          </Card.Content>
        </Card>
      );
    }

    // Connected
    return (
      <Card style={styles.bleStatus}>
        <Card.Content style={{ alignItems: "center" }}>
          <View style={{ alignItems: "center", width: "100%" }}>
            <List.Icon icon="bluetooth-connect" color="#673AB7" />
            <Text
              variant="titleMedium"
              style={{
                color: "#673AB7",
                marginTop: theme.spacing.sm,
                fontWeight: "600",
              }}
            >
              Connected to {connectedDevice?.name || "Device"}
            </Text>
          </View>
          <Button
            mode="outlined"
            onPress={handleDisconnect}
            icon="bluetooth-off"
            style={{
              marginTop: theme.spacing.md,
              borderColor: theme.colors.error,
              width: "100%",
            }}
            textColor={theme.colors.error}
          >
            Disconnect
          </Button>
        </Card.Content>
      </Card>
    );
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.scrollContent}>
          {/* Welcome Card */}
          <Card style={styles.welcomeCard}>
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeText}>
                {settings.defaultOperator
                  ? `Welcome, ${settings.defaultOperator}!`
                  : "Welcome to Tagster!"}
              </Text>
              <Text style={styles.welcomeSubtext}>
                {scans.length === 0
                  ? "Start scanning to track your tags"
                  : `You have ${scans.length} scan${
                      scans.length !== 1 ? "s" : ""
                    } logged`}
              </Text>
            </View>
          </Card>

          {/* BLE Status Card - NOW FUNCTIONAL! */}
          {renderBleStatusCard()}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Card.Content>
                <Text style={styles.statValue}>{scans.length}</Text>
                <Text style={styles.statLabel}>Total Scans</Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content>
                <Text style={styles.statValue}>{todayScans}</Text>
                <Text style={styles.statLabel}>Today</Text>
              </Card.Content>
            </Card>
          </View>

          {/* Recent Scans */}
          <Card style={styles.sectionCard}>
            <Card.Title
              title="Recent Scans"
              right={(props) =>
                scans.length > 0 ? (
                  <Button
                    {...props}
                    onPress={() => navigation.navigate("Logbook")}
                  >
                    View All
                  </Button>
                ) : null
              }
            />
            <Card.Content>
              {recentScans.length === 0 ? (
                <Text style={styles.emptyText}>
                  No scans yet. Tap "Start Scanning" below to get started!
                </Text>
              ) : (
                <>
                  {recentScans.map((scan, index) => (
                    <React.Fragment key={scan.id}>
                      <View style={styles.recentScanItem}>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text style={styles.tagId}>{scan.tagId}</Text>
                          <Text style={styles.timestamp}>
                            {formatTime(scan.timestamp)}
                          </Text>
                        </View>
                      </View>
                      {index < recentScans.length - 1 && (
                        <Divider style={{ marginVertical: theme.spacing.sm }} />
                      )}
                    </React.Fragment>
                  ))}
                </>
              )}
            </Card.Content>
          </Card>
        </View>
      </ScrollView>

      {/* Floating Action Button - Dynamic based on connection */}
      <ConnectReaderFAB
        onPress={() => {
          if (isConnected) {
            navigation.navigate("Scan");
          } else {
            setBleModalVisible(true);
          }
        }}
      />

      {/* BLE Scanner Modal */}
      <BLEDeviceModal
        visible={bleModalVisible}
        onDismiss={handleCloseBleModal}
      />
    </>
  );
};

export default HomeScreen;
