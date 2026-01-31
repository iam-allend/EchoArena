import { SubjectId, LevelId } from './subjects'

export interface Material {
  id: string
  title: string
  description: string
  subject: SubjectId
  level: LevelId
  duration: string // e.g., "15 menit"
  topics: number
  thumbnail: string
  content: MaterialContent[]
}

export interface MaterialContent {
  title: string
  content: string
  examples?: string[]
}

export const materials: Material[] = [
  // MATEMATIKA - SD
  {
    id: 'math-sd-mat-1',
    title: 'Dasar Penjumlahan',
    description: 'Pelajari konsep penjumlahan dari awal',
    subject: 'math',
    level: 'sd',
    duration: '15 menit',
    topics: 3,
    thumbnail: '➕',
    content: [
      {
        title: 'Apa itu Penjumlahan?',
        content: 'Penjumlahan adalah operasi matematika dasar untuk menggabungkan dua atau lebih bilangan menjadi satu jumlah total.'
      },
      {
        title: 'Cara Menjumlahkan',
        content: 'Untuk menjumlahkan, kita menambahkan bilangan pertama dengan bilangan kedua.',
        examples: ['2 + 3 = 5', '5 + 7 = 12', '10 + 15 = 25']
      },
      {
        title: 'Latihan Soal',
        content: 'Cobalah hitung: Jika kamu punya 3 apel dan diberi 5 apel lagi, berapa total apelmu?'
      }
    ]
  },
  {
    id: 'math-sd-mat-2',
    title: 'Perkalian Untuk Pemula',
    description: 'Memahami konsep perkalian sebagai penjumlahan berulang',
    subject: 'math',
    level: 'sd',
    duration: '20 menit',
    topics: 4,
    thumbnail: '✖️',
    content: [
      {
        title: 'Konsep Perkalian',
        content: 'Perkalian adalah penjumlahan berulang dari bilangan yang sama.'
      },
      {
        title: 'Tabel Perkalian 1-5',
        content: 'Hafalkan tabel perkalian 1 sampai 5 terlebih dahulu.',
        examples: ['2 × 3 = 6 (2+2+2)', '3 × 4 = 12 (3+3+3+3)', '5 × 2 = 10 (5+5)']
      }
    ]
  },
  
  // MATEMATIKA - SMP
  {
    id: 'math-smp-mat-1',
    title: 'Pengantar Aljabar',
    description: 'Memahami variabel dan persamaan linear',
    subject: 'math',
    level: 'smp',
    duration: '25 menit',
    topics: 5,
    thumbnail: '📐',
    content: [
      {
        title: 'Apa itu Variabel?',
        content: 'Variabel adalah simbol (biasanya huruf) yang mewakili bilangan yang belum diketahui.'
      },
      {
        title: 'Persamaan Linear Satu Variabel',
        content: 'Persamaan berbentuk ax + b = c, dimana a, b, c adalah konstanta.',
        examples: ['2x + 3 = 7', 'x - 5 = 10', '3x = 12']
      },
      {
        title: 'Cara Menyelesaikan Persamaan',
        content: 'Isolasi variabel dengan operasi invers pada kedua ruas.'
      }
    ]
  },
  
  // SAINS - SD
  {
    id: 'science-sd-mat-1',
    title: 'Mengenal Tumbuhan',
    description: 'Bagian-bagian tumbuhan dan fungsinya',
    subject: 'science',
    level: 'sd',
    duration: '20 menit',
    topics: 4,
    thumbnail: '🌱',
    content: [
      {
        title: 'Bagian-Bagian Tumbuhan',
        content: 'Tumbuhan terdiri dari akar, batang, daun, bunga, dan buah.'
      },
      {
        title: 'Fungsi Akar',
        content: 'Akar berfungsi untuk menyerap air dan mineral dari tanah, serta menopang tumbuhan.'
      },
      {
        title: 'Fungsi Daun',
        content: 'Daun adalah tempat fotosintesis, proses pembuatan makanan oleh tumbuhan.'
      }
    ]
  },
  
  // SAINS - SMP
  {
    id: 'science-smp-mat-1',
    title: 'Sistem Peredaran Darah',
    description: 'Jantung, pembuluh darah, dan fungsinya',
    subject: 'science',
    level: 'smp',
    duration: '30 menit',
    topics: 6,
    thumbnail: '❤️',
    content: [
      {
        title: 'Organ Peredaran Darah',
        content: 'Sistem peredaran darah terdiri dari jantung, pembuluh darah, dan darah.'
      },
      {
        title: 'Fungsi Jantung',
        content: 'Jantung memompa darah ke seluruh tubuh melalui pembuluh darah.'
      },
      {
        title: 'Jenis Pembuluh Darah',
        content: 'Ada tiga jenis: arteri (dari jantung), vena (ke jantung), dan kapiler (penghubung).'
      }
    ]
  },
  
  // SEJARAH - SD
  {
    id: 'history-sd-mat-1',
    title: 'Proklamasi Kemerdekaan',
    description: 'Peristiwa 17 Agustus 1945',
    subject: 'history',
    level: 'sd',
    duration: '15 menit',
    topics: 3,
    thumbnail: '🇮🇩',
    content: [
      {
        title: 'Peristiwa Proklamasi',
        content: 'Pada 17 Agustus 1945, Ir. Soekarno membacakan teks Proklamasi Kemerdekaan Indonesia.'
      },
      {
        title: 'Tokoh Proklamasi',
        content: 'Proklamasi ditulis oleh Soekarno, Hatta, dan Ahmad Soebardjo.'
      }
    ]
  },
  
  // SASTRA - SD
  {
    id: 'language-sd-mat-1',
    title: 'Pantun dan Jenisnya',
    description: 'Mengenal pantun dan cara membuatnya',
    subject: 'language',
    level: 'sd',
    duration: '20 menit',
    topics: 4,
    thumbnail: '📝',
    content: [
      {
        title: 'Apa itu Pantun?',
        content: 'Pantun adalah puisi lama yang terdiri dari 4 baris dengan pola a-b-a-b.'
      },
      {
        title: 'Ciri-Ciri Pantun',
        content: 'Baris 1-2 adalah sampiran, baris 3-4 adalah isi. Setiap baris terdiri dari 8-12 suku kata.'
      },
      {
        title: 'Contoh Pantun',
        content: 'Jalan-jalan ke kota Bogor / Jangan lupa membeli duku / Menuntut ilmu penuh perjuangan / Agar masa depan lebih cerah',
        examples: [
          'Kalau ada jarum yang patah / Jangan disimpan di dalam peti / Kalau ada kata yang salah / Jangan disimpan di dalam hati'
        ]
      }
    ]
  }
]

export const getMaterialsBySubjectAndLevel = (subject: SubjectId, level: LevelId) => {
  return materials.filter(m => m.subject === subject && m.level === level)
}

export const getMaterialById = (id: string) => materials.find(m => m.id === id)