import { Alert } from "react-native";
import { BleManager, Device, State } from "react-native-ble-plx";
import { requestBLEPermissions } from "./blePermissions";
import { SCAN_CONFIG } from "./bleConstants";

/**
 * BLE Scanner Utility
 *
 * ===========================================================================
 * WHY THIS FILE EXISTS:
 * ===========================================================================
 *
 * BLE scanning involves multiple steps that can fail:
 * 1. Check if Bluetooth is turned on
 * 2. Request platform-specific permissions (Android vs iOS)
 * 3. Start the actual scan
 * 4. Handle discovered devices
 * 5. Handle errors
 * 6. Auto-stop after timeout (to save battery)
 *
 * This complexity was cluttering the React Context with business logic.
 * By extracting it to a utility, we:
 * - Keep the Context focused on state management
 * - Make scanning logic testable without React
 * - Reuse scanning logic if needed elsewhere
 *
 * ===========================================================================
 * WHAT THIS FILE DOES:
 * ===========================================================================
 *
 * Provides two functions:
 *
 * 1. startBLEScan() - Starts scanning for nearby BLE devices
 *    - Checks Bluetooth state
 *    - Requests permissions
 *    - Calls callbacks for discovered devices and state changes
 *    - Auto-stops after configured timeout (saves battery)
 *
 * 2. stopBLEScan() - Stops scanning immediately
 *    - Cleans up scan state
 *
 * Uses callbacks to communicate with React Context (keeps it pure).
 *
 * ===========================================================================
 */

/**
 * Start scanning for BLE devices
 *
 * @param bleManager - The BLE manager instance
 * @param bluetoothState - Current Bluetooth state
 * @param onDeviceDiscovered - Callback when a device is found
 * @param onScanStateChange - Callback to update scanning state (true = scanning, false = stopped)
 * @param onError - Callback for errors
 * @param serviceUUIDs - Optional array of service UUIDs to filter (null = scan all)
 * @returns Promise<void>
 */
export const startBLEScan = async (
  bleManager: BleManager,
  bluetoothState: State,
  onDeviceDiscovered: (device: Device) => void,
  onScanStateChange: (isScanning: boolean) => void,
  onError: (error: string) => void,
  serviceUUIDs: string[] | null = null
): Promise<void> => {
  try {
    console.log("[BLE Scanner] Starting scan process...");

    // Step 1: Check if Bluetooth is on
    if (bluetoothState !== State.PoweredOn) {
      const errorMsg = "Bluetooth is off. Please turn on Bluetooth.";
      onError(errorMsg);
      Alert.alert("Bluetooth Off", errorMsg);
      console.log("[BLE Scanner] Cannot scan - Bluetooth is off");
      return;
    }

    // Step 2: Request permissions
    const hasPermission = await requestBLEPermissions();
    if (!hasPermission) {
      const errorMsg = "Bluetooth permissions denied";
      onError(errorMsg);
      Alert.alert(
        "Permissions Required",
        "Please grant Bluetooth permissions in Settings."
      );
      console.log("[BLE Scanner] Cannot scan - permissions denied");
      return;
    }

    // Step 3: Start scanning
    onScanStateChange(true);
    console.log("[BLE Scanner] Scanning for devices...");

    bleManager.startDeviceScan(
      serviceUUIDs, // null = all devices, or pass specific UUIDs to filter
      null, // Default scan options
      (error, device) => {
        // Handle scan errors
        if (error) {
          console.error("[BLE Scanner] Scan error:", error);
          onError(`Scan error: ${error.message}`);
          onScanStateChange(false);
          return;
        }

        // Handle discovered device
        if (device) {
          console.log("[BLE Scanner] Discovered device:", {
            id: device.id,
            name: device.name || "Unknown",
            rssi: device.rssi,
          });
          onDeviceDiscovered(device);
        }
      }
    );

    // Step 4: Auto-stop scanning after configured timeout (saves battery)
    setTimeout(() => {
      stopBLEScan(bleManager, onScanStateChange);
      console.log(
        `[BLE Scanner] Auto-stopped scan after ${SCAN_CONFIG.AUTO_STOP_TIMEOUT}ms`
      );
    }, SCAN_CONFIG.AUTO_STOP_TIMEOUT);
  } catch (err: any) {
    console.error("[BLE Scanner] Start scan failed:", err);
    onError("Failed to start scanning");
    onScanStateChange(false);
  }
};

/**
 * Stop scanning for BLE devices
 *
 * @param bleManager - The BLE manager instance
 * @param onScanStateChange - Callback to update scanning state
 */
export const stopBLEScan = (
  bleManager: BleManager,
  onScanStateChange: (isScanning: boolean) => void
): void => {
  bleManager.stopDeviceScan();
  onScanStateChange(false);
  console.log("[BLE Scanner] Stopped scanning");
};
