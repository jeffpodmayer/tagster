# Enhanced Data Collection Fields - Simplified Plan

## Overview

Add new data fields (anesthesia, measurements, clips, GPS, custom fields) using a swipeable tabbed interface optimized for field use with gloves. Include offline voice transcription for Notes, Operator, and custom field values.

## Core Implementation

### 1. Data Model & Database

**File: `src/models/types.ts`**

- Extend `TagScan` with optional fields: anesthesia (concentration, water temp, timing), measurements (fork length, total length, circumference, weight), genetic clip (boolean + ID with G prefix), isotope clip (boolean + ID with I prefix), radio/acoustic notes, customFields (JSON)

**File: `src/utils/database.ts`**

- Add migration to alter `tag_scans` table with new columns (all nullable)
- Update `createScan` and `updateScan` to handle new fields

### 2. Tabbed Form Interface

**File: `src/screens/ScanCaptureScreen.tsx`**

- Replace form with swipeable tabs (use `react-native-pager-view` or React Native Paper `Tabs`)
- Tabs: Tag (Tag ID, Operator), Basic (Species, Site, Notes), Anesthesia, Measurements, Clips (Genetic + Isotope), Radio/Acoustic, Custom Fields, Location (GPS)
- Keep Tag ID visible from all tabs
- Large touch targets (44x44px minimum) for all inputs
- Auto-save form state

### 3. Voice Transcription

**File: `src/utils/voiceTranscription.ts` (new)**

- Offline speech recognition using device-native APIs
- Request microphone permissions
- Return transcribed text

**File: `src/components/VoiceInputButton.tsx` (new)**

- Microphone button (44x44px) with recording indicator
- Integrates with TextInput fields

**File: `src/screens/ScanCaptureScreen.tsx`**

- Add voice input buttons to Notes, Operator, and custom field values

### 4. GPS Capture

**File: `src/utils/location.ts` (new)**

- Use `expo-location` for GPS capture
- Manual capture button in Location tab

### 5. Custom Fields

**File: `src/components/CustomFieldsEditor.tsx` (new)**

- Add/remove key-value pairs
- Voice input for values

### 6. CSV Export Update

**File: `src/utils/csvExport.ts`**

- Update to include all new fields in export

## Files to Modify

- `src/models/types.ts`
- `src/utils/database.ts`
- `src/screens/ScanCaptureScreen.tsx`
- `src/utils/csvExport.ts`

## Files to Create

- `src/utils/location.ts`
- `src/utils/voiceTranscription.ts`
- `src/components/VoiceInputButton.tsx`
- `src/components/CustomFieldsEditor.tsx`
