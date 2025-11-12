# PIT Tag Mobile App - Implementation Plan

## Tech Stack Summary

- **Framework**: Expo (managed workflow) + TypeScript
- **UI Library**: React Native Paper (Material Design)
- **State Management**: React Context API
- **Offline Storage**: expo-sqlite
- **BLE**: react-native-ble-plx (via expo dev client)
- **CSV Export**: Custom implementation with expo-sharing
- **Navigation**: React Navigation

## Phase 1: Project Setup & Foundation

### 1.1 Initialize Expo Project

- Create new Expo project with TypeScript template
- Install core dependencies: React Navigation, React Native Paper, expo-sqlite, expo-sharing
- Configure Expo dev client for BLE support (react-native-ble-plx requires custom native code)
- Set up project structure: `/src/screens`, `/src/components`, `/src/context`, `/src/models`, `/src/utils`

### 1.2 Type Definitions & Data Models

Create [`src/models/types.ts`](src/models/types.ts) with:

```typescript
export interface TagScan {
  id: string; // UUID (required)
  tagId: string; // Store as-is from reader (required)
  tagFormat?: TagFormat; // Optional format detection
  timestamp: string; // ISO 8601 (required, auto)
  operator: string; // Required
  species?: string; // Optional dropdown
  site?: string; // Optional dropdown
  latitude?: number; // Optional GPS (add in Phase 5-6)
  longitude?: number; // Optional GPS (add in Phase 5-6)
  notes?: string; // Optional free text
  duplicatedFrom?: string; // UUID if duplicated from another scan
  createdAt: string; // ISO 8601 (required, auto)
  updatedAt: string; // ISO 8601 (required, auto)
}

export type TagFormat =
  | "ISO_DECIMAL_15" // 999123456789012
  | "ISO_HEX_DOT" // 3E7.1CBE991A14
  | "125KHZ_9DIGIT" // 123456789
  | "UNKNOWN"; // Anything else

export interface BLEDevice {
  id: string;
  name: string;
  rssi?: number;
}

export interface AppSettings {
  defaultOperator?: string;
  enableGPS: boolean;
  customSpecies: string[];
  customSites: string[];
}
```

Create [`src/data/metadata.json`](src/data/metadata.json) with example dropdown options:

```json
{
  "species": [
    "Chinook Salmon",
    "Coho Salmon",
    "Steelhead Trout",
    "Sockeye Salmon",
    "Rainbow Trout",
    "Bull Trout",
    "Cutthroat Trout",
    "Other"
  ],
  "sites": [
    "Site A - Lower River",
    "Site B - Middle Creek",
    "Site C - Upper Falls",
    "Site D - Hatchery",
    "Other"
  ]
}
```

**Field Requirements:**

- **Required**: tagId, operator, timestamp (auto-generated)
- **Optional**: species, site, notes, GPS coordinates

### 1.3 SQLite Database Setup

Create [`src/utils/database.ts`](src/utils/database.ts):

- Initialize SQLite database with `tag_scans` table
- CRUD operations: createScan, getScan, getAllScans, updateScan, deleteScan, bulkDelete
- Migration support for future schema changes

## Phase 2: State Management & Context

### 2.1 Create Context Providers

- **ScanContext** ([`src/context/ScanContext.tsx`](src/context/ScanContext.tsx)): Manage tag scans (add, edit, delete, duplicate)
- **BLEContext** ([`src/context/BLEContext.tsx`](src/context/BLEContext.tsx)): Manage BLE connection state and device scanning
- **AppContext** ([`src/context/AppContext.tsx`](src/context/AppContext.tsx)): App settings (default operator name, GPS preferences)

### 2.2 Context Integration

- Wrap app in context providers in [`App.tsx`](App.tsx)
- Create custom hooks: `useScans()`, `useBLE()`, `useAppSettings()`

## Phase 3: Expo Dev Client Setup (Transition from Expo Go)

**At this point, you've built the foundation with Expo Go. Now we need BLE support.**

### 3.1 Install Expo Dev Client

- Run `npx expo install expo-dev-client`
- Install react-native-ble-plx: `npm install react-native-ble-plx`
- Update `app.json` to include BLE permissions:
  ```json
  "ios": {
    "infoPlist": {
      "NSBluetoothAlwaysUsageDescription": "This app uses Bluetooth to connect to PIT tag readers"
    }
  },
  "android": {
    "permissions": ["BLUETOOTH", "BLUETOOTH_ADMIN", "BLUETOOTH_SCAN", "BLUETOOTH_CONNECT", "ACCESS_FINE_LOCATION"]
  }
  ```

### 3.2 Build Development Client

- For iOS: `eas build --profile development --platform ios` (requires EAS account)
- For Android: `eas build --profile development --platform android`
- Or use local builds: `npx expo run:ios` / `npx expo run:android`
- Install the built app on your physical device (BLE won't work in simulators)

### 3.3 Development Workflow Change

- Instead of scanning QR with Expo Go, use your custom dev client app
- Same fast refresh experience, but now with BLE support
- Continue using `npx expo start --dev-client`

## Phase 4: BLE Integration (Phased Approach)

**BLE is built in progressive milestones - each is independently testable**

### 4.1 Milestone 1: BLE Discovery & Connection

Create [`src/utils/bleManager.ts`](src/utils/bleManager.ts):

- Initialize BLE manager with react-native-ble-plx
- Request BLE permissions (iOS/Android specific handling)
- Scan for nearby BLE devices (all devices, not PIT-reader specific yet)
- Display device names, IDs, and signal strength (RSSI)
- Basic connect/disconnect functions
- Connection state management (connecting, connected, disconnected, error)

**Testing at this milestone**: Use any BLE device (headphones, fitness tracker, etc.) to verify scanning and connection works

**BLE Debugging Tools** (essential for this phase):

- **LightBlue** (iOS): Inspect BLE devices, see services/characteristics
- **nRF Connect** (Android): Same functionality
- Use these to explore BLE devices before coding

### 4.2 Milestone 2: Generic Data Reading

Extend [`src/utils/bleManager.ts`](src/utils/bleManager.ts):

- Discover services and characteristics from connected device
- Read from generic characteristics
- Subscribe to notifications (for real-time data)
- Display raw data (hex/string) in console or debug screen
- Error handling for disconnections and failed reads

**Testing at this milestone**: Connect to any BLE device that broadcasts data, read characteristics, verify data appears in app

### 4.3 Milestone 3: Generic Protocol Handler

Create [`src/utils/bleProtocol.ts`](src/utils/bleProtocol.ts):

- Parse incoming BLE data (start with hex string assumption)
- Convert raw bytes to string format
- Basic validation (check for expected data patterns)
- Configurable for future reader-specific protocols
- Error handling for malformed data

**At this point**: BLE infrastructure is complete, app can receive data from any BLE device

### 4.4 Milestone 4: PIT Reader Integration (when hardware arrives)

Update [`src/utils/bleProtocol.ts`](src/utils/bleProtocol.ts):

- Identify PIT reader's specific service UUIDs (use LightBlue/nRF Connect)
- Identify characteristic that sends tag ID data
- Parse PIT tag ID format (typically 10-15 digit hex)
- Filter for PIT reader during scanning (by name or service UUID)
- Handle reader-specific timing and data format

**Testing Strategy Without PIT Reader**:

1. Implement generic BLE (milestones 1-3) with any BLE device
2. When PIT reader arrives, use debugging tools to inspect it
3. Update service UUIDs and parsing logic (minimal changes)
4. 80% of BLE code works before you have the actual reader

**BLE Learning Resources**:

- react-native-ble-plx example app: https://github.com/dotintent/react-native-ble-plx/tree/master/examples
- BLE Fundamentals: Services, Characteristics, UUIDs (15 min read in library docs)
- Common pitfall: Android requires location permission for BLE scanning

## Phase 5: Core Screens

### 4.1 Navigation Setup

Configure React Navigation with bottom tabs in [`src/navigation/AppNavigator.tsx`](src/navigation/AppNavigator.tsx):

- Home/Dashboard tab
- Scan tab
- Logbook tab
- Settings tab

### 4.2 Home Screen ([`src/screens/HomeScreen.tsx`](src/screens/HomeScreen.tsx))

- BLE connection status indicator
- Quick stats: total scans today, last scan time
- "Connect to Reader" button
- "Export CSV" button
- Recent scans preview (last 5)

### 4.3 BLE Connection Screen ([`src/screens/BLEConnectionScreen.tsx`](src/screens/BLEConnectionScreen.tsx))

- Scan for BLE devices with loading indicator
- List available devices with signal strength
- Connect/disconnect buttons
- Connection status (connected, disconnected, connecting)
- Permissions request handling

### 4.4 Scan Capture Screen ([`src/screens/ScanCaptureScreen.tsx`](src/screens/ScanCaptureScreen.tsx))

- Auto-display incoming tag ID from BLE reader
- Form fields: Operator (text), Species (dropdown/autocomplete), Location (GPS button + manual entry), Notes (multiline)
- "Duplicate Last Entry" button (copies all metadata except tag ID)
- "Save Scan" button (large, primary action)
- Visual/audio feedback on successful save
- Field-friendly large touch targets

### 4.5 Logbook Screen ([`src/screens/LogbookScreen.tsx`](src/screens/LogbookScreen.tsx))

- Spreadsheet-style scrollable list (FlatList)
- Each row shows: tag ID, timestamp, operator, species
- Search/filter bar (by tag ID, species, operator, date range)
- Swipe actions: Edit, Duplicate, Delete
- Bulk selection mode for batch operations
- Export selected to CSV

### 4.6 Settings Screen ([`src/screens/SettingsScreen.tsx`](src/screens/SettingsScreen.tsx))

- Default operator name
- GPS auto-capture preference
- Species list customization (for dropdown)
- Database stats (total scans, storage used)
- Clear all data (with confirmation)

## Phase 5: CSV Export

### 5.1 CSV Generation

Create [`src/utils/csvExport.ts`](src/utils/csvExport.ts):

- Convert TagScan array to CSV string
- Headers: Tag ID, Timestamp, Operator, Species, Latitude, Longitude, Notes
- Handle special characters and commas in data
- Generate filename with timestamp

### 5.2 Export & Share

- Use expo-sharing to share CSV file
- Option to save to device storage (expo-file-system)
- Success/error notifications
- Loading indicator during export

## Phase 6: UI Polish & Field Usability

### 6.1 Theme & Styling

- Configure React Native Paper theme with agency-appropriate colors
- Dark mode support for low-light field conditions
- Large fonts for outdoor readability

### 6.2 Offline-First UX

- Clear offline indicators
- Queue system for failed operations (for future sync)
- Optimistic UI updates
- Error boundaries for graceful crashes

### 6.3 Field Enhancements

- Haptic feedback on button presses
- Audio notification on successful tag scan
- Prevent accidental data loss (unsaved changes warning)
- Battery optimization considerations

## Phase 7: Testing & Validation

### 7.1 Unit Tests

- Database CRUD operations
- CSV generation with edge cases
- Scan duplication logic
- BLE data parsing

### 7.2 Manual Testing Checklist

- BLE connection/disconnection flow
- Scan capture with all metadata combinations
- Duplicate functionality
- CSV export with various data sizes
- App backgrounding/foregrounding
- Low battery scenarios
- Permission denials

### 7.3 Build & Deploy

- Build development client for iOS/Android
- Create internal test builds (EAS Build)
- Prepare for TestFlight/Play Store internal testing

## Dependencies to Install

```json
{
  "expo": "~50.0.0",
  "expo-sqlite": "~13.0.0",
  "expo-sharing": "~12.0.0",
  "expo-file-system": "~16.0.0",
  "expo-location": "~16.0.0",
  "react-native-paper": "^5.11.0",
  "@react-navigation/native": "^6.1.0",
  "@react-navigation/bottom-tabs": "^6.5.0",
  "react-native-ble-plx": "^3.1.0"
}
```

## Key Implementation Notes

- **BLE Limitations**: Expo Go doesn't support react-native-ble-plx; you'll need to use Expo Dev Client or EAS Build
- **Generic BLE**: Initial implementation will read raw BLE characteristic data; can be adapted when specific reader model is chosen
- **Metadata Duplication**: Store `duplicatedFrom` field to track entry relationships
- **GPS**: Use expo-location with permission handling; allow manual override
- **CSV Format**: Standard format compatible with Excel and database imports
- **Future Backend**: Architecture allows easy addition of Supabase sync layer later

## File Structure

```
/src
  /components
    - ScanListItem.tsx
    - BLEDeviceCard.tsx
    - StatsCard.tsx
  /context
    - ScanContext.tsx
    - BLEContext.tsx
    - AppContext.tsx
  /models
    - types.ts
  /navigation
    - AppNavigator.tsx
  /screens
    - HomeScreen.tsx
    - BLEConnectionScreen.tsx
    - ScanCaptureScreen.tsx
    - LogbookScreen.tsx
    - SettingsScreen.tsx
  /utils
    - database.ts
    - bleManager.ts
    - bleProtocol.ts
    - csvExport.ts
App.tsx
app.json
```

### To-dos

- [ ] Initialize Expo project with TypeScript and install core dependencies
- [ ] Create project folder structure and TypeScript types/models
- [ ] Implement SQLite database setup with CRUD operations
- [ ] Create React Context providers for scans, BLE, and app settings
- [ ] Build BLE manager with device scanning and connection handling
- [ ] Configure React Navigation with bottom tabs
- [ ] Create Home screen with connection status and quick actions
- [ ] Create BLE Connection screen for device pairing
- [ ] Create Scan Capture screen with metadata form and duplication
- [ ] Create Logbook screen with spreadsheet-style list and search
- [ ] Create Settings screen for app configuration
- [ ] Build CSV generation and export/sharing functionality
- [ ] Apply Material Design theme and field-friendly UX enhancements
- [ ] Write unit tests and perform manual testing checklist
