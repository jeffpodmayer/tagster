import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Platform, PermissionsAndroid, Alert } from "react-native";
import { BleManager, Device, State } from "react-native-ble-plx";

/**
 * BLE Context Interface
 *
 * This defines all the BLE functionality available to your components.
 * Think of it like ScanContext but for Bluetooth operations.
 */
interface BLEContextType {
  // ============ STATE ============
  isScanning: boolean; // Are we currently scanning for devices?
  isConnected: boolean; // Are we connected to a device?
  connectedDevice: Device | null; // The currently connected device (or null)
  discoveredDevices: Device[]; // List of all devices found during scanning
  bluetoothState: State; // Is Bluetooth on/off/unauthorized?
  error: string | null; // Any error messages

  // ============ ACTIONS ============
  startScan: () => Promise<void>; // Start scanning for BLE devices
  stopScan: () => void; // Stop scanning
  connectToDevice: (deviceId: string) => Promise<void>; // Connect to a specific device
  disconnect: () => Promise<void>; // Disconnect from current device
  readTag: () => Promise<string | null>; // Read tag ID (or battery for testing)
  requestPermissions: () => Promise<boolean>; // Request Bluetooth permissions
}

/**
 * Create the context
 */
const BLEContext = createContext<BLEContextType | undefined>(undefined);

/**
 * Provider Props
 */
interface BLEProviderProps {
  children: ReactNode;
}

/**
 * BLE Provider Component
 *
 * This component wraps your app and provides BLE functionality to all screens.
 * It manages the BLE state and provides functions to interact with Bluetooth devices.
 */
export const BLEProvider: React.FC<BLEProviderProps> = ({ children }) => {
  /**
   * Initialize the BLE Manager
   *
   * This is the main interface to the phone's Bluetooth hardware.
   * We create it once and reuse it throughout the app's lifecycle.
   */
  const [bleManager] = useState(() => new BleManager());

  // ============ STATE MANAGEMENT ============
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<Device[]>([]);
  const [bluetoothState, setBluetoothState] = useState<State>(State.Unknown);
  const [error, setError] = useState<string | null>(null);

  /**
   * Monitor Bluetooth State
   *
   * This effect runs when the component mounts and sets up a listener
   * for Bluetooth state changes (user turns BT on/off, permissions change, etc.)
   */
  useEffect(() => {
    console.log("[BLE] Setting up Bluetooth state listener");

    // Subscribe to state changes
    const subscription = bleManager.onStateChange((state) => {
      console.log("[BLE] Bluetooth state changed to:", state);
      setBluetoothState(state);

      // If Bluetooth turns off while connected, auto-disconnect
      if (state !== State.PoweredOn && isConnected) {
        console.log("[BLE] Bluetooth turned off, disconnecting...");
        disconnect();
      }
    }, true); // true = emit current state immediately

    // Cleanup function - runs when component unmounts
    return () => {
      console.log("[BLE] Cleaning up BLE Manager");
      subscription.remove();
      bleManager.destroy();
    };
  }, []);

  /**
   * Request Bluetooth Permissions
   *
   * Android requires explicit permission requests.
   * iOS handles permissions automatically when you first use BLE.
   */
  const requestPermissions = async (): Promise<boolean> => {
    // iOS doesn't need explicit requests (handled by system prompts)
    if (Platform.OS !== "android") {
      return true;
    }

    try {
      console.log("[BLE] Requesting Android permissions...");

      // Android 12+ (API level 31+) has new permission model
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

        console.log("[BLE] Android 12+ permissions granted:", allGranted);
        return allGranted;
      } else {
        // Android 11 and below - only need location permission
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        const isGranted = granted === "granted";
        console.log(
          "[BLE] Android <12 location permission granted:",
          isGranted
        );
        return isGranted;
      }
    } catch (err) {
      console.error("[BLE] Permission request error:", err);
      return false;
    }
  };

  /**
   * Start Scanning for BLE Devices
   *
   * This function:
   * 1. Checks Bluetooth is on
   * 2. Requests permissions
   * 3. Starts scanning for nearby devices
   * 4. Auto-stops after 10 seconds
   */
  const startScan = async (): Promise<void> => {
    // Prevent duplicate scans
    if (isScanning) {
      return;
    }
    try {
      setError(null);
      console.log("[BLE] Starting scan process...");

      // Step 1: Check if Bluetooth is on
      if (bluetoothState !== State.PoweredOn) {
        const errorMsg = "Bluetooth is off. Please turn on Bluetooth.";
        setError(errorMsg);
        Alert.alert("Bluetooth Off", errorMsg);
        console.log("[BLE] Cannot scan - Bluetooth is off");
        return;
      }

      // Step 2: Request permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        const errorMsg = "Bluetooth permissions denied";
        setError(errorMsg);
        Alert.alert(
          "Permissions Required",
          "Please grant Bluetooth permissions in Settings."
        );
        console.log("[BLE] Cannot scan - permissions denied");
        return;
      }

      // Step 3: Start fresh scan (clear previous results)
      setDiscoveredDevices([]);
      setIsScanning(true);
      console.log("[BLE] Scanning for devices...");

      /**
       * Start the actual scan
       *
       * Parameters:
       * - serviceUUIDs: null = scan for all devices
       *                 OR ['uuid1', 'uuid2'] = filter by specific services
       * - options: null = default scan options
       * - listener: callback function called for each discovered device
       *
       * TODO (PIT READER): Replace null with your reader's service UUID to filter:
       * bleManager.startDeviceScan(['YOUR-PIT-READER-SERVICE-UUID'], null, ...)
       */
      bleManager.startDeviceScan(
        null, // TODO: Add PIT reader service UUID here for filtering
        null, // Default options
        (error, device) => {
          // Handle scan errors
          if (error) {
            console.error("[BLE] Scan error:", error);
            setError(`Scan error: ${error.message}`);
            setIsScanning(false);
            return;
          }

          // Handle discovered device
          if (device) {
            // Log the discovered device
            console.log("[BLE] Discovered device:", {
              id: device.id,
              name: device.name || "Unknown",
              rssi: device.rssi, // Signal strength
            });

            // Add to discovered devices list (avoid duplicates)
            setDiscoveredDevices((prevDevices) => {
              const exists = prevDevices.find((d) => d.id === device.id);
              if (exists) {
                return prevDevices; // Already have this device
              }
              return [...prevDevices, device]; // Add new device
            });
          }
        }
      );

      // Step 4: Auto-stop scanning after 10 seconds (saves battery)
      setTimeout(() => {
        stopScan();
        console.log("[BLE] Auto-stopped scan after 10 seconds");
      }, 10000);
    } catch (err: any) {
      console.error("[BLE] Start scan failed:", err);
      setError("Failed to start scanning");
      setIsScanning(false);
    }
  };

  /**
   * Stop Scanning
   *
   * Stops looking for devices and updates UI state.
   */
  const stopScan = (): void => {
    bleManager.stopDeviceScan();
    setIsScanning(false);
    console.log("[BLE] Stopped scanning");
  };

  /**
   * Connect to a Device
   *
   * This function:
   * 1. Stops scanning
   * 2. Connects to the device
   * 3. Discovers its services and characteristics
   * 4. Updates connected state
   */
  const connectToDevice = async (deviceId: string): Promise<void> => {
    try {
      setError(null);
      stopScan(); // Stop scanning before connecting (good practice)

      console.log("[BLE] Connecting to device:", deviceId);

      // Step 1: Establish connection
      const device = await bleManager.connectToDevice(deviceId);
      console.log("[BLE] Connected, discovering services...");

      // Step 2: Discover what services/characteristics the device offers
      // This is required before you can read/write data
      await device.discoverAllServicesAndCharacteristics();
      console.log("[BLE] Services discovered");

      // Step 3: Update state
      setConnectedDevice(device);
      setIsConnected(true);

      console.log("[BLE] Successfully connected to:", device.name || device.id);
    } catch (err: any) {
      console.error("[BLE] Connection failed:", err);
      setError(`Connection failed: ${err.message}`);
      Alert.alert(
        "Connection Failed",
        "Unable to connect to device. Make sure it's powered on and nearby."
      );
    }
  };

  /**
   * Disconnect from Device
   *
   * Gracefully disconnect and clean up state.
   * Note: Some devices may not be truly connected (failed connection)
   * so disconnect errors are handled silently.
   */
  const disconnect = async (): Promise<void> => {
    try {
      if (connectedDevice) {
        console.log(
          "[BLE] Disconnecting from:",
          connectedDevice.name || connectedDevice.id
        );
        await bleManager.cancelDeviceConnection(connectedDevice.id);
        console.log("[BLE] Successfully disconnected");
      }
    } catch (err: any) {
      // "Operation was cancelled" means device wasn't actually connected
      // This is fine - we still want to clean up UI state
      if (err.message?.includes("cancelled")) {
        console.log("[BLE] Device was not connected (cleaned up state anyway)");
      } else {
        console.error("[BLE] Unexpected disconnect error:", err);
      }
    } finally {
      // Always clear state, even if disconnect fails
      setConnectedDevice(null);
      setIsConnected(false);
      console.log("[BLE] Disconnected (state cleared)");

      // Only show alert after state is cleared
      Alert.alert("Disconnected", "Device disconnected");
    }
  };

  /**
   * Read Tag ID (or Battery Level for Testing)
   *
   * FOR TESTING WITH HEADPHONES:
   * - Reads battery level from standard Battery Service
   * - Returns "BATTERY_XX" as a mock tag ID
   *
   * FOR PIT TAG READER (TODO):
   * - Replace UUIDs with your reader's service/characteristic UUIDs
   * - Update data parsing to match reader's format
   * - Return actual tag ID string
   */
  const readTag = async (): Promise<string | null> => {
    try {
      if (!connectedDevice) {
        setError("No device connected");
        Alert.alert("Error", "Please connect to a device first");
        return null;
      }

      setError(null);
      console.log("[BLE] Reading data from device...");

      // ========================================
      // TESTING MODE: Battery Service (Headphones)
      // ========================================
      // These are standard Bluetooth UUIDs that most audio devices support
      const BATTERY_SERVICE_UUID = "0000180f-0000-1000-8000-00805f9b34fb";
      const BATTERY_LEVEL_UUID = "00002a19-0000-1000-8000-00805f9b34fb";

      // TODO (PIT READER): Replace with your actual reader's UUIDs
      // const PIT_TAG_SERVICE_UUID = 'YOUR-SERVICE-UUID-HERE';
      // const PIT_TAG_CHARACTERISTIC_UUID = 'YOUR-CHARACTERISTIC-UUID-HERE';

      try {
        // Try to read battery level (for testing with headphones)
        console.log("[BLE] Attempting to read battery service...");

        const characteristic =
          await connectedDevice.readCharacteristicForService(
            BATTERY_SERVICE_UUID,
            BATTERY_LEVEL_UUID
          );

        if (characteristic.value) {
          // Battery level is a single byte (0-100)
          const buffer = Buffer.from(characteristic.value, "base64");
          const batteryLevel = buffer.readUInt8(0);

          console.log(
            "[BLE] Battery level read successfully:",
            batteryLevel + "%"
          );
          Alert.alert(
            "Test Successful! 🎉",
            `Battery level: ${batteryLevel}%\n\nThis proves BLE reading works!`
          );

          // Return mock tag ID for testing
          return `TEST_BATTERY_${batteryLevel}`;
        }
      } catch (batteryError: any) {
        console.log(
          "[BLE] Battery service not available:",
          batteryError.message
        );

        // Fallback: Try device information service
        console.log("[BLE] Trying device information service...");

        const DEVICE_INFO_SERVICE_UUID = "0000180a-0000-1000-8000-00805f9b34fb";
        const MODEL_NUMBER_UUID = "00002a24-0000-1000-8000-00805f9b34fb";

        try {
          const characteristic =
            await connectedDevice.readCharacteristicForService(
              DEVICE_INFO_SERVICE_UUID,
              MODEL_NUMBER_UUID
            );

          if (characteristic.value) {
            const modelNumber = Buffer.from(
              characteristic.value,
              "base64"
            ).toString("utf-8");
            console.log("[BLE] Model number read successfully:", modelNumber);
            Alert.alert(
              "Test Successful! 🎉",
              `Device model: ${modelNumber}\n\nThis proves BLE reading works!`
            );
            return `TEST_MODEL_${modelNumber}`;
          }
        } catch (modelError: any) {
          console.log(
            "[BLE] Device info service not available:",
            modelError.message
          );
        }
      }

      // If we get here, no standard services are available
      Alert.alert(
        "No Standard Services",
        "This device doesn't expose battery or device info services. This is normal!\n\nYour PIT tag reader will have its own custom services."
      );

      // TODO (PIT READER): Implement actual tag reading here
      // Example:
      // const characteristic = await connectedDevice.readCharacteristicForService(
      //   PIT_TAG_SERVICE_UUID,
      //   PIT_TAG_CHARACTERISTIC_UUID
      // );
      // const tagId = parseTagData(characteristic.value);  // Your parsing function
      // return tagId;

      return null;
    } catch (err: any) {
      console.error("[BLE] Read failed:", err);
      setError(`Read failed: ${err.message}`);
      Alert.alert(
        "Read Error",
        "Could not read from device.\n\nFor testing: Some devices don't expose standard services.\n\nWith PIT reader: Update the UUIDs in BLEContext.tsx"
      );
      return null;
    }
  };

  // ============ CONTEXT VALUE ============
  // This is what components get when they use useBLE()
  const value: BLEContextType = {
    isScanning,
    isConnected,
    connectedDevice,
    discoveredDevices,
    bluetoothState,
    error,
    startScan,
    stopScan,
    connectToDevice,
    disconnect,
    readTag,
    requestPermissions,
  };

  return <BLEContext.Provider value={value}>{children}</BLEContext.Provider>;
};

/**
 * Custom Hook: useBLE()
 *
 * Use this in your components to access BLE functionality:
 * const { startScan, connectToDevice, isConnected } = useBLE();
 *
 * This is the same pattern as useScans() for scan data.
 */
export const useBLE = (): BLEContextType => {
  const context = useContext(BLEContext);

  if (!context) {
    throw new Error("useBLE must be used within a BLEProvider");
  }

  return context;
};
