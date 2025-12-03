export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: 'recommend' | 'popular' | 'new';
  content: string;
};

export const NEWS_BACKDROPS = [
  'https://images.pexels.com/photos/164745/pexels-photo-164745.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1647457/pexels-photo-1647457.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/164863/pexels-photo-164863.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/210256/pexels-photo-210256.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/995301/pexels-photo-995301.jpeg?auto=compress&cs=tinysrgb&w=800',
];

// Static mock data for now. Later this can be replaced with API / Firebase.
export const NEWS: NewsItem[] = [
  {
    id: 'news-1',
    title: 'SoundCave Launches Curated Indie Spotlight',
    summary: 'Temukan rilisan indie terbaru pilihan editor yang dikurasi khusus untuk pendengar SoundCave.',
    date: '2025-12-01',
    category: 'recommend',
    content:
      'SoundCave resmi meluncurkan kurasi “Indie Spotlight” untuk membantu kamu menemukan rilisan independen terbaru yang mungkin belum masuk playlist besar.\n\nSetiap minggu, tim editorial SoundCave akan memilih beberapa album, single, dan EP dari musisi independen lokal maupun internasional. Fokusnya bukan hanya pada jumlah stream, tapi juga karakter suara, kualitas produksi, dan cerita di balik lagu.\n\nBuka SoundCave setiap akhir pekan untuk melihat update terbaru di section Indie Spotlight, dan jangan lupa simpan track favoritmu ke playlist pribadi.',
  },
  {
    id: 'news-2',
    title: 'Podcast “Soundcave Sessions” Musim Baru',
    summary: 'Musim terbaru Soundcave Sessions hadir dengan obrolan eksklusif bersama musisi independen.',
    date: '2025-11-25',
    category: 'popular',
    content:
      'Podcast “Soundcave Sessions” kembali dengan musim baru yang menghadirkan musisi lintas genre untuk ngobrol santai seputar proses kreatif, industri musik, hingga cerita personal di balik lagu.\n\nDi musim ini, kami menyiapkan episode spesial dengan format live session langsung dari studio SoundCave. Kamu bisa mendengarkan versi intim dari lagu-lagu favorit sekaligus mendengar komentar langsung dari artisnya.\n\nIkuti dan aktifkan notifikasi podcast Soundcave Sessions agar tidak ketinggalan rilis episode terbaru setiap minggu.',
  },
  {
    id: 'news-3',
    title: 'Update Player: Kontrol Musik Lebih Intuitif',
    summary: 'Pengalaman memutar musik kini lebih halus dengan kontrol baru di Full Player dan PlayerBar.',
    date: '2025-11-10',
    category: 'new',
    content:
      'Kami merilis update baru untuk player SoundCave yang membuat kontrol musik terasa lebih halus dan responsif, terutama saat beralih antara PlayerBar dan Full Player.\n\nAnimasi transisi diperhalus, gesture swipe diperbaiki, dan tampilan kontrol dipoles ulang agar tetap minimalis namun jelas terlihat. Selain itu, perbaikan dilakukan pada stabilitas playback ketika berpindah screen.\n\nPastikan kamu sudah menggunakan versi aplikasi terbaru untuk merasakan peningkatan ini.',
  },
  {
    id: 'news-4',
    title: 'Segera Hadir: Video Player untuk Music Video',
    summary: 'Tim SoundCave sedang menyiapkan pemutar video penuh untuk konten Music Video favorit kamu.',
    date: '2025-10-30',
    category: 'recommend',
    content:
      'Section Music Video di SoundCave saat ini masih menampilkan cover dan informasi dasar, namun tim kami sedang menyiapkan pemutar video penuh yang terintegrasi langsung dengan pengalaman mendengarkan musik.\n\nFitur ini dirancang agar tetap ringan, namun nyaman untuk menonton dalam mode portrait maupun landscape. Kami juga sedang menguji berbagai skenario jaringan agar streaming tetap stabil.\n\nRencananya, video player akan dirilis bertahap ke sebagian pengguna terlebih dahulu sebelum tersedia untuk semua orang.',
  },
  {
    id: 'news-5',
    title: 'SoundCave Live: Konser Virtual Akhir Tahun',
    summary: 'Nikmati konser virtual akhir tahun dengan line-up musisi pilihan langsung dari aplikasi SoundCave.',
    date: '2025-10-15',
    category: 'popular',
    content:
      'Menutup tahun 2025, SoundCave akan menggelar konser virtual bertajuk “SoundCave Live: End of Year Sessions”.\n\nKonser ini akan menghadirkan beberapa musisi favorit pengguna dengan format live performance eksklusif yang hanya bisa diakses melalui aplikasi.\n\nPengguna dapat menambahkan jadwal konser ke kalender, memberi pengingat, serta menonton ulang rekaman konser dalam waktu terbatas.',
  },
  {
    id: 'news-6',
    title: 'Fitur Download Offline Segera Hadir',
    summary: 'Tim sedang mengerjakan fitur download agar kamu bisa mendengarkan musik tanpa koneksi internet.',
    date: '2025-10-05',
    category: 'new',
    content:
      'Banyak pengguna meminta fitur untuk mendengarkan musik tanpa koneksi internet. Kami mendengar masukan tersebut dan sedang menyiapkan mode offline di SoundCave.\n\nKamu akan bisa menandai album, playlist, atau lagu tertentu untuk diunduh dan disimpan di perangkat.\n\nSaat fitur ini dirilis, kami juga akan menambahkan pengaturan kualitas dan manajemen storage agar pengalaman tetap ringan.',
  },
  {
    id: 'news-7',
    title: 'Kolaborasi Playlist dengan Teman',
    summary: 'Segera kamu bisa membuat dan mengedit playlist bersama teman secara real-time.',
    date: '2025-09-28',
    category: 'recommend',
    content:
      'Membuat playlist bareng teman akan menjadi lebih mudah dengan fitur Collaborative Playlist.\n\nKamu bisa mengundang teman untuk menambah, mengurutkan, atau menghapus lagu dari playlist yang sama.\n\nFitur ini cocok untuk menyiapkan playlist pesta, road trip, atau sekadar berbagi referensi musik satu sama lain.',
  },
  {
    id: 'news-8',
    title: 'SoundCave Wrapped: Rekap Musik Tahunan Kamu',
    summary: 'Lihat rangkuman lagu, artis, dan genre yang paling sering kamu dengarkan tahun ini.',
    date: '2025-09-15',
    category: 'popular',
    content:
      'SoundCave Wrapped akan menampilkan statistik personal seperti total menit mendengarkan, artis paling sering diputar, lagu favorit, serta genre yang mendominasi tahun kamu.\n\nKami juga menambahkan kartu visual yang bisa langsung kamu bagikan ke media sosial.\n\nWrapped akan tersedia setiap akhir tahun, dan bisa diakses ulang melalui menu profil.',
  },
  {
    id: 'news-9',
    title: 'Mode Fokus dengan Suara Ambient',
    summary: 'Tambahkan suara hujan, white noise, atau ambience kota ke sesi mendengarkanmu.',
    date: '2025-09-01',
    category: 'new',
    content:
      'Mode Fokus di SoundCave menghadirkan berbagai suara ambient seperti hujan, kafe, kereta, hingga white noise.\n\nKamu bisa menggabungkannya dengan playlist instrumental favorit untuk membantu fokus belajar atau bekerja.\n\nSetiap sesi bisa diatur durasinya, lengkap dengan timer otomatis untuk berhenti ketika selesai.',
  },
  {
    id: 'news-10',
    title: 'Kurasi Khusus Musik Lokal',
    summary: 'Section baru “Lokal First” hadir untuk mengangkat musisi Indonesia lintas genre.',
    date: '2025-08-20',
    category: 'recommend',
    content:
      'Kami percaya talenta lokal perlu mendapat panggung yang lebih besar.\n\nMelalui section “Lokal First”, kamu bisa menemukan rilisan terbaru musisi Indonesia dari berbagai genre, mulai dari pop, hip-hop, elektronik, sampai eksperimental.\n\nKurasi ini akan diperbarui setiap minggu oleh tim editorial SoundCave.',
  },
  {
    id: 'news-11',
    title: 'Peningkatan Kualitas Audio Streaming',
    summary: 'Streaming musik kini lebih jernih dengan profil kualitas baru di pengaturan.',
    date: '2025-08-10',
    category: 'new',
    content:
      'SoundCave kini mendukung profil streaming baru dengan bitrate yang lebih tinggi untuk pengguna dengan koneksi stabil.\n\nDi sisi lain, kami juga menyediakan mode hemat data yang secara pintar menyesuaikan kualitas saat jaringan sedang lemah.\n\nKamu bisa mengubah preferensi kualitas ini kapan saja melalui menu Settings.',
  },
  {
    id: 'news-12',
    title: 'Program Dukungan untuk Musisi Independen',
    summary: 'SoundCave meluncurkan program micro-grant untuk membantu produksi musisi independen.',
    date: '2025-07-30',
    category: 'popular',
    content:
      'Sebagai bagian dari komitmen mendukung ekosistem musik, SoundCave meluncurkan program micro-grant untuk musisi independen.\n\nProgram ini memberikan bantuan produksi kecil berupa biaya mixing, mastering, atau distribusi digital.\n\nInformasi cara mendaftar akan diumumkan melalui kanal resmi SoundCave dan section News di aplikasi.',
  },
  {
    id: 'news-13',
    title: 'Integrasi dengan Smart Speaker',
    summary: 'Segera kendalikan musik SoundCave lewat perintah suara di smart speaker favoritmu.',
    date: '2025-07-18',
    category: 'recommend',
    content:
      'Kami sedang menguji integrasi dengan beberapa smart speaker populer.\n\nNantinya kamu bisa memutar playlist, meminta lagu tertentu, atau mengontrol volume hanya dengan perintah suara.\n\nFitur ini akan dirilis secara bertahap dan membutuhkan update aplikasi ke versi terbaru.',
  },
  {
    id: 'news-14',
    title: 'UI Baru untuk Full Player',
    summary: 'Tampilan Full Player diperbarui agar lebih minimalis dan mudah digunakan.',
    date: '2025-07-05',
    category: 'new',
    content:
      'Full Player di SoundCave kini hadir dengan layout baru yang lebih bersih dan fokus pada cover art.\n\nKontrol utama seperti play/pause, next, previous, dan shuffle dibuat lebih besar dan mudah dijangkau.\n\nSelain itu, transisi dari mini PlayerBar ke Full Player dibuat lebih halus untuk pengalaman yang konsisten.',
  },
  {
    id: 'news-15',
    title: 'Channel Podcast Eksklusif SoundCave',
    summary: 'Deretan podcast eksklusif kini hanya tersedia di SoundCave.',
    date: '2025-06-25',
    category: 'popular',
    content:
      'Kami bekerja sama dengan beberapa kreator podcast untuk menghadirkan konten eksklusif yang hanya bisa kamu dengarkan di SoundCave.\n\nTopiknya beragam, mulai dari musik, budaya pop, hingga obrolan santai seputar kehidupan kreatif.\n\nIkuti channel favoritmu agar tidak ketinggalan episode terbaru.',
  },
  {
    id: 'news-16',
    title: 'Fitur Timer Tidur untuk Musik Malam',
    summary: 'Atur musik berhenti otomatis saat kamu tertidur.',
    date: '2025-06-10',
    category: 'new',
    content:
      'Sleep Timer memungkinkan kamu memutar musik atau podcast sebelum tidur tanpa khawatir lupa mematikannya.\n\nKamu bisa memilih durasi tertentu, misalnya 15, 30, atau 60 menit, dan playback akan berhenti otomatis setelah waktunya habis.\n\nFitur ini bisa diakses langsung dari Full Player.',
  },
  {
    id: 'news-17',
    title: 'Playlist “Morning Energy” dan “Night Chill”',
    summary: 'Dua playlist dinamis yang menyesuaikan mood pagi dan malammu.',
    date: '2025-05-30',
    category: 'recommend',
    content:
      'Playlist “Morning Energy” berisi lagu-lagu upbeat untuk memulai hari, sementara “Night Chill” menawarkan nuansa tenang untuk menutup hari.\n\nKedua playlist ini diperbarui secara berkala berdasarkan tren dan perilaku mendengarkan pengguna.\n\nKamu bisa menemukannya di beranda atau bagian rekomendasi.',
  },
  {
    id: 'news-18',
    title: 'Perbaikan Performa Aplikasi pada Perangkat Lama',
    summary: 'SoundCave kini lebih ringan dan cepat di berbagai perangkat Android lawas.',
    date: '2025-05-15',
    category: 'new',
    content:
      'Tim engineering kami melakukan banyak optimasi di sisi memori dan rendering UI.\n\nHasilnya, SoundCave kini terasa lebih responsif, terutama pada perangkat dengan spesifikasi lebih rendah.\n\nUpdate ini juga mengurangi kemungkinan aplikasi force close saat berpindah antar-screen dengan cepat.',
  },
  {
    id: 'news-19',
    title: 'Kategori Genre Baru: Synthwave dan Lofi Hip-Hop',
    summary: 'Tambah dua kategori genre baru untuk menemani fokus dan nostalgia.',
    date: '2025-05-01',
    category: 'recommend',
    content:
      'Genre Synthwave dan Lofi Hip-Hop kini memiliki kategori khusus di SoundCave.\n\nKamu bisa menemukan playlist kurasi, album klasik, hingga rilisan terbaru dari skena ini.\n\nKategori baru ini dirancang untuk kamu yang suka bekerja, belajar, atau sekadar bersantai dengan latar musik yang lembut.',
  },
  {
    id: 'news-20',
    title: 'Roadmap Fitur Publik SoundCave',
    summary: 'Kami merilis roadmap publik agar pengguna bisa melihat arah pengembangan SoundCave.',
    date: '2025-04-20',
    category: 'popular',
    content:
      'Mulai tahun ini, SoundCave akan membagikan roadmap fitur secara publik.\n\nRoadmap ini berisi daftar fitur yang sedang dikerjakan, ide yang sedang dipertimbangkan, serta fitur yang sudah dirilis.\n\nKamu juga bisa memberikan feedback dan vote fitur mana yang menurutmu paling penting untuk dikembangkan berikutnya.',
  },
];


