import { Device } from "react-native-ble-plx";
import { Buffer } from "buffer";

/**
 * BLE Tag Reader
 *
 * Three functions:
 * 1. discoverDeviceData() - One-time scan to see all characteristics
 * 2. monitorCharacteristic() - Real-time listener for tag data
 * 3. readCharacteristic() - Read a characteristic once (on-demand)
 */

/**
 * STEP 1: Discover what the device has
 * Run this once after connecting to see all services/characteristics
 */
export const discoverDeviceData = async (device: Device): Promise<void> => {
  console.log("[Discovery] 🔍 Scanning device...");
  console.log("[Discovery] =====================================");

  try {
    const services = await device.services();

    for (const service of services) {
      console.log(`\n[Discovery] 📦 SERVICE: ${service.uuid}`);
      const characteristics = await service.characteristics();

      for (const char of characteristics) {
        console.log(`\n  📡 CHARACTERISTIC: ${char.uuid}`);
        console.log(`     Properties:`);
        console.log(`       - Readable: ${char.isReadable}`);
        console.log(
          `       - Notifiable: ${char.isNotifiable} ${
            char.isNotifiable ? "⭐ PERFECT!" : ""
          }`
        );
        console.log(
          `       - Indicatable: ${char.isIndicatable} ${
            char.isIndicatable ? "⭐ PERFECT!" : ""
          }`
        );

        // Try to read current value
        if (char.isReadable) {
          try {
            const value = await char.read();
            if (value.value) {
              const buffer = Buffer.from(value.value, "base64");
              const hexString = buffer.toString("hex").toUpperCase();

              console.log(`     📊 CURRENT VALUE:`);
              console.log(`        Hex: ${hexString}`);
              console.log(`        Length: ${buffer.length} bytes`);
            }
          } catch (err: any) {
            console.log(`     ⚠️ Could not read: ${err.message}`);
          }
        }
      }
    }

    console.log("\n[Discovery] =====================================");
    console.log("[Discovery] ✅ Complete! Look for ⭐ characteristics above.");
    console.log(
      "[Discovery] 💡 Use the Service + Characteristic UUID in monitorCharacteristic()"
    );
  } catch (err: any) {
    console.error("[Discovery] ❌ Failed:", err.message);
  }
};

/**
 * STEP 2: Monitor a specific characteristic for real-time updates
 * Use the UUIDs you found in discovery
 */
export const monitorCharacteristic = (
  device: Device,
  serviceUUID: string,
  characteristicUUID: string,
  onDataReceived: (hexString: string) => void
): (() => void) => {
  console.log("[Monitor] 📡 Starting notification listener...");
  console.log(`[Monitor]  Service: ${serviceUUID}`);
  console.log(`[Monitor]  Characteristic: ${characteristicUUID}`);

  const subscription = device.monitorCharacteristicForService(
    serviceUUID,
    characteristicUUID,
    (error, characteristic) => {
      if (error) {
        console.error("[Monitor] ❌ Error:", error.message);
        return;
      }

      if (characteristic?.value) {
        const buffer = Buffer.from(characteristic.value, "base64");
        const hexString = buffer.toString("hex").toUpperCase();

        console.log("\n[Monitor] 🔔 NOTIFICATION RECEIVED!");
        console.log(`[Monitor]  Hex: ${hexString}`);
        console.log(`[Monitor]  Length: ${buffer.length} bytes`);
        console.log(`[Monitor]  Time: ${new Date().toLocaleTimeString()}\n`);

        // Pass raw hex to callback (no processing)
        onDataReceived(hexString);
      }
    }
  );

  // Return cleanup function
  return () => {
    console.log("[Monitor] 🛑 Stopping notification listener");
    subscription.remove();
  };
};

/**
 * Read a specific characteristic once (on-demand)
 * Use this AFTER scanning a tag on Flipper to retrieve the stored data
 */
export const readCharacteristic = async (
  device: Device,
  serviceUUID: string,
  characteristicUUID: string
): Promise<string | null> => {
  console.log("[Read] 📖 Reading characteristic...");
  console.log(`[Read]  Service: ${serviceUUID}`);
  console.log(`[Read]  Characteristic: ${characteristicUUID}`);

  try {
    const characteristic = await device.readCharacteristicForService(
      serviceUUID,
      characteristicUUID
    );

    if (characteristic.value) {
      const buffer = Buffer.from(characteristic.value, "base64");
      const hexString = buffer.toString("hex").toUpperCase();

      console.log("[Read] ✅ Data received:");
      console.log(`[Read]  Hex: ${hexString}`);
      console.log(`[Read]  Length: ${buffer.length} bytes`);
      console.log(
        `[Read]  Bytes: [${Array.from(buffer)
          .slice(0, 20)
          .map((b) => `0x${b.toString(16).padStart(2, "0")}`)
          .join(", ")}${buffer.length > 20 ? "..." : ""}]`
      );

      return hexString;
    }

    console.log("[Read] ⚠️ No data returned");
    return null;
  } catch (err: any) {
    console.error("[Read] ❌ Read failed:", err.message);
    return null;
  }
};
