import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Card,
  Button,
  List,
  Divider,
  Chip,
  useTheme,
  FAB,
} from "react-native-paper";
import type { AppTheme } from "../styles/theme";
import { useScans } from "../context/ScanContext";
import { useAppSettings } from "../context/AppContext";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { RootTabParamList } from "../navigation/AppNavigator";

type NavigationProp = BottomTabNavigationProp<RootTabParamList, "Home">;

const HomeScreen: React.FC = () => {
  const theme = useTheme<AppTheme>();
  const navigation = useNavigation<NavigationProp>();
  const { scans } = useScans();
  const { settings } = useAppSettings();

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

          {/* BLE Status (Coming Soon) */}
          <Card style={styles.bleStatus}>
            <Card.Content>
              <List.Item
                title="BLE Reader Status"
                description="Manual entry mode (BLE coming soon)"
                left={(props) => <List.Icon {...props} icon="bluetooth-off" />}
              />
            </Card.Content>
          </Card>

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
                  No scans yet. Tap "New Scan" below to get started!
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

          {/* Quick Actions */}
          {/* <Card style={styles.sectionCard}>
            <Card.Title title="Quick Actions" />
            <Card.Content style={styles.actionButtons}>
              <Button
                mode="outlined"
                icon="format-list-bulleted"
                onPress={() => navigation.navigate("Logbook")}
                style={styles.actionButton}
              >
                View All Scans ({scans.length})
              </Button>

              <Button
                mode="outlined"
                icon="cog"
                onPress={() => navigation.navigate("Settings")}
                style={styles.actionButton}
              >
                Settings
              </Button>
            </Card.Content>
          </Card> */}
        </View>
      </ScrollView>

      {/* Floating Action Button for New Scan */}
      <FAB
        icon="plus"
        label="Start Scanning"
        style={styles.fab}
        color={theme.colors.surface}
        onPress={() => navigation.navigate("Scan")}
      />
    </>
  );
};

export default HomeScreen;
