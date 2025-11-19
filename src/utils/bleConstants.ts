/**
 * BLE Constants & Configuration
 *
 * ===========================================================================
 * WHY THIS FILE EXISTS:
 * ===========================================================================
 *
 * BLE code has many "magic numbers" and repeated values:
 * - Service UUIDs to ignore (battery, device info)
 * - Timing values (scan timeout, polling interval)
 * - Validation rules (min/max tag length, valid characters)
 * - Repeated validation logic (checking for empty hex, valid length)
 *
 * Without centralization, these values get:
 * - Duplicated across multiple files
 * - Hardcoded with different values in different places
 * - Difficult to change (have to hunt through all files)
 * - Prone to inconsistencies and bugs
 *
 * ===========================================================================
 * WHAT THIS FILE DOES:
 * ===========================================================================
 *
 * Provides a single source of truth for:
 * 1. Standard BLE service UUIDs to ignore (IGNORED_SERVICE_UUIDS)
 * 2. Timing configuration (SCAN_CONFIG)
 * 3. Tag validation rules (TAG_VALIDATION)
 * 4. Reusable validation helper functions:
 *    - isEmptyHex() - Check if hex string is all zeros
 *    - isValidTagLength() - Check if hex is within valid range
 *    - looksLikeTagText() - Check if ASCII string looks like a tag ID
 *
 * Want to change max tag length? Change it once here, works everywhere.
 *
 * ===========================================================================
 */

/**
 * Standard BLE service UUIDs to ignore during scanning
 * These are generic services that don't contain PIT tag data
 */
export const IGNORED_SERVICE_UUIDS = [
  "0000180a-0000-1000-8000-00805f9b34fb", // Device Information Service
  "0000180f-0000-1000-8000-00805f9b34fb", // Battery Service
];

/**
 * Scanning configuration
 */
export const SCAN_CONFIG = {
  AUTO_STOP_TIMEOUT: 10000, // Stop scanning after 10 seconds
  READ_INTERVAL: 2000, // Periodic read interval (2 seconds)
  WRITE_COMMAND_DELAY: 100, // Delay after write command (100ms)
};

/**
 * Tag ID validation rules
 */
export const TAG_VALIDATION = {
  MIN_HEX_LENGTH: 4, // Minimum hex string length for valid tag
  MAX_HEX_LENGTH: 32, // Maximum hex string length for valid tag
  MAX_ASCII_LENGTH: 20, // Maximum ASCII text length for valid tag
  ASCII_PATTERN: /^[a-zA-Z0-9\s-]+$/, // Valid ASCII characters for tag ID
};

/**
 * Common write commands to try when requesting tag data
 * These are sent to writable characteristics to trigger data updates
 */
export const WRITE_COMMANDS = {
  START_REQUEST: [0x01], // Generic "start" or "request" byte
  READ_COMMAND: "READ", // ASCII "READ" command
};

/**
 * Check if a hex string is empty or all zeros
 */
export const isEmptyHex = (hexString: string): boolean => {
  return hexString === "00" || /^0+$/.test(hexString);
};

/**
 * Check if a hex string is within valid tag ID length range
 */
export const isValidTagLength = (hexString: string): boolean => {
  return (
    hexString.length >= TAG_VALIDATION.MIN_HEX_LENGTH &&
    hexString.length <= TAG_VALIDATION.MAX_HEX_LENGTH
  );
};

/**
 * Check if ASCII string looks like valid tag text
 */
export const looksLikeTagText = (asciiString: string): boolean => {
  const trimmed = asciiString.trim();
  return (
    trimmed.length > 0 &&
    trimmed.length < TAG_VALIDATION.MAX_ASCII_LENGTH &&
    TAG_VALIDATION.ASCII_PATTERN.test(trimmed)
  );
};
