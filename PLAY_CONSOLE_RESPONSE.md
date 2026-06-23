# Google Play Console: Jawaban Singkat untuk Policy Compliance

## Bahasa Indonesia

Aplikasi Soundcave menggunakan akses foto **hanya untuk pemilihan thumbnail sekali saat pengguna membuat live stream**. 

**Penjelasan penggunaan READ_MEDIA_IMAGES:**

Kami menggunakan akses ke galeri foto hanya dalam fitur "Go Live" (siaran langsung). Saat pengguna akan memulai siaran:

1. **Kapan**: Hanya saat membuat/menjadwalkan live stream
2. **Apa**: Pengguna memilih 1 gambar dari galeri untuk thumbnail stream
3. **Berapa sering**: Sesekali saja (1-2 kali per sesi, hanya saat setup stream)
4. **Bagaimana**: Menggunakan system photo picker bawaan Android

Pengguna memiliki kontrol penuh - hanya 1 file yang dipilih dan diproses, lalu diunggah ke server kami. Kami tidak melakukan akses massal atau pemantauan berkelanjutan.

**Kami telah menghapus deklarasi permission dari manifest dan hanya meminta permission saat runtime ketika pengguna membuka photo picker.**

Untuk Android 13+, kami dapat menggunakan native Photo Picker API tanpa membutuhkan permission sama sekali.

---

## English Version

Soundcave uses photo access **only for occasional thumbnail selection during live stream creation**.

**Explanation of READ_MEDIA_IMAGES usage:**

We access the photo gallery exclusively in the "Go Live" (live streaming) feature. When a user creates a stream:

1. **When**: Only during live stream setup
2. **What**: User selects 1 image from their gallery as the stream thumbnail
3. **How often**: Occasionally only (1-2 times per session, only during stream setup)
4. **How**: Using Android's system photo picker

Users have full control - only 1 selected file is processed and uploaded to our server. We do not perform bulk access or continuous monitoring.

**We have removed permission declarations from the manifest and only request permission at runtime when the user opens the photo picker.**

For Android 13+, we can use the native Photo Picker API without requiring any permissions.

---

## Data Flow Diagram

```
User taps "Select Thumbnail"
    ↓
System asks for permission (if not granted)
    ↓
Android photo picker opens (system-managed)
    ↓
User selects 1 image
    ↓
Image uploaded to cloud storage
    ↓
Local file deleted/not retained
    ↓
Thumbnail URL associated with live stream
```

**Total access duration**: < 5 minutes per stream creation
**Permission scope**: Single file only
**Data retention**: Image URL only (original file not stored locally)
