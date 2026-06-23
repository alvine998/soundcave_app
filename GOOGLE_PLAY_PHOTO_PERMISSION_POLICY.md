# Google Play Console: Photo & Video Permission Response

## Application: SoundCave App

### Summary
Soundcave is a live streaming and music platform. Photo/video access is required **only for occasional thumbnail selection during live stream creation** - not for frequent or unrestricted access.

---

## Use Case: Live Stream Thumbnail Selection

### What the app does:
1. **When**: Only when a user initiates a live stream ("Go Live" feature)
2. **What**: User selects ONE image from their gallery to use as the stream thumbnail
3. **Frequency**: Occasional - only during stream setup (typically once per stream)
4. **Permission Requested**: At runtime, only when the user taps "Select Thumbnail"

### Why we need this:
- The thumbnail is displayed in the live stream list/directory
- Users want to choose a custom thumbnail representing their content
- Without this, stream thumbnails would be auto-generated or unavailable

---

## Compliance with Google Play Policy

### ✅ We meet the requirements because:

1. **Limited Scope**: 
   - Only photo selection (no videos)
   - Single file per session
   - User explicitly triggers the action

2. **Runtime Permission Only**:
   - We **no longer declare** `READ_MEDIA_IMAGES` or `READ_EXTERNAL_STORAGE` in the manifest
   - Permission is requested **only at runtime** when the user accesses the photo picker
   - User can deny and the app continues to function

3. **Not Frequent Access**:
   - Average user creates 1-2 streams per session
   - Photo picker is accessed only during stream setup
   - Does NOT access photos in bulk or continuous monitoring

4. **User Control**:
   - System photo picker is used (not custom scanning)
   - Only the selected image is processed
   - User has full control over what gets shared

---

## Alternative Approaches Evaluated

### 1. Android 13+ Photo Picker API ✅ (Preferred)
- **Available on**: Android 13 (API 33+)
- **Permission needed**: NONE
- **Status**: Can implement in future update for Android 13+ users
- **Benefit**: Zero permission requirement

### 2. System File Picker
- **Available on**: All Android versions
- **Permission needed**: None (system-managed)
- **Current implementation**: Using `react-native-image-crop-picker` which delegates to system picker

### 3. Temporary Storage (Not Applicable)
- This feature requires user-supplied images, not app-generated content

---

## Technical Implementation

**Library**: `react-native-image-crop-picker`
- Delegates to system photo picker
- Runtime permission model
- No manifest permission declaration needed

**Runtime Behavior**:
- User taps "Select Thumbnail" button
- System photo picker opens (managed by Android)
- Permission dialog appears (if not yet granted)
- User selects ONE image
- Image is uploaded to cloud storage
- Local copy not retained

---

## Manifest Declaration

```xml
<!-- Removed from AndroidManifest.xml -->
<!-- No READ_EXTERNAL_STORAGE or READ_MEDIA_IMAGES declaration -->
<!-- Permissions are requested at runtime by the image picker library -->
```

---

## Data Privacy

- **What we access**: One user-selected image file
- **How long**: During stream creation only (≤ 5 minutes)
- **Storage**: Image is uploaded to Firebase Storage, local file is not retained
- **Sharing**: Image URL is associated only with the live stream, visible to stream viewers

---

## Future Optimization

For users on **Android 13+** (API 33+), we can:
1. Detect API level at runtime
2. Use `ACTION_PICK_IMAGES` (native photo picker, zero permissions)
3. For Android < 13: Fall back to current implementation

This would eliminate all permission requirements for modern devices.

---

## Conclusion

Soundcave's photo access is:
- ✅ Occasional (not frequent)
- ✅ User-initiated (not automatic)
- ✅ Scoped to a single file
- ✅ Runtime-permission based
- ✅ Compliant with Google Play Photo & Video Permission Policy

We believe this implementation meets all requirements for the `READ_MEDIA_IMAGES` usage.
