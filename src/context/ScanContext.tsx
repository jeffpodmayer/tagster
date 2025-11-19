import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { TagScan } from "../models/types";
import * as Database from "../utils/database";
import { Paths, File } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { generateCSV } from "../utils/csvExport";

/**
 * Shape of the ScanContext
 * This defines what's available to components that use useScans()
 */
interface ScanContextType {
  scans: TagScan[]; // All scans in memory
  isLoading: boolean; // Loading state
  error: string | null; // Error message if something fails

  // Functions to modify scans
  addScan: (
    scan: Omit<TagScan, "id" | "timestamp" | "createdAt" | "updatedAt">
  ) => Promise<TagScan>;
  updateScan: (
    id: string,
    updates: Partial<Omit<TagScan, "id" | "createdAt">>
  ) => Promise<TagScan | null>;
  deleteScan: (id: string) => Promise<boolean>;
  deleteScansBulk: (ids: string[]) => Promise<number>;
  deleteAllScans: () => Promise<number>;
  searchScans: (searchTerm: string) => TagScan[];
  refreshScans: () => Promise<void>; // Reload from database
  exportToCSV: () => Promise<void>; // Export scans to CSV file
}

/**
 * Create the context with undefined default
 * We'll provide the real value in the Provider
 */
const ScanContext = createContext<ScanContextType | undefined>(undefined);

/**
 * Props for the ScanProvider component
 */
interface ScanProviderProps {
  children: ReactNode; // Child components that can use this context
}

/**
 * ScanProvider Component
 * Wraps your app and provides scan data/functions to all child components
 */
export const ScanProvider: React.FC<ScanProviderProps> = ({ children }) => {
  // State management
  const [scans, setScans] = useState<TagScan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all scans from database when component mounts
   * This runs once when the app starts
   */
  useEffect(() => {
    loadScans();
  }, []);

  /**
   * Load scans from database
   */
  const loadScans = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const allScans = Database.getAllScans();
      setScans(allScans);
    } catch (err) {
      console.error("[ScanContext] Failed to load scans:", err);
      setError("Failed to load scans");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Add a new scan
   */
  const addScan = async (
    scan: Omit<TagScan, "id" | "timestamp" | "createdAt" | "updatedAt">
  ): Promise<TagScan> => {
    try {
      setError(null);
      const newScan = Database.createScan(scan);

      // Add to state immediately (optimistic update)
      setScans((prevScans) => [newScan, ...prevScans]);

      return newScan;
    } catch (err) {
      console.error("[ScanContext] Failed to add scan:", err);
      setError("Failed to add scan");
      throw err;
    }
  };

  /**
   * Update an existing scan
   */
  const updateScan = async (
    id: string,
    updates: Partial<Omit<TagScan, "id" | "createdAt">>
  ): Promise<TagScan | null> => {
    try {
      setError(null);
      const updatedScan = Database.updateScan(id, updates);

      if (updatedScan) {
        // Update in state
        setScans((prevScans) =>
          prevScans.map((scan) => (scan.id === id ? updatedScan : scan))
        );
      }

      return updatedScan;
    } catch (err) {
      console.error("[ScanContext] Failed to update scan:", err);
      setError("Failed to update scan");
      throw err;
    }
  };

  /**
   * Delete a single scan
   */
  const deleteScan = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const success = Database.deleteScan(id);

      if (success) {
        // Remove from state
        setScans((prevScans) => prevScans.filter((scan) => scan.id !== id));
      }

      return success;
    } catch (err) {
      console.error("[ScanContext] Failed to delete scan:", err);
      setError("Failed to delete scan");
      throw err;
    }
  };

  /**
   * Delete multiple scans at once
   */
  const deleteScansBulk = async (ids: string[]): Promise<number> => {
    try {
      setError(null);
      const deletedCount = Database.deleteScansBulk(ids);

      // Remove from state
      setScans((prevScans) =>
        prevScans.filter((scan) => !ids.includes(scan.id))
      );

      return deletedCount;
    } catch (err) {
      console.error("[ScanContext] Failed to bulk delete scans:", err);
      setError("Failed to delete scans");
      throw err;
    }
  };

  /**
   * Delete all scans (use with caution!)
   */
  const deleteAllScans = async (): Promise<number> => {
    try {
      setError(null);
      const deletedCount = Database.deleteAllScans();

      // Clear state
      setScans([]);

      return deletedCount;
    } catch (err) {
      console.error("[ScanContext] Failed to delete all scans:", err);
      setError("Failed to delete all scans");
      throw err;
    }
  };

  /**
   * Search scans by tag ID
   * Note: This searches in-memory, not database
   */
  const searchScans = (searchTerm: string): TagScan[] => {
    if (!searchTerm.trim()) {
      return scans;
    }

    return scans.filter((scan) =>
      scan.tagId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  /**
   * Refresh scans from database
   */
  const refreshScans = async (): Promise<void> => {
    await loadScans();
  };

  /**
   * Export scans to CSV and share
   */
  const exportToCSV = async (): Promise<void> => {
    try {
      // Check if there are scans to export
      if (scans.length === 0) {
        throw new Error("No scans to export");
      }

      // Generate CSV content
      const csvContent = generateCSV(scans);

      // Create file path with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `tagster_scans_${timestamp}.csv`;
      // Create file in document directory
      const file = new File(Paths.document, fileName);

      // Write CSV to file
      file.write(csvContent);

      // Share the file
      await Sharing.shareAsync(file.uri, {
        mimeType: "text/csv",
        dialogTitle: "Export Scans",
        UTI: "public.comma-separated-values-text",
      });
    } catch (err: any) {
      console.error("[ScanContext] Export failed:", err);
      throw new Error(err.message || "Failed to export scans");
    }
  };

  // Context value that will be provided to children
  const value: ScanContextType = {
    scans,
    isLoading,
    error,
    addScan,
    updateScan,
    deleteScan,
    deleteScansBulk,
    deleteAllScans,
    searchScans,
    refreshScans,
    exportToCSV,
  };

  return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>;
};

/**
 * Custom hook to use ScanContext
 * Usage: const { scans, addScan, deleteScan } = useScans();
 *
 * @throws Error if used outside ScanProvider
 */
export const useScans = (): ScanContextType => {
  const context = useContext(ScanContext);

  if (!context) {
    throw new Error("useScans must be used within a ScanProvider");
  }

  return context;
};
