// src/models/types.ts

import { State } from "react-native-ble-plx";

/**
 * PIT Tag format types based on ISO 11784/11785 and common variations
 */
export type TagFormat =
  | "ISO_DECIMAL_15" // 999123456789012 (15 digits)
  | "ISO_HEX_DOT" // 3E7.1CBE991A14 (13 chars with dot)
  | "125KHZ_9DIGIT" // 123456789 (9 digits)
  | "UNKNOWN"; // Any other format

/**
 * Main data model for a tag scan record
 */
export interface TagScan {
  id: string; // UUID (required)
  tagId: string; // Tag ID as received from reader (required)
  tagFormat?: TagFormat; // Detected format (optional)
  timestamp: string; // ISO 8601 format (required, auto-generated)
  operator?: string; // Person conducting scan (optional)
  species?: string; // Species name (optional)
  site?: string; // Location/site name (optional)
  latitude?: number; // GPS latitude (optional, future feature)
  longitude?: number; // GPS longitude (optional, future feature)
  notes?: string; // Free-form notes (optional)
  duplicatedFrom?: string; // UUID of original scan if duplicated (optional)
  createdAt: string; // ISO 8601 timestamp (required, auto-generated)
  updatedAt: string; // ISO 8601 timestamp (required, auto-updated)
}

/**
 * BLE device information
 */
export interface BLEDevice {
  id: string; // Device UUID
  name: string; // Device name
  rssi?: number; // Signal strength (optional)
}

/**
 * App settings/preferences
 */
export interface AppSettings {
  defaultOperator?: string; // Default operator name
  enableGPS: boolean; // GPS auto-capture enabled
  customSpecies: string[]; // User-customized species list
  customSites: string[]; // User-customized site list
}

/**
 * Metadata dropdown options
 */
export interface MetadataOptions {
  species: string[];
  sites: string[];
}

/**
 * BLE-specific types
 */

/**
 * Tag read result from BLE device
 */
export interface TagReadResult {
  tagId: string; // The actual tag ID
  uuid: string; // Characteristic UUID where it was read from
  isNew: boolean; // Whether this is a new/changed value
  timestamp: Date; // When it was read
}

/**
 * BLE characteristic with metadata
 */
export interface ReadableCharacteristic {
  characteristic: any; // The actual BLE characteristic object
  serviceUuid: string; // Parent service UUID
  charUuid: string; // Characteristic UUID
}

/**
 * BLE scan options
 */
export interface BLEScanOptions {
  serviceUUIDs?: string[]; // Filter by specific service UUIDs (null = all devices)
  autoStopTimeout?: number; // Auto-stop after N milliseconds
}

/**
 * BLE connection state
 */
export type BLEConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting";
