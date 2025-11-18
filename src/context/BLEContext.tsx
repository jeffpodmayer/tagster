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

/**
 * BLE Context Interface - SIMPLIFIED
 *
 * Focus: Connect, discover, monitor
 */
interface BLEContextType {
  // ============ STATE ============
  isScanning: boolean;
  isConnected: boolean;
  connectedDevice: Device | null;
  discoveredDevices: Device[];
  bluetoothState: State;
  error: string | null;
  lastTagId: string | null;

  // ============ ACTIONS ============
  startScan: () => Promise<void>;
  stopScan: () => void;
  connectToDevice: (deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  discover: () => Promise<void>; // Run discovery manually
  requestPermissions: () => Promise<boolean>;
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
 * BLE Provider Component - SIMPLIFIED
 *
 * Removed:
 * - Complex refs for tag tracking
 * - Automatic polling
 * - Tag callbacks
 *
 * Added:
 * - Simple discovery function
 * - Manual monitoring control
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
  // Ref to track connected device (for monitoring)
  const connectedDeviceRef = useRef<Device | null>(null);

  // Ref to store the monitoring cleanup function
  const monitoringCleanupRef = useRef<(() => void) | null>(null);

  // ============ BLUETOOTH STATE MONITORING ============
  useEffect(() => {
    console.log("[BLE Context] Setting up Bluetooth state listener");

    const subscription = bleManager.onStateChange((state) => {
      console.log("[BLE Context] Bluetooth state changed to:", state);
      setBluetoothState(state);

      // If Bluetooth turns off while connected, auto-disconnect
      if (state !== State.PoweredOn && isConnected) {
        console.log("[BLE Context] Bluetooth turned off, disconnecting...");
        disconnect();
      }
    }, true); // true = emit current state immediately

    // Cleanup
    return () => {
      console.log("[BLE Context] Cleaning up BLE Manager");
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
      console.log("[BLE Context] ⚠️ Device not configured yet");
      console.log(
        "[BLE Context] 💡 Run discovery and update bleDeviceConfig.ts"
      );
      return;
    }

    // Auto-start monitoring with configured UUIDs
    if (READER_CONFIG.USE_NOTIFICATIONS) {
      console.log(
        "[BLE Context] 🎬 Auto-starting monitoring with configured UUIDs"
      );
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
      console.log("[BLE Context] Already scanning, ignoring duplicate request");
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
        console.log("[BLE Context] ✅ Device connected!");
        console.log(
          "[BLE Context] 💡 Next step: Call discover() to see characteristics"
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
        console.log("[BLE Context] Disconnected and state cleared");
      }
    );
  };

  // ============ DISCOVERY ============
  const discover = async (): Promise<void> => {
    const currentDevice = connectedDeviceRef.current || connectedDevice;

    if (!currentDevice) {
      setError("No device connected");
      console.error("[BLE Context] ❌ Cannot discover - no device connected");
      return;
    }

    console.log("[BLE Context] 🔍 Running discovery...");
    setError(null);

    try {
      await discoverDeviceData(currentDevice);
      console.log(
        "[BLE Context] ✅ Discovery complete! Check logs above for UUIDs."
      );
    } catch (err: any) {
      console.error("[BLE Context] ❌ Discovery failed:", err.message);
      setError(`Discovery failed: ${err.message}`);
    }
  };

  // ============ MONITORING ============
  const startMonitoring = (serviceUUID: string, charUUID: string): void => {
    const currentDevice = connectedDeviceRef.current || connectedDevice;

    if (!currentDevice) {
      console.error("[BLE Context] ❌ Cannot monitor - no device connected");
      setError("No device connected");
      return;
    }

    // Stop existing monitoring if any
    if (monitoringCleanupRef.current) {
      console.log("[BLE Context] Stopping previous monitoring...");
      monitoringCleanupRef.current();
    }

    console.log("[BLE Context] 🎬 Starting monitoring...");
    setError(null);

    const cleanup = monitorCharacteristic(
      currentDevice,
      serviceUUID,
      charUUID,
      (hexString: string) => {
        console.log(`[BLE Context] 🏷️ Tag received: ${hexString}`);
        setLastTagId(hexString);
      }
    );

    monitoringCleanupRef.current = cleanup;
  };

  const stopMonitoring = (): void => {
    if (monitoringCleanupRef.current) {
      console.log("[BLE Context] Stopping monitoring...");
      monitoringCleanupRef.current();
      monitoringCleanupRef.current = null;
    } else {
      console.log("[BLE Context] No active monitoring to stop");
    }
  };
  // ============ MANUAL READ ============
  const readChar = async (
    serviceUUID: string,
    charUUID: string
  ): Promise<string | null> => {
    const currentDevice = connectedDeviceRef.current || connectedDevice;

    if (!currentDevice) {
      console.error("[BLE Context] ❌ Cannot read - no device connected");
      setError("No device connected");
      return null;
    }

    console.log("[BLE Context] 📖 Reading characteristic...");
    setError(null);

    const result = await readCharacteristic(
      currentDevice,
      serviceUUID,
      charUUID
    );

    if (result) {
      console.log(
        `[BLE Context] ✅ Read complete: ${result.substring(0, 50)}...`
      );
      setLastTagId(result);
    } else {
      console.log("[BLE Context] ⚠️ No data received");
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
