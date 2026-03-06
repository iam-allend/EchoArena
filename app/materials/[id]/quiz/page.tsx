'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Zap, Trophy, Clock, ChevronRight, Loader2, AlertCircle,
  CheckCircle2, XCircle, RotateCcw, BookOpen, ArrowRight,
  BarChart3, RefreshCw, X, AlertTriangle, Play, Flame,
  Star, Shield,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  id: number
  question_text: string
  option_a: string; option_b: string; option_c: string; option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  difficulty: 'easy' | 'medium' | 'hard'
}

interface QuizSession {
  id: number
  user_id: string
  material_id: string
  status: 'in_progress' | 'completed'
  question_order: number[]
  current_index: number
  correct_count: number
  wrong_count: number
  total_coins_earned: number
  total_xp_earned: number
  coin_credited: boolean
}

type Screen = 'loading' | 'intro' | 'question' | 'feedback' | 'result' | 'error'
type ConfirmType = 'restart' | 'exit' | 'replay' | null

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMER_SECONDS = 30
const COIN_BASE: Record<string, number> = { easy: 5, medium: 10, hard: 15 }
const XP_BASE:   Record<string, number> = { easy: 10, medium: 20, hard: 30 }

const DIFF_CFG = {
  easy:   { label: 'Mudah',  color: '#10b981', bg: 'rgba(16,185,129,.15)', border: 'rgba(16,185,129,.4)', glow: '0 0 20px rgba(16,185,129,.3)' },
  medium: { label: 'Sedang', color: '#f59e0b', bg: 'rgba(245,158,11,.15)', border: 'rgba(245,158,11,.4)', glow: '0 0 20px rgba(245,158,11,.3)' },
  hard:   { label: 'Sulit',  color: '#f43f5e', bg: 'rgba(244,63,94,.15)',  border: 'rgba(244,63,94,.4)',  glow: '0 0 20px rgba(244,63,94,.3)' },
}

function calcCoins(base: number, timeTaken: number): number {
  const r = TIMER_SECONDS - timeTaken
  if (r >= 20) return base
  if (r >= 10) return Math.floor(base * 0.7)
  if (r >= 1)  return Math.floor(base * 0.5)
  return 0
}

function xpToLevel(xp: number): number {
  let lvl = 1, threshold = 100, cum = 0
  while (cum + threshold <= xp && lvl < 99) { cum += threshold; lvl++; threshold = 100 + (lvl - 1) * 150 }
  return lvl
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({ type, onConfirm, onCancel, questionCount, currentIndex }: {
  type: ConfirmType
  onConfirm: () => void
  onCancel: () => void
  questionCount?: number
  currentIndex?: number
}) {
  if (!type) return null

  const cfg = {
    restart: {
      icon: <RotateCcw className="w-8 h-8" />,
      color: '#f59e0b',
      title: 'Mulai Ulang Quiz?',
      body: `Progress soal ${(currentIndex ?? 0) + 1} dari ${questionCount} akan hilang. Soal akan diacak ulang dan kamu harus mulai dari awal.`,
      confirm: 'Ya, Ulang',
      cancel: 'Batal',
    },
    exit: {
      icon: <AlertTriangle className="w-8 h-8" />,
      color: '#f43f5e',
      title: 'Keluar dari Quiz?',
      body: 'Progress soal yang sudah dikerjakan akan tersimpan. Kamu bisa lanjutkan lain kali dari soal ini.',
      confirm: 'Keluar',
      cancel: 'Lanjut Main',
    },
    replay: {
      icon: <Shield className="w-8 h-8" />,
      color: '#a855f7',
      title: 'Main Ulang Tanpa Hadiah',
      body: 'Kamu sudah pernah menyelesaikan quiz ini. Replay TIDAK memberikan koin dan XP. Lanjutkan untuk berlatih saja?',
      confirm: 'Ya, Main Lagi',
      cancel: 'Batal',
    },
  }[type]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-3xl border overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1030 100%)',
          borderColor: cfg.color + '40',
          boxShadow: `0 0 60px ${cfg.color}20, 0 25px 50px rgba(0,0,0,.6)`,
          animation: 'popIn .25s cubic-bezier(.34,1.56,.64,1) both',
        }}>
        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }} />

        <div className="p-7 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: cfg.color + '15', border: `1px solid ${cfg.color}40`, color: cfg.color }}>
            {cfg.icon}
          </div>
          <div>
            <h3 className="text-xl font-black text-white mb-2">{cfg.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(220,210,255,.6)' }}>{cfg.body}</p>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onCancel}
              className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[.98]"
              style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(220,210,255,.6)' }}>
              {cfg.cancel}
            </button>
            <button onClick={onConfirm}
              className="flex-1 py-3 rounded-2xl font-black text-sm text-white transition-all hover:scale-[1.02] active:scale-[.98]"
              style={{ background: `linear-gradient(135deg, ${cfg.color}cc, ${cfg.color})`, boxShadow: `0 4px 20px ${cfg.color}40` }}>
              {cfg.confirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Circular Timer ───────────────────────────────────────────────────────────

function CircularTimer({ seconds, total = TIMER_SECONDS }: { seconds: number; total?: number }) {
  const r = 44
  const circ = 2 * Math.PI * r
  const pct  = seconds / total
  const dash = circ * (1 - pct)
  const color = seconds > 18 ? '#10b981' : seconds > 9 ? '#f59e0b' : '#f43f5e'
  const urgency = seconds <= 9

  return (
    <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
      {urgency && (
        <div className="absolute inset-0 rounded-full animate-ping"
          style={{ background: 'rgba(244,63,94,.15)', animationDuration: '1s' }} />
      )}
      <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="6" />
        <circle cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dash}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s ease', filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black text-xl leading-none" style={{ color, textShadow: `0 0 12px ${color}` }}>
          {seconds}
        </span>
        <span style={{ color: 'rgba(180,160,255,.4)', fontSize: 10, fontWeight: 700 }}>SEK</span>
      </div>
    </div>
  )
}

// ─── Option Button ────────────────────────────────────────────────────────────

function OptionBtn({ letter, text, state, disabled, onClick }: {
  letter: 'A' | 'B' | 'C' | 'D'
  text: string
  state: 'idle' | 'correct' | 'wrong' | 'dimmed'
  disabled: boolean
  onClick: () => void
}) {
  const colors = { A: '#22d3ee', B: '#a855f7', C: '#f59e0b', D: '#f43f5e' }
  const c = colors[letter]

  const styles: Record<string, React.CSSProperties> = {
    idle: {
      background: `linear-gradient(135deg, rgba(255,255,255,.03) 0%, rgba(255,255,255,.06) 100%)`,
      border: `1px solid rgba(255,255,255,.08)`,
      color: '#f0eeff',
    },
    correct: {
      background: 'linear-gradient(135deg, rgba(16,185,129,.18) 0%, rgba(16,185,129,.08) 100%)',
      border: '1px solid rgba(16,185,129,.6)',
      color: '#6ee7b7',
      boxShadow: '0 0 30px rgba(16,185,129,.25), inset 0 1px 0 rgba(16,185,129,.2)',
    },
    wrong: {
      background: 'linear-gradient(135deg, rgba(244,63,94,.18) 0%, rgba(244,63,94,.08) 100%)',
      border: '1px solid rgba(244,63,94,.6)',
      color: '#fca5a5',
      boxShadow: '0 0 30px rgba(244,63,94,.2)',
      animation: 'shake .4s ease',
    },
    dimmed: {
      background: 'rgba(255,255,255,.01)',
      border: '1px solid rgba(255,255,255,.04)',
      color: 'rgba(150,140,200,.3)',
    },
  }

  const badgeStyles: Record<string, React.CSSProperties> = {
    idle:    { background: `${c}20`, border: `1px solid ${c}50`, color: c },
    correct: { background: 'rgba(16,185,129,.3)', border: '1px solid rgba(16,185,129,.6)', color: '#6ee7b7' },
    wrong:   { background: 'rgba(244,63,94,.3)',  border: '1px solid rgba(244,63,94,.6)',  color: '#fca5a5' },
    dimmed:  { background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', color: 'rgba(150,140,200,.2)' },
  }

  return (
    <button onClick={onClick} disabled={disabled}
      className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left group transition-all duration-200"
      style={{
        ...styles[state],
        ...(state === 'idle' && !disabled ? {
          cursor: 'pointer',
        } : {}),
      }}
      onMouseEnter={e => {
        if (state !== 'idle' || disabled) return
        ;(e.currentTarget as HTMLElement).style.background = `linear-gradient(135deg, ${c}12 0%, ${c}06 100%)`
        ;(e.currentTarget as HTMLElement).style.borderColor = `${c}40`
        ;(e.currentTarget as HTMLElement).style.transform = 'translateX(4px)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${c}15`
      }}
      onMouseLeave={e => {
        if (state !== 'idle' || disabled) return
        const el = e.currentTarget as HTMLElement
        el.style.background = 'linear-gradient(135deg, rgba(255,255,255,.03) 0%, rgba(255,255,255,.06) 100%)'
        el.style.borderColor = 'rgba(255,255,255,.08)'
        el.style.transform = ''
        el.style.boxShadow = ''
      }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-all"
        style={badgeStyles[state]}>
        {letter}
      </div>
      <span className="text-sm font-semibold leading-snug flex-1">{text}</span>
      {state === 'correct' && <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: '#10b981', filter: 'drop-shadow(0 0 6px #10b981)' }} />}
      {state === 'wrong'   && <XCircle      className="w-5 h-5 shrink-0" style={{ color: '#f43f5e', filter: 'drop-shadow(0 0 6px #f43f5e)' }} />}
    </button>
  )
}

// ─── Coin Float Animation ─────────────────────────────────────────────────────

function CoinFloat({ coins }: { coins: number }) {
  return (
    <div className="pointer-events-none select-none font-black text-2xl"
      style={{ animation: 'coinFloat .8s ease forwards', color: '#fbbf24', textShadow: '0 0 20px #fbbf24' }}>
      +🪙{coins}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SoloQuizPage() {
  const params   = useParams()
  const router   = useRouter()
  const id       = params?.id as string
  const supabase = createClient()

  const [screen, setScreen]     = useState<Screen>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [confirm, setConfirm]   = useState<ConfirmType>(null)

  const [materialTitle, setMaterialTitle] = useState('')
  const [materialThumb, setMaterialThumb] = useState('📚')
  const [userId, setUserId]               = useState<string | null>(null)
  const [session, setSession]             = useState<QuizSession | null>(null)
  const [questions, setQuestions]         = useState<Question[]>([])
  const [hasPrevCompleted, setHasPrevCompleted] = useState(false)
  const [isReplay, setIsReplay]           = useState(false)

  const [currentQ, setCurrentQ]           = useState<Question | null>(null)
  const [currentIdx, setCurrentIdx]       = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null)
  const [isAnswered, setIsAnswered]       = useState(false)
  const [isCorrect, setIsCorrect]         = useState(false)
  const [timerSec, setTimerSec]           = useState(TIMER_SECONDS)
  const [coinsPreview, setCoinsPreview]   = useState(0)
  const [showCoinFloat, setShowCoinFloat] = useState(false)
  const [earnedCoins, setEarnedCoins]     = useState(0)

  const [resultCoins, setResultCoins]   = useState(0)
  const [resultXP, setResultXP]         = useState(0)
  const [resultCorrect, setResultCorrect] = useState(0)
  const [resultWrong, setResultWrong]   = useState(0)
  const [leveledUp, setLeveledUp]       = useState(false)
  const [newLevel, setNewLevel]         = useState(1)
  const [sessionIdForEval, setSessionIdForEval] = useState<number | null>(null)

  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef     = useRef<number>(0)
  const answeredRef  = useRef(false)

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      try {
        const { data: { session: auth } } = await supabase.auth.getSession()
        if (!auth) { router.replace(`/auth/login?redirect=/materials/${id}/quiz`); return }
        const uid = auth.user.id
        if (!cancelled) setUserId(uid)

        const [matRes, progressRes, allQRes] = await Promise.all([
          supabase.from('materials').select('id,title,thumbnail,is_quiz_enabled,content').eq('id', id).single(),
          supabase.from('reading_progress').select('section_index', { count: 'exact' }).eq('user_id', uid).eq('material_id', id),
          supabase.from('questions').select('id,question_text,option_a,option_b,option_c,option_d,correct_answer,difficulty').eq('material_id', id),
        ])

        if (cancelled) return
        if (matRes.error || !matRes.data) { setErrorMsg('Materi tidak ditemukan.'); setScreen('error'); return }
        if (!matRes.data.is_quiz_enabled)  { setErrorMsg('Quiz belum diaktifkan untuk materi ini.'); setScreen('error'); return }

        setMaterialTitle(matRes.data.title)
        setMaterialThumb(matRes.data.thumbnail ?? '📚')

        let totalSections = 0
        try {
          const raw = typeof matRes.data.content === 'string' ? JSON.parse(matRes.data.content) : matRes.data.content
          if (Array.isArray(raw)) totalSections = raw.length
        } catch {}

        const readCount = progressRes.count ?? 0
        if (totalSections > 0 && readCount < totalSections) {
          setErrorMsg(`Baca dulu semua bagian materi (${readCount}/${totalSections} selesai) sebelum mengerjakan quiz.`)
          setScreen('error'); return
        }

        if (!allQRes.data || allQRes.data.length === 0) { setErrorMsg('Belum ada soal untuk materi ini.'); setScreen('error'); return }

        const qs = allQRes.data as Question[]

        const { data: sessions } = await supabase
          .from('quiz_sessions').select('*')
          .eq('user_id', uid).eq('material_id', id)
          .order('started_at', { ascending: false })

        if (cancelled) return

        const inProg   = sessions?.find(s => s.status === 'in_progress')
        const completed = sessions?.find(s => s.status === 'completed')
        if (completed) setHasPrevCompleted(true)

        if (inProg) {
          const ordered = (inProg.question_order as number[])
            .map(qid => qs.find(q => q.id === qid)).filter(Boolean) as Question[]
          setSession(inProg as QuizSession)
          setQuestions(ordered)
          setCurrentIdx(inProg.current_index)
        } else {
          setQuestions(qs)
        }

        if (!cancelled) setScreen('intro')
      } catch (err) {
        console.error(err)
        if (!cancelled) { setErrorMsg('Terjadi kesalahan. Coba lagi.'); setScreen('error') }
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  // ── Start / Resume ─────────────────────────────────────────────────────────
  const startQuiz = useCallback(async (mode: 'new' | 'resume' | 'replay') => {
    if (!userId || questions.length === 0) return

    if (mode === 'resume' && session) {
      setIsReplay(session.coin_credited)
      setSessionIdForEval(session.id)
      goToQuestion(session.current_index)
      return
    }

    const shuffled     = shuffle(questions.map(q => q.id))
    const coinCredited = mode === 'replay' || hasPrevCompleted

    // Delete old in_progress
    await supabase.from('quiz_sessions')
      .delete().eq('user_id', userId).eq('material_id', id).eq('status', 'in_progress')

    const { data, error } = await supabase.from('quiz_sessions')
      .insert({ user_id: userId, material_id: id, status: 'in_progress',
        question_order: shuffled, current_index: 0,
        correct_count: 0, wrong_count: 0, total_coins_earned: 0, total_xp_earned: 0,
        coin_credited: coinCredited })
      .select().single()

    if (error || !data) { setErrorMsg('Gagal membuat sesi.'); setScreen('error'); return }

    const ordered = shuffled.map(qid => questions.find(q => q.id === qid)).filter(Boolean) as Question[]
    setQuestions(ordered)
    setSession(data as QuizSession)
    setIsReplay(coinCredited)
    setSessionIdForEval(data.id)
    setCurrentIdx(0)
    goToQuestion(0)
  }, [userId, questions, session, hasPrevCompleted, id])

  function goToQuestion(idx: number) {
    setCurrentIdx(idx)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setIsCorrect(false)
    setTimerSec(TIMER_SECONDS)
    answeredRef.current = false
    setShowCoinFloat(false)
    setScreen('question')
  }

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'question') { if (timerRef.current) clearInterval(timerRef.current); return }
    const q = questions[currentIdx]
    startRef.current = Date.now()
    setCoinsPreview(COIN_BASE[q?.difficulty ?? 'medium'] ?? 10)

    timerRef.current = setInterval(() => {
      if (answeredRef.current) return
      const elapsed    = Math.floor((Date.now() - startRef.current) / 1000)
      const remaining  = TIMER_SECONDS - elapsed
      if (remaining <= 0) {
        clearInterval(timerRef.current!)
        setTimerSec(0); setCoinsPreview(0)
        if (!answeredRef.current) handleAnswer(null, elapsed)
      } else {
        setTimerSec(remaining)
        setCoinsPreview(calcCoins(COIN_BASE[q?.difficulty ?? 'medium'] ?? 10, elapsed))
      }
    }, 500)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [screen, currentIdx])

  useEffect(() => {
    if (questions.length > 0 && currentIdx < questions.length) setCurrentQ(questions[currentIdx])
  }, [questions, currentIdx])

  // ── Submit answer ──────────────────────────────────────────────────────────
  const handleAnswer = useCallback(async (
    answer: 'A' | 'B' | 'C' | 'D' | null,
    elapsedOverride?: number,
  ) => {
    if (!currentQ || !session || answeredRef.current) return
    answeredRef.current = true
    if (timerRef.current) clearInterval(timerRef.current)

    const elapsed  = elapsedOverride ?? Math.floor((Date.now() - startRef.current) / 1000)
    const correct  = answer === currentQ.correct_answer
    const coins    = correct && !isReplay ? calcCoins(COIN_BASE[currentQ.difficulty] ?? 10, elapsed) : 0
    const xp       = correct && !isReplay ? XP_BASE[currentQ.difficulty] ?? 20 : 0

    setSelectedAnswer(answer)
    setIsAnswered(true)
    setIsCorrect(correct)

    if (correct && coins > 0) {
      setEarnedCoins(coins)
      setShowCoinFloat(true)
      setTimeout(() => setShowCoinFloat(false), 900)
    }

    try {
      await supabase.from('quiz_answers').insert({
        session_id: session.id, question_id: currentQ.id,
        selected_answer: answer, is_correct: correct,
        time_taken: elapsed, coins_earned: coins, xp_earned: xp,
      })

      const newCorrect = session.correct_count + (correct ? 1 : 0)
      const newWrong   = session.wrong_count   + (correct ? 0 : 1)
      const newCoins   = session.total_coins_earned + coins
      const newXP      = session.total_xp_earned + xp
      const nextIdx    = currentIdx + 1
      const done       = nextIdx >= questions.length

      const patch: Partial<QuizSession> = {
        current_index: done ? currentIdx : nextIdx,
        correct_count: newCorrect, wrong_count: newWrong,
        total_coins_earned: newCoins, total_xp_earned: newXP,
        ...(done ? { status: 'completed', completed_at: new Date().toISOString() } as any : {}),
      }

      await supabase.from('quiz_sessions').update(patch).eq('id', session.id)
      setSession(prev => prev ? { ...prev, ...patch } : prev)

      if (done) {
        if (!isReplay) {
          const { data: u } = await supabase.from('users').select('xp,level,coins').eq('id', session.user_id).single()
          if (u) {
            const nXP    = u.xp + newXP
            const nCoins = u.coins + newCoins
            const nLvl   = xpToLevel(nXP)
            await supabase.from('users').update({ xp: nXP, coins: nCoins, level: nLvl }).eq('id', session.user_id)
            if (nLvl > u.level) { setLeveledUp(true); setNewLevel(nLvl) }
          }
        }
        setResultCoins(newCoins); setResultXP(newXP)
        setResultCorrect(newCorrect); setResultWrong(newWrong)
        setTimeout(() => setScreen('result'), correct ? 900 : 1400)
        return
      }
    } catch (err) { console.error(err) }

    if (!correct || answer === null) {
      setScreen('feedback')
    } else {
      setTimeout(() => goToQuestion(currentIdx + 1), 900)
    }
  }, [currentQ, session, currentIdx, questions, isReplay])

  // ─── RENDER ────────────────────────────────────────────────────────────────

  const BG = `
    radial-gradient(ellipse at 20% 20%, rgba(139,92,246,.15) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 80%, rgba(34,211,238,.1) 0%, transparent 60%),
    radial-gradient(ellipse at 50% 50%, rgba(168,85,247,.05) 0%, transparent 80%),
    linear-gradient(135deg, #050510 0%, #0a0820 50%, #060312 100%)
  `

  const GRID = `
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 40h40M40 0v40' stroke='rgba(139,92,246,.06)' stroke-width='1'/%3E%3C/svg%3E")
  `

  // ── Loading ────────────────────────────────────────────────────────────────
  if (screen === 'loading') return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(139,92,246,.2)', border: '1px solid rgba(139,92,246,.4)', boxShadow: '0 0 30px rgba(139,92,246,.3)' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#a855f7' }} />
        </div>
        <p style={{ color: 'rgba(200,180,255,.5)', fontSize: 14 }}>Memuat quiz...</p>
      </div>
    </div>
  )

  // ── Error ──────────────────────────────────────────────────────────────────
  if (screen === 'error') return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: BG }}>
      <div className="max-w-sm w-full text-center space-y-5 p-8 rounded-3xl"
        style={{ background: 'rgba(244,63,94,.08)', border: '1px solid rgba(244,63,94,.3)' }}>
        <AlertCircle className="w-12 h-12 mx-auto" style={{ color: '#f43f5e', filter: 'drop-shadow(0 0 12px #f43f5e)' }} />
        <p className="text-white font-bold text-base">{errorMsg}</p>
        <Link href={`/materials/${id}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm text-white transition-all hover:scale-[1.03]"
          style={{ background: 'rgba(244,63,94,.2)', border: '1px solid rgba(244,63,94,.4)' }}>
          ← Kembali ke Materi
        </Link>
      </div>
    </div>
  )

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (screen === 'intro') {
    const hasInProg = session?.status === 'in_progress'
    const maxCoins  = questions.reduce((s, q) => s + (COIN_BASE[q.difficulty] ?? 10), 0)
    const maxXP     = questions.reduce((s, q) => s + (XP_BASE[q.difficulty] ?? 20), 0)
    const easyCount = questions.filter(q => q.difficulty === 'easy').length
    const medCount  = questions.filter(q => q.difficulty === 'medium').length
    const hardCount = questions.filter(q => q.difficulty === 'hard').length

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: BG }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: GRID }} />

        <ConfirmModal type={confirm}
          onCancel={() => setConfirm(null)}
          onConfirm={() => { setConfirm(null); startQuiz(confirm === 'replay' ? 'replay' : 'new') }}
          questionCount={questions.length}
          currentIndex={session?.current_index} />

        <div className="relative w-full max-w-md space-y-4" style={{ animation: 'slideUp .4s ease both' }}>
          {/* Header card */}
          <div className="rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,.15) 0%, rgba(34,211,238,.08) 100%)',
              border: '1px solid rgba(139,92,246,.25)',
              boxShadow: '0 0 60px rgba(139,92,246,.15), 0 20px 40px rgba(0,0,0,.4)',
            }}>
            {/* Top gradient bar */}
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #7c3aed, #06b6d4, #7c3aed)' }} />

            <div className="p-7 text-center space-y-5">
              {/* Thumbnail */}
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-5xl"
                  style={{ background: 'rgba(139,92,246,.15)', border: '1px solid rgba(139,92,246,.3)', boxShadow: '0 0 30px rgba(139,92,246,.2)' }}>
                  {materialThumb}
                </div>
                {isReplay && (
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                    style={{ background: '#f59e0b', boxShadow: '0 0 12px #f59e0b' }}>
                    ↺
                  </div>
                )}
              </div>

              <div>
                <p style={{ color: 'rgba(167,139,250,.6)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }} className="mb-1">
                  ⚡ Solo Quiz
                </p>
                <h1 className="text-xl font-black text-white leading-snug">{materialTitle}</h1>
              </div>

              {/* Replay warning */}
              {isReplay && (
                <div className="rounded-2xl px-4 py-3 text-center" style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)' }}>
                  <p className="font-black text-sm mb-0.5" style={{ color: '#fbbf24' }}>⚠️ Mode Replay — Tanpa Hadiah</p>
                  <p style={{ color: 'rgba(251,191,36,.55)', fontSize: 12 }}>Koin dan XP tidak akan didapat di sesi ini</p>
                </div>
              )}

              {/* Resume info */}
              {hasInProg && !isReplay && (
                <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(34,211,238,.08)', border: '1px solid rgba(34,211,238,.25)' }}>
                  <p className="font-black text-sm mb-0.5" style={{ color: '#22d3ee' }}>
                    🔄 Sesi Tersimpan — Soal {session!.current_index + 1}/{questions.length}
                  </p>
                  <p style={{ color: 'rgba(34,211,238,.5)', fontSize: 12 }}>Lanjutkan dari soal terakhir atau mulai ulang</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: 'Total Soal', val: questions.length, icon: '📝', color: '#a78bfa' },
                  { label: 'Maks Koin',  val: isReplay ? '—' : `🪙${maxCoins}`,  icon: null, color: isReplay ? '#444' : '#fbbf24' },
                  { label: 'Maks XP',    val: isReplay ? '—' : `⚡${maxXP}`,    icon: null, color: isReplay ? '#444' : '#34d399' },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl p-3 text-center"
                    style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
                    <p className="font-black text-base" style={{ color: s.color }}>{s.val}</p>
                    <p style={{ color: 'rgba(180,160,255,.4)', fontSize: 11, marginTop: 2 }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Difficulty breakdown */}
              <div className="flex justify-center gap-3">
                {[
                  { label: 'Mudah', count: easyCount, color: '#10b981' },
                  { label: 'Sedang', count: medCount, color: '#f59e0b' },
                  { label: 'Sulit', count: hardCount, color: '#f43f5e' },
                ].filter(d => d.count > 0).map(d => (
                  <div key={d.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                    style={{ background: d.color + '15', border: `1px solid ${d.color}35` }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
                    <span style={{ color: d.color, fontSize: 12, fontWeight: 700 }}>{d.count} {d.label}</span>
                  </div>
                ))}
              </div>

              {/* Timer info */}
              <p style={{ color: 'rgba(180,160,255,.4)', fontSize: 12 }} className="flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> {TIMER_SECONDS}s per soal · Jawab cepat = koin lebih besar
              </p>

              {/* Action buttons */}
              <div className="space-y-2.5 pt-1">
                {hasInProg && !isReplay ? (
                  <>
                    <button onClick={() => startQuiz('resume')}
                      className="w-full py-4 rounded-2xl font-black text-base text-white transition-all hover:scale-[1.02] active:scale-[.98]"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', boxShadow: '0 4px 24px rgba(124,58,237,.5)' }}>
                      <ArrowRight className="inline w-5 h-5 mr-2" /> Lanjutkan Quiz
                    </button>
                    <button onClick={() => setConfirm('restart')}
                      className="w-full py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.01]"
                      style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(200,180,255,.6)' }}>
                      <RotateCcw className="inline w-4 h-4 mr-1.5" /> Mulai dari Awal
                    </button>
                  </>
                ) : hasPrevCompleted ? (
                  <button onClick={() => setConfirm('replay')}
                    className="w-full py-4 rounded-2xl font-black text-base text-white transition-all hover:scale-[1.02] active:scale-[.98]"
                    style={{ background: 'linear-gradient(135deg, #7c3aed80, #a855f7)', border: '1px solid rgba(168,85,247,.4)', boxShadow: '0 4px 24px rgba(168,85,247,.3)' }}>
                    <RefreshCw className="inline w-5 h-5 mr-2" /> Main Lagi (Tanpa Hadiah)
                  </button>
                ) : (
                  <button onClick={() => startQuiz('new')}
                    className="w-full py-4 rounded-2xl font-black text-base text-black transition-all hover:scale-[1.02] active:scale-[.98]"
                    style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 4px 28px rgba(251,191,36,.5)' }}>
                    <Play className="inline w-5 h-5 mr-2 fill-black" /> Mulai Quiz Sekarang
                  </button>
                )}

                <Link href={`/materials/${id}`}
                  className="block text-center py-2 text-sm transition-colors hover:opacity-80"
                  style={{ color: 'rgba(180,160,255,.35)' }}>
                  ← Kembali ke Materi
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Question / Feedback ────────────────────────────────────────────────────
  if ((screen === 'question' || screen === 'feedback') && currentQ) {
    const opts: { letter: 'A' | 'B' | 'C' | 'D'; text: string }[] = [
      { letter: 'A', text: currentQ.option_a },
      { letter: 'B', text: currentQ.option_b },
      { letter: 'C', text: currentQ.option_c },
      { letter: 'D', text: currentQ.option_d },
    ]
    const diff = DIFF_CFG[currentQ.difficulty as keyof typeof DIFF_CFG] ?? DIFF_CFG.medium
    const prog = ((currentIdx + (isAnswered ? 1 : 0)) / questions.length) * 100

    function optState(l: 'A' | 'B' | 'C' | 'D'): 'idle' | 'correct' | 'wrong' | 'dimmed' {
      if (!isAnswered) return 'idle'
      if (l === selectedAnswer && isCorrect)  return 'correct'
      if (l === selectedAnswer && !isCorrect) return 'wrong'
      return 'dimmed'
    }

    return (
      <div className="min-h-screen flex flex-col" style={{ background: BG }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: GRID }} />

        <ConfirmModal type={confirm}
          onCancel={() => setConfirm(null)}
          onConfirm={() => { setConfirm(null); if (confirm === 'exit') router.push(`/materials/${id}`) }}
          questionCount={questions.length} currentIndex={currentIdx} />

        {/* Top HUD */}
        <div className="relative flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b"
          style={{ borderColor: 'rgba(139,92,246,.12)', background: 'rgba(10,8,25,.6)', backdropFilter: 'blur(12px)' }}>

          {/* Exit button */}
          <button onClick={() => setConfirm('exit')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.04]"
            style={{ background: 'rgba(244,63,94,.1)', border: '1px solid rgba(244,63,94,.25)', color: '#f87171' }}>
            <X className="w-3.5 h-3.5" /> Keluar
          </button>

          {/* Progress bar */}
          <div className="flex-1">
            <div className="flex justify-between mb-1" style={{ color: 'rgba(180,160,255,.45)', fontSize: 11, fontWeight: 700 }}>
              <span>Soal {currentIdx + 1} / {questions.length}</span>
              <span style={{ color: diff.color }}>{diff.label}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.05)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${prog}%`, background: `linear-gradient(90deg, #7c3aed, ${diff.color})`, boxShadow: `0 0 8px ${diff.color}` }} />
            </div>
          </div>

          {/* Coin display */}
          {!isReplay && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl relative"
              style={{ background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.25)' }}>
              <span style={{ fontSize: 14 }}>🪙</span>
              <span className="font-black text-sm" style={{ color: '#fbbf24' }}>
                {session?.total_coins_earned ?? 0}
              </span>
              {/* Float animation */}
              {showCoinFloat && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none"
                  style={{ animation: 'coinFloat .9s ease forwards', color: '#fbbf24', fontWeight: 900, fontSize: 13, whiteSpace: 'nowrap' }}>
                  +{earnedCoins} 🪙
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main question area */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 max-w-2xl mx-auto w-full gap-5">

          {/* Timer + coins preview */}
          {!isAnswered && screen === 'question' && (
            <div className="flex items-center gap-5 w-full justify-center">
              <CircularTimer seconds={timerSec} />
              {!isReplay && (
                <div className="text-center">
                  <p className="font-black text-2xl" style={{ color: '#fbbf24', textShadow: '0 0 20px rgba(251,191,36,.6)' }}>
                    🪙 {coinsPreview}
                  </p>
                  <p style={{ color: 'rgba(251,191,36,.4)', fontSize: 11, fontWeight: 700 }}>koin tersedia</p>
                </div>
              )}
            </div>
          )}

          {/* Timeout */}
          {isAnswered && selectedAnswer === null && (
            <div className="w-full text-center py-3 rounded-2xl" style={{ animation: 'popIn .3s ease both', background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.4)' }}>
              <p className="font-black text-base" style={{ color: '#fbbf24' }}>⏰ Waktu Habis!</p>
            </div>
          )}

          {/* Wrong feedback */}
          {isAnswered && selectedAnswer !== null && !isCorrect && screen === 'feedback' && (
            <div className="w-full text-center py-3 rounded-2xl" style={{ animation: 'popIn .3s ease both', background: 'rgba(244,63,94,.1)', border: '1px solid rgba(244,63,94,.4)' }}>
              <p className="font-black text-base" style={{ color: '#f87171' }}>✗ Jawaban Salah</p>
              <p style={{ color: 'rgba(248,113,113,.5)', fontSize: 12, marginTop: 2 }}>Lihat evaluasi di akhir quiz untuk penjelasan lebih lanjut</p>
            </div>
          )}

          {/* Correct flash */}
          {isAnswered && isCorrect && (
            <div className="w-full text-center py-3 rounded-2xl" style={{ animation: 'popIn .3s ease both', background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.4)' }}>
              <p className="font-black text-base" style={{ color: '#34d399' }}>✓ Benar! {!isReplay && earnedCoins > 0 && `+🪙${earnedCoins}`}</p>
            </div>
          )}

          {/* Question card */}
          <div className="w-full rounded-2xl p-6" style={{ animation: 'slideUp .3s ease both', background: 'rgba(139,92,246,.06)', border: `1px solid ${diff.border}`, boxShadow: diff.glow }}>
            <p className="text-white font-bold text-base sm:text-lg leading-relaxed">{currentQ.question_text}</p>
          </div>

          {/* Options */}
          <div className="w-full space-y-2.5">
            {opts.map(({ letter, text }) => (
              <OptionBtn key={letter} letter={letter} text={text}
                state={optState(letter)}
                disabled={isAnswered}
                onClick={() => { if (!isAnswered && screen === 'question') handleAnswer(letter) }}
              />
            ))}
          </div>

          {/* Next button */}
          {screen === 'feedback' && (
            <button onClick={() => goToQuestion(currentIdx + 1)}
              className="w-full py-4 rounded-2xl font-black text-white text-base transition-all hover:scale-[1.02] active:scale-[.98]"
              style={{ animation: 'slideUp .3s ease both', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', boxShadow: '0 4px 24px rgba(124,58,237,.4)' }}>
              Soal Berikutnya <ChevronRight className="inline w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  if (screen === 'result') {
    const total    = resultCorrect + resultWrong
    const accuracy = total > 0 ? Math.round((resultCorrect / total) * 100) : 0
    const grade    = accuracy >= 90 ? { icon: '🏆', label: 'Sempurna!', color: '#fbbf24' }
      : accuracy >= 75 ? { icon: '🎯', label: 'Bagus!', color: '#34d399' }
      : accuracy >= 50 ? { icon: '📚', label: 'Lumayan!', color: '#60a5fa' }
      : { icon: '💪', label: 'Terus Berlatih!', color: '#f87171' }

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: BG }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: GRID }} />

        <div className="relative w-full max-w-md space-y-4" style={{ animation: 'slideUp .4s ease both' }}>
          <div className="rounded-3xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,.12), rgba(34,211,238,.06))', border: '1px solid rgba(139,92,246,.25)', boxShadow: '0 0 80px rgba(139,92,246,.2), 0 25px 50px rgba(0,0,0,.5)' }}>
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #7c3aed, #06b6d4, #10b981)' }} />

            <div className="p-7 space-y-5">
              {/* Grade */}
              <div className="text-center space-y-2">
                <div className="text-5xl" style={{ filter: `drop-shadow(0 0 20px ${grade.color})`, animation: 'popIn .5s .1s ease both' }}>
                  {grade.icon}
                </div>
                <h1 className="text-2xl font-black" style={{ color: grade.color, textShadow: `0 0 20px ${grade.color}60` }}>
                  {grade.label}
                </h1>
                <p style={{ color: 'rgba(180,160,255,.5)', fontSize: 13 }}>{materialTitle}</p>
              </div>

              {/* Level up */}
              {leveledUp && !isReplay && (
                <div className="text-center py-3 rounded-2xl" style={{ animation: 'popIn .4s .3s ease both', background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.4)', boxShadow: '0 0 30px rgba(251,191,36,.2)' }}>
                  <p className="font-black text-lg" style={{ color: '#fbbf24', textShadow: '0 0 20px rgba(251,191,36,.6)' }}>
                    ⬆️ LEVEL UP! → Level {newLevel}
                  </p>
                </div>
              )}

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Benar',   val: resultCorrect,  color: '#10b981', icon: '✅', sub: `dari ${total} soal` },
                  { label: 'Salah',   val: resultWrong,    color: '#f43f5e', icon: '❌', sub: `dari ${total} soal` },
                  { label: 'Akurasi', val: `${accuracy}%`, color: '#60a5fa', icon: '📊', sub: 'jawaban benar' },
                  {
                    label: isReplay ? 'Koin (Replay)' : 'Koin Didapat',
                    val: isReplay ? '—' : `+${resultCoins}`,
                    color: isReplay ? '#444' : '#fbbf24',
                    icon: '🪙', sub: isReplay ? 'tidak berlaku' : 'ditambahkan'
                  },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl p-4 text-center"
                    style={{ animation: `popIn .4s ${.2 + i * .08}s ease both`, background: s.color + '0d', border: `1px solid ${s.color}25` }}>
                    <p className="font-black text-2xl" style={{ color: s.color, textShadow: `0 0 12px ${s.color}60` }}>{s.val}</p>
                    <p style={{ color: 'rgba(180,160,255,.5)', fontSize: 11, marginTop: 2 }}>{s.icon} {s.label}</p>
                    <p style={{ color: 'rgba(180,160,255,.3)', fontSize: 10 }}>{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* XP bar */}
              {!isReplay && resultXP > 0 && (
                <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
                  style={{ background: 'rgba(124,58,237,.1)', border: '1px solid rgba(124,58,237,.3)' }}>
                  <Zap className="w-5 h-5 shrink-0" style={{ color: '#a78bfa' }} />
                  <div>
                    <p className="font-black text-sm" style={{ color: '#c4b5fd' }}>+{resultXP} XP didapat</p>
                    <p style={{ color: 'rgba(167,139,250,.4)', fontSize: 11 }}>Progress level bertambah</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2.5 pt-1">
                {sessionIdForEval && (
                  <Link href={`/materials/${id}/quiz/evaluation?session=${sessionIdForEval}`}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
                    style={{ background: 'rgba(96,165,250,.12)', border: '1px solid rgba(96,165,250,.3)', color: '#93c5fd' }}>
                    <BarChart3 className="w-4 h-4" /> Lihat Evaluasi Jawaban
                  </Link>
                )}
                <button onClick={() => { setSession(null); setHasPrevCompleted(true); setScreen('intro') }}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.3)', color: '#c4b5fd' }}>
                  <RefreshCw className="w-4 h-4" /> Main Lagi
                </button>
                <Link href={`/materials/${id}`}
                  className="flex items-center justify-center gap-2 w-full py-3 text-sm transition-colors hover:opacity-80"
                  style={{ color: 'rgba(180,160,255,.35)' }}>
                  <BookOpen className="w-4 h-4" /> Kembali ke Materi
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}