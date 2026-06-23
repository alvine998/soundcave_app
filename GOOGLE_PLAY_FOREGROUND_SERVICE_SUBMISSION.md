# Google Play Console: Foreground Service Permission - Panduan Revisi v2

## Status: DITOLAK KEDUA KALI

**Alasan penolakan**: Video dan deskripsi dianggap tidak cukup menunjukkan ketergantungan fitur inti pada izin Layanan Latar Depan.

**Yang perlu Anda lakukan**:
1. Rekam ulang video (panduan di bawah) — dengan zoom pada notifikasi persisten
2. Upload ke YouTube sebagai UNLISTED
3. Perbarui deskripsi di Play Store (salin dari file GOOGLE_PLAY_DESCRIPTION_INDONESIAN.md)
4. Submit teks pernyataan baru ke Play Console dengan link video baru
5. Sertakan kredensial pengujian

---

## Part 1: KENAPA VIDEO SEBELUMNYA DITOLAK

Google menolak karena video tidak cukup jelas menunjukkan:
- Notifikasi persisten yang **terbaca jelas** (harus zoom in)
- Fitur tetap berjalan saat app **diminimalkan** (tekan HOME, bukan back)
- Audio musik **terdengar** dalam rekaman layar

Bukan yang diperlukan: musik berputar di dalam app saja.
Yang diperlukan: musik berputar → tekan HOME → notifikasi TERLIHAT JELAS di layar → musik masih terdengar.

---

## Part 2: Script Video Wajib (2-3 menit)

### SCENE 1: Pemutaran Musik di Latar Belakang (0:00 – 1:10)

**0:00–0:20** — Buka aplikasi, navigasi ke daftar lagu
- Tunjukkan: layar beranda dengan daftar lagu

**0:20–0:40** — Pilih dan putar satu lagu
- Tunjukkan: musik mulai diputar
- **WAJIB**: Tarik status bar ke bawah — ZOOM IN ke notifikasi
- Tunjukkan: nama lagu, nama artis, tombol play/pause/skip di notifikasi
- Narasi: "Notifikasi ini menunjukkan layanan latar depan pemutaran media sedang aktif"

**0:40–1:00** — Tekan tombol HOME (bukan Back)
- Tunjukkan: layar home Android dengan notifikasi masih terlihat di status bar
- **WAJIB**: Tarik status bar ke bawah untuk menampilkan notifikasi secara penuh
- Musik harus masih terdengar dalam rekaman
- Narasi: "Aplikasi sudah diminimalkan tetapi musik tetap berjalan. Ini karena SoundCave menggunakan layanan latar depan pemutaran media Android."

**1:00–1:10** — Tap tombol pause di NOTIFIKASI (tanpa membuka app)
- Tunjukkan: musik berhenti
- Narasi: "Pengguna bisa mengontrol pemutaran langsung dari notifikasi"

### SCENE 2: Siaran Langsung (1:10 – 2:30)

**1:10–1:30** — Buka app, navigasi ke fitur "Go Live"
- Tunjukkan: layar Go Live dengan preview kamera aktif

**1:30–1:50** — Isi judul siaran, tekan "Mulai Siaran"
- Tunjukkan: siaran dimulai, preview kamera berjalan

**1:50–2:05** — WAJIB: Tarik status bar ke bawah
- Tunjukkan: ZOOM IN ke notifikasi "Siaran Sedang Berlangsung" / "Live Streaming Active"
- Pastikan notifikasi terbaca jelas
- Narasi: "Notifikasi ini menunjukkan layanan latar depan kamera dan mikrofon sedang aktif"

**2:05–2:20** — Tekan HOME
- Tunjukkan: layar home dengan notifikasi siaran masih ada di status bar
- Tarik status bar untuk menampilkan notifikasi penuh
- Narasi: "Siaran tetap aktif saat app diminimalkan. Kamera dan mikrofon terus terhubung melalui layanan latar depan."

**2:20–2:30** — Kembali ke app, akhiri siaran
- Tunjukkan: notifikasi hilang setelah siaran diakhiri
- Narasi: "Layanan berhenti saat pengguna mengakhiri siaran"

### Tips Teknis Rekaman

- Gunakan Android screen recorder bawaan (swipe down → Screen Record)
- Aktifkan "Show touches" di Developer Options agar tap terlihat
- Gunakan perangkat fisik (bukan emulator) untuk audio yang jelas
- Brightness maksimum agar notifikasi terbaca
- Saat zoom in ke notifikasi: tahan 2-3 detik sebelum lanjut
- Pastikan suara musik terdengar dalam audio rekaman layar

### Upload Video ke YouTube

1. Buka youtube.com → klik ikon + → Upload video
2. Pilih file rekaman layar
3. Judul: "SoundCave — Foreground Service Demo: Music Playback & Live Streaming"
4. Visibility: UNLISTED (bukan Private, bukan Public)
5. Klik Publish → Copy link

---

## Part 3: Update Deskripsi Aplikasi di Play Store

PENTING: Lakukan ini SEBELUM submit ulang pernyataan.

1. Buka Google Play Console → Pilih SoundCave
2. Klik Store listing (Informasi toko)
3. Scroll ke App description (Deskripsi aplikasi)
4. Ganti dengan deskripsi dari file GOOGLE_PLAY_DESCRIPTION_INDONESIAN.md
5. Klik Save

Deskripsi baru mengintegrasikan penjelasan foreground service langsung ke dalam deskripsi fitur (bukan hanya di bagian izin terpisah).

---

## Part 4: Teks Pernyataan untuk Play Console

Buka Google Play Console → SoundCave → App content → Review questionnaire → Foreground services → EDIT

Salin teks berikut PERSIS ke kotak pernyataan (ganti [YOUTUBE LINK] dan [KREDENSIAL]):

---

FOREGROUND SERVICE PERMISSION DECLARATION — SOUNDCAVE

SoundCave is a music streaming and live broadcasting application. It uses three foreground service types, each essential to a distinct core feature. All services are user-initiated, display a persistent notification, and stop when the user terminates the feature.

================================================================
1. FOREGROUND_SERVICE_MEDIA_PLAYBACK
   Type: mediaPlayback
================================================================

Core Feature: Continuous music and podcast streaming

Why foreground service is required:
SoundCave's primary function is music streaming. Users start a song, then continue other activities (messaging, browsing, reading) while music plays. Without a mediaPlayback foreground service, Android's process management would terminate audio playback whenever the app is not in the foreground. This would make the music streaming feature completely non-functional — equivalent to removing the core feature of the app.

How it works:
- Service starts: User taps Play on any song or podcast
- Persistent notification appears: Shows track title, artist name, and media controls (previous / play-pause / next)
- Service runs: Audio continues playing while app is in background or screen is locked
- Service stops: User taps Pause then closes the player, or kills the app

Notification example: "[Song Title] • [Artist Name] [⏮] [⏸] [⏭]"

================================================================
2. FOREGROUND_SERVICE_CAMERA
   Type: camera
================================================================

Core Feature: Live video broadcasting ("Go Live")

Why foreground service is required:
SoundCave's "Go Live" feature lets users broadcast live video via RTMP to a streaming server. Without a camera foreground service, Android would revoke camera access when another app uses the camera or when system resources are under pressure. This would abruptly cut the live stream — breaking the broadcast for all viewers watching.

How it works:
- Service starts: User taps "Start Broadcast" in the Go Live screen
- Persistent notification appears: Shows "Live Streaming Active" with an End Stream action
- Service runs: Camera frames are continuously captured and sent to the RTMP streaming server
- Service stops: User taps "End Stream" in app or in notification; camera is released

Notification example: "SoundCave — Live Streaming Active [End Stream]"

================================================================
3. FOREGROUND_SERVICE_MICROPHONE
   Type: microphone
================================================================

Core Feature: Live audio capture during broadcasting

Why foreground service is required:
The microphone foreground service runs concurrently with the camera foreground service during live broadcasts. Without a microphone foreground service, the system may revoke microphone access mid-broadcast, resulting in silent or broken audio for all viewers.

How it works:
- Service starts: Simultaneously with the camera foreground service, when user taps "Start Broadcast"
- Persistent notification: Same "Live Streaming Active" notification as the camera service
- Service runs: Microphone audio is captured continuously and mixed into the RTMP stream
- Service stops: Simultaneously with the camera service when user ends the broadcast

================================================================
DEMONSTRATION VIDEO
================================================================

Video link: [PASTE YOUR YOUTUBE UNLISTED LINK HERE]

The video demonstrates:
0:00–1:10 — Music playback foreground service:
  - User plays a song
  - Persistent notification with track controls is shown (zoomed in, clearly readable)
  - User presses HOME; app goes to background
  - Music continues playing (audible in recording)
  - Notification remains visible in status bar
  - User taps Pause in notification — music stops

1:10–2:30 — Camera & microphone foreground services:
  - User opens Go Live feature
  - User starts a live stream
  - Persistent notification "Live Streaming Active" is shown (zoomed in, clearly readable)
  - User presses HOME; stream continues (notification still visible)
  - User returns to app, ends stream
  - Notification disappears

================================================================
TEST CREDENTIALS
================================================================

Username: [MASUKKAN EMAIL AKUN TEST]
Password: [MASUKKAN PASSWORD AKUN TEST]
Notes: Account has full access to music library and Go Live feature. No payment required. To test music playback: tap any song on the Home screen. To test Go Live: tap the Go Live icon.

---

## Checklist Sebelum Submit

- [ ] Video baru sudah direkam (notifikasi terlihat jelas dan terbaca saat di-zoom)
- [ ] Video sudah diupload ke YouTube sebagai UNLISTED
- [ ] YouTube link sudah disalin
- [ ] Deskripsi Play Store sudah diperbarui (dari file GOOGLE_PLAY_DESCRIPTION_INDONESIAN.md)
- [ ] Teks pernyataan di atas sudah diisi dengan link video dan disalin ke Play Console
- [ ] Kredensial pengujian (email + password) sudah diisi di Play Console
- [ ] Klik Save lalu Submit
