import React, { useState } from "react";
import { View, StyleSheet, FlatList, Alert } from "react-native";
import {
  Text,
  Searchbar,
  Card,
  IconButton,
  Chip,
  FAB,
  Portal,
  Dialog,
  Button,
  Divider,
  useTheme,
} from "react-native-paper";
import type { AppTheme } from "../styles/theme";
import { useScans } from "../context/ScanContext";
import { TagScan } from "../models/types";
import { ExportDataFAB } from "../components/ExportDataFAB";

const LogbookScreen: React.FC = () => {
  const theme = useTheme<AppTheme>();
  const { scans, deleteScan, exportToCSV } = useScans();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Dialog states
  const [detailDialogVisible, setDetailDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedScan, setSelectedScan] = useState<TagScan | null>(null);

  // Create styles using theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    searchContainer: {
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: theme.spacing.xl,
    },
    emptyText: {
      textAlign: "center",
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    listContent: {
      padding: theme.spacing.md,
      paddingTop: theme.spacing.sm,
    },
    scanCard: {
      marginBottom: theme.spacing.md,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    tagIdContainer: {
      flex: 1,
    },
    tagId: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.primary,
    },
    timestamp: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    actions: {
      flexDirection: "row",
    },
    metadataRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    metadataText: {
      marginTop: theme.spacing.sm,
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    detailRow: {
      marginBottom: theme.spacing.sm,
    },
    detailLabel: {
      fontWeight: "bold",
      color: theme.colors.textSecondary,
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
   * Filter scans based on search query
   */
  const filteredScans = scans.filter((scan) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      scan.tagId.toLowerCase().includes(query) ||
      scan.operator?.toLowerCase().includes(query) ||
      scan.species?.toLowerCase().includes(query) ||
      scan.site?.toLowerCase().includes(query)
    );
  });

  /**
   * Open scan details dialog
   */
  const handleViewDetails = (scan: TagScan) => {
    setSelectedScan(scan);
    setDetailDialogVisible(true);
  };

  /**
   * Open delete confirmation dialog
   */
  const handleDeletePress = (scan: TagScan) => {
    setSelectedScan(scan);
    setDeleteDialogVisible(true);
  };

  /**
   * Confirm and delete scan
   */
  const handleConfirmDelete = async () => {
    if (!selectedScan) return;

    try {
      await deleteScan(selectedScan.id);
      setDeleteDialogVisible(false);
      setSelectedScan(null);
      Alert.alert("Success", "Scan deleted successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to delete scan");
    }
  };
  /**
   * Handle CSV export
   */
  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportToCSV();
      // Success - share dialog will appear automatically
    } catch (err: any) {
      Alert.alert(
        "Export Failed",
        err.message || "Could not export scans. Please try again."
      );
    } finally {
      setIsExporting(false);
    }
  };
  /**
   * Format date for display
   */
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Render individual scan card
   */
  const renderScanCard = ({ item }: { item: TagScan }) => (
    <Card style={styles.scanCard} onPress={() => handleViewDetails(item)}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.tagIdContainer}>
            <Text style={styles.tagId}>{item.tagId}</Text>
            <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
          </View>
          <View style={styles.actions}>
            <IconButton
              icon="eye"
              size={20}
              onPress={() => handleViewDetails(item)}
            />
            <IconButton
              icon="delete"
              size={20}
              iconColor={theme.colors.error}
              onPress={() => handleDeletePress(item)}
            />
          </View>
        </View>

        {(item.operator || item.species || item.site) && (
          <Text style={styles.metadataText}>
            {[
              item.species && `🐟 ${item.species}`,
              item.site && `📍 ${item.site}`,
            ]
              .filter(Boolean)
              .join("  •  ")}
          </Text>
        )}

        {item.notes && (
          <Text
            numberOfLines={2}
            style={{
              marginTop: theme.spacing.sm,
              color: theme.colors.textSecondary,
            }}
          >
            {item.notes}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  /**
   * Empty state
   */
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text variant="headlineMedium" style={styles.emptyText}>
        📋 No Scans Yet
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        Start scanning tags to see them here!
      </Text>
    </View>
  );

  /**
   * No search results
   */
  const renderNoResults = () => (
    <View style={styles.emptyContainer}>
      <Text variant="headlineMedium" style={styles.emptyText}>
        🔍 No Results
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        No scans match "{searchQuery}"
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search"
          onChangeText={setSearchQuery}
          value={searchQuery}
        />
      </View>

      {/* Scan List */}
      {scans.length === 0 ? (
        renderEmpty()
      ) : filteredScans.length === 0 ? (
        renderNoResults()
      ) : (
        <FlatList
          data={filteredScans}
          renderItem={renderScanCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Details Dialog */}
      <Portal>
        <Dialog
          visible={detailDialogVisible}
          onDismiss={() => setDetailDialogVisible(false)}
        >
          <Dialog.Title>Scan Details</Dialog.Title>
          <Dialog.ScrollArea>
            <Divider />
            {selectedScan && (
              <View style={{ padding: theme.spacing.md }}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tag ID</Text>
                  <Text variant="bodyLarge">{selectedScan.tagId}</Text>
                </View>

                {selectedScan.operator && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Operator</Text>
                    <Text>{selectedScan.operator}</Text>
                  </View>
                )}

                {selectedScan.species && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Species</Text>
                    <Text>{selectedScan.species}</Text>
                  </View>
                )}

                {selectedScan.site && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Site</Text>
                    <Text>{selectedScan.site}</Text>
                  </View>
                )}

                {selectedScan.notes && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Notes</Text>
                    <Text>{selectedScan.notes}</Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Scanned At</Text>
                  <Text>{formatDate(selectedScan.timestamp)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Last Updated</Text>
                  <Text>{formatDate(selectedScan.updatedAt)}</Text>
                </View>
              </View>
            )}
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDetailDialogVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Delete Scan?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete this scan?
            </Text>
            {selectedScan && (
              <Text
                variant="bodyMedium"
                style={{ marginTop: theme.spacing.sm, fontWeight: "bold" }}
              >
                Tag ID: {selectedScan.tagId}
              </Text>
            )}
            <Text
              variant="bodySmall"
              style={{ marginTop: theme.spacing.sm, color: theme.colors.error }}
            >
              This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>
              Cancel
            </Button>
            <Button
              onPress={handleConfirmDelete}
              textColor={theme.colors.error}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Export FAB */}
      {scans.length > 0 && (
        <ExportDataFAB
          onPress={handleExport}
          disabled={isExporting}
          isExporting={isExporting}
        />
      )}
    </View>
  );
};

export default LogbookScreen;
