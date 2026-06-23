# Deskripsi Aplikasi SoundCave - Google Play Store (Indonesian)

> **STATUS: REVISI v2** — Versi sebelumnya ditolak karena deskripsi tidak cukup menjelaskan
> penggunaan Layanan Latar Depan. Versi ini mengintegrasikan penjelasan foreground service
> langsung ke dalam deskripsi fitur utama (bukan hanya di bagian izin).

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
SoundCave menggunakan layanan latar depan Android (foreground service) untuk memutar musik secara terus-menerus. Musik tetap berjalan saat Anda:
• Beralih ke aplikasi lain
• Mengunci layar perangkat
• Meminimalkan aplikasi
Selama pemutaran berlangsung, notifikasi persisten ditampilkan di status bar dengan kontrol pemutaran lengkap (play, pause, lagu berikutnya). Layanan ini hanya aktif saat Anda memutar musik dan berhenti ketika Anda menjeda atau menutup pemutar.

🎥 Siaran Langsung (Live Streaming)
Fitur Go Live menggunakan layanan latar depan kamera dan mikrofon Android untuk menjaga koneksi kamera dan audio selama siaran berlangsung. Selama siaran aktif:
• Notifikasi persisten "Siaran Sedang Berlangsung" ditampilkan
• Siaran tidak terputus meskipun Anda berinteraksi dengan UI aplikasi
• Kamera dan mikrofon tetap terhubung ke server streaming
Layanan ini hanya aktif saat Anda memulai siaran dan berhenti secara otomatis saat Anda mengakhiri siaran.

🎙️ Podcast & Konten Audio
• Dengarkan podcast populer dari berbagai topik
• Konten audio original dari kreator lokal
• Podcast terus diputar di latar belakang via layanan latar depan pemutaran media
• Rekomendasi personal berdasarkan preferensi Anda

🎙️ Solusi Musik untuk Bisnis
Khusus untuk UMKM, Kafe, Restoran, dan Hotel:
• Musik latar belakang (background music) yang diputar terus-menerus menggunakan layanan latar depan
• Musik berlisensi penuh — tanpa khawatir pelanggaran hak cipta
• Playlist yang dikurasi sesuai ambience bisnis
• Akses mudah dari berbagai perangkat

📱 Kontrol via Notifikasi
• Kontrol pemutaran musik dari notifikasi tanpa membuka aplikasi
• Status siaran langsung terlihat di bar notifikasi
• Hentikan layanan kapan saja dengan menjeda musik atau mengakhiri siaran

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
LAYANAN LATAR DEPAN (FOREGROUND SERVICES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SoundCave menggunakan tiga jenis layanan latar depan Android yang merupakan fitur inti aplikasi:

🎵 1. Pemutaran Media (mediaPlayback)
Digunakan untuk memutar musik dan podcast secara berkelanjutan. Saat aktif, notifikasi persisten ditampilkan dengan kontrol play/pause/skip. Layanan dimulai saat pengguna menekan tombol Play dan berhenti saat pengguna menjeda atau menutup pemutar.

📷 2. Kamera (camera)
Digunakan saat pengguna memulai siaran langsung melalui fitur Go Live. Layanan ini menjaga koneksi kamera ke server RTMP agar siaran tidak terputus. Notifikasi persisten menampilkan status "Siaran Aktif". Layanan berhenti saat pengguna mengakhiri siaran.

🎙️ 3. Mikrofon (microphone)
Berjalan bersamaan dengan layanan kamera saat siaran langsung aktif. Menjaga koneksi audio ke server streaming. Berhenti bersamaan saat siaran diakhiri.

Semua layanan latar depan ini:
• Hanya dimulai atas permintaan pengguna (user-initiated)
• Selalu menampilkan notifikasi persisten yang jelas
• Dapat dihentikan kapan saja oleh pengguna
• Merupakan fitur inti yang tidak dapat berfungsi tanpa layanan ini

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

## Tautan Relevan untuk Diisi:

Dalam Google Play Console, tambahkan juga:

**Website**: https://www.soundcave.id (jika ada)

**Email Kontak**: support@soundcave.id

**Kebijakan Privasi**: [URL kebijakan privasi Anda]

**Syarat & Ketentuan**: [URL T&C Anda]

---

## Cara Mengupdate di Google Play Console:

1. Buka Google Play Console
2. Pilih aplikasi SoundCave
3. Klik **Store listing**
4. Scroll ke bagian **Description**
5. Hapus deskripsi lama
6. Tempel deskripsi baru di atas (bagian "Deskripsi Lengkap")
7. Klik **Save**
8. Klik **Review and update** untuk publish perubahan

---

## Catatan:

✅ Deskripsi ini menjelaskan:
- Asal usul Soundcave (2024, respons terhadap kebutuhan bisnis Indonesia)
- Fitur musik streaming utama
- Dukungan untuk UMKM, kafe, restoran, hotel
- Fitur siaran langsung yang unik
- Penjelasan foreground services (untuk mematuhi kebijakan Google Play)
- Privasi dan keamanan
- Informasi kontak dukungan

✅ Menggunakan bahasa Indonesia yang profesional
✅ Fokus pada nilai unik produk Anda
✅ Mematuhi kebutuhan Google Play
✅ Ramah untuk bisnis dan pengguna personal
```
