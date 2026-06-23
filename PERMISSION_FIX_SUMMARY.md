# Google Play Console Permission Issue - Resolution Summary

## Problem
Google Play Console rejected the app for using `READ_MEDIA_IMAGES` permission without proper justification, requesting either:
1. Migration to Android photo picker, OR
2. Justification for needing broad media access

## Solution Implemented

### ✅ Changes Made

1. **Removed from `android/app/src/main/AndroidManifest.xml`**:
   - `android.permission.READ_EXTERNAL_STORAGE`
   - `android.permission.READ_MEDIA_IMAGES`
   - `android.permission.WRITE_EXTERNAL_STORAGE` (API < 30)

   **Rationale**: The photo picker library (`react-native-image-crop-picker`) uses Android's system file picker, which doesn't require manifest declarations. Permission is requested at runtime only when needed.

2. **Runtime Permission Model**:
   - The `react-native-image-crop-picker` library in [GoLive/index.tsx](src/screens/GoLive/index.tsx#L325) requests permission at runtime
   - Only requested when user explicitly taps "Select Thumbnail"
   - User can deny access and stream creation continues with default thumbnail

3. **Documentation Created**:
   - `GOOGLE_PLAY_PHOTO_PERMISSION_POLICY.md` - Detailed policy compliance documentation
   - `PLAY_CONSOLE_RESPONSE.md` - Short response for Google Play Console (copy-paste ready)

---

## How to Respond to Google Play

1. Go to your app in Google Play Console
2. Navigate to **Policy > App content rating > Sensitive permissions**
3. Find the `READ_MEDIA_IMAGES` or photo permission warning
4. Click "Respond" or "Appeal"
5. Copy the response from [PLAY_CONSOLE_RESPONSE.md](PLAY_CONSOLE_RESPONSE.md)
6. Submit

---

## Why This Works

✅ **Occasional Use**: Photo picker only opens during stream setup (1-2 times per session)

✅ **User-Initiated**: Not automatic or background access

✅ **Single File**: Only 1 image selected and processed per session

✅ **Runtime Permission**: No manifest declaration, permission requested only when needed

✅ **System-Managed**: Delegates to Android's native file picker, not custom scanning

✅ **Secure**: Image URL only kept, local file not retained

---

## Future Enhancement (Optional)

For Android 13+ (API 33+), implement native Photo Picker API:
```kotlin
// This would require ZERO permissions
val intent = Intent(MediaStore.ACTION_PICK_IMAGES)
startActivityForResult(intent, REQUEST_CODE)
```

This was prepared but not needed for the initial submission since runtime permission model is compliant.

---

## Affected Code

The photo picker is only used in:
- [src/screens/GoLive/index.tsx](src/screens/GoLive/index.tsx#L325) - `handleSelectThumbnail()` function

No changes needed here; the library handles runtime permissions automatically.

---

## Build Instructions

```bash
# Rebuild Android app after manifest changes
cd android
./gradlew clean
cd ..
npx react-native run-android

# Or build release APK
cd android
./gradlew assembleRelease
```

---

## Checklist Before Submission

- [ ] Manifest updated (no READ_MEDIA_IMAGES)
- [ ] App rebuilt and tested
- [ ] Thumbnail selection still works
- [ ] Photo permission request appears at runtime (if Android < 13)
- [ ] Response document prepared
- [ ] Submit to Google Play

---

## References

- [Google Play Photo & Video Permission Policy](https://support.google.com/googleplay/android-developer/answer/9888170)
- [Android MediaStore.ACTION_PICK_IMAGES](https://developer.android.com/reference/android/provider/MediaStore#ACTION_PICK_IMAGES)
- [React Native Image Crop Picker Docs](https://github.com/ivpusic/react-native-image-crop-picker)
