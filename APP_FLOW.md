# Tagster App Flow

Quick reference showing how major features work with actual function names.

## Architecture

Flow: Screens → Contexts → Utils → Storage

Three contexts: AppContext (settings), ScanContext (scans), BLEContext (bluetooth)

## Quick Reference

Where to add code:

- New screen → src/screens/
- UI component → src/components/
- BLE logic → src/utils/ble\*.ts
- Database query → src/utils/database.ts
- App state → src/context/AppContext.tsx
- Scan state → src/context/ScanContext.tsx
- BLE state → src/context/BLEContext.tsx
- Device config → src/config/bleDeviceConfig.ts

# Core Flows

## Flow 1: App Startup

Providers mount → useEffect() fires  
→ AppContext.loadSettings() → AsyncStorage.getItem()  
→ ScanContext.refreshScans() → Database.getAllScans()  
→ BLEContext creates BleManager

## Flow 2: Manual Tag Entry ✅

User fills form → handleSave()  
→ addScan({ tagId, operator, species, site })  
→ Database.createScan() → SQL INSERT  
→ ScanContext updates scans array  
→ UI shows success

Files: ScanCaptureScreen.tsx → ScanContext.tsx → database.ts

## Flow 3: BLE Scanning ✅

User taps "Connect Reader" → BLEDeviceModal opens  
→ handleStartScan() → startScan()  
→ startBLEScan(bleManager, callbacks)  
→ requestBLEPermissions() → bleManager.startDeviceScan()  
→ Devices populate discoveredDevices array

User taps device → handleConnect(deviceId)  
→ connectToDevice(deviceId)  
→ connectToBLEDevice(bleManager, deviceId)  
→ device.connect() + discoverAllServicesAndCharacteristics()  
→ connectedDevice state updated

Files: BLEDeviceModal.tsx → BLEContext.tsx → bleScanner.ts / bleConnection.ts

## Flow 4: Auto Tag Reading ⏸️ Awaiting Hardware

Device connects → useEffect() checks isConfigured()  
→ IF configured: startMonitoring()  
 → monitorCharacteristic(device, serviceUUID, charUUID, callback)  
 → device.monitorCharacteristicForService()

[Hardware scans tag] → BLE notification fires  
→ onDataReceived(hexString)  
→ parseTagData(hexString)  
→ setLastTagId(parsedId)  
→ ScanCaptureScreen auto-fills tag field

Status: Blocked at isConfigured() check (UUIDs = "UNCONFIGURED")  
Needs: Real PIT tag reader (Flipper doesn't stream live RFID)

Files: BLEContext.tsx → bleTagReader.ts → bleDeviceConfig.ts

## Flow 5: Device Discovery ✅ Ready for real device

User taps "Run Discovery" → discover()  
→ discoverDeviceData(device)  
→ device.services() → device.characteristics()  
→ FOR EACH characteristic: read() → log UUID + data  
→ Developer copies UUIDs from console  
→ Updates bleDeviceConfig.ts (SERVICE_UUID, CHARACTERISTIC_UUID)  
→ Reload → Flow 4 activates

Files: ScanCaptureScreen.tsx → BLEContext.tsx → bleTagReader.ts

## Flow 6: Search Scans ✅

User types → searchScans(query)  
→ scans.filter() checks tagId/operator/species/site/notes  
→ Returns filtered array → FlatList updates

Files: LogbookScreen.tsx → ScanContext.tsx

## Flow 7: Delete Scan ✅

User taps trash → deleteScan(id)  
→ Database.deleteScan(id) → SQL DELETE  
→ Remove from scans array → UI updates

Files: LogbookScreen.tsx → ScanContext.tsx → database.ts

## Flow 8: Update Settings ✅

User saves → updateSettings({ defaultOperator })  
→ AsyncStorage.setItem() → Update settings state  
→ Next scan pre-fills new operator

Files: SettingsScreen.tsx → AppContext.tsx
