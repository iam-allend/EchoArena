import { SubjectId, LevelId } from './subjects'

export interface Quiz {
  id: string
  title: string
  description: string
  subject: SubjectId
  level: LevelId
  questionCount: number
  duration: number // in minutes
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  thumbnail: string
}

export const quizzes: Quiz[] = [
  // MATEMATIKA - SD
  {
    id: 'math-sd-1',
    title: 'Penjumlahan & Pengurangan Dasar',
    description: 'Belajar operasi hitung dasar untuk pemula',
    subject: 'math',
    level: 'sd',
    questionCount: 10,
    duration: 15,
    difficulty: 'easy',
    points: 100,
    thumbnail: '➕'
  },
  {
    id: 'math-sd-2',
    title: 'Perkalian & Pembagian',
    description: 'Kuasai tabel perkalian 1-10',
    subject: 'math',
    level: 'sd',
    questionCount: 15,
    duration: 20,
    difficulty: 'medium',
    points: 150,
    thumbnail: '✖️'
  },
  
  // MATEMATIKA - SMP
  {
    id: 'math-smp-1',
    title: 'Aljabar Linear',
    description: 'Persamaan linear satu variabel',
    subject: 'math',
    level: 'smp',
    questionCount: 12,
    duration: 25,
    difficulty: 'medium',
    points: 200,
    thumbnail: '📐'
  },
  {
    id: 'math-smp-2',
    title: 'Geometri Bidang Datar',
    description: 'Luas dan keliling bangun datar',
    subject: 'math',
    level: 'smp',
    questionCount: 10,
    duration: 20,
    difficulty: 'medium',
    points: 180,
    thumbnail: '△'
  },
  
  // MATEMATIKA - SMA
  {
    id: 'math-sma-1',
    title: 'Trigonometri Dasar',
    description: 'Sin, Cos, Tan dan penerapannya',
    subject: 'math',
    level: 'sma',
    questionCount: 15,
    duration: 30,
    difficulty: 'hard',
    points: 300,
    thumbnail: '📊'
  },
  
  // SAINS - SD
  {
    id: 'science-sd-1',
    title: 'Makhluk Hidup & Lingkungan',
    description: 'Mengenal tumbuhan dan hewan',
    subject: 'science',
    level: 'sd',
    questionCount: 10,
    duration: 15,
    difficulty: 'easy',
    points: 100,
    thumbnail: '🌱'
  },
  
  // SAINS - SMP
  {
    id: 'science-smp-1',
    title: 'Sistem Pencernaan Manusia',
    description: 'Organ dan proses pencernaan',
    subject: 'science',
    level: 'smp',
    questionCount: 12,
    duration: 20,
    difficulty: 'medium',
    points: 200,
    thumbnail: '🫀'
  },
  
  // SAINS - SMA
  {
    id: 'science-sma-1',
    title: 'Hukum Newton',
    description: 'Gerak dan gaya dalam fisika',
    subject: 'science',
    level: 'sma',
    questionCount: 15,
    duration: 30,
    difficulty: 'hard',
    points: 300,
    thumbnail: '⚛️'
  },
  
  // SEJARAH - SD
  {
    id: 'history-sd-1',
    title: 'Pahlawan Nasional Indonesia',
    description: 'Kenali pahlawan kemerdekaan',
    subject: 'history',
    level: 'sd',
    questionCount: 10,
    duration: 15,
    difficulty: 'easy',
    points: 100,
    thumbnail: '🇮🇩'
  },
  
  // SEJARAH - SMP
  {
    id: 'history-smp-1',
    title: 'Penjajahan di Indonesia',
    description: 'Era VOC hingga Jepang',
    subject: 'history',
    level: 'smp',
    questionCount: 12,
    duration: 20,
    difficulty: 'medium',
    points: 200,
    thumbnail: '⛵'
  },
  
  // SASTRA - SD
  {
    id: 'language-sd-1',
    title: 'Cerita Rakyat Nusantara',
    description: 'Dongeng dan legenda Indonesia',
    subject: 'language',
    level: 'sd',
    questionCount: 10,
    duration: 15,
    difficulty: 'easy',
    points: 100,
    thumbnail: '📚'
  }
]

export const getQuizzesBySubjectAndLevel = (subject: SubjectId, level: LevelId) => {
  return quizzes.filter(q => q.subject === subject && q.level === level)
}

export const getQuizById = (id: string) => quizzes.find(q => q.id === id)