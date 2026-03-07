'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ChevronLeft, Loader2, CheckCircle2, XCircle, Clock,
  AlertCircle, BarChart3, BookOpen, Trophy, Zap, Target,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvalItem {
  index: number
  question_text: string
  option_a: string; option_b: string; option_c: string; option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  difficulty: 'easy' | 'medium' | 'hard'
  selected_answer: 'A' | 'B' | 'C' | 'D' | null
  is_correct: boolean
  time_taken: number
  coins_earned: number
  xp_earned: number
}

interface Summary {
  correct_count: number
  wrong_count: number
  total_coins_earned: number
  total_xp_earned: number
  coin_credited: boolean
}

// ─── Config ───────────────────────────────────────────────────────────────────

const BG = `
  radial-gradient(ellipse at 15% 15%, rgba(139,92,246,.12) 0%, transparent 55%),
  radial-gradient(ellipse at 85% 80%, rgba(34,211,238,.08) 0%, transparent 55%),
  linear-gradient(160deg, #050510 0%, #0a0820 60%, #060312 100%)
`
const GRID = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 40h40M40 0v40' stroke='rgba(139,92,246,.05)' stroke-width='1'/%3E%3C/svg%3E")`

const DIFF = {
  easy:   { label: 'Mudah',  color: '#10b981' },
  medium: { label: 'Sedang', color: '#f59e0b' },
  hard:   { label: 'Sulit',  color: '#f43f5e' },
}

const OPT_COLORS: Record<string, string> = { A: '#22d3ee', B: '#a855f7', C: '#f59e0b', D: '#f43f5e' }

// ─── Option Row ───────────────────────────────────────────────────────────────

function OptionRow({ letter, text, state }: {
  letter: string
  text: string
  state: 'correct' | 'wrong' | 'missed' | 'neutral'
}) {
  const c = OPT_COLORS[letter] ?? '#a78bfa'

  const styles: Record<string, React.CSSProperties> = {
    correct: { background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.45)', color: '#86efac' },
    wrong:   { background: 'rgba(244,63,94,.12)',  border: '1px solid rgba(244,63,94,.45)',  color: '#fca5a5' },
    missed:  { background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)',  color: 'rgba(134,239,172,.6)' },
    neutral: { background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)', color: 'rgba(200,180,255,.3)' },
  }

  const dotStyles: Record<string, React.CSSProperties> = {
    correct: { background: 'rgba(16,185,129,.3)', border: '1px solid rgba(16,185,129,.6)', color: '#34d399' },
    wrong:   { background: 'rgba(244,63,94,.3)',  border: '1px solid rgba(244,63,94,.6)',  color: '#f87171' },
    missed:  { background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.35)', color: '#34d399' },
    neutral: { background: `${c}12`, border: `1px solid ${c}25`, color: `${c}80` },
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all" style={styles[state]}>
      <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0" style={dotStyles[state]}>
        {letter}
      </span>
      <span className="text-sm leading-snug flex-1">{text}</span>
      {state === 'correct' && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#10b981', filter: 'drop-shadow(0 0 5px #10b981)' }} />}
      {state === 'wrong'   && <XCircle      className="w-4 h-4 shrink-0" style={{ color: '#f43f5e', filter: 'drop-shadow(0 0 5px #f43f5e)' }} />}
      {state === 'missed'  && (
        <span className="text-[11px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,.2)', color: '#34d399' }}>
          Jawaban Benar
        </span>
      )}
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function QuizEvaluationPage() {
  const params       = useParams()
  const searchParams = useSearchParams()
  const router       = useRouter()
  const materialId   = params?.id as string
  const sessionId    = searchParams?.get('session')
  const supabase     = createClient()

  const [items, setItems]       = useState<EvalItem[]>([])
  const [summary, setSummary]   = useState<Summary | null>(null)
  const [materialTitle, setMaterialTitle] = useState('')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    if (!sessionId || !materialId) { setError('Parameter tidak valid.'); setLoading(false); return }

    async function load() {
      try {
        const { data: { session: auth } } = await supabase.auth.getSession()
        if (!auth) { router.replace('/auth/login'); return }

        const [sessRes, matRes] = await Promise.all([
          supabase.from('quiz_sessions').select('*').eq('id', Number(sessionId)).eq('user_id', auth.user.id).single(),
          supabase.from('materials').select('title').eq('id', materialId).single(),
        ])

        if (sessRes.error || !sessRes.data) { setError('Sesi tidak ditemukan.'); setLoading(false); return }

        setSummary({
          correct_count: sessRes.data.correct_count,
          wrong_count:   sessRes.data.wrong_count,
          total_coins_earned: sessRes.data.total_coins_earned,
          total_xp_earned:    sessRes.data.total_xp_earned,
          coin_credited: sessRes.data.coin_credited,
        })
        if (matRes.data) setMaterialTitle(matRes.data.title)

        const { data: answers } = await supabase
          .from('quiz_answers')
          .select(`
            question_id, selected_answer, is_correct, time_taken, coins_earned, xp_earned,
            questions ( question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty )
          `)
          .eq('session_id', Number(sessionId))
          .order('answered_at', { ascending: true })

        if (answers) {
          setItems(answers.map((a, i) => {
            const q = Array.isArray(a.questions) ? a.questions[0] : a.questions
            return {
              index: i,
              question_text: q?.question_text ?? '',
              option_a: q?.option_a ?? '', option_b: q?.option_b ?? '',
              option_c: q?.option_c ?? '', option_d: q?.option_d ?? '',
              correct_answer: q?.correct_answer ?? 'A',
              difficulty: q?.difficulty ?? 'medium',
              selected_answer: a.selected_answer as any,
              is_correct: a.is_correct,
              time_taken: a.time_taken,
              coins_earned: a.coins_earned,
              xp_earned: a.xp_earned,
            }
          }))
        }

        setLoading(false)
      } catch (err) {
        console.error(err)
        setError('Terjadi kesalahan.')
        setLoading(false)
      }
    }
    load()
  }, [sessionId, materialId])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(96,165,250,.15)', border: '1px solid rgba(96,165,250,.35)', boxShadow: '0 0 25px rgba(96,165,250,.3)' }}>
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#60a5fa' }} />
        </div>
        <p style={{ color: 'rgba(200,180,255,.45)', fontSize: 14 }}>Memuat evaluasi...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: BG }}>
      <div className="text-center space-y-4">
        <AlertCircle className="w-10 h-10 mx-auto" style={{ color: '#f43f5e' }} />
        <p className="text-white font-bold">{error}</p>
        <Link href={`/materials/${materialId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white"
          style={{ background: 'rgba(244,63,94,.15)', border: '1px solid rgba(244,63,94,.3)' }}>
          ← Kembali
        </Link>
      </div>
    </div>
  )

  const total    = (summary?.correct_count ?? 0) + (summary?.wrong_count ?? 0)
  const accuracy = total > 0 ? Math.round(((summary?.correct_count ?? 0) / total) * 100) : 0
  const grade    = accuracy >= 90 ? { icon: '🏆', label: 'Luar Biasa', color: '#fbbf24' }
    : accuracy >= 75 ? { icon: '🎯', label: 'Bagus', color: '#34d399' }
    : accuracy >= 50 ? { icon: '📚', label: 'Terus Belajar', color: '#60a5fa' }
    : { icon: '💪', label: 'Jangan Menyerah', color: '#f87171' }

  return (
    <div className="min-h-screen pt-15" style={{ background: BG }}>
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: GRID }} />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-5">

        {/* Back link */}
        <Link href={`/materials/${materialId}`}
          className="inline-flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
          style={{ color: 'rgba(180,160,255,.35)' }}>
          <ChevronLeft className="w-3.5 h-3.5" /> Kembali ke Materi
        </Link>

        {/* Header */}
        <div className="rounded-3xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(96,165,250,.1), rgba(139,92,246,.08))', border: '1px solid rgba(96,165,250,.2)', boxShadow: '0 0 50px rgba(96,165,250,.12)' }}>
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #3b82f6, #a855f7, #10b981)' }} />
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(96,165,250,.15)', border: '1px solid rgba(96,165,250,.35)' }}>
                <BarChart3 className="w-6 h-6" style={{ color: '#60a5fa', filter: 'drop-shadow(0 0 6px #60a5fa)' }} />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Evaluasi Jawaban</h1>
                <p style={{ color: 'rgba(180,160,255,.45)', fontSize: 13 }}>{materialTitle}</p>
              </div>
            </div>

            {/* Grade */}
            <div className="mt-5 text-center py-4 rounded-2xl"
              style={{ background: `${grade.color}0d`, border: `1px solid ${grade.color}25` }}>
              <span style={{ fontSize: 28, filter: `drop-shadow(0 0 12px ${grade.color})` }}>{grade.icon}</span>
              <p className="font-black text-lg mt-1" style={{ color: grade.color, textShadow: `0 0 15px ${grade.color}50` }}>{grade.label}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {[
                { label: 'Benar',   val: summary?.correct_count ?? 0,           color: '#10b981', icon: '✅' },
                { label: 'Salah',   val: summary?.wrong_count ?? 0,             color: '#f43f5e', icon: '❌' },
                { label: 'Akurasi', val: `${accuracy}%`,                         color: '#60a5fa', icon: '📊' },
                {
                  label: summary?.coin_credited ? 'Koin (Replay)' : 'Koin',
                  val: summary?.coin_credited ? '—' : `+${summary?.total_coins_earned ?? 0}`,
                  color: summary?.coin_credited ? 'rgba(255,255,255,.2)' : '#fbbf24',
                  icon: '🪙',
                },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-3 text-center"
                  style={{ background: `${s.color}0d`, border: `1px solid ${s.color}20` }}>
                  <p className="font-black text-xl" style={{ color: s.color }}>{s.val}</p>
                  <p style={{ color: 'rgba(180,160,255,.4)', fontSize: 11, marginTop: 2 }}>{s.icon} {s.label}</p>
                </div>
              ))}
            </div>

            {/* XP */}
            {!summary?.coin_credited && (summary?.total_xp_earned ?? 0) > 0 && (
              <div className="flex items-center gap-2.5 mt-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(124,58,237,.1)', border: '1px solid rgba(124,58,237,.25)' }}>
                <Zap className="w-4 h-4 shrink-0" style={{ color: '#a78bfa' }} />
                <p className="font-bold text-sm" style={{ color: '#c4b5fd' }}>+{summary?.total_xp_earned} XP dari quiz ini</p>
              </div>
            )}
          </div>
        </div>

        {/* Section divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'rgba(139,92,246,.15)' }} />
          <p style={{ color: 'rgba(180,160,255,.35)', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {items.length} Soal
          </p>
          <div className="flex-1 h-px" style={{ background: 'rgba(139,92,246,.15)' }} />
        </div>

        {/* Question cards */}
        <div className="space-y-4">
          {items.map((item, i) => {
            const opts: { letter: 'A'|'B'|'C'|'D'; text: string }[] = [
              { letter: 'A', text: item.option_a }, { letter: 'B', text: item.option_b },
              { letter: 'C', text: item.option_c }, { letter: 'D', text: item.option_d },
            ]
            const diff = DIFF[item.difficulty as keyof typeof DIFF] ?? DIFF.medium
            const isTimeout = item.selected_answer === null
            const borderColor = item.is_correct ? 'rgba(16,185,129,.2)' : 'rgba(244,63,94,.2)'
            const bgColor     = item.is_correct ? 'rgba(16,185,129,.04)' : 'rgba(244,63,94,.04)'

            return (
              <div key={i} className="rounded-2xl overflow-hidden"
                style={{ border: `1px solid ${borderColor}`, background: bgColor, animation: `slideUp .3s ${i * 0.04}s ease both` }}>

                {/* Card header */}
                <div className="flex items-start gap-3 px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,.04)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={item.is_correct
                      ? { background: 'rgba(16,185,129,.2)', border: '1px solid rgba(16,185,129,.4)' }
                      : { background: 'rgba(244,63,94,.2)',  border: '1px solid rgba(244,63,94,.4)' }}>
                    {item.is_correct
                      ? <CheckCircle2 className="w-4 h-4" style={{ color: '#10b981' }} />
                      : <XCircle      className="w-4 h-4" style={{ color: '#f43f5e' }} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span style={{ color: 'rgba(180,160,255,.4)', fontSize: 11, fontWeight: 700 }}>Soal {i + 1}</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                        style={{ background: `${diff.color}15`, border: `1px solid ${diff.color}35`, color: diff.color }}>
                        {diff.label}
                      </span>
                      <span className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(180,160,255,.3)' }}>
                        <Clock className="w-3 h-3" /> {item.time_taken}s
                      </span>
                      {isTimeout && <span style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700 }}>⏰ Timeout</span>}
                      {item.is_correct && item.coins_earned > 0 && (
                        <span style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700 }}>🪙 +{item.coins_earned}</span>
                      )}
                      {item.is_correct && item.xp_earned > 0 && (
                        <span style={{ color: '#a78bfa', fontSize: 11, fontWeight: 700 }}>⚡ +{item.xp_earned}xp</span>
                      )}
                    </div>
                    <p className="text-white text-sm font-semibold leading-snug">{item.question_text}</p>
                  </div>
                </div>

                {/* Options */}
                <div className="px-5 py-4 space-y-2">
                  {opts.map(({ letter, text }) => {
                    let state: 'correct' | 'wrong' | 'missed' | 'neutral' = 'neutral'
                    if (letter === item.correct_answer && letter === item.selected_answer) state = 'correct'
                    else if (letter === item.selected_answer && !item.is_correct)          state = 'wrong'
                    else if (letter === item.correct_answer && !item.is_correct)           state = 'missed'
                    return <OptionRow key={letter} letter={letter} text={text} state={state} />
                  })}

                  {isTimeout && (
                    <p style={{ color: 'rgba(180,160,255,.3)', fontSize: 11, paddingTop: 4, paddingLeft: 4 }}>
                      Kamu tidak menjawab soal ini karena waktu habis.
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-3">
          <Link href={`/materials/${materialId}/quiz`}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm text-white transition-all hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', boxShadow: '0 4px 24px rgba(124,58,237,.4)' }}>
            <Trophy className="w-4 h-4" /> Coba Lagi
          </Link>
          <Link href={`/materials/${materialId}`}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02]"
            style={{ background: 'rgba(139,92,246,.1)', border: '1px solid rgba(139,92,246,.25)', color: '#c4b5fd' }}>
            <BookOpen className="w-4 h-4" /> Baca Materi Lagi
          </Link>
        </div>
      </div>
    </div>
  )
}
