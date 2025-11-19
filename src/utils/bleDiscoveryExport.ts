import { Device } from "react-native-ble-plx";
import { Buffer } from "buffer";
import { Paths, File } from "expo-file-system";
import * as Sharing from "expo-sharing";

export interface DiscoveryData {
  deviceName: string;
  deviceId: string;
  timestamp: string;
  rssi?: number;
  mtu?: number;
  services: Array<{
    uuid: string;
    characteristics: Array<{
      uuid: string;
      isReadable: boolean;
      isNotifiable: boolean;
      isIndicatable: boolean;
      isWritable: boolean;
      sampleValues: string[];
      descriptors: Array<{
        uuid: string;
        value?: string;
      }>;
    }>;
  }>;
  recommendedService?: string;
  recommendedCharacteristic?: string;
  storedTagSamples: string[];
}

export const discoverDeviceDataStructured = async (
  device: Device
): Promise<DiscoveryData> => {
  const discovery: DiscoveryData = {
    deviceName: device.name || "Unknown Device",
    deviceId: device.id,
    timestamp: new Date().toISOString(),
    services: [],
    storedTagSamples: [],
  };

  try {
    // Get RSSI if available
    try {
      const updatedDevice = await device.readRSSI();
      discovery.rssi = updatedDevice.rssi ?? undefined;
    } catch (err) {
      // Ignore
    }

    // Get MTU if available
    try {
      discovery.mtu = device.mtu;
    } catch (err) {
      // Ignore
    }

    const services = await device.services();
    const allSamples: string[] = [];

    for (const service of services) {
      const characteristics = await service.characteristics();
      const serviceData = {
        uuid: service.uuid,
        characteristics: [] as DiscoveryData["services"][0]["characteristics"],
      };

      for (const char of characteristics) {
        const charData = {
          uuid: char.uuid,
          isReadable: char.isReadable,
          isNotifiable: char.isNotifiable,
          isIndicatable: char.isIndicatable,
          isWritable: char.isWritableWithoutResponse,
          sampleValues: [] as string[],
          descriptors: [] as Array<{ uuid: string; value?: string }>,
        };

        // Read characteristic multiple times to get stored data
        if (char.isReadable) {
          for (let i = 0; i < 3; i++) {
            try {
              const value = await char.read();
              if (value.value) {
                const buffer = Buffer.from(value.value, "base64");
                const hexString = buffer.toString("hex").toUpperCase();

                if (
                  hexString &&
                  !/^0+$/.test(hexString) &&
                  hexString.length >= 4 &&
                  !charData.sampleValues.includes(hexString)
                ) {
                  charData.sampleValues.push(hexString);
                  if (!allSamples.includes(hexString)) {
                    allSamples.push(hexString);
                  }
                }
              }
              if (i < 2)
                await new Promise((resolve) => setTimeout(resolve, 500));
            } catch (err) {
              // Ignore
            }
          }
        }

        // Get descriptors
        try {
          const descriptors = await char.descriptors();
          for (const descriptor of descriptors) {
            try {
              const descValue = await descriptor.read();
              charData.descriptors.push({
                uuid: descriptor.uuid,
                value: descValue.value
                  ? Buffer.from(descValue.value, "base64")
                      .toString("hex")
                      .toUpperCase()
                  : undefined,
              });
            } catch (err) {
              charData.descriptors.push({ uuid: descriptor.uuid });
            }
          }
        } catch (err) {
          // Ignore
        }

        serviceData.characteristics.push(charData);

        if (
          (char.isNotifiable || char.isIndicatable) &&
          !discovery.recommendedService
        ) {
          discovery.recommendedService = service.uuid;
          discovery.recommendedCharacteristic = char.uuid;
        }
      }

      discovery.services.push(serviceData);
    }

    discovery.storedTagSamples = allSamples;
    return discovery;
  } catch (err: any) {
    throw new Error(`Discovery failed: ${err.message}`);
  }
};

export const formatDiscoveryAsText = (data: DiscoveryData): string => {
  let text = `BLE Device Discovery Report\n`;
  text += `==========================\n\n`;
  text += `Device Name: ${data.deviceName}\n`;
  text += `Device ID: ${data.deviceId}\n`;
  text += `Timestamp: ${data.timestamp}\n`;
  if (data.rssi !== undefined) text += `RSSI: ${data.rssi} dBm\n`;
  if (data.mtu) text += `MTU: ${data.mtu} bytes\n`;
  text += `\n`;

  text += `Services and Characteristics:\n`;
  text += `----------------------------\n\n`;

  data.services.forEach((service, sIdx) => {
    text += `${sIdx + 1}. SERVICE: ${service.uuid}\n`;
    service.characteristics.forEach((char, cIdx) => {
      text += `   ${cIdx + 1}. CHARACTERISTIC: ${char.uuid}\n`;
      text += `      - Readable: ${char.isReadable}\n`;
      text += `      - Notifiable: ${char.isNotifiable} ${
        char.isNotifiable ? "⭐" : ""
      }\n`;
      text += `      - Indicatable: ${char.isIndicatable} ${
        char.isIndicatable ? "⭐" : ""
      }\n`;
      text += `      - Writable: ${char.isWritable}\n`;

      if (char.sampleValues.length > 0) {
        text += `      Stored Values:\n`;
        char.sampleValues.forEach((val, idx) => {
          text += `        ${idx + 1}. ${val}\n`;
        });
      }

      if (char.descriptors.length > 0) {
        text += `      Descriptors:\n`;
        char.descriptors.forEach((desc) => {
          text += `        - ${desc.uuid}`;
          if (desc.value) text += ` = ${desc.value}`;
          text += `\n`;
        });
      }
      text += `\n`;
    });
    text += `\n`;
  });

  if (data.recommendedService && data.recommendedCharacteristic) {
    text += `⭐ RECOMMENDED:\n`;
    text += `Service UUID: ${data.recommendedService}\n`;
    text += `Characteristic UUID: ${data.recommendedCharacteristic}\n\n`;
  }

  if (data.storedTagSamples.length > 0) {
    text += `📦 STORED TAG SAMPLES:\n`;
    data.storedTagSamples.forEach((sample, idx) => {
      text += `${idx + 1}. ${sample}\n`;
    });
    text += `\n`;
  }

  text += `Configuration:\n`;
  text += `1. Open src/config/bleDeviceConfig.ts\n`;
  text += `2. Set SERVICE_UUID: ${data.recommendedService || "YOUR_UUID"}\n`;
  text += `3. Set CHARACTERISTIC_UUID: ${
    data.recommendedCharacteristic || "YOUR_UUID"
  }\n`;
  text += `4. Update parseTagData() based on samples above\n`;

  return text;
};

export const exportDiscoveryData = async (
  data: DiscoveryData
): Promise<void> => {
  try {
    const textContent = formatDiscoveryAsText(data);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const deviceNameSafe = data.deviceName.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `tagster_discovery_${deviceNameSafe}_${timestamp}.txt`;
    const file = new File(Paths.document, fileName);
    file.write(textContent);
    await Sharing.shareAsync(file.uri, {
      mimeType: "text/plain",
      dialogTitle: "Export Device Discovery",
    });
  } catch (err: any) {
    throw new Error(`Export failed: ${err.message}`);
  }
};
