/**
 * BLE PIT Tag Reader Configuration
 *
 * WHEN YOU GET YOUR REAL DEVICE:
 * 1. Connect to it
 * 2. Run discovery (see dev panel)
 * 3. Update SERVICE_UUID and CHARACTERISTIC_UUID below
 * 4. Update parseTagData() if needed
 * 5. Done!
 */

// Constant for unconfigured UUID values
export const UNCONFIGURED = "UNCONFIGURED" as const;

// ============================================
// DEVICE SETTINGS
// ============================================

export const READER_CONFIG = {
  // TODO: Update these after running discovery with your device
  SERVICE_UUID: UNCONFIGURED,
  CHARACTERISTIC_UUID: UNCONFIGURED,

  // Will the characteristic send notifications? (true = automatic, false = manual read)
  USE_NOTIFICATIONS: true,
};

// ============================================
// TAG PARSER
// ============================================

/**
 * Parse raw hex from device into formatted tag ID
 *
 * Update this function based on your device's format
 */
export function parseTagData(hexString: string): string | null {
  // Remove whitespace and convert to uppercase
  const cleanHex = hexString.replace(/\s/g, "").toUpperCase();

  // Ignore empty or all-zero data
  if (!cleanHex || /^0+$/.test(cleanHex)) {
    return null;
  }

  // TODO: Add your parsing logic here when you know the format
  // For now, just return the raw hex
  console.log("[Parser] Using raw hex (update parseTagData() for your device)");
  return cleanHex;

  // EXAMPLE: If your device sends ISO FDX-B format (11 bytes = 22 hex chars)
  // Uncomment and modify this when ready:
  /*
  if (cleanHex.length === 22) {
    const countryCode = parseInt(cleanHex.substring(0, 4), 16);
    const animalId = parseInt(cleanHex.substring(4, 16), 16);
    return `${countryCode}-${animalId.toString().padStart(12, '0')}`;
  }
  return cleanHex;
  */
}

// ============================================
// VALIDATION
// ============================================

export function isConfigured(): boolean {
  return (
    READER_CONFIG.SERVICE_UUID !== UNCONFIGURED &&
    READER_CONFIG.CHARACTERISTIC_UUID !== UNCONFIGURED
  );
}
