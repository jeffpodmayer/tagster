# Device Setup

## When You Get Your PIT Tag Reader

1. **Connect**: Open app, connect to reader via BLE
2. **Discover**: Tap "Run Discovery" button
3. **Find UUIDs**: Check console for characteristics marked with ⭐
4. **Update Config**: Open `src/config/bleDeviceConfig.ts`
   - Set `SERVICE_UUID`
   - Set `CHARACTERISTIC_UUID`
5. **Test**: Scan a tag, should auto-populate
6. **Parse**: Update `parseTagData()` if needed to format the tag ID

Done! App will work with all units of that same reader model.
