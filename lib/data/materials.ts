import { SubjectId, LevelId } from './subjects'

export interface Material {
  id: string
  title: string
  description: string
  subject: SubjectId
  level: LevelId
  duration: string
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
  // ==================== MATEMATIKA - SD ====================
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
        content: 'Penjumlahan adalah operasi matematika dasar untuk menggabungkan dua atau lebih bilangan menjadi satu jumlah total. Simbol penjumlahan adalah tanda plus (+).'
      },
      {
        title: 'Cara Menjumlahkan',
        content: 'Untuk menjumlahkan, kita menambahkan bilangan pertama dengan bilangan kedua. Hasilnya disebut jumlah.',
        examples: [
          '2 + 3 = 5 (dua ditambah tiga sama dengan lima)',
          '5 + 7 = 12 (lima ditambah tujuh sama dengan dua belas)',
          '10 + 15 = 25 (sepuluh ditambah lima belas sama dengan dua puluh lima)'
        ]
      },
      {
        title: 'Latihan Soal',
        content: 'Mari berlatih! Jika kamu punya 3 apel dan diberi 5 apel lagi, berapa total apelmu? Jawaban: 3 + 5 = 8 apel.'
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
        content: 'Perkalian adalah penjumlahan berulang dari bilangan yang sama. Simbol perkalian adalah tanda kali (×).'
      },
      {
        title: 'Perkalian Sebagai Penjumlahan Berulang',
        content: 'Misalnya 3 × 4 artinya: 3 + 3 + 3 + 3 = 12. Kita menjumlahkan angka 3 sebanyak 4 kali.',
        examples: [
          '2 × 3 = 6 (sama dengan 2 + 2 + 2)',
          '4 × 5 = 20 (sama dengan 4 + 4 + 4 + 4 + 4)',
          '5 × 2 = 10 (sama dengan 5 + 5)'
        ]
      },
      {
        title: 'Tabel Perkalian 1-5',
        content: 'Hafal tabel perkalian akan memudahkan perhitungan. Mulai dari yang mudah dulu!',
        examples: [
          '1 × 1 = 1, 1 × 2 = 2, 1 × 3 = 3',
          '2 × 1 = 2, 2 × 2 = 4, 2 × 3 = 6',
          '5 × 1 = 5, 5 × 2 = 10, 5 × 3 = 15'
        ]
      },
      {
        title: 'Tips Menghapal',
        content: 'Latih setiap hari dengan menulis tabel perkalian. Gunakan lagu atau permainan untuk membuat belajar lebih menyenangkan!'
      }
    ]
  },
  {
    id: 'math-sd-mat-3',
    title: 'Geometri Dasar',
    description: 'Mengenal bangun datar sederhana',
    subject: 'math',
    level: 'sd',
    duration: '25 menit',
    topics: 5,
    thumbnail: '△',
    content: [
      {
        title: 'Apa itu Bangun Datar?',
        content: 'Bangun datar adalah bentuk geometri yang memiliki dua dimensi (panjang dan lebar). Contohnya: persegi, persegi panjang, segitiga, dan lingkaran.'
      },
      {
        title: 'Persegi',
        content: 'Persegi memiliki 4 sisi yang sama panjang dan 4 sudut siku-siku (90 derajat).',
        examples: ['Contoh: Papan catur memiliki kotak-kotak berbentuk persegi']
      },
      {
        title: 'Persegi Panjang',
        content: 'Persegi panjang memiliki 2 pasang sisi yang sama panjang dan 4 sudut siku-siku.',
        examples: ['Contoh: Buku tulis berbentuk persegi panjang']
      },
      {
        title: 'Segitiga',
        content: 'Segitiga memiliki 3 sisi dan 3 sudut. Total sudut dalam segitiga adalah 180 derajat.',
        examples: ['Contoh: Rambu lalu lintas berbentuk segitiga']
      },
      {
        title: 'Lingkaran',
        content: 'Lingkaran adalah bangun datar yang semua titik di tepinya berjarak sama dari titik pusat.',
        examples: ['Contoh: Roda sepeda berbentuk lingkaran']
      }
    ]
  },

  // ==================== MATEMATIKA - SMP ====================
  {
    id: 'math-smp-mat-1',
    title: 'Pengantar Aljabar',
    description: 'Memahami variabel dan persamaan linear',
    subject: 'math',
    level: 'smp',
    duration: '30 menit',
    topics: 6,
    thumbnail: '📐',
    content: [
      {
        title: 'Apa itu Variabel?',
        content: 'Variabel adalah simbol (biasanya huruf seperti x, y, z) yang mewakili bilangan yang belum diketahui nilainya.'
      },
      {
        title: 'Bentuk Aljabar',
        content: 'Bentuk aljabar adalah kombinasi dari angka (konstanta) dan variabel dengan operasi matematika.',
        examples: ['2x + 5', '3y - 7', 'a² + 2a + 1']
      },
      {
        title: 'Persamaan Linear Satu Variabel',
        content: 'Persamaan linear berbentuk ax + b = c, dimana a, b, c adalah konstanta dan x adalah variabel.',
        examples: [
          '2x + 3 = 7',
          'x - 5 = 10',
          '3x = 12'
        ]
      },
      {
        title: 'Cara Menyelesaikan Persamaan',
        content: 'Isolasi variabel dengan melakukan operasi invers pada kedua ruas. Apa yang dilakukan di ruas kiri, harus dilakukan juga di ruas kanan.',
        examples: [
          'Contoh: 2x + 3 = 7',
          'Langkah 1: 2x = 7 - 3 (pindahkan 3 ke ruas kanan)',
          'Langkah 2: 2x = 4',
          'Langkah 3: x = 4 ÷ 2 = 2'
        ]
      },
      {
        title: 'Sifat-Sifat Aljabar',
        content: 'Sifat komutatif: a + b = b + a. Sifat asosiatif: (a + b) + c = a + (b + c). Sifat distributif: a(b + c) = ab + ac.'
      },
      {
        title: 'Latihan',
        content: 'Selesaikan persamaan: 5x - 10 = 15. Jawaban: x = 5'
      }
    ]
  },
  {
    id: 'math-smp-mat-2',
    title: 'Himpunan',
    description: 'Konsep dasar himpunan dan operasinya',
    subject: 'math',
    level: 'smp',
    duration: '25 menit',
    topics: 5,
    thumbnail: '∪',
    content: [
      {
        title: 'Pengertian Himpunan',
        content: 'Himpunan adalah kumpulan objek yang terdefinisi dengan jelas. Objek dalam himpunan disebut anggota atau elemen.'
      },
      {
        title: 'Notasi Himpunan',
        content: 'Himpunan biasanya dilambangkan dengan huruf kapital dan anggotanya ditulis dalam kurung kurawal { }.',
        examples: [
          'A = {1, 2, 3, 4, 5}',
          'B = {a, b, c, d}',
          'C = {bilangan genap kurang dari 10} = {2, 4, 6, 8}'
        ]
      },
      {
        title: 'Irisan Himpunan',
        content: 'Irisan (∩) adalah himpunan yang anggotanya merupakan anggota bersama dari dua himpunan.',
        examples: [
          'A = {1, 2, 3, 4}',
          'B = {3, 4, 5, 6}',
          'A ∩ B = {3, 4}'
        ]
      },
      {
        title: 'Gabungan Himpunan',
        content: 'Gabungan (∪) adalah himpunan yang anggotanya berasal dari salah satu atau kedua himpunan.',
        examples: [
          'A = {1, 2, 3}',
          'B = {3, 4, 5}',
          'A ∪ B = {1, 2, 3, 4, 5}'
        ]
      },
      {
        title: 'Diagram Venn',
        content: 'Diagram Venn adalah cara visual untuk merepresentasikan himpunan menggunakan lingkaran atau kurva tertutup.'
      }
    ]
  },

  // ==================== MATEMATIKA - SMA ====================
  {
    id: 'math-sma-mat-1',
    title: 'Trigonometri Dasar',
    description: 'Memahami sin, cos, tan dan penerapannya',
    subject: 'math',
    level: 'sma',
    duration: '35 menit',
    topics: 7,
    thumbnail: '📊',
    content: [
      {
        title: 'Pengenalan Trigonometri',
        content: 'Trigonometri adalah cabang matematika yang mempelajari hubungan antara sudut dan sisi segitiga, khususnya segitiga siku-siku.'
      },
      {
        title: 'Fungsi Sinus (sin)',
        content: 'Sinus suatu sudut adalah perbandingan antara sisi depan sudut dengan sisi miring (hipotenusa).',
        examples: ['sin θ = depan / miring']
      },
      {
        title: 'Fungsi Cosinus (cos)',
        content: 'Cosinus suatu sudut adalah perbandingan antara sisi samping sudut dengan sisi miring.',
        examples: ['cos θ = samping / miring']
      },
      {
        title: 'Fungsi Tangen (tan)',
        content: 'Tangen suatu sudut adalah perbandingan antara sisi depan dengan sisi samping sudut.',
        examples: ['tan θ = depan / samping = sin θ / cos θ']
      },
      {
        title: 'Sudut Istimewa',
        content: 'Sudut istimewa adalah sudut-sudut yang nilai trigonometrinya mudah dihitung: 0°, 30°, 45°, 60°, 90°.',
        examples: [
          'sin 30° = 1/2',
          'cos 45° = √2/2',
          'tan 60° = √3'
        ]
      },
      {
        title: 'Identitas Trigonometri',
        content: 'Identitas dasar: sin²θ + cos²θ = 1',
        examples: [
          '1 + tan²θ = sec²θ',
          '1 + cot²θ = csc²θ'
        ]
      },
      {
        title: 'Aplikasi Trigonometri',
        content: 'Trigonometri digunakan dalam navigasi, astronomi, fisika, teknik sipil, dan banyak bidang lainnya untuk menghitung jarak dan sudut.'
      }
    ]
  },
  {
    id: 'math-sma-mat-2',
    title: 'Limit Fungsi',
    description: 'Konsep limit dan kontinuitas',
    subject: 'math',
    level: 'sma',
    duration: '40 menit',
    topics: 6,
    thumbnail: '∞',
    content: [
      {
        title: 'Pengertian Limit',
        content: 'Limit adalah nilai yang didekati oleh suatu fungsi ketika variabelnya mendekati suatu nilai tertentu.'
      },
      {
        title: 'Notasi Limit',
        content: 'Limit fungsi f(x) saat x mendekati a ditulis: lim(x→a) f(x) = L',
        examples: ['lim(x→2) (x² + 1) = 5']
      },
      {
        title: 'Sifat-Sifat Limit',
        content: 'Limit penjumlahan: lim[f(x) + g(x)] = lim f(x) + lim g(x). Limit perkalian: lim[f(x) × g(x)] = lim f(x) × lim g(x).'
      },
      {
        title: 'Bentuk Tak Tentu 0/0',
        content: 'Jika substitusi langsung menghasilkan 0/0, gunakan cara faktorisasi, perkalian sekawan, atau aturan L\'Hospital.',
        examples: [
          'lim(x→2) (x²-4)/(x-2)',
          '= lim(x→2) (x+2)(x-2)/(x-2)',
          '= lim(x→2) (x+2) = 4'
        ]
      },
      {
        title: 'Limit Tak Hingga',
        content: 'Limit saat x mendekati tak hingga dilihat dari derajat tertinggi pembilang dan penyebut.',
        examples: ['lim(x→∞) (2x²+1)/(x²+3) = 2']
      },
      {
        title: 'Kontinuitas',
        content: 'Fungsi f(x) kontinu di x=a jika: f(a) terdefinisi, lim(x→a) f(x) ada, dan lim(x→a) f(x) = f(a).'
      }
    ]
  },

  // ==================== SAINS - SD ====================
  {
    id: 'science-sd-mat-1',
    title: 'Mengenal Tumbuhan',
    description: 'Bagian-bagian tumbuhan dan fungsinya',
    subject: 'science',
    level: 'sd',
    duration: '20 menit',
    topics: 5,
    thumbnail: '🌱',
    content: [
      {
        title: 'Bagian-Bagian Tumbuhan',
        content: 'Tumbuhan memiliki bagian utama: akar, batang, daun, bunga, dan buah. Setiap bagian memiliki fungsi penting.'
      },
      {
        title: 'Fungsi Akar',
        content: 'Akar berfungsi untuk menyerap air dan mineral dari tanah, menopang tumbuhan agar tetap tegak, dan menyimpan cadangan makanan.',
        examples: ['Contoh: Wortel dan ubi menyimpan makanan di akarnya']
      },
      {
        title: 'Fungsi Batang',
        content: 'Batang mengangkut air dan mineral dari akar ke daun, mengangkut hasil fotosintesis dari daun ke seluruh tubuh tumbuhan, dan menopang tumbuhan.',
        examples: ['Contoh: Batang pohon kelapa sangat kuat dan tinggi']
      },
      {
        title: 'Fungsi Daun',
        content: 'Daun adalah tempat fotosintesis, yaitu proses pembuatan makanan oleh tumbuhan dengan bantuan cahaya matahari. Daun juga tempat penguapan air.',
        examples: ['Daun hijau karena mengandung klorofil']
      },
      {
        title: 'Fungsi Bunga dan Buah',
        content: 'Bunga adalah alat perkembangbiakan tumbuhan. Setelah penyerbukan, bunga akan menjadi buah yang berisi biji untuk regenerasi tumbuhan baru.'
      }
    ]
  },
  {
    id: 'science-sd-mat-2',
    title: 'Siklus Air',
    description: 'Memahami perjalanan air di alam',
    subject: 'science',
    level: 'sd',
    duration: '18 menit',
    topics: 4,
    thumbnail: '💧',
    content: [
      {
        title: 'Apa itu Siklus Air?',
        content: 'Siklus air adalah perjalanan air dari laut ke udara, kemudian turun ke bumi dan kembali lagi ke laut. Proses ini berulang terus menerus.'
      },
      {
        title: 'Evaporasi (Penguapan)',
        content: 'Air di laut, sungai, dan danau menguap menjadi uap air karena panas matahari. Uap air naik ke udara.',
        examples: ['Saat menjemur pakaian basah, airnya menguap ke udara']
      },
      {
        title: 'Kondensasi (Pengembunan)',
        content: 'Uap air di udara yang dingin akan berubah menjadi titik-titik air kecil dan membentuk awan.',
        examples: ['Embun di pagi hari adalah hasil kondensasi']
      },
      {
        title: 'Presipitasi (Hujan)',
        content: 'Titik air di awan semakin banyak dan berat, akhirnya jatuh sebagai hujan, salju, atau es. Air hujan akan mengalir ke sungai dan kembali ke laut.'
      }
    ]
  },

  // ==================== SAINS - SMP ====================
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
        content: 'Sistem peredaran darah manusia terdiri dari jantung sebagai pompa, pembuluh darah sebagai jalur, dan darah sebagai medium pengangkut.'
      },
      {
        title: 'Struktur Jantung',
        content: 'Jantung memiliki 4 ruang: 2 serambi (atrium) dan 2 bilik (ventrikel). Serambi kanan menerima darah kotor, bilik kanan memompa ke paru-paru. Serambi kiri menerima darah bersih, bilik kiri memompa ke seluruh tubuh.'
      },
      {
        title: 'Fungsi Jantung',
        content: 'Jantung memompa darah ke seluruh tubuh secara terus menerus. Jantung berdetak sekitar 60-100 kali per menit saat istirahat.',
        examples: ['Detak jantung bisa dirasakan di pergelangan tangan (nadi)']
      },
      {
        title: 'Jenis Pembuluh Darah',
        content: 'Ada tiga jenis pembuluh darah: (1) Arteri: membawa darah dari jantung, dinding tebal, (2) Vena: membawa darah ke jantung, dinding tipis, (3) Kapiler: penghubung arteri dan vena, sangat kecil.',
        examples: ['Arteri tampak merah, vena tampak kebiruan di kulit']
      },
      {
        title: 'Peredaran Darah Besar dan Kecil',
        content: 'Peredaran darah kecil: jantung → paru-paru → jantung (mengambil O₂). Peredaran darah besar: jantung → seluruh tubuh → jantung (mengedarkan O₂).'
      },
      {
        title: 'Menjaga Kesehatan Jantung',
        content: 'Olahraga teratur, makan makanan bergizi, hindari rokok dan alkohol, kelola stres, dan cek kesehatan rutin.'
      }
    ]
  },
  {
    id: 'science-smp-mat-2',
    title: 'Energi dan Perubahannya',
    description: 'Bentuk-bentuk energi dan konversinya',
    subject: 'science',
    level: 'smp',
    duration: '28 menit',
    topics: 5,
    thumbnail: '⚡',
    content: [
      {
        title: 'Pengertian Energi',
        content: 'Energi adalah kemampuan untuk melakukan usaha atau kerja. Energi tidak dapat diciptakan atau dimusnahkan, hanya berubah bentuk (Hukum Kekekalan Energi).'
      },
      {
        title: 'Bentuk-Bentuk Energi',
        content: 'Energi memiliki banyak bentuk: energi kinetik (gerak), potensial (ketinggian), panas, cahaya, listrik, kimia, dan nuklir.',
        examples: [
          'Energi kinetik: mobil yang bergerak',
          'Energi potensial: air terjun',
          'Energi kimia: makanan, baterai'
        ]
      },
      {
        title: 'Perubahan Bentuk Energi',
        content: 'Energi dapat berubah dari satu bentuk ke bentuk lain.',
        examples: [
          'Setrika: energi listrik → energi panas',
          'Lampu: energi listrik → energi cahaya',
          'Pembangkit listrik: energi gerak air → energi listrik'
        ]
      },
      {
        title: 'Sumber Energi',
        content: 'Sumber energi terbarukan: matahari, angin, air, panas bumi. Sumber energi tak terbarukan: minyak bumi, gas alam, batu bara.',
        examples: ['Panel surya mengubah energi matahari menjadi listrik']
      },
      {
        title: 'Hemat Energi',
        content: 'Menghemat energi penting untuk menjaga lingkungan. Matikan lampu saat tidak digunakan, gunakan peralatan hemat energi, dan manfaatkan energi terbarukan.'
      }
    ]
  },

  // ==================== SAINS - SMA ====================
  {
    id: 'science-sma-mat-1',
    title: 'Hukum Newton',
    description: 'Gerak dan gaya dalam fisika',
    subject: 'science',
    level: 'sma',
    duration: '35 menit',
    topics: 7,
    thumbnail: '⚛️',
    content: [
      {
        title: 'Hukum Newton I (Inersia)',
        content: 'Benda akan tetap diam atau bergerak lurus beraturan jika tidak ada gaya yang bekerja padanya.',
        examples: ['Penumpang terdorong ke depan saat mobil direm mendadak']
      },
      {
        title: 'Hukum Newton II (F = ma)',
        content: 'Percepatan benda sebanding dengan resultan gaya dan berbanding terbalik dengan massa. Rumus: F = m × a',
        examples: [
          'F = gaya (Newton)',
          'm = massa (kg)',
          'a = percepatan (m/s²)'
        ]
      },
      {
        title: 'Hukum Newton III (Aksi-Reaksi)',
        content: 'Setiap aksi memiliki reaksi yang sama besar namun berlawanan arah.',
        examples: [
          'Saat mendayung, kita mendorong air ke belakang (aksi), perahu bergerak maju (reaksi)',
          'Saat melompat, kaki mendorong tanah ke bawah, tanah mendorong kita ke atas'
        ]
      },
      {
        title: 'Gaya Gesek',
        content: 'Gaya gesek adalah gaya yang melawan gerak benda. Ada dua jenis: gesek statis (benda diam) dan gesek kinetis (benda bergerak).',
        examples: ['Rem sepeda menggunakan prinsip gaya gesek']
      },
      {
        title: 'Gaya Gravitasi',
        content: 'Gaya tarik antara dua benda bermassa. Di Bumi, percepatan gravitasi g = 9.8 m/s². Rumus gaya gravitasi: F = G(m₁m₂)/r²'
      },
      {
        title: 'Penerapan Hukum Newton',
        content: 'Hukum Newton diterapkan dalam: desain kendaraan, roket, sistem rem, olahraga, dan banyak teknologi modern.'
      },
      {
        title: 'Contoh Soal',
        content: 'Benda bermassa 10 kg diberi gaya 50 N. Berapa percepatannya? Jawab: a = F/m = 50/10 = 5 m/s²'
      }
    ]
  },
  {
    id: 'science-sma-mat-2',
    title: 'Reaksi Kimia',
    description: 'Persamaan reaksi dan stoikiometri',
    subject: 'science',
    level: 'sma',
    duration: '40 menit',
    topics: 6,
    thumbnail: '⚗️',
    content: [
      {
        title: 'Pengertian Reaksi Kimia',
        content: 'Reaksi kimia adalah proses perubahan zat reaktan menjadi produk. Ditandai dengan perubahan warna, suhu, terbentuknya gas atau endapan.'
      },
      {
        title: 'Persamaan Reaksi',
        content: 'Persamaan reaksi menunjukkan reaktan dan produk. Harus setara (jumlah atom sebelum dan sesudah reaksi sama).',
        examples: [
          '2H₂ + O₂ → 2H₂O',
          'Reaktan: H₂ (hidrogen) dan O₂ (oksigen)',
          'Produk: H₂O (air)'
        ]
      },
      {
        title: 'Jenis-Jenis Reaksi',
        content: 'Sintesis: A + B → AB. Dekomposisi: AB → A + B. Substitusi: AB + C → AC + B. Metatesis: AB + CD → AD + CB.',
        examples: ['Fotosintesis adalah reaksi sintesis: CO₂ + H₂O → C₆H₁₂O₆ + O₂']
      },
      {
        title: 'Mol dan Massa Molar',
        content: '1 mol = 6.02 × 10²³ partikel (bilangan Avogadro). Massa molar adalah massa 1 mol zat dalam gram.',
        examples: ['Massa molar H₂O = 18 g/mol']
      },
{
        title: 'Stoikiometri',
        content: 'Stoikiometri adalah perhitungan kuantitatif dalam reaksi kimia untuk menentukan jumlah reaktan yang dibutuhkan atau produk yang dihasilkan.',
        examples: [
          'Jika 2 mol H₂ bereaksi dengan 1 mol O₂, akan dihasilkan 2 mol H₂O',
          'Perbandingan koefisien = perbandingan mol'
        ]
      },
      {
        title: 'Hukum Kekekalan Massa',
        content: 'Massa reaktan sebelum reaksi = massa produk setelah reaksi (Hukum Lavoisier). Tidak ada massa yang hilang atau bertambah dalam reaksi kimia.'
      }
    ]
  },

  // ==================== SEJARAH - SD ====================
  {
    id: 'history-sd-mat-1',
    title: 'Proklamasi Kemerdekaan',
    description: 'Peristiwa 17 Agustus 1945',
    subject: 'history',
    level: 'sd',
    duration: '20 menit',
    topics: 4,
    thumbnail: '🇮🇩',
    content: [
      {
        title: 'Peristiwa Proklamasi',
        content: 'Pada 17 Agustus 1945, Ir. Soekarno membacakan teks Proklamasi Kemerdekaan Indonesia di Jalan Pegangsaan Timur 56, Jakarta.',
        examples: ['Proklamasi dibacakan pukul 10.00 WIB']
      },
      {
        title: 'Tokoh Proklamasi',
        content: 'Proklamasi ditulis oleh Soekarno, Hatta, dan Ahmad Soebardjo di rumah Laksamana Maeda. Soekarno dan Hatta ditunjuk sebagai Presiden dan Wakil Presiden pertama.'
      },
      {
        title: 'Teks Proklamasi',
        content: 'Teks Proklamasi sangat singkat namun bermakna besar: "Kami bangsa Indonesia dengan ini menjatakan kemerdekaan Indonesia. Hal-hal jang mengenai pemindahan kekoeasaan d.l.l., diselenggarakan dengan tjara seksama dan dalam tempo jang sesingkat-singkatnja."'
      },
      {
        title: 'Makna Proklamasi',
        content: 'Proklamasi menandai berakhirnya penjajahan dan lahirnya Indonesia sebagai negara merdeka. Tanggal 17 Agustus ditetapkan sebagai Hari Kemerdekaan Indonesia.'
      }
    ]
  },
  {
    id: 'history-sd-mat-2',
    title: 'Pahlawan Nasional',
    description: 'Mengenal tokoh-tokoh pejuang Indonesia',
    subject: 'history',
    level: 'sd',
    duration: '25 menit',
    topics: 5,
    thumbnail: '🎖️',
    content: [
      {
        title: 'Siapa Pahlawan Nasional?',
        content: 'Pahlawan Nasional adalah gelar yang diberikan kepada tokoh yang berjasa besar dalam memperjuangkan kemerdekaan Indonesia.'
      },
      {
        title: 'Cut Nyak Dien',
        content: 'Pahlawan wanita dari Aceh yang berjuang melawan Belanda. Beliau terus berjuang meski suaminya gugur dan dalam kondisi buta.',
        examples: ['Cut Nyak Dien dikenal sangat berani dan pantang menyerah']
      },
      {
        title: 'Pangeran Diponegoro',
        content: 'Pemimpin Perang Jawa (1825-1830) melawan Belanda. Perang ini adalah perang terbesar yang dihadapi Belanda di Nusantara.'
      },
      {
        title: 'R.A. Kartini',
        content: 'Pelopor emansipasi wanita Indonesia. Melalui surat-suratnya, Kartini memperjuangkan pendidikan untuk perempuan pribumi.',
        examples: ['Hari Kartini diperingati setiap 21 April']
      },
      {
        title: 'Bung Tomo',
        content: 'Tokoh perjuangan di Surabaya yang membakar semangat arek-arek Suroboyo melawan Inggris pada 10 November 1945.'
      }
    ]
  },

  // ==================== SEJARAH - SMP ====================
  {
    id: 'history-smp-mat-1',
    title: 'Masa Penjajahan Belanda',
    description: 'VOC dan sistem tanam paksa',
    subject: 'history',
    level: 'smp',
    duration: '30 menit',
    topics: 6,
    thumbnail: '⛵',
    content: [
      {
        title: 'Kedatangan VOC',
        content: 'VOC (Vereenigde Oostindische Compagnie) datang ke Indonesia tahun 1602 dengan tujuan berdagang rempah-rempah. Lambat laun VOC menguasai wilayah Indonesia.'
      },
      {
        title: 'Hak Istimewa VOC',
        content: 'VOC memiliki hak monopoli dagang, mencetak uang, mengangkat gubernur jenderal, memiliki tentara, dan membuat perjanjian dengan raja-raja lokal.'
      },
      {
        title: 'Sistem Tanam Paksa',
        content: 'Cultuurstelsel (1830-1870) adalah sistem yang memaksa rakyat menanam tanaman ekspor seperti kopi, tebu, dan nila untuk keuntungan Belanda.',
        examples: [
          'Rakyat wajib menyerahkan 1/5 tanah untuk tanaman ekspor',
          'Atau bekerja di perkebunan pemerintah selama 66 hari'
        ]
      },
      {
        title: 'Dampak Tanam Paksa',
        content: 'Kemiskinan dan kelaparan melanda rakyat karena fokus pada tanaman ekspor, bukan pangan. Banyak rakyat meninggal akibat kerja paksa yang berat.'
      },
      {
        title: 'Politik Etis',
        content: 'Politik Balas Budi (1901) dengan program Irigasi, Emigrasi, dan Edukasi. Tapi dalam praktiknya lebih menguntungkan Belanda.',
        examples: ['Edukasi melahirkan golongan terpelajar yang nantinya menjadi pelopor kemerdekaan']
      },
      {
        title: 'Perlawanan Rakyat',
        content: 'Berbagai perlawanan terjadi: Perang Padri, Perang Jawa, Perang Aceh, dan perlawanan daerah lainnya menunjukkan semangat rakyat Indonesia.'
      }
    ]
  },
  {
    id: 'history-smp-mat-2',
    title: 'Organisasi Pergerakan Nasional',
    description: 'Budi Utomo hingga Sumpah Pemuda',
    subject: 'history',
    level: 'smp',
    duration: '28 menit',
    topics: 5,
    thumbnail: '🏛️',
    content: [
      {
        title: 'Budi Utomo (1908)',
        content: 'Organisasi modern pertama di Indonesia, didirikan oleh dr. Wahidin Sudirohusodo dan dr. Sutomo. Fokus pada pendidikan dan kebudayaan Jawa.',
        examples: ['20 Mei diperingati sebagai Hari Kebangkitan Nasional']
      },
      {
        title: 'Sarekat Islam (1911)',
        content: 'Organisasi dengan anggota terbanyak (2 juta orang). Awalnya organisasi dagang, berkembang menjadi organisasi politik yang menentang penjajahan.'
      },
      {
        title: 'Indische Partij (1912)',
        content: 'Partai politik pertama yang mencita-citakan kemerdekaan Indonesia. Didirikan oleh Douwes Dekker, Cipto Mangunkusumo, dan Suwardi Surjaningrat.'
      },
      {
        title: 'Sumpah Pemuda (1928)',
        content: 'Kongres Pemuda II menghasilkan ikrar: Satu Nusa (Indonesia), Satu Bangsa (Indonesia), Satu Bahasa (Indonesia). Menandai persatuan pemuda dari berbagai daerah.',
        examples: ['Lagu Indonesia Raya pertama kali dikumandangkan dalam kongres ini']
      },
      {
        title: 'Partai Nasional Indonesia (1927)',
        content: 'Didirikan Soekarno dengan tujuan Indonesia merdeka. PNI menjadi motor pergerakan nasional menuju kemerdekaan.'
      }
    ]
  },

  // ==================== SEJARAH - SMA ====================
  {
    id: 'history-sma-mat-1',
    title: 'Perang Dunia II dan Indonesia',
    description: 'Pendudukan Jepang hingga kemerdekaan',
    subject: 'history',
    level: 'sma',
    duration: '35 menit',
    topics: 7,
    thumbnail: '🏺',
    content: [
      {
        title: 'Pendudukan Jepang (1942-1945)',
        content: 'Jepang menduduki Indonesia setelah Belanda menyerah. Jepang berjanji memberikan kemerdekaan, namun kenyataannya lebih kejam dari Belanda.'
      },
      {
        title: 'Kebijakan Jepang',
        content: 'Romusha (kerja paksa), penyerahan hasil bumi secara paksa, propaganda 3A (Jepang Pelindung Asia, Jepang Pemimpin Asia, Jepang Cahaya Asia).',
        examples: ['Jutaan romusha meninggal akibat kerja paksa yang sangat berat']
      },
      {
        title: 'BPUPKI dan PPKI',
        content: 'Jepang membentuk BPUPKI (29 Mei - 17 Agustus 1945) untuk mempersiapkan kemerdekaan. Soekarno merumuskan Pancasila sebagai dasar negara pada 1 Juni 1945.',
        examples: ['1 Juni diperingati sebagai Hari Lahir Pancasila']
      },
      {
        title: 'Peristiwa Rengasdengklok',
        content: 'Golongan muda menculik Soekarno-Hatta ke Rengasdengklok agar segera memproklamasikan kemerdekaan tanpa campur tangan Jepang (16 Agustus 1945).'
      },
      {
        title: 'Proklamasi 17 Agustus 1945',
        content: 'Teks proklamasi dirumuskan malam 16 Agustus di rumah Laksamana Maeda. Dibacakan Soekarno pukul 10.00 WIB di Jl. Pegangsaan Timur 56.'
      },
      {
        title: 'Pembentukan Pemerintahan',
        content: 'PPKI mengesahkan UUD 1945, memilih Soekarno-Hatta sebagai Presiden-Wapres, dan membentuk Komite Nasional Indonesia Pusat (KNIP).'
      },
      {
        title: 'Agresi Militer Belanda',
        content: 'Belanda ingin kembali menguasai Indonesia melalui Agresi Militer I (1947) dan II (1948). Indonesia menghadapi dengan perjuangan diplomasi dan fisik.'
      }
    ]
  },

  // ==================== BAHASA/SASTRA - SD ====================
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
        content: 'Pantun adalah puisi lama khas Indonesia yang terdiri dari 4 baris dengan pola sajak a-b-a-b. Pantun memiliki sampiran (2 baris awal) dan isi (2 baris akhir).'
      },
      {
        title: 'Ciri-Ciri Pantun',
        content: 'Setiap baris terdiri dari 8-12 suku kata. Baris 1-2 adalah sampiran (biasanya tentang alam), baris 3-4 adalah isi (pesan atau nasihat).',
        examples: [
          'Contoh perhitungan suku kata:',
          'Ka-lau-a-da-ja-rum-yang-pa-tah (9 suku kata)',
          'Ja-ngan-di-sim-pan-di-da-lam-pe-ti (10 suku kata)'
        ]
      },
      {
        title: 'Jenis-Jenis Pantun',
        content: 'Pantun nasihat (berisi petuah), pantun jenaka (lucu), pantun teka-teki (berisi tebakan), pantun anak-anak (tema bermain).',
        examples: [
          'Pantun nasihat: berisi pesan moral',
          'Pantun jenaka: membuat orang tertawa',
          'Pantun anak: tentang dunia anak-anak'
        ]
      },
      {
        title: 'Contoh Pantun',
        content: 'Mari belajar membuat pantun!',
        examples: [
          'Jalan-jalan ke kota Bogor',
          'Jangan lupa membeli duku',
          'Menuntut ilmu penuh perjuangan',
          'Agar masa depan lebih cerah'
        ]
      }
    ]
  },
  {
    id: 'language-sd-mat-2',
    title: 'Cerita Rakyat Nusantara',
    description: 'Mengenal dongeng dan legenda Indonesia',
    subject: 'language',
    level: 'sd',
    duration: '25 menit',
    topics: 5,
    thumbnail: '📚',
    content: [
      {
        title: 'Apa itu Cerita Rakyat?',
        content: 'Cerita rakyat adalah cerita yang diwariskan secara turun-temurun dari nenek moyang. Berisi nilai moral dan kearifan lokal.'
      },
      {
        title: 'Jenis Cerita Rakyat',
        content: 'Legenda (cerita asal-usul tempat), dongeng (cerita fantasi), fabel (cerita tentang hewan), mite (cerita dewa-dewi).'
      },
      {
        title: 'Contoh: Malin Kundang',
        content: 'Cerita dari Sumatra Barat tentang anak durhaka yang dikutuk menjadi batu karena tidak mengakui ibunya sendiri. Pesan moral: hormati orang tua.',
        examples: ['Malin Kundang menjadi batu di tepi pantai karena durhaka kepada ibu']
      },
      {
        title: 'Contoh: Timun Mas',
        content: 'Dongeng dari Jawa Tengah tentang gadis ajaib yang lahir dari buah timun emas. Timun Mas berhasil mengalahkan raksasa dengan bantuan benda ajaib.',
        examples: ['Pesan: keberanian dan kecerdikan dapat mengalahkan kekuatan']
      },
      {
        title: 'Nilai dalam Cerita Rakyat',
        content: 'Cerita rakyat mengajarkan: kejujuran, kerja keras, menghormati orang tua, tolong-menolong, dan tidak sombong.'
      }
    ]
  },

  // ==================== BAHASA/SASTRA - SMP ====================
  {
    id: 'language-smp-mat-1',
    title: 'Teks Eksposisi',
    description: 'Struktur dan ciri teks eksposisi',
    subject: 'language',
    level: 'smp',
    duration: '30 menit',
    topics: 6,
    thumbnail: '✍️',
    content: [
      {
        title: 'Pengertian Teks Eksposisi',
        content: 'Teks eksposisi adalah teks yang menjelaskan informasi atau pengetahuan berdasarkan fakta. Bertujuan menambah wawasan pembaca.'
      },
      {
        title: 'Struktur Teks Eksposisi',
        content: 'Terdiri dari: (1) Tesis (pernyataan pendapat), (2) Argumentasi (alasan/bukti pendukung), (3) Penegasan ulang (kesimpulan).'
      },
      {
        title: 'Ciri-Ciri Teks Eksposisi',
        content: 'Berisi informasi faktual, menggunakan bahasa baku, logis dan sistematis, objektif (tidak memihak), dan dilengkapi data/fakta.',
        examples: ['Contoh topik: manfaat membaca, bahaya narkoba, pentingnya pendidikan']
      },
      {
        title: 'Jenis-Jenis Eksposisi',
        content: 'Eksposisi berita (menyampaikan berita), eksposisi ilustrasi (menggambarkan sesuatu), eksposisi proses (langkah-langkah), eksposisi perbandingan (membandingkan dua hal).'
      },
      {
        title: 'Kata Penghubung dalam Eksposisi',
        content: 'Menggunakan konjungsi: karena, sehingga, akibatnya, oleh karena itu, dengan demikian, selain itu, bahkan, padahal.',
        examples: [
          'Membaca buku sangat bermanfaat karena dapat menambah wawasan.',
          'Oleh karena itu, kita harus rajin membaca.'
        ]
      },
      {
        title: 'Contoh Teks Eksposisi Singkat',
        content: 'Tesis: Sampah plastik sangat berbahaya bagi lingkungan. Argumentasi: Plastik sulit terurai, mencemari laut, dan membahayakan hewan. Penegasan: Kita harus mengurangi penggunaan plastik.'
      }
    ]
  },
  {
    id: 'language-smp-mat-2',
    title: 'Puisi dan Unsur-unsurnya',
    description: 'Memahami diksi, rima, dan majas dalam puisi',
    subject: 'language',
    level: 'smp',
    duration: '28 menit',
    topics: 5,
    thumbnail: '🎭',
    content: [
      {
        title: 'Pengertian Puisi',
        content: 'Puisi adalah karya sastra yang berisi ungkapan perasaan penyair dengan bahasa yang indah dan penuh makna. Puisi mengutamakan keindahan kata.'
      },
      {
        title: 'Unsur Fisik Puisi',
        content: 'Diksi (pilihan kata), rima (persamaan bunyi), tipografi (tata letak), dan kata konkret (kata yang dapat ditangkap panca indera).',
        examples: [
          'Diksi: memilih kata "mendung" lebih puitis dari "awan hitam"',
          'Rima: langit-pagi (sajak akhir yang sama)'
        ]
      },
      {
        title: 'Unsur Batin Puisi',
        content: 'Tema (gagasan pokok), nada (sikap penyair), perasaan (emosi yang terkandung), dan amanat (pesan moral).'
      },
      {
        title: 'Majas dalam Puisi',
        content: 'Personifikasi (benda mati seperti manusia), metafora (perbandingan langsung), simile (perbandingan dengan kata "seperti"), hiperbola (melebih-lebihkan).',
        examples: [
          'Personifikasi: "Angin berbisik di telingaku"',
          'Metafora: "Kamu matahari di hatiku"',
          'Simile: "Wajahmu bagai bulan purnama"'
        ]
      },
      {
        title: 'Membaca dan Mengapresiasi Puisi',
        content: 'Baca dengan penghayatan, pahami makna tersurat dan tersirat, rasakan emosi yang ingin disampaikan penyair.'
      }
    ]
  },

  // ==================== BAHASA/SASTRA - SMA ====================
  {
    id: 'language-sma-mat-1',
    title: 'Teks Argumentasi',
    description: 'Menyusun argumen yang kuat dan logis',
    subject: 'language',
    level: 'sma',
    duration: '35 menit',
    topics: 7,
    thumbnail: '📜',
    content: [
      {
        title: 'Pengertian Teks Argumentasi',
        content: 'Teks argumentasi bertujuan meyakinkan pembaca tentang suatu pendapat dengan menyajikan alasan, bukti, dan data yang kuat.'
      },
      {
        title: 'Perbedaan Eksposisi dan Argumentasi',
        content: 'Eksposisi: menjelaskan informasi (netral). Argumentasi: meyakinkan pembaca (memihak satu pendapat). Argumentasi lebih persuasif.'
      },
      {
        title: 'Struktur Teks Argumentasi',
        content: 'Pendahuluan (pengenalan isu), Tubuh argumen (pendapat + bukti/data), Simpulan (penegasan pendapat).'
      },
      {
        title: 'Jenis-Jenis Argumen',
        content: 'Argumen sebab-akibat, argumen perbandingan, argumen analogi, argumen data/fakta, argumen otoritas (pendapat ahli).',
        examples: [
          'Argumen data: "Menurut WHO, polusi udara membunuh 7 juta orang/tahun"',
          'Argumen otoritas: "Prof. Dr. X menyatakan bahwa..."'
        ]
      },
      {
        title: 'Syarat Argumen yang Baik',
        content: 'Berdasarkan fakta (bukan opini semata), logis dan masuk akal, didukung data/bukti valid, relevan dengan topik, konsisten (tidak kontradiktif).'
      },
      {
        title: 'Teknik Menyusun Argumen',
        content: 'Mulai dengan klaim yang jelas, sajikan bukti konkret, gunakan penalaran yang logis, antisipasi kontra-argumen, tutup dengan kesimpulan kuat.'
      },
      {
        title: 'Contoh Klaim dan Argumen',
        content: 'Klaim: "Pendidikan karakter harus diterapkan di sekolah." Argumen: (1) Data kenakalan remaja meningkat, (2) Penelitian menunjukkan pendidikan karakter menurunkan bullying 40%, (3) Ahli pendidikan merekomendasikan, (4) Negara maju telah menerapkan.'
      }
    ]
  }
]

export const getMaterialsBySubjectAndLevel = (subject: SubjectId, level: LevelId) => {
  return materials.filter(m => m.subject === subject && m.level === level)
}

export const getMaterialById = (id: string) => materials.find(m => m.id === id)