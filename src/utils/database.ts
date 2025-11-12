import * as SQLite from "expo-sqlite";
import { TagScan } from "../models/types";
import "react-native-get-random-values"; // Required for uuid
import { v4 as uuidv4 } from "uuid";

/*** Database name - stored on device*/
const DB_NAME = "tagster_data.db";

/*** Open/create the database This creates the database file if it doesn't exist*/
const db = SQLite.openDatabaseSync(DB_NAME);

/**
 * Initialize the database schema
 * Creates the tag_scans table if it doesn't exist
 * This runs automatically when the app starts
 */
export const initDatabase = (): void => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS tag_scans (
        id TEXT PRIMARY KEY NOT NULL,
        tagId TEXT NOT NULL,
        tagFormat TEXT,
        timestamp TEXT NOT NULL,
        operator TEXT,
        species TEXT,
        site TEXT,
        latitude REAL,
        longitude REAL,
        notes TEXT,
        duplicatedFrom TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);

    console.log("[Database] Initialized successfully");
  } catch (error) {
    console.error("[Database] Initialization failed:", error);
    throw error;
  }
};

/**
 * Create a new tag scan record
 * Automatically generates: id, timestamp, createdAt, updatedAt
 *
 * @param scan - Partial scan data (no need to provide id or timestamps)
 * @returns The complete TagScan object that was saved
 */
export const createScan = (
  scan: Omit<TagScan, "id" | "timestamp" | "createdAt" | "updatedAt">
): TagScan => {
  try {
    // Generate unique ID and timestamps
    const id = uuidv4();
    const now = new Date().toISOString();

    // Build the complete scan object
    const newScan: TagScan = {
      id,
      timestamp: now,
      createdAt: now,
      updatedAt: now,
      ...scan, // Spread operator: adds all fields from the input scan
    };

    // Insert into database
    db.runSync(
      `INSERT INTO tag_scans (
        id, tagId, tagFormat, timestamp, operator, species, site,
        latitude, longitude, notes, duplicatedFrom, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newScan.id,
        newScan.tagId,
        newScan.tagFormat || null,
        newScan.timestamp,
        newScan.operator || null,
        newScan.species || null,
        newScan.site || null,
        newScan.latitude || null,
        newScan.longitude || null,
        newScan.notes || null,
        newScan.duplicatedFrom || null,
        newScan.createdAt,
        newScan.updatedAt,
      ]
    );

    console.log("[Database] Created scan:", newScan.id);
    return newScan;
  } catch (error) {
    console.error("[Database] Failed to create scan:", error);
    throw error;
  }
};

/**
 * Get all tag scans from the database
 * Returns most recent scans first (sorted by timestamp DESC)
 *
 * @returns Array of all TagScan records
 */
export const getAllScans = (): TagScan[] => {
  try {
    const result = db.getAllSync<TagScan>(
      "SELECT * FROM tag_scans ORDER BY timestamp DESC"
    );

    console.log(`[Database] Retrieved ${result.length} scans`);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get all scans:", error);
    throw error;
  }
};

/**
 * Get a single scan by its ID
 *
 * @param id - UUID of the scan to retrieve
 * @returns TagScan object or null if not found
 */
export const getScanById = (id: string): TagScan | null => {
  try {
    const result = db.getFirstSync<TagScan>(
      "SELECT * FROM tag_scans WHERE id = ?",
      [id]
    );

    return result || null;
  } catch (error) {
    console.error("[Database] Failed to get scan by ID:", error);
    throw error;
  }
};

/**
 * Search scans by tag ID (partial match)
 * Useful for the search feature in the logbook
 *
 * @param searchTerm - Partial tag ID to search for
 * @returns Array of matching TagScan records
 */
export const searchScansByTagId = (searchTerm: string): TagScan[] => {
  try {
    const result = db.getAllSync<TagScan>(
      "SELECT * FROM tag_scans WHERE tagId LIKE ? ORDER BY timestamp DESC",
      [`%${searchTerm}%`]
    );

    console.log(
      `[Database] Found ${result.length} scans matching "${searchTerm}"`
    );
    return result;
  } catch (error) {
    console.error("[Database] Failed to search scans:", error);
    throw error;
  }
};

/**
 * Update an existing scan
 * Note: createdAt is NEVER changed, only updatedAt
 *
 * @param id - UUID of the scan to update
 * @param updates - Partial TagScan with fields to update
 * @returns Updated TagScan object or null if not found
 */
export const updateScan = (
  id: string,
  updates: Partial<Omit<TagScan, "id" | "createdAt">>
): TagScan | null => {
  try {
    // First, check if the scan exists
    const existingScan = getScanById(id);
    if (!existingScan) {
      console.warn(`[Database] Scan ${id} not found for update`);
      return null;
    }

    // Update the updatedAt timestamp
    const now = new Date().toISOString();

    // Merge existing scan with updates
    const updatedScan: TagScan = {
      ...existingScan, // Keep all existing data
      ...updates, // Override with new data
      id, // Ensure ID never changes
      createdAt: existingScan.createdAt, // ← PRESERVE original createdAt!
      updatedAt: now, // ← UPDATE to current time
    };

    // Update in database
    db.runSync(
      `UPDATE tag_scans SET
        tagId = ?,
        tagFormat = ?,
        timestamp = ?,
        operator = ?,
        species = ?,
        site = ?,
        latitude = ?,
        longitude = ?,
        notes = ?,
        duplicatedFrom = ?,
        updatedAt = ?
      WHERE id = ?`,
      [
        updatedScan.tagId,
        updatedScan.tagFormat || null,
        updatedScan.timestamp,
        updatedScan.operator || null,
        updatedScan.species || null,
        updatedScan.site || null,
        updatedScan.latitude || null,
        updatedScan.longitude || null,
        updatedScan.notes || null,
        updatedScan.duplicatedFrom || null,
        updatedScan.updatedAt,
        id, // WHERE clause
      ]
    );

    console.log("[Database] Updated scan:", id);
    return updatedScan;
  } catch (error) {
    console.error("[Database] Failed to update scan:", error);
    throw error;
  }
};

/**
 * Delete a single scan by ID
 *
 * @param id - UUID of the scan to delete
 * @returns true if deleted, false if not found
 */
export const deleteScan = (id: string): boolean => {
  try {
    const result = db.runSync("DELETE FROM tag_scans WHERE id = ?", [id]);

    if (result.changes > 0) {
      console.log("[Database] Deleted scan:", id);
      return true;
    } else {
      console.warn("[Database] Scan not found for deletion:", id);
      return false;
    }
  } catch (error) {
    console.error("[Database] Failed to delete scan:", error);
    throw error;
  }
};

/**
 * Delete multiple scans by their IDs
 * Useful for bulk delete operations in the logbook
 *
 * @param ids - Array of UUIDs to delete
 * @returns Number of scans actually deleted
 */
export const deleteScansBulk = (ids: string[]): number => {
  try {
    if (ids.length === 0) {
      return 0;
    }

    // Create placeholders: [?, ?, ?] for each ID
    const placeholders = ids.map(() => "?").join(",");

    const result = db.runSync(
      `DELETE FROM tag_scans WHERE id IN (${placeholders})`,
      ids
    );

    console.log(`[Database] Deleted ${result.changes} scans`);
    return result.changes;
  } catch (error) {
    console.error("[Database] Failed to bulk delete scans:", error);
    throw error;
  }
};

/**
 * Delete ALL scans from the database
 * ⚠️ DANGEROUS - Use only with user confirmation!
 * Typically called from Settings > Clear All Data
 *
 * @returns Number of scans deleted
 */
export const deleteAllScans = (): number => {
  try {
    const result = db.runSync("DELETE FROM tag_scans");

    console.log(`[Database] Deleted all scans (${result.changes} total)`);
    return result.changes;
  } catch (error) {
    console.error("[Database] Failed to delete all scans:", error);
    throw error;
  }
};

/**
 * Get database statistics
 * Useful for displaying in Settings screen
 *
 * @returns Object with count and size info
 */
export const getDatabaseStats = (): {
  totalScans: number;
  oldestScan: string | null;
  newestScan: string | null;
} => {
  try {
    // Get total count
    const countResult = db.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) as count FROM tag_scans"
    );

    // Get oldest scan timestamp
    const oldestResult = db.getFirstSync<{ timestamp: string }>(
      "SELECT timestamp FROM tag_scans ORDER BY timestamp ASC LIMIT 1"
    );

    // Get newest scan timestamp
    const newestResult = db.getFirstSync<{ timestamp: string }>(
      "SELECT timestamp FROM tag_scans ORDER BY timestamp DESC LIMIT 1"
    );

    return {
      totalScans: countResult?.count || 0,
      oldestScan: oldestResult?.timestamp || null,
      newestScan: newestResult?.timestamp || null,
    };
  } catch (error) {
    console.error("[Database] Failed to get stats:", error);
    throw error;
  }
};
