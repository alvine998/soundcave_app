# Google Play Console: Foreground Service Permission - Panduan Revisi v3

## Status: FIX ROOT CAUSE

**Penolakan sebelumnya**: Google menilai video & deskripsi tidak cukup.
**Root cause sebenarnya**: Manifest declare 3 foreground service types (mediaPlayback, camera, microphone)
tapi implementasi native HANYA ada 1: mediaPlayback via `react-native-music-control`.
`react-native-nodemediaclient` TIDAK membuat foreground service — hanya preview View.

Google mendeteksi mismatch: declare camera/mic foreground service tapi tidak ada service type camera/mic di APK.
=> ditolak.

**FIX v3**:
- AndroidManifest.xml: HAPUS `FOREGROUND_SERVICE_CAMERA` + `FOREGROUND_SERVICE_MICROPHONE`
- Sisa: `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_MEDIA_PLAYBACK` saja
- Deskripsi Play Store: hanya klaim 1 service (mediaPlayback)
- Go Live: jelaskan sebagai fitur foreground biasa (izin CAMERA/RECORD_AUDIO runtime)
- Video baru: HANYA demo music playback foreground service (lebih simple, lebih jelas)

---

## Part 1: Perubahan Manifest (SUDAH DILAKUKAN)

File: `android/app/src/main/AndroidManifest.xml`

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
```

Build version dinaikkan: 46 -> 47 (1.46 -> 1.47)

---

## Part 2: Script Video Baru (90 detik saja, lebih simple!)

### Script: Pemutaran Musik di Latar Belakang

**0:00-0:20** — Buka aplikasi, navigasi ke daftar lagu
- Tunjukkan: layar home dengan daftar lagu / playlist

**0:20-0:40** — Pilih dan putar satu lagu
- Tunjukkan: musik mulai diputar, PlayerBar muncul
- Tarik status bar ke bawah — ZOOM IN ke notifikasi
- Tunjukkan: nama lagu, artis, tombol play/pause/skip di notifikasi
- Narasi (text overlay): "SoundCave menampilkan notifikasi persisten dengan kontrol media"

**0:40-1:00** — Tekan tombol HOME (bukan Back)
- Tunjukkan: layar home Android, notifikasi masih terlihat di status bar
- Tarik status bar ke bawah — notifikasi terlihat penuh
- Musik harus masih terdengar dalam rekaman (pastikan audio unmuted)
- Narasi: "Musik tetap berjalan saat app di latar belakang via foreground service mediaPlayback"

**1:00-1:20** — Tap Pause di NOTIFIKASI
- Tunjukkan: tap tombol Pause di notifikasi
- Musik berhenti
- Narasi: "Pengguna bisa pause langsung dari notifikasi"

**1:20-1:30** — Kembali ke app, tutup player -> notifikasi hilang
- Narasi: "Service berhenti saat user menutup pemutar"

### Tips Rekaman

- Gunakan screen recorder bawaan Android
- Aktifkan "Show touches" di Developer Options
- Perangkat fisik (bukan emulator)
- Pastikan audio musik terdengar di hasil rekaman
- Zoom 2-3 detik di notifikasi
- Upload ke YouTube sebagai UNLISTED
- Judul: "SoundCave — Foreground Service Demo: Media Playback"

---

## Part 3: Update Deskripsi Play Store

Copy dari `GOOGLE_PLAY_DESCRIPTION_INDONESIAN.md` ke Play Console > Store Listing

---

## Part 4: Teks Pernyataan untuk Play Console (BARU - hanya 1 service)

Buka Play Console → SoundCave → Policy → App content → Foreground service → Manage/Edit

```
FOREGROUND SERVICE DECLARATION — SOUNDCAVE v1.47

SoundCave is a music streaming platform whose core feature is continuous background music playback for personal and business use (cafes, restaurants, hotels).

We declare 1 foreground service type:

================================================================
FOREGROUND_SERVICE_MEDIA_PLAYBACK
Type: mediaPlayback
================================================================

Core Feature: Continuous music and podcast streaming while app is in background or screen is locked. This is the PRIMARY function of the app.

Why foreground service is required:
SoundCave's primary function is music streaming. Users start a song, then continue other activities (messaging, browsing, locking screen) while music plays. Without a mediaPlayback foreground service, Android would terminate audio playback whenever the app is not in the foreground. This would make the core feature completely non-functional.

This is standard behavior for ALL music apps (Spotify, YouTube Music, etc.) and is explicitly allowed under Google Play policy for mediaPlayback use case.

How it works:
- Service starts: User taps Play on any song/podcast
- Persistent notification: Shows track title, artist, controls (prev/play-pause/next)
- Service runs: Audio continues while app backgrounded / screen locked
- Service stops: User taps Pause or closes player; notification disappears
- User-initiated: Only starts when user taps Play
- Controllable: User can pause/stop directly from notification

Notification example: "[Song Title] • [Artist]  [⏮] [⏸] [⏭]"

Implementation: Uses react-native-music-control library which creates a NotificationService with foregroundServiceType="mediaPlayback" (see library's AndroidManifest.xml).

================================================================
WHAT WE REMOVED (to fix rejection)
================================================================

Previous version declared FOREGROUND_SERVICE_CAMERA and FOREGROUND_SERVICE_MICROPHONE but did not actually implement foreground services for those types. The NodeMediaClient library only does camera preview/broadcast in foreground Activity, not via foreground service.

In v1.47 we REMOVED those two permissions. Now only mediaPlayback is declared, which matches actual implementation.

CAMERA and RECORD_AUDIO permissions are still used for Go Live feature (live streaming) but via runtime permission request in foreground Activity, NOT via foreground service types.

================================================================
DEMONSTRATION VIDEO
================================================================

Video link: [PASTE YOUR YOUTUBE UNLISTED LINK HERE]

Video demonstrates (90 seconds):
0:00-0:40: User opens SoundCave, plays a song, notification appears with media controls (zoomed in, readable)
0:40-1:00: User presses HOME, app goes to background, music continues (audible), notification remains
1:00-1:20: User taps Pause in notification, music stops
1:20-1:30: User returns to app, closes player, notification disappears

This proves:
- Persistent notification is shown
- Music continues when backgrounded (foreground service working)
- User can control/stop from notification
- Service is user-initiated and stoppable

================================================================
TEST CREDENTIALS
================================================================

Username: [YOUR TEST EMAIL]
Password: [YOUR TEST PASSWORD]
Notes: Login, then tap any song on Home to test playback foreground service.

================================================================
