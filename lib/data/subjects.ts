export type SubjectId = 'math' | 'science' | 'history' | 'language'
export type LevelId = 'sd' | 'smp' | 'sma'

export interface Subject {
  id: SubjectId
  emoji: string
  title: string
  description: string
  count: string
  color: 'yellow' | 'green' | 'blue' | 'purple'
  levels: Level[]
}

export interface Level {
  id: LevelId
  name: string
  description: string
  icon: string
}

export const subjects: Subject[] = [
  {
    id: 'math',
    emoji: '📊',
    title: 'Matematika',
    description: 'Aljabar, Geometri, Kalkulus & lainnya',
    count: '120 Kuis',
    color: 'yellow',
    levels: [
      { id: 'sd', name: 'SD', description: 'Kelas 1-6', icon: '🎒' },
      { id: 'smp', name: 'SMP', description: 'Kelas 7-9', icon: '📐' },
      { id: 'sma', name: 'SMA', description: 'Kelas 10-12', icon: '🎓' }
    ]
  },
  {
    id: 'science',
    emoji: '🔬',
    title: 'Sains',
    description: 'Topik Fisika, Kimia, Biologi',
    count: '95 Kuis',
    color: 'green',
    levels: [
      { id: 'sd', name: 'SD', description: 'Kelas 1-6', icon: '🌱' },
      { id: 'smp', name: 'SMP', description: 'Kelas 7-9', icon: '⚗️' },
      { id: 'sma', name: 'SMA', description: 'Kelas 10-12', icon: '🔬' }
    ]
  },
  {
    id: 'history',
    emoji: '📚',
    title: 'Sejarah',
    description: 'Peristiwa dunia, peradaban & budaya',
    count: '78 Kuis',
    color: 'blue',
    levels: [
      { id: 'sd', name: 'SD', description: 'Kelas 1-6', icon: '🏛️' },
      { id: 'smp', name: 'SMP', description: 'Kelas 7-9', icon: '📜' },
      { id: 'sma', name: 'SMA', description: 'Kelas 10-12', icon: '🏺' }
    ]
  },
  {
    id: 'language',
    emoji: '📖',
    title: 'Sastra',
    description: 'Pemahaman bacaan & analisis',
    count: '64 Kuis',
    color: 'purple',
    levels: [
      { id: 'sd', name: 'SD', description: 'Kelas 1-6', icon: '📚' },
      { id: 'smp', name: 'SMP', description: 'Kelas 7-9', icon: '✍️' },
      { id: 'sma', name: 'SMA', description: 'Kelas 10-12', icon: '📝' }
    ]
  }
]

export const getSubjectById = (id: SubjectId) => subjects.find(s => s.id === id)
export const getLevelById = (subjectId: SubjectId, levelId: LevelId) => {
  const subject = getSubjectById(subjectId)
  return subject?.levels.find(l => l.id === levelId)
}