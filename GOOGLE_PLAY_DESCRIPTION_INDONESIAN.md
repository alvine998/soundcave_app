# Deskripsi Aplikasi SoundCave - Google Play Store (Indonesian)

> **STATUS: REVISI v3** - FIX FOREGROUND_SERVICE
> Manifest sekarang HANYA declare FOREGROUND_SERVICE + FOREGROUND_SERVICE_MEDIA_PLAYBACK
> (camera/mic foreground types dihapus karena NodeMediaClient tidak implement foreground service)
> Video baru HANYA perlu demo music playback foreground service.

Gunakan deskripsi berikut di Google Play Console > Store listing > Description:

---

## Deskripsi Lengkap:

```
🎵 SoundCave - Digital Streaming Music

Layanan Streaming Musik, Podcast, dan Konten Audio Legal untuk Semua

Soundcave adalah platform streaming musik digital yang menyediakan akses unlimited ke ribuan lagu, podcast, dan konten audio berkualitas tinggi. Diakses melalui internet di ponsel, komputer, tablet, speaker, TV, dan mobil Anda.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TENTANG SOUNDCAVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Soundcave lahir dari keprihatinan kami ketika melihat kekosongan musik yang diputar di kafe, hotel, dan restoran di Indonesia. Pada tahun 2024, kami memahami bahwa bisnis UMKM, kafe, restoran, dan hotel membutuhkan solusi musik legal yang terjangkau dan mudah digunakan.

Misi kami: Membawa musik berkualitas ke setiap sudut bisnis Indonesia sambil memberikan pengalaman streaming terbaik untuk pengguna personal.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FITUR UTAMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎵 Pemutaran Musik di Latar Belakang
SoundCave menggunakan layanan latar depan Android (foreground service) jenis Pemutaran Media (mediaPlayback) untuk memutar musik secara terus-menerus. Musik tetap berjalan saat Anda:
• Beralih ke aplikasi lain
• Mengunci layar perangkat
• Meminimalkan aplikasi
Selama pemutaran berlangsung, notifikasi persisten ditampilkan di status bar dengan kontrol pemutaran lengkap (play, pause, lagu berikutnya). Layanan ini hanya aktif saat Anda memutar musik dan berhenti ketika Anda menjeda atau menutup pemutar. Ini adalah fitur inti aplikasi.

🎥 Siaran Langsung (Live Streaming)
Fitur Go Live memungkinkan Anda menyiarkan video langsung via RTMP ke penonton. Kamera dan mikrofon digunakan hanya saat Anda berada di dalam layar siaran (foreground) dan meminta izin runtime CAMERA & RECORD_AUDIO. Siaran berjalan di foreground dan akan berhenti jika Anda keluar dari layar siaran.

🎙️ Podcast & Konten Audio
• Dengarkan podcast populer dari berbagai topik
• Konten audio original dari kreator lokal
• Podcast terus diputar di latar belakang via layanan latar depan pemutaran media
• Rekomendasi personal berdasarkan preferensi Anda

🎙️ Solusi Musik untuk Bisnis
Khusus untuk UMKM, Kafe, Restoran, dan Hotel:
• Musik latar belakang (background music) yang diputar terus-menerus menggunakan layanan latar depan pemutaran media
• Musik berlisensi penuh — tanpa khawatir pelanggaran hak cipta
• Playlist yang dikurasi sesuai ambience bisnis
• Akses mudah dari berbagai perangkat

📱 Kontrol via Notifikasi
• Kontrol pemutaran musik dari notifikasi tanpa membuka aplikasi
• Hentikan musik kapan saja dengan menjeda dari notifikasi atau menutup pemutar

💬 Fitur Sosial
• Buat dan bagikan playlist dengan teman
• Lihat apa yang sedang didengarkan teman-teman
• Komunitas musik Indonesia yang aktif

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAKET UNTUK BISNIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Khusus untuk bisnis Anda:
• Musik latar (background music) tanpa gangguan iklan
• Perpustakaan musik berlisensi lengkap
• Akses dari beberapa perangkat sekaligus
• Dukungan pelanggan prioritas
• Playlist yang dikurasi profesional

Cocok untuk:
✓ Kafe dan Kedai Kopi
✓ Restoran dan Rumah Makan
✓ Hotel dan Resort
✓ Salon dan Spa
✓ Toko Retail
✓ UMKM Lainnya

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MENGAPA MEMILIH SOUNDCAVE?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Musik Legal - Semua hak cipta terbayar
✅ Harga Terjangkau - Dari personal hingga bisnis
✅ Kualitas Tinggi - Audio berkualitas tinggi
✅ Tanpa Gangguan - Mendengarkan tanpa batas
✅ Lokal + Global - Musik Indonesia dan Internasional
✅ Dukungan Lokal - Tim dukungan dalam bahasa Indonesia

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYANAN LATAR DEPAN (FOREGROUND SERVICE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SoundCave menggunakan SATU jenis layanan latar depan Android sebagai fitur inti:

🎵 Pemutaran Media (mediaPlayback)
Digunakan untuk memutar musik dan podcast secara berkelanjutan saat aplikasi di latar belakang atau layar terkunci. Saat aktif, notifikasi persisten ditampilkan dengan kontrol play/pause/skip. Layanan dimulai saat pengguna menekan Play dan berhenti saat pengguna menjeda atau menutup pemutar.

Detail izin:
• FOREGROUND_SERVICE + FOREGROUND_SERVICE_MEDIA_PLAYBACK
• Hanya dimulai atas permintaan pengguna (user-initiated)
• Selalu menampilkan notifikasi persisten yang jelas
• Dapat dihentikan kapan saja oleh pengguna (pause/stop)
• Tanpa layanan ini, musik akan berhenti saat aplikasi di latar belakang — fitur inti menjadi tidak berfungsi

Izin CAMERA & RECORD_AUDIO digunakan untuk fitur Go Live (preview & siaran foreground) melalui izin runtime, bukan melalui foreground service type camera/microphone.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRIVASI & KEAMANAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Data Anda dienkripsi saat transmisi
• Kami tidak menjual data pribadi Anda
• Izin hanya digunakan untuk fitur yang dijelaskan
• Privasi adalah prioritas kami

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DUKUNGAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pertanyaan atau masalah? Hubungi kami:
📧 Email: support@soundcave.id
🌐 Website: www.soundcave.id
📱 WhatsApp: [nomor support]

Terima kasih telah memilih SoundCave - Platform Musik Indonesia!

Selamat menikmati musik berkualitas.
```

---

## Ringkasan Deskripsi (Short Description - 80 karakter):

```
Streaming musik, podcast, dan konten audio berkualitas tinggi. Solusi musik legal untuk bisnis Anda.
```

---

## Catatan v3:

✅ Manifest sekarang HANYA declare mediaPlayback (1 service type)
✅ Deskripsi hanya klaim 1 foreground service
✅ Go Live dijelaskan sebagai fitur foreground biasa (bukan foreground service)
✅ Video demo baru HANYA perlu: play musik -> HOME -> notifikasi terlihat -> pause dari notifikasi
