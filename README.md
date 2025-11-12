# Tagster - PIT Tag Mobile Scanner

A mobile-first, offline-capable PIT (Passive Integrated Transponder) tag scanning and logging application for fish & wildlife field staff.

## 📱 Overview

Tagster is a React Native app built with Expo that allows field researchers to log PIT tag scans with customizable metadata. The app works completely offline and stores all data locally in SQLite, making it perfect for remote field work.

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

### Coming Soon

- 🔄 **BLE Reader Support** - Auto-capture tag IDs from Bluetooth readers
- 🔄 **CSV Export** - Export scans for database import
- 🔄 **GPS Capture** - Automatically capture location coordinates

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Expo Go app** on your mobile device:
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## 🚀 Getting Started

### 1. Clone or Download the Repository

Navigate to the tagster folder.

### 2. Install Dependencies

Run: npm install

This will install all required packages including React Native, Expo, React Native Paper, and SQLite.

### 3. Start the Development Server

Run: npm start

Or use: npx expo start

### 4. Open on Your Phone

Once the development server starts, you'll see a QR code in your terminal.

**On iOS:**

1. Open the Camera app
2. Point it at the QR code
3. Tap the notification to open in Expo Go

**On Android:**

1. Open the Expo Go app
2. Tap "Scan QR code"
3. Point your camera at the QR code

The app will load on your phone within 10-30 seconds!

## 📱 Using the App

### First Time Setup

1. Go to Settings tab (gear icon)
2. Set your default operator name - This will auto-fill on new scans
3. Optional: Enable GPS auto-capture (coming soon)

### Creating Your First Scan

1. Go to Scan tab (plus icon)
2. Enter a Tag ID (e.g., "999123456789012")
3. Fill in metadata:
   - Operator (auto-filled from settings)
   - Select species from dropdown
   - Select site from dropdown
   - Add optional notes
4. Tap "Save Scan"

### Viewing Your Scans

1. Go to Logbook tab (list icon)
2. Search using the search bar
3. Tap a scan to view full details
4. Tap trash icon to delete a scan

### Tips

- **Duplicate Entry**: On Scan screen, tap the copy icon to duplicate the last scan's metadata
- **Quick Navigation**: Use the Home dashboard for an overview and quick actions
- **Persistence**: All data is saved locally - close and reopen the app anytime

## 🐛 Troubleshooting

### App won't load on phone

- Make sure your phone and computer are on the same WiFi network
- Try restarting the Expo dev server: Ctrl+C then npm start
- Clear Expo Go cache: Shake phone → "Clear Cache"

### "Cannot find module" errors

Run: rm -rf node_modules
Then: npm install

### Database errors

The app will automatically initialize the database on first run. If you encounter issues:

- Uninstall and reinstall the app
- Or use "Clear All Scan Data" in Settings

### TypeScript errors in IDE

Restart your TypeScript server:

- VS Code/Cursor: Cmd+Shift+P → "TypeScript: Restart TS Server"

## 🚧 Roadmap

### Phase 1: MVP (✅ Complete)

- ✅ Manual tag entry
- ✅ Offline SQLite storage
- ✅ Basic CRUD operations
- ✅ Search and filter
- ✅ Material Design UI

### Phase 2: BLE Integration (Next)

- 🔄 Expo Dev Client setup
- 🔄 BLE reader connection
- 🔄 Auto-capture tag IDs

### Phase 3: Data Export

- 🔄 CSV export functionality
- 🔄 Share exported files

### Phase 4: Enhanced Features

- 🔄 GPS coordinate capture
- 🔄 Photo attachments
- 🔄 Cloud sync (optional)

---

**Built with ❤️ for fish & wildlife field researchers**
