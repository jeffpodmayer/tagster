import { Alert } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";

/**
 * BLE Connection Utility
 *
 * ===========================================================================
 * WHY THIS FILE EXISTS:
 * ===========================================================================
 *
 * Connecting to and disconnecting from BLE devices involves:
 * - Stopping any active scans first
 * - Establishing the connection
 * - Discovering services and characteristics (required before reading data)
 * - Handling connection failures gracefully
 * - Cleaning up on disconnect (even if disconnect fails)
 *
 * This logic was embedded in the Context, making it hard to:
 * - Test connection logic independently
 * - Reuse connection logic
 * - Debug connection issues
 *
 * ===========================================================================
 * WHAT THIS FILE DOES:
 * ===========================================================================
 *
 * Provides two functions:
 *
 * 1. connectToBLEDevice() - Connect to a BLE device by ID
 *    - Stops scanning first (can't scan and connect simultaneously)
 *    - Connects to the device
 *    - Discovers all services and characteristics
 *    - Calls onConnected() callback with the device object
 *    - Shows user-friendly error alerts on failure
 *
 * 2. disconnectFromBLEDevice() - Disconnect from a device
 *    - Cancels the device connection
 *    - Handles "not connected" errors gracefully
 *    - Always calls onDisconnected() callback (even if disconnect fails)
 *    - Shows confirmation alert to user
 *
 * Uses callbacks to communicate with React Context (keeps it pure).
 *
 * ===========================================================================
 */

/**
 * Connect to a BLE device
 *
 * @param bleManager - The BLE manager instance
 * @param deviceId - The device ID to connect to
 * @param onStopScan - Callback to stop scanning before connecting
 * @param onConnected - Callback when successfully connected (receives the device)
 * @param onError - Callback for errors
 * @returns Promise<void>
 */
export const connectToBLEDevice = async (
  bleManager: BleManager,
  deviceId: string,
  onStopScan: () => void,
  onConnected: (device: Device) => void,
  onError: (error: string) => void
): Promise<void> => {
  try {
    console.log("[BLE Connection] Connecting to device:", deviceId);

    // Step 1: Stop scanning before connecting
    onStopScan();

    // Step 2: Establish connection
    const device = await bleManager.connectToDevice(deviceId);
    console.log("[BLE Connection] Connected, discovering services...");

    // Step 3: Discover services and characteristics
    await device.discoverAllServicesAndCharacteristics();
    console.log("[BLE Connection] Services discovered");

    // Step 4: Notify success
    onConnected(device);

    console.log(
      "[BLE Connection] Successfully connected:",
      device.name || device.id
    );
  } catch (err: any) {
    console.error("[BLE Connection] Connection failed:", err);
    onError(`Connection failed: ${err.message}`);
    Alert.alert(
      "Connection Failed",
      "Unable to connect to device. Make sure it's powered on and nearby."
    );
  }
};

/**
 * Disconnect from a BLE device
 *
 * @param bleManager - The BLE manager instance
 * @param device - The device to disconnect from (null = no device connected)
 * @param onDisconnected - Callback when disconnected (for state cleanup)
 * @returns Promise<void>
 */
export const disconnectFromBLEDevice = async (
  bleManager: BleManager,
  device: Device | null,
  onDisconnected: () => void
): Promise<void> => {
  try {
    if (device) {
      console.log(
        "[BLE Connection] Disconnecting from:",
        device.name || device.id
      );
      await bleManager.cancelDeviceConnection(device.id);
      console.log("[BLE Connection] Successfully disconnected");
    }
  } catch (err: any) {
    // "Operation was cancelled" means device wasn't actually connected
    // This is fine - we still want to clean up UI state
    if (err.message?.includes("cancelled")) {
      console.log(
        "[BLE Connection] Device was not connected (cleaned up state anyway)"
      );
    } else {
      console.error("[BLE Connection] Unexpected disconnect error:", err);
    }
  } finally {
    // Always clean up, even if disconnect fails
    onDisconnected();
    console.log("[BLE Connection] Disconnected (state cleared)");

    // Show user feedback
    Alert.alert("Disconnected", "Device disconnected");
  }
};
