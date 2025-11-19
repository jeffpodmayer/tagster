// src/context/BLEContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { BleManager, Device, State } from "react-native-ble-plx";
import { startBLEScan, stopBLEScan } from "../utils/bleScanner";
import {
  connectToBLEDevice,
  disconnectFromBLEDevice,
} from "../utils/bleConnection";
import {
  discoverDeviceData,
  monitorCharacteristic,
  readCharacteristic,
} from "../utils/bleTagReader";
import { requestBLEPermissions } from "../utils/blePermissions";
import {
  READER_CONFIG,
  parseTagData,
  isConfigured,
} from "../config/bleDeviceConfig";

// ============================================
// ERROR MESSAGES (Centralized)
// ============================================
const ERROR_MESSAGES = {
  NO_DEVICE: "No device connected",
  DISCOVERY_FAILED: "Discovery failed",
} as const;

// ============================================
// LOGGING CONVENTIONS
// ============================================
// [BLE] - Core BLE operations
// [Discovery] - Device discovery (bleTagReader.ts)
// [Monitor] - Notification listeners (bleTagReader.ts)
// [Read] - Manual reads (bleTagReader.ts)
// [Parse] - Tag parsing (bleDeviceConfig.ts)
//
// Emojis: 🔍 search, 🔌 connect, ✅ success, ❌ error, ⚠️ warning, 📡 BLE ops, 🔔 notify
// ============================================

/**
 * BLE Context Interface
 *
 * Manages BLE device scanning, connection, and data reading for PIT tag readers.
 */
interface BLEContextType {
  // ============ STATE ============
  /** Whether BLE scanning is active */
  isScanning: boolean;
  /** Whether a device is connected */
  isConnected: boolean;
  /** Currently connected device, or null */
  connectedDevice: Device | null;
  /** List of discovered BLE devices */
  discoveredDevices: Device[];
  /** Bluetooth adapter state (PoweredOn, PoweredOff, etc.) */
  bluetoothState: State;
  /** Last error message, or null */
  error: string | null;
  /** Last parsed tag ID from connected device */
  lastTagId: string | null;

  // ============ ACTIONS ============
  /** Start scanning for BLE devices */
  startScan: () => Promise<void>;
  /** Stop scanning */
  stopScan: () => void;
  /**
   * Connect to a device by ID
   * @param deviceId - Device ID from discoveredDevices
   */
  connectToDevice: (deviceId: string) => Promise<void>;
  /** Disconnect from current device */
  disconnect: () => Promise<void>;
  /**
   * Run discovery to log all services/characteristics
   * Use in dev mode to find UUIDs for bleDeviceConfig.ts
   */
  discover: () => Promise<void>;
  /**
   * Request BLE permissions
   * @returns true if granted
   */
  requestPermissions: () => Promise<boolean>;
  /**
   * Read a characteristic value manually
   * @returns Hex string or null
   */
  readCharacteristic: (
    serviceUUID: string,
    characteristicUUID: string
  ) => Promise<string | null>;
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
 */
export const BLEProvider: React.FC<BLEProviderProps> = ({ children }) => {
  // ============ BLE MANAGER ============
  const [bleManager] = useState(() => new BleManager());

  // ============ STATE ============
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<Device[]>([]);
  const [bluetoothState, setBluetoothState] = useState<State>(State.Unknown);
  const [error, setError] = useState<string | null>(null);
  const [lastTagId, setLastTagId] = useState<string | null>(null);

  // ============ REFS ============
  const connectedDeviceRef = useRef<Device | null>(null);
  const monitoringCleanupRef = useRef<(() => void) | null>(null);

  /**
   * Get the current connected device
   */
  const getCurrentDevice = (): Device | null => {
    return connectedDeviceRef.current || connectedDevice;
  };

  // ============ BLUETOOTH STATE MONITORING ============
  useEffect(() => {
    console.log("[BLE] Setting up Bluetooth state listener");

    const subscription = bleManager.onStateChange((state) => {
      console.log("[BLE] Bluetooth state changed to:", state);
      setBluetoothState(state);

      // If Bluetooth turns off while connected, auto-disconnect
      // If Bluetooth turns off while connected, auto-disconnect
      if (state !== State.PoweredOn && isConnected) {
        console.log("[BLE] Bluetooth turned off, disconnecting...");

        // Stop monitoring if active
        if (monitoringCleanupRef.current) {
          monitoringCleanupRef.current();
          monitoringCleanupRef.current = null;
        }

        // Disconnect from device
        disconnectFromBLEDevice(bleManager, connectedDevice, () => {
          setConnectedDevice(null);
          setIsConnected(false);
          connectedDeviceRef.current = null;
          setLastTagId(null);
          console.log("[BLE] Disconnected (Bluetooth turned off)");
        });
      }
    }, true); // true = emit current state immediately

    // Cleanup
    return () => {
      console.log("[BLE] Cleaning up BLE Manager");
      subscription.remove();
      bleManager.destroy();
    };
  }, []);

  // ============ AUTO-MONITORING ============
  useEffect(() => {
    if (!isConnected || !connectedDevice) {
      return;
    }

    // Check if device is configured
    if (!isConfigured()) {
      console.log("[BLE] ⚠️ Device not configured yet");
      console.log("[BLE] 💡 Run discovery and update bleDeviceConfig.ts");
      return;
    }

    // Auto-start monitoring with configured UUIDs
    if (READER_CONFIG.USE_NOTIFICATIONS) {
      console.log("[BLE] 🎬 Auto-starting monitoring with configured UUIDs");
      startMonitoring(
        READER_CONFIG.SERVICE_UUID,
        READER_CONFIG.CHARACTERISTIC_UUID
      );
    }

    return () => {
      // Cleanup handled by startMonitoring
    };
  }, [isConnected, connectedDevice]);

  // ============ SCANNING ============
  const startScan = async (): Promise<void> => {
    // Prevent duplicate scans
    if (isScanning) {
      console.log("[BLE] Already scanning, ignoring duplicate request");
      return;
    }

    // Clear previous devices
    setDiscoveredDevices([]);
    setError(null);

    await startBLEScan(
      bleManager,
      bluetoothState,
      // onDeviceDiscovered callback
      (device: Device) => {
        setDiscoveredDevices((prevDevices) => {
          const exists = prevDevices.find((d) => d.id === device.id);
          if (exists) {
            return prevDevices;
          }
          return [...prevDevices, device];
        });
      },
      // onScanStateChange callback
      (scanning: boolean) => {
        setIsScanning(scanning);
      },
      // onError callback
      (errorMsg: string) => {
        setError(errorMsg);
      },
      // serviceUUIDs filter (null = scan all devices)
      null
    );
  };

  const stopScan = (): void => {
    stopBLEScan(bleManager, setIsScanning);
  };

  // ============ CONNECTION ============
  const connectToDevice = async (deviceId: string): Promise<void> => {
    setError(null);

    await connectToBLEDevice(
      bleManager,
      deviceId,
      // onStopScan callback
      () => {
        stopScan();
      },
      // onConnected callback
      (device: Device) => {
        setConnectedDevice(device);
        setIsConnected(true);
        connectedDeviceRef.current = device;
        console.log("[BLE] 🔌 Device connected!");
        console.log(
          "[BLE] 💡 Next step: Call discover() to see characteristics"
        );
      },
      // onError callback
      (errorMsg: string) => {
        setError(errorMsg);
      }
    );
  };

  const disconnect = async (): Promise<void> => {
    // Stop monitoring if active
    if (monitoringCleanupRef.current) {
      monitoringCleanupRef.current();
      monitoringCleanupRef.current = null;
    }

    await disconnectFromBLEDevice(
      bleManager,
      connectedDevice,
      // onDisconnected callback (cleanup)
      () => {
        setConnectedDevice(null);
        setIsConnected(false);
        connectedDeviceRef.current = null;
        setLastTagId(null);
        console.log("[BLE] Disconnected and state cleared");
      }
    );
  };

  // ============ DISCOVERY ============
  const discover = async (): Promise<void> => {
    const currentDevice = getCurrentDevice();

    if (!currentDevice) {
      setError(ERROR_MESSAGES.NO_DEVICE);
      return;
    }

    console.log("[BLE] 🔍 Running discovery...");
    setError(null);

    try {
      await discoverDeviceData(currentDevice);
      console.log("[BLE] ✅ Discovery complete! Check logs above for UUIDs.");
    } catch (err: any) {
      setError(`${ERROR_MESSAGES.DISCOVERY_FAILED}: ${err.message}`);
    }
  };

  // ============ MONITORING ============
  const startMonitoring = (serviceUUID: string, charUUID: string): void => {
    const currentDevice = getCurrentDevice();

    if (!currentDevice) {
      setError(ERROR_MESSAGES.NO_DEVICE);
      return;
    }

    // Stop existing monitoring if any
    if (monitoringCleanupRef.current) {
      console.log("[BLE] Stopping previous monitoring...");
      monitoringCleanupRef.current();
    }

    console.log("[BLE] 🎬 Starting monitoring...");
    setError(null);

    const cleanup = monitorCharacteristic(
      currentDevice,
      serviceUUID,
      charUUID,
      (hexString: string) => {
        console.log(`[BLE] 🏷️ Raw: ${hexString.substring(0, 50)}...`);

        const parsed = parseTagData(hexString); // Already returns clean hex
        if (parsed) {
          console.log(`[BLE] ✅ Tag: ${parsed}`);
          setLastTagId(parsed);
        }
      }
    );

    monitoringCleanupRef.current = cleanup;
  };

  // ============ MANUAL READ ============
  const readChar = async (
    serviceUUID: string,
    charUUID: string
  ): Promise<string | null> => {
    const currentDevice = getCurrentDevice();

    if (!currentDevice) {
      setError(ERROR_MESSAGES.NO_DEVICE);
      return null;
    }

    console.log("[BLE] 📖 Reading characteristic...");
    setError(null);

    const result = await readCharacteristic(
      currentDevice,
      serviceUUID,
      charUUID
    );

    if (result) {
      console.log(`[BLE] ✅ Read complete: ${result.substring(0, 50)}...`);
      setLastTagId(result);
    } else {
      console.log("[BLE] ⚠️ No data received");
    }

    return result;
  };

  // ============ PERMISSIONS ============
  const requestPermissions = async (): Promise<boolean> => {
    return await requestBLEPermissions();
  };

  // ============ CONTEXT VALUE ============
  const value: BLEContextType = {
    isScanning,
    isConnected,
    connectedDevice,
    discoveredDevices,
    bluetoothState,
    error,
    lastTagId,
    startScan,
    stopScan,
    connectToDevice,
    disconnect,
    discover,
    requestPermissions,
    readCharacteristic: readChar,
  };

  return <BLEContext.Provider value={value}>{children}</BLEContext.Provider>;
};

/**
 * Custom Hook: useBLE()
 *
 * Use this in your components to access BLE functionality.
 */
export const useBLE = (): BLEContextType => {
  const context = useContext(BLEContext);

  if (!context) {
    throw new Error("useBLE must be used within a BLEProvider");
  }

  return context;
};
