export interface User {
  id: string
  username: string
  email: string
  avatar_url?: string
  level: number
  xp: number
  coins: number
  total_wins: number
  total_games: number
  created_at: string
}

export interface GameRoom {
  id: string
  room_code: string
  host_user_id: string
  status: 'waiting' | 'playing' | 'finished'
  current_stage: number
  max_stages: number
  voice_room_url?: string
  created_at: string
}

export interface Question {
  id: number
  category_id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  difficulty: 'easy' | 'medium' | 'hard'
}