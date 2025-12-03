# Tagster - PIT Tag Mobile Scanner

A mobile-first, offline-capable PIT (Passive Integrated Transponder) tag scanning and logging application for fish & wildlife field staff.

## 📱 Overview

Tagster is a React Native app allows field researchers to log PIT tag scans with customizable metadata. The app works completely offline and stores all data locally in SQLite, making it perfect for remote field work. Need to have super duper redunant PIT tag data storage. 

## Questions that are coming up:

- What are the metadata types? What are the headers on the CSV that gets uplaoded?
- What is the whole flow from Scanning the tag to uploading the data?
- What is the format of the PIT Tag data and how is created/where does it come from?
- Can we connect the existing app to a HPRLite or similiar device and get the device information to build a device library/configuration file?

## 🛠 Tech Stack

### Frontend & Framework

- **React Native** - Cross-platform mobile framework
- **Expo** (~54.0) - Development platform and managed workflow
- **TypeScript** - Type-safe development
- **React Native Paper** - Material Design UI components

### State Management & Data

- **React Context API** - Global state management
- **expo-sqlite** - Local SQLite database for offline storage
- **AsyncStorage** - Settings persistence

### Navigation & Routing

- **React Navigation** - Bottom tab navigation
- **@react-navigation/bottom-tabs** - Tab-based navigation

### Utilities

- **uuid** - Unique ID generation for database records
- **react-native-get-random-values** - Cryptographic random values for UUID

## ✨ Features

### Current

- ✅ **Manual Tag Entry** - Enter PIT tag IDs manually
- ✅ **Metadata Capture** - Log operator, species, site, and notes
- ✅ **Offline Storage** - SQLite database, works without internet
- ✅ **Search & Filter** - Search scans by tag ID, operator, species, or site
- ✅ **Duplicate Entry** - Copy metadata from last scan for faster data entry
- ✅ **Settings Management** - Configure default operator and preferences
- ✅ **Material Design UI** - Beautiful, themed interface with dark mode support
- ✅ **Statistics Dashboard** - View scan counts and recent activity

### Future Features and Implementation

- 🔄 **BLE Reader Support** - Auto-capture tag IDs from Bluetooth readers
- 🔄 **CSV Export** - Export scans for database import
- 🔄 **GPS Capture** - Automatically capture location coordinates

## 📋 Prerequisites

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Xcode** (for iOS development)
- **USB cable** (to connect your iPhone to Mac)

**Note:** This app uses Bluetooth Low Energy (BLE), which requires a development build instead of Expo Go.

## 🚀 Getting Started

### 1. Clone or Download the Repository

Navigate to the tagster folder.

### 2. Install Dependencies

Run: npm install

This will install all required packages including React Native, Expo, React Native Paper, and SQLite.

### 3. Connect Your iPhone

- Plug your iPhone into your Mac with a USB cable
- Unlock your phone and trust the computer if prompted

### 3. First-Time Build in Xcode

npx expo run:ios

This will:

- Open the project in Xcode automatically
- Build the app with BLE support
- Install it on your connected iPhone

**First time in Xcode?** You may need to:

- Select your Apple ID as the development team
- On your iPhone: Settings → General → VPN & Device Management → Trust your developer certificate

### 4. Daily Development

After the initial Xcode build, start the dev server:

npm run start:usb

Then scan the QR code with your iPhone camera to load updates.

**Important:** Keep your phone plugged in via USB when using `npm run start:usb`.

### 5. When to Rebuild in Xcode

Only rebuild with `npx expo run:ios` when:

- Adding/removing native dependencies
- Updating Expo SDK version
- Changing `app.json`

For regular code changes (TypeScript/React): just save and reload (shake phone → Reload).

## 📱 Using the App

### First Time Setup

1. Go to Settings tab (gear icon)
2. Set your default operator name - This will auto-fill on new scans

### Creating Your First Scan

1. Go to Scan tab (plus icon)
2. Enter a Tag ID (e.g., "999123456789012")
3. Fill in metadata:
   - Operator (auto-filled from settings)
   - Select species from dropdown
   - Select site from dropdown
   - Add optional notes
4. Tap "Save Scan"

### Tips

- **Duplicate Entry**: On Scan screen, tap the copy icon to duplicate the last scan's metadata
- **Quick Navigation**: Use the Home dashboard for an overview and quick actions
- **Persistence**: All data is saved locally - close and reopen the app anytime
- **Testing BLE**: All features work without a physical tag reader. See `README_DEVICE_SETUP.md` for connecting real hardware.

## 🐛 Troubleshooting

### App won't load after scanning QR code

- Make sure USB cable is connected
- Try restarting: Ctrl+C then `npm run start:usb`
- If still stuck, rebuild: `npx expo run:ios`

### "Cannot find module" errors

rm -rf node_modules
npm install

### Database errors

The app automatically initializes the database on first run. If issues occur:

- Uninstall and reinstall the app
- Or use "Clear All Scan Data" in Settings

### TypeScript errors in IDE

Restart your TypeScript server:

- VS Code/Cursor: Cmd+Shift+P → "TypeScript: Restart TS Server"

### Xcode build errors

- Make sure Xcode is up to date
- Clean build folder: Xcode → Product → Clean Build Folder
- Delete `ios` folder and run `npx expo prebuild` then `npx expo run:ios`

## 👨‍💻 Developer Notes

### When to Rebuild

Rebuild with `npx expo run:ios` only when:

- Adding/removing native dependencies
- Updating Expo SDK
- Changing `app.json`

For code changes: just save and reload.

### BLE Development

Developer panel in Scan screen:

- **Run Discovery** - Find device UUIDs for configuration. See `README_DEVICE_SETUP.md` for connecting real hardware.

### Project Structure

- **`src/components/`** - Reusable UI components (BLE modals, FABs)
- **`src/config/`** - Device configuration (bleDeviceConfig.ts)
- **`src/context/`** - State management (App, BLE, Scan contexts)
- **`src/data/`** - Static data (metadata.json)
- **`src/models/`** - TypeScript types
- **`src/navigation/`** - React Navigation setup
- **`src/screens/`** - Main app screens (Home, Scan, Logbook, Settings)
- **`src/styles/`** - Theme and styling
- **`src/utils/`** - Helper functions (BLE & database utilities)

## Deployment

### Branch Strategy

- dev - Development (default)
- stage - TestFlight builds
- prod - App Store releases

### TestFlight Deployment

1. Switch to stage branch:
   git checkout stage

2. Build and submit:
   eas build --platform ios --profile preview
   eas submit --platform ios

3. Add testers in App Store Connect -> TestFlight -> Internal Testing

### Prerequisites

- Apple Developer Account
- EAS CLI: npm install -g eas-cli
- App created in App Store Connect with bundle ID: com.jeffandmarshall.tagster

### Important Notes

- Build numbers must increment for each build (in app.json)
- First build takes 12-24 hours to process
- TestFlight builds expire after 90 days

## 🚧 Roadmap

### Phase 1: MVP (✅ Complete)

- ✅ Manual tag entry
- ✅ Offline SQLite storage
- ✅ Basic CRUD operations
- ✅ Search and filter
- ✅ Material Design UI

### Phase 2: BLE Integration (In Progress)

- ✅ Development build setup
- ✅ BLE infrastructure (scanning, connecting, discovery)
- ✅ Device configuration system
- 🔄 PIT tag reader integration (awaiting hardware)
- 🔄 Auto-capture tag IDs

### Phase 3: Data Export(✅ Complete)

- ✅ CSV export functionality
- ✅ Share exported files

### Phase 4: Enhanced Features (Long Term Vision Ideas)

- 🔄 GPS coordinate capture
- 🔄 Find a Tag Feature - if you found multiple tags in one wave scan
- 🔄 Vibrate on Scan
- 🔄 Photo attachments
- 🔄 Cloud sync (optional)

## Thoughts from meeting with Hannah (11/21/25)
- With larger tagging effforts the currrent design is not setup for an easy way to upload the data.
- Easily add fields and store data
- They want ways to build a form that would work for capturing and organizing PIT tag data
- Be able to Add Fields
- Every time ou are hiking a stream - when you have fish capture can we populate the geolocation of the tag.

### Notes that are common 
- anastesia, concentration, water temp for anastesia, timing of anastesia
- length - fork lenght total length, around body cirfumfrence of fish
- weight in grams
- genetic clip - yes or no and clipID - G preface on ID
- clip for stable isotopesID - I for isotopes
- notes on radio or acoustic tag
- Insert PIT tags
- Release notes and Addiotnal Notes
- ShinyApps are a common thing that folks build through
- barretthannahs@gmail.com

---

**Built with ❤️ for fish & wildlife field researchers**
