export const SONGS = [
  {
    artist: 'Zara Salsabila',
    title: 'Seperti Kemarin',
    // NOTE: This .mpeg file may not play on Android. Convert to .mp3 for better compatibility
    url: 'https://firebasestorage.googleapis.com/v0/b/tokotitoh-cd962.appspot.com/o/soundcave%2Fmusic%2Fsongs%2FZara%20Salsabila%2FWhatsApp%20Audio%202025-11-22%20at%2011.12.06.mpeg?alt=media&token=7a6e3550-3412-4018-b7c6-2cf5a1c6ac57',
    time: '04:33',
    cover:
      'https://firebasestorage.googleapis.com/v0/b/tokotitoh-cd962.appspot.com/o/soundcave%2Fmusic%2Fsongs%2FZara%20Salsabila%2FWhatsApp%20Image%202025-11-22%20at%2000.46.52.jpeg?alt=media&token=7a4d504f-dd2c-43e4-958c-4f2dd133e51c',
    lyrics: `Rintik hujan turun membasahiku
            Ingatkanku akan kekasih jiwaku
            Terpakukus saat tatap matamu
            Namun aku telah berjanji tak berpisah sampai mati
            [Chorus]
            Kamu adalah pelita jiwaku
            Tak mudah untukku mendapatkanmu
            Sampai saat aku mencintaimu
            Tetaplah tersenyum jantung hatiku
            Seperti bintang malam yang selalu menerangi
            Kuat menyinari semua rinduku
            Seperti kemarinku
            [Verse 2]
            Ku hanya ingin ada cintaku
            Biarkan aku menemanimu
            Walau letih ragaku tak mengapa
            Seperti saat itu
            [Chorus]
            Ku hanya ingin ada dirimu
            Melewati hari-hari suka duka bersamamu
            Ku hanya ingin semua denganmu
            [Instrumental]
            [Chorus]
            Seperti kemarinku
            Ku hanya ingin ada cintaku
            Biarkan aku menemanimu
            Walau letih ragaku tak mengapa
            Seperti saat itu
            Ku hanya ingin ada dirimu
            Melewati hari-hari suka duka bersamamu
            Ku hanya ingin semua denganmu`,
  },
  {
    artist: 'Fani Fabianto',
    title: 'Telah Pergi',
    url: 'https://firebasestorage.googleapis.com/v0/b/tokotitoh-cd962.appspot.com/o/soundcave%2Fmusic%2Fsongs%2FFani%20Fabianto%2FWhatsApp%20Audio%202025-11-22%20at%2011.12.06%20(2).mpeg?alt=media&token=dbb5307c-f15e-414a-8966-c386cfbf5e46',
    time: '04:42',
    cover:
      'https://firebasestorage.googleapis.com/v0/b/tokotitoh-cd962.appspot.com/o/soundcave%2Fmusic%2Fsongs%2FFani%20Fabianto%2FWhatsApp%20Image%202025-11-22%20at%2021.54.21.jpeg?alt=media&token=93230949-8f1b-41b6-a4b2-b7436a892665',
    lyrics: ``,
  },
  {
    artist: 'Original Soundcave',
    title: 'Track 01',
    url: 'https://firebasestorage.googleapis.com/v0/b/tokotitoh-cd962.appspot.com/o/soundcave%2Fmusic%2Fsongs%2FUnknown%2FWhatsApp%20Audio%202025-11-22%20at%2011.12.07.mp3?alt=media&token=c4bbf0ec-f138-4563-8a5c-017d7d8549fb',
    time: '03:47',
    cover:
      'https://firebasestorage.googleapis.com/v0/b/tokotitoh-cd962.appspot.com/o/soundcave%2Fmusic%2Fsongs%2FUnknown%2FWhatsApp%20Image%202025-11-24%20at%2021.36.15%20(1).jpeg?alt=media&token=443eb6c3-6e4b-4809-a678-bc7104662f58',
    lyrics: ``,
  },
  {
    artist: 'Original Soundcave',
    title: 'Track 02',
    url: 'https://firebasestorage.googleapis.com/v0/b/tokotitoh-cd962.appspot.com/o/soundcave%2Fmusic%2Fsongs%2FUnknown%2FWhatsApp%20Audio%202025-11-22%20at%2011.12.07%20(1).mpeg?alt=media&token=a033e2d6-7520-4240-be2e-359605c95cc1',
    time: '03:25',
    cover:
      'https://firebasestorage.googleapis.com/v0/b/tokotitoh-cd962.appspot.com/o/soundcave%2Fmusic%2Fsongs%2FUnknown%2FWhatsApp%20Image%202025-11-24%20at%2021.36.15%20(1).jpeg?alt=media&token=443eb6c3-6e4b-4809-a678-bc7104662f58',
    lyrics: ``,
  },
  {
    artist: 'Original Soundcave',
    title: 'Track 03',
    url: 'https://firebasestorage.googleapis.com/v0/b/tokotitoh-cd962.appspot.com/o/soundcave%2Fmusic%2Fsongs%2FUnknown%2FWhatsApp%20Audio%202025-11-22%20at%2011.12.06%20(3).mpeg?alt=media&token=4b1e8a2b-881f-4a0c-a69a-e512d9e3f104',
    time: '03:44',
    cover:
      'https://firebasestorage.googleapis.com/v0/b/tokotitoh-cd962.appspot.com/o/soundcave%2Fmusic%2Fsongs%2FUnknown%2FWhatsApp%20Image%202025-11-24%20at%2021.36.15%20(1).jpeg?alt=media&token=443eb6c3-6e4b-4809-a678-bc7104662f58',
    lyrics: ``,
  },
] as const;

export type Song = (typeof SONGS)[number];
