import { Platform, PermissionsAndroid } from "react-native";

/**
 * BLE Permissions Handler
 *
 * ===========================================================================
 * WHY THIS FILE EXISTS:
 * ===========================================================================
 *
 * Bluetooth scanning requires different permissions on different platforms:
 *
 * - iOS: System automatically prompts user when BLE is first used
 *        → We don't need to request permissions explicitly
 *
 * - Android 11 and below: Requires FINE_LOCATION permission
 *        → BLE scanning uses Bluetooth beacons for location, so Android
 *          requires location permission (even though we're not using GPS)
 *
 * - Android 12+ (API 31+): Requires THREE permissions:
 *        1. BLUETOOTH_SCAN - To scan for nearby devices
 *        2. BLUETOOTH_CONNECT - To connect to discovered devices
 *        3. FINE_LOCATION - Still required for BLE scanning
 *
 * ===========================================================================
 * WHAT THIS FILE DOES:
 * ===========================================================================
 *
 * Provides `requestBLEPermissions()` function that:
 * 1. Detects the platform (iOS vs Android)
 * 2. Detects Android version (11 vs 12+)
 * 3. Requests the appropriate permissions
 * 4. Returns true if all permissions granted, false otherwise
 *
 * ===========================================================================
 */

/**
 * Request Bluetooth permissions
 *
 * @returns Promise<boolean> - true if all required permissions granted
 */
export const requestBLEPermissions = async (): Promise<boolean> => {
  // iOS doesn't need explicit permission requests
  // System prompts appear automatically when BLE is first used
  if (Platform.OS !== "android") {
    console.log("[BLE Permissions] iOS - using system prompts");
    return true;
  }

  try {
    console.log("[BLE Permissions] Requesting Android permissions...");

    // Android 12+ (API level 31+) has new Bluetooth permission model
    if (Platform.Version >= 31) {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, // Scan for devices
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT, // Connect to devices
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, // Required for BLE scanning
      ]);

      const allGranted =
        granted["android.permission.BLUETOOTH_SCAN"] === "granted" &&
        granted["android.permission.BLUETOOTH_CONNECT"] === "granted" &&
        granted["android.permission.ACCESS_FINE_LOCATION"] === "granted";

      console.log(
        "[BLE Permissions] Android 12+ permissions granted:",
        allGranted
      );
      return allGranted;
    } else {
      // Android 11 and below - only need location permission
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      const isGranted = granted === "granted";
      console.log(
        "[BLE Permissions] Android <12 location permission granted:",
        isGranted
      );
      return isGranted;
    }
  } catch (err) {
    console.error("[BLE Permissions] Request error:", err);
    return false;
  }
};

/**
 * Check if we have required BLE permissions (Android only)
 * Note: This is a basic check, actual runtime permission state may differ
 *
 * @returns Promise<boolean> - true if permissions likely granted
 */
export const checkBLEPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== "android") {
    return true;
  }

  try {
    if (Platform.Version >= 31) {
      const scanGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
      );
      const connectGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      );
      const locationGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      return scanGranted && connectGranted && locationGranted;
    } else {
      return await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
    }
  } catch (err) {
    console.error("[BLE Permissions] Check error:", err);
    return false;
  }
};
