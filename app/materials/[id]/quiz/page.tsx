'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Zap, Trophy, Clock, ChevronRight, Loader2, AlertCircle,
  CheckCircle2, XCircle, RotateCcw, BookOpen, ArrowRight,
  BarChart3, RefreshCw, X, AlertTriangle, Play, Shield,
  Coins, Flame, Target, TrendingUp,
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

const TIMER_SECONDS = 30
const COIN_BASE: Record<string, number> = { easy: 5, medium: 10, hard: 15 }
const XP_BASE:   Record<string, number> = { easy: 10, medium: 20, hard: 30 }

const DIFF = {
  easy:   { label: 'Mudah',  color: '#10b981', rgb: '16,185,129',  tag: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  medium: { label: 'Sedang', color: '#f59e0b', rgb: '245,158,11',  tag: 'bg-amber-500/20 text-amber-300 border-amber-500/30'       },
  hard:   { label: 'Sulit',  color: '#f43f5e', rgb: '244,63,94',   tag: 'bg-rose-500/20 text-rose-300 border-rose-500/30'           },
}

const OPT_COLORS: Record<string, { base: string; r: string }> = {
  A: { base: '#818cf8', r: '129,140,248' },
  B: { base: '#c084fc', r: '192,132,252' },
  C: { base: '#38bdf8', r: '56,189,248'  },
  D: { base: '#fb923c', r: '251,146,60'  },
}

function calcCoins(base: number, t: number) {
  const r = TIMER_SECONDS - t
  if (r >= 20) return base
  if (r >= 10) return Math.floor(base * .7)
  if (r >= 1)  return Math.floor(base * .5)
  return 0
}

function xpToLevel(xp: number) {
  let l = 1, th = 100, c = 0
  while (c + th <= xp && l < 99) { c += th; l++; th = 100 + (l - 1) * 150 }
  return l
}

function shuffle<T>(a: T[]): T[] {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

// ─── Global CSS ───────────────────────────────────────────────────────────────

const CSS = `
  @keyframes float {
    0%,100% { transform:translateY(0) rotate(0deg); }
    33%     { transform:translateY(-20px) rotate(4deg); }
    66%     { transform:translateY(-8px) rotate(-2deg); }
  }
  @keyframes slideUp {
    from { transform:translateY(24px); opacity:0; }
    to   { transform:translateY(0); opacity:1; }
  }
  @keyframes slideDown {
    from { transform:translateY(-14px); opacity:0; }
    to   { transform:translateY(0); opacity:1; }
  }
  @keyframes popIn {
    0%  { transform:scale(.84) translateY(6px); opacity:0; }
    70% { transform:scale(1.03); }
    100%{ transform:scale(1) translateY(0); opacity:1; }
  }
  @keyframes shake {
    0%,100%{ transform:translateX(0); }
    15%    { transform:translateX(-7px); }
    45%    { transform:translateX(7px); }
    75%    { transform:translateX(-4px); }
  }
  @keyframes coinPop {
    0%  { transform:translateY(0) scale(.8); opacity:0; }
    20% { opacity:1; }
    100%{ transform:translateY(-44px) scale(1.1); opacity:0; }
  }
  @keyframes pulseRing {
    0%  { transform:scale(.9); opacity:.8; }
    100%{ transform:scale(1.9); opacity:0; }
  }
  @keyframes gradShift {
    0%,100%{ background-position:0% 50%; }
    50%    { background-position:100% 50%; }
  }
  @keyframes timerUrgent {
    0%  { transform:scale(1); }
    50% { transform:scale(1.1); }
    100%{ transform:scale(1); }
  }
  @keyframes barShimmer {
    from { transform:translateX(-100%); }
    to   { transform:translateX(400%); }
  }
  @keyframes correctFlash {
    0%  { background:rgba(16,185,129,0); }
    30% { background:rgba(16,185,129,.12); }
    100%{ background:rgba(16,185,129,0); }
  }
  @keyframes wrongFlash {
    0%  { background:rgba(244,63,94,0); }
    30% { background:rgba(244,63,94,.1); }
    100%{ background:rgba(244,63,94,0); }
  }
  @keyframes fadeIn {
    from { opacity:0; }
    to   { opacity:1; }
  }
  .opt-btn {
    transition: transform .15s ease, box-shadow .15s ease, background .15s ease, border-color .15s ease;
  }
  .opt-btn:hover:not(:disabled) { transform:translateX(6px); }
  .opt-btn:active:not(:disabled){ transform:translateX(3px) scale(.998); }
`

// ─── Scene Background ─────────────────────────────────────────────────────────

function SceneBG() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-[#130826] to-[#0d1033]" />
      <div className="absolute top-[-10%] left-[-5%]  w-[600px] h-[600px] bg-purple-700/[.13] rounded-full blur-[120px]" />
      <div className="absolute top-[40%] right-[-8%] w-[500px] h-[500px] bg-pink-700/[.1]   rounded-full blur-[100px]" />
      <div className="absolute bottom-[-5%] left-[25%] w-[450px] h-[450px] bg-indigo-700/[.1] rounded-full blur-[90px]" />
      {['📝','⚡','🎯','🪙','✨','🏆'].map((e, i) => (
        <div key={i} className="absolute text-2xl opacity-[.12] select-none"
          style={{
            top:   ['7%','19%','58%','72%','34%','84%'][i],
            left:  ['4%', undefined, '2%', undefined, '91%', '18%'][i] as string | undefined,
            right: [undefined,'6%',undefined,'5%',undefined,undefined][i] as string | undefined,
            animation: `float ${[12,10,14,11,13,9][i]}s ease-in-out infinite`,
            animationDelay: `${[0,3,1.5,5,2,4][i]}s`,
          }}>
          {e}
        </div>
      ))}
      <div className="absolute inset-0 opacity-[.022]"
        style={{ backgroundImage:'linear-gradient(rgba(139,92,246,.9) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,.9) 1px,transparent 1px)', backgroundSize:'72px 72px' }} />
    </div>
  )
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({ type, onConfirm, onCancel, qCount, qIdx }: {
  type: ConfirmType; onConfirm(): void; onCancel(): void; qCount?: number; qIdx?: number
}) {
  if (!type) return null
  const C = {
    restart: { color:'#f59e0b', icon:<RotateCcw className="w-6 h-6"/>, title:'Mulai Ulang Quiz?',
      body:`Progress soal ${(qIdx??0)+1}/${qCount} akan hilang. Soal diacak ulang dari awal.`, ok:'Ya, Ulang', cancel:'Batal' },
    exit:    { color:'#f43f5e', icon:<AlertTriangle className="w-6 h-6"/>, title:'Keluar dari Quiz?',
      body:'Progress tersimpan otomatis. Kamu bisa lanjutkan lain kali dari soal ini.', ok:'Keluar', cancel:'Lanjut Main' },
    replay:  { color:'#a855f7', icon:<Shield className="w-6 h-6"/>, title:'Main Ulang Tanpa Hadiah',
      body:'Quiz ini sudah pernah diselesaikan. Replay tidak memberikan koin dan XP — hanya untuk latihan.', ok:'Main Lagi', cancel:'Batal' },
  }[type]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backdropFilter:'blur(16px)', background:'rgba(4,2,15,.82)' }}>
      <div className="w-full max-w-[340px] rounded-3xl overflow-hidden"
        style={{ animation:'popIn .28s cubic-bezier(.34,1.56,.64,1) both',
          background:'linear-gradient(145deg,rgba(22,12,48,.97),rgba(14,7,32,.97))',
          border:`1px solid ${C.color}38`,
          boxShadow:`0 0 0 1px ${C.color}12,0 32px 64px rgba(0,0,0,.7),0 0 80px ${C.color}12` }}>
        <div className="h-[3px]" style={{ background:`linear-gradient(90deg,transparent,${C.color},transparent)` }}/>
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background:`${C.color}18`, border:`1px solid ${C.color}35`, color:C.color }}>
            {C.icon}
          </div>
          <div>
            <h3 className="text-[17px] font-black text-white mb-1.5">{C.title}</h3>
            <p className="text-[13px] leading-relaxed text-purple-200/45">{C.body}</p>
          </div>
          <div className="flex gap-2.5 pt-1">
            <button onClick={onCancel}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-purple-300/55 transition-all hover:text-purple-200 hover:scale-[1.02]"
              style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(139,92,246,.15)' }}>
              {C.cancel}
            </button>
            <button onClick={onConfirm}
              className="flex-1 py-3 rounded-xl font-black text-sm text-white transition-all hover:scale-[1.02] active:scale-[.98]"
              style={{ background:`linear-gradient(135deg,${C.color}cc,${C.color})`, boxShadow:`0 6px 20px ${C.color}45` }}>
              {C.ok}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Arc Timer ────────────────────────────────────────────────────────────────

function ArcTimer({ sec, total = TIMER_SECONDS }: { sec: number; total?: number }) {
  const r = 42, C2 = 2 * Math.PI * r
  const dash = C2 * (1 - sec / total)
  const col  = sec > 18 ? '#10b981' : sec > 9 ? '#f59e0b' : '#f43f5e'
  return (
    <div className="relative flex items-center justify-center" style={{ width:100, height:100 }}>
      {sec <= 9 && <div className="absolute inset-0 rounded-full" style={{ animation:'pulseRing 1s ease-out infinite', background:`${col}18` }}/>}
      <svg width="100" height="100" style={{ transform:'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(139,92,246,.1)" strokeWidth="5"/>
        <circle cx="50" cy="50" r={r} fill="none" stroke={col} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={C2} strokeDashoffset={dash}
          style={{ transition:'stroke-dashoffset .95s linear,stroke .4s ease', filter:`drop-shadow(0 0 8px ${col}aa)` }}/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0">
        <span className="font-black text-[22px] leading-none"
          style={{ color:col, textShadow:`0 0 14px ${col}99`, animation:sec<=9?'timerUrgent 1s ease infinite':'none' }}>
          {sec}
        </span>
        <span className="text-[9px] font-black tracking-[.14em] text-purple-400/35">SEC</span>
      </div>
    </div>
  )
}

// ─── Option Button ────────────────────────────────────────────────────────────

function OptionBtn({ letter, text, state, disabled, onClick }: {
  letter: 'A'|'B'|'C'|'D'; text: string
  state: 'idle'|'correct'|'wrong'|'dimmed'; disabled: boolean; onClick(): void
}) {
  const oc = OPT_COLORS[letter]
  const sty: Record<string, React.CSSProperties> = {
    idle:    { background:'rgba(255,255,255,.03)',  border:`1px solid rgba(139,92,246,.13)`,  color:'rgba(235,228,255,.88)' },
    correct: { background:'rgba(16,185,129,.14)',   border:'1px solid rgba(16,185,129,.55)',  color:'#a7f3d0', boxShadow:'0 0 28px rgba(16,185,129,.2),inset 0 1px 0 rgba(16,185,129,.12)' },
    wrong:   { background:'rgba(244,63,94,.13)',    border:'1px solid rgba(244,63,94,.5)',    color:'#fda4af', boxShadow:'0 0 24px rgba(244,63,94,.15)', animation:'shake .4s ease' },
    dimmed:  { background:'rgba(255,255,255,.01)',  border:'1px solid rgba(139,92,246,.06)',  color:'rgba(160,145,210,.25)' },
  }
  const bsty: Record<string, React.CSSProperties> = {
    idle:    { background:`rgba(${oc.r},.14)`, border:`1px solid rgba(${oc.r},.35)`, color:oc.base },
    correct: { background:'rgba(16,185,129,.22)', border:'1px solid rgba(16,185,129,.5)', color:'#6ee7b7' },
    wrong:   { background:'rgba(244,63,94,.22)',  border:'1px solid rgba(244,63,94,.5)',  color:'#fb7185' },
    dimmed:  { background:'rgba(255,255,255,.03)', border:'1px solid rgba(139,92,246,.07)', color:'rgba(160,145,210,.18)' },
  }
  return (
    <button onClick={onClick} disabled={disabled}
      className="opt-btn w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-left"
      style={sty[state]}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[13px] font-black shrink-0"
        style={bsty[state]}>
        {letter}
      </div>
      <span className="text-[14px] font-semibold leading-snug flex-1">{text}</span>
      {state==='correct' && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" style={{ filter:'drop-shadow(0 0 6px #10b981)' }}/>}
      {state==='wrong'   && <XCircle      className="w-5 h-5 shrink-0 text-rose-400"    style={{ filter:'drop-shadow(0 0 6px #f43f5e)' }}/>}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SoloQuizPage() {
  const params   = useParams()
  const router   = useRouter()
  const id       = params?.id as string
  const supabase = createClient()

  const [screen,    setScreen]    = useState<Screen>('loading')
  const [errorMsg,  setErrorMsg]  = useState('')
  const [confirm,   setConfirm]   = useState<ConfirmType>(null)

  const [materialTitle, setMaterialTitle] = useState('')
  const [materialThumb, setMaterialThumb] = useState('📚')
  const [userId,    setUserId]    = useState<string|null>(null)
  const [session,   setSession]   = useState<QuizSession|null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [hasPrevCompleted, setHasPrevCompleted] = useState(false)
  const [isReplay,  setIsReplay]  = useState(false)

  const [currentQ,       setCurrentQ]       = useState<Question|null>(null)
  const [currentIdx,     setCurrentIdx]     = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<'A'|'B'|'C'|'D'|null>(null)
  const [isAnswered,     setIsAnswered]     = useState(false)
  const [isCorrect,      setIsCorrect]      = useState(false)
  const [timerSec,       setTimerSec]       = useState(TIMER_SECONDS)
  const [coinsPreview,   setCoinsPreview]   = useState(0)
  const [showCoinFloat,  setShowCoinFloat]  = useState(false)
  const [earnedCoins,    setEarnedCoins]    = useState(0)
  const [streak,         setStreak]         = useState(0)
  const [bestStreak,     setBestStreak]     = useState(0)
  const [flashResult,    setFlashResult]    = useState<'correct'|'wrong'|null>(null)

  const [resultCoins,   setResultCoins]   = useState(0)
  const [resultXP,      setResultXP]      = useState(0)
  const [resultCorrect, setResultCorrect] = useState(0)
  const [resultWrong,   setResultWrong]   = useState(0)
  const [leveledUp,     setLeveledUp]     = useState(false)
  const [newLevel,      setNewLevel]      = useState(1)
  const [sessionIdForEval, setSessionIdForEval] = useState<number|null>(null)

  const timerRef    = useRef<ReturnType<typeof setInterval>|null>(null)
  const startRef    = useRef(0)
  const answeredRef = useRef(false)

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      try {
        const { data:{ session:auth } } = await supabase.auth.getSession()
        if (!auth) { router.replace(`/auth/login?redirect=/materials/${id}/quiz`); return }
        const uid = auth.user.id
        if (!cancelled) setUserId(uid)

        const [matRes, progressRes, allQRes] = await Promise.all([
          supabase.from('materials').select('id,title,thumbnail,is_quiz_enabled,content').eq('id',id).single(),
          supabase.from('reading_progress').select('section_index',{count:'exact'}).eq('user_id',uid).eq('material_id',id),
          supabase.from('questions').select('id,question_text,option_a,option_b,option_c,option_d,correct_answer,difficulty').eq('material_id',id),
        ])

        if (cancelled) return
        if (matRes.error||!matRes.data)        { setErrorMsg('Materi tidak ditemukan.'); setScreen('error'); return }
        if (!matRes.data.is_quiz_enabled)       { setErrorMsg('Quiz belum diaktifkan untuk materi ini.'); setScreen('error'); return }

        setMaterialTitle(matRes.data.title)
        setMaterialThumb(matRes.data.thumbnail ?? '📚')

        let totalSec = 0
        try { const r = typeof matRes.data.content==='string'?JSON.parse(matRes.data.content):matRes.data.content; if(Array.isArray(r)) totalSec=r.length } catch{}

        const rc = progressRes.count ?? 0
        if (totalSec>0 && rc<totalSec) { setErrorMsg(`Baca dulu semua bagian materi (${rc}/${totalSec} selesai) sebelum mengerjakan quiz.`); setScreen('error'); return }
        if (!allQRes.data||allQRes.data.length===0) { setErrorMsg('Belum ada soal untuk materi ini.'); setScreen('error'); return }

        const qs = allQRes.data as Question[]
        const { data:sessions } = await supabase.from('quiz_sessions').select('*').eq('user_id',uid).eq('material_id',id).order('started_at',{ascending:false})

        if (cancelled) return
        const inProg    = sessions?.find(s=>s.status==='in_progress')
        const completed = sessions?.find(s=>s.status==='completed')
        if (completed) setHasPrevCompleted(true)

        if (inProg) {
          const ordered = (inProg.question_order as number[]).map(qid=>qs.find(q=>q.id===qid)).filter(Boolean) as Question[]
          setSession(inProg as QuizSession); setQuestions(ordered); setCurrentIdx(inProg.current_index)
        } else { setQuestions(qs) }

        if (!cancelled) setScreen('intro')
      } catch(err) { console.error(err); if(!cancelled) { setErrorMsg('Terjadi kesalahan. Coba lagi.'); setScreen('error') } }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  // ── Start ──────────────────────────────────────────────────────────────────
  const startQuiz = useCallback(async (mode:'new'|'resume'|'replay') => {
    if (!userId||questions.length===0) return
    if (mode==='resume'&&session) { setIsReplay(session.coin_credited); setSessionIdForEval(session.id); goToQuestion(session.current_index); return }
    const shuffled     = shuffle(questions.map(q=>q.id))
    const coinCredited = mode==='replay'||hasPrevCompleted
    await supabase.from('quiz_sessions').delete().eq('user_id',userId).eq('material_id',id).eq('status','in_progress')
    const { data, error } = await supabase.from('quiz_sessions')
      .insert({user_id:userId,material_id:id,status:'in_progress',question_order:shuffled,current_index:0,
        correct_count:0,wrong_count:0,total_coins_earned:0,total_xp_earned:0,coin_credited:coinCredited})
      .select().single()
    if (error||!data) { setErrorMsg('Gagal membuat sesi.'); setScreen('error'); return }
    const ordered = shuffled.map(qid=>questions.find(q=>q.id===qid)).filter(Boolean) as Question[]
    setQuestions(ordered); setSession(data as QuizSession); setIsReplay(coinCredited)
    setSessionIdForEval(data.id); setCurrentIdx(0); setStreak(0); setBestStreak(0); goToQuestion(0)
  }, [userId,questions,session,hasPrevCompleted,id])

  function goToQuestion(idx:number) {
    setCurrentIdx(idx); setSelectedAnswer(null); setIsAnswered(false); setIsCorrect(false)
    setTimerSec(TIMER_SECONDS); answeredRef.current=false; setShowCoinFloat(false); setFlashResult(null); setScreen('question')
  }

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen!=='question') { if(timerRef.current) clearInterval(timerRef.current); return }
    const q = questions[currentIdx]
    startRef.current = Date.now()
    setCoinsPreview(COIN_BASE[q?.difficulty??'medium']??10)
    timerRef.current = setInterval(() => {
      if (answeredRef.current) return
      const elapsed = Math.floor((Date.now()-startRef.current)/1000)
      const rem     = TIMER_SECONDS - elapsed
      if (rem<=0) { clearInterval(timerRef.current!); setTimerSec(0); setCoinsPreview(0); if(!answeredRef.current) handleAnswer(null,elapsed) }
      else { setTimerSec(rem); setCoinsPreview(calcCoins(COIN_BASE[q?.difficulty??'medium']??10,elapsed)) }
    }, 400)
    return () => { if(timerRef.current) clearInterval(timerRef.current) }
  }, [screen, currentIdx])

  useEffect(() => {
    if (questions.length>0&&currentIdx<questions.length) setCurrentQ(questions[currentIdx])
  }, [questions,currentIdx])

  // ── Answer ─────────────────────────────────────────────────────────────────
  const handleAnswer = useCallback(async (answer:'A'|'B'|'C'|'D'|null, elapsedOverride?:number) => {
    if (!currentQ||!session||answeredRef.current) return
    answeredRef.current = true
    if (timerRef.current) clearInterval(timerRef.current)

    const elapsed = elapsedOverride ?? Math.floor((Date.now()-startRef.current)/1000)
    const correct = answer===currentQ.correct_answer
    const coins   = correct&&!isReplay ? calcCoins(COIN_BASE[currentQ.difficulty]??10,elapsed) : 0
    const xp      = correct&&!isReplay ? XP_BASE[currentQ.difficulty]??20 : 0

    setSelectedAnswer(answer); setIsAnswered(true); setIsCorrect(correct)
    setFlashResult(correct?'correct':'wrong')
    setTimeout(()=>setFlashResult(null), 700)

    const newStreak = correct ? streak+1 : 0
    setStreak(newStreak)
    setBestStreak(prev=>Math.max(prev,newStreak))

    if (correct&&coins>0) { setEarnedCoins(coins); setShowCoinFloat(true); setTimeout(()=>setShowCoinFloat(false),950) }

    try {
      await supabase.from('quiz_answers').insert({session_id:session.id,question_id:currentQ.id,
        selected_answer:answer,is_correct:correct,time_taken:elapsed,coins_earned:coins,xp_earned:xp})

      const nC=session.correct_count+(correct?1:0), nW=session.wrong_count+(correct?0:1)
      const nCo=session.total_coins_earned+coins, nX=session.total_xp_earned+xp
      const ni=currentIdx+1, done=ni>=questions.length

      const patch: any = { current_index:done?currentIdx:ni, correct_count:nC, wrong_count:nW,
        total_coins_earned:nCo, total_xp_earned:nX, ...(done?{status:'completed',completed_at:new Date().toISOString()}:{}) }

      await supabase.from('quiz_sessions').update(patch).eq('id',session.id)
      setSession(prev=>prev?{...prev,...patch}:prev)

      if (done) {
        if (!isReplay) {
          const { data:u } = await supabase.from('users').select('xp,level,coins').eq('id',session.user_id).single()
          if (u) {
            const nXP=u.xp+nX, nCoins=u.coins+nCo, nLvl=xpToLevel(nXP)
            await supabase.from('users').update({xp:nXP,coins:nCoins,level:nLvl}).eq('id',session.user_id)
            if (nLvl>u.level) { setLeveledUp(true); setNewLevel(nLvl) }
          }
        }
        setResultCoins(nCo); setResultXP(nX); setResultCorrect(nC); setResultWrong(nW)
        setTimeout(()=>setScreen('result'), correct?900:1500)
        return
      }
    } catch(err) { console.error(err) }

    if (!correct||answer===null) setScreen('feedback')
    else setTimeout(()=>goToQuestion(currentIdx+1), 750)
  }, [currentQ,session,currentIdx,questions,isReplay,streak])

  // ─── LOADING ───────────────────────────────────────────────────────────────
  if (screen==='loading') return (
    <>
      <style>{CSS}</style>
      <SceneBG/>
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{background:'rgba(139,92,246,.2)',border:'1px solid rgba(139,92,246,.3)',boxShadow:'0 0 28px rgba(139,92,246,.25)'}}>
            <Loader2 className="w-7 h-7 animate-spin text-violet-400"/>
          </div>
          <p className="text-purple-300/45 text-[13px] font-semibold tracking-wide">Memuat quiz...</p>
        </div>
      </div>
    </>
  )

  // ─── ERROR ─────────────────────────────────────────────────────────────────
  if (screen==='error') return (
    <>
      <style>{CSS}</style>
      <SceneBG/>
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-5 p-8 rounded-3xl"
          style={{animation:'popIn .35s ease both',background:'rgba(244,63,94,.07)',border:'1px solid rgba(244,63,94,.22)',boxShadow:'0 0 48px rgba(244,63,94,.1),0 20px 40px rgba(0,0,0,.4)'}}>
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
            style={{background:'rgba(244,63,94,.12)',border:'1px solid rgba(244,63,94,.28)'}}>
            <AlertCircle className="w-6 h-6 text-rose-400" style={{filter:'drop-shadow(0 0 8px #f43f5e)'}}/>
          </div>
          <p className="text-white font-bold text-[14px] leading-relaxed">{errorMsg}</p>
          <Link href={`/materials/${id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-rose-300 transition-all hover:scale-[1.03]"
            style={{background:'rgba(244,63,94,.1)',border:'1px solid rgba(244,63,94,.25)'}}>
            ← Kembali ke Materi
          </Link>
        </div>
      </div>
    </>
  )

  // ─── INTRO ─────────────────────────────────────────────────────────────────
  if (screen==='intro') {
    const hasInProg = session?.status==='in_progress'
    const maxCoins  = questions.reduce((s,q)=>s+(COIN_BASE[q.difficulty]??10),0)
    const maxXP     = questions.reduce((s,q)=>s+(XP_BASE[q.difficulty]??20),0)
    const ec=questions.filter(q=>q.difficulty==='easy').length
    const mc=questions.filter(q=>q.difficulty==='medium').length
    const hc=questions.filter(q=>q.difficulty==='hard').length

    return (
      <>
        <style>{CSS}</style>
        <SceneBG/>
        <ConfirmModal type={confirm} onCancel={()=>setConfirm(null)}
          onConfirm={()=>{setConfirm(null);startQuiz(confirm==='replay'?'replay':'new')}}
          qCount={questions.length} qIdx={session?.current_index}/>

        <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10 pt-24">
          <div className="w-full max-w-[420px] space-y-3" style={{animation:'slideUp .4s ease both'}}>

            {/* Badge row */}
            <div className="flex items-center justify-between mb-1">
              <div className="inline-flex items-center gap-2 bg-purple-500/15 border border-purple-400/20 rounded-full px-3.5 py-1.5 text-[11px] font-black text-purple-300 uppercase tracking-widest">
                <Zap className="w-3 h-3 text-yellow-400"/> Solo Quiz
              </div>
              {isReplay && (
                <div className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-400/20 rounded-full px-3 py-1.5 text-[11px] font-black text-amber-300">
                  <Shield className="w-3 h-3"/> Replay
                </div>
              )}
            </div>

            {/* Card */}
            <div className="rounded-3xl overflow-hidden"
              style={{background:'linear-gradient(145deg,rgba(22,12,50,.92),rgba(14,7,36,.95))',
                border:'1px solid rgba(139,92,246,.2)',
                boxShadow:'0 0 0 1px rgba(139,92,246,.06),0 32px 64px rgba(0,0,0,.55),0 0 80px rgba(139,92,246,.08)'}}>
              <div className="h-[3px]" style={{background:'linear-gradient(90deg,#7c3aed,#ec4899,#818cf8)'}}/>

              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[38px] shrink-0"
                    style={{background:'rgba(139,92,246,.15)',border:'1px solid rgba(139,92,246,.22)',boxShadow:'0 0 24px rgba(139,92,246,.18)'}}>
                    {materialThumb}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-[11px] font-black text-purple-400/50 uppercase tracking-widest mb-1">Materi</p>
                    <h1 className="text-[17px] font-black text-white leading-snug line-clamp-2">{materialTitle}</h1>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon:<Target className="w-4 h-4"/>,  label:'Soal',      val:String(questions.length), color:'#a78bfa' },
                    { icon:<Coins className="w-4 h-4"/>,   label:'Maks Koin', val:isReplay?'—':`+${maxCoins}`, color:isReplay?'#3d3060':'#fbbf24' },
                    { icon:<Zap className="w-4 h-4"/>,     label:'Maks XP',   val:isReplay?'—':`+${maxXP}`,   color:isReplay?'#3d3060':'#34d399' },
                  ].map((s,i) => (
                    <div key={i} className="rounded-2xl p-3 flex flex-col gap-1.5"
                      style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(139,92,246,.1)'}}>
                      <div style={{color:s.color}}>{s.icon}</div>
                      <p className="font-black text-[15px] leading-none" style={{color:s.color}}>{s.val}</p>
                      <p className="text-[11px] text-purple-400/40 font-semibold">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Difficulty breakdown */}
                <div className="rounded-2xl p-3.5 space-y-2.5"
                  style={{background:'rgba(255,255,255,.025)',border:'1px solid rgba(139,92,246,.08)'}}>
                  <p className="text-[11px] font-black text-purple-400/40 uppercase tracking-widest">Distribusi Kesulitan</p>
                  <div className="flex gap-1 h-1.5 rounded-full overflow-hidden">
                    {ec>0&&<div className="h-full rounded-l-full" style={{flex:ec,background:'#10b981',boxShadow:'0 0 6px #10b98188'}}/>}
                    {mc>0&&<div className="h-full" style={{flex:mc,background:'#f59e0b',boxShadow:'0 0 6px #f59e0b88'}}/>}
                    {hc>0&&<div className="h-full rounded-r-full" style={{flex:hc,background:'#f43f5e',boxShadow:'0 0 6px #f43f5e88'}}/>}
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    {[{c:ec,d:DIFF.easy},{c:mc,d:DIFF.medium},{c:hc,d:DIFF.hard}].filter(x=>x.c>0).map(x=>(
                      <div key={x.d.label} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{background:x.d.color,boxShadow:`0 0 5px ${x.d.color}`}}/>
                        <span className="text-[12px] font-bold" style={{color:x.d.color}}>{x.c} {x.d.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Replay warning */}
                {isReplay && (
                  <div className="rounded-2xl px-4 py-3 flex items-start gap-3"
                    style={{background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)'}}>
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0"/>
                    <div>
                      <p className="font-black text-sm text-amber-300">Mode Replay — Tanpa Hadiah</p>
                      <p className="text-amber-400/45 text-xs mt-0.5">Koin dan XP tidak berlaku di sesi ini</p>
                    </div>
                  </div>
                )}

                {/* Resume banner */}
                {hasInProg && !isReplay && (
                  <div className="rounded-2xl px-4 py-3 flex items-start gap-3"
                    style={{background:'rgba(139,92,246,.1)',border:'1px solid rgba(139,92,246,.22)'}}>
                    <RefreshCw className="w-4 h-4 text-violet-400 mt-0.5 shrink-0"/>
                    <div>
                      <p className="font-black text-sm text-purple-200">Sesi Tersimpan</p>
                      <p className="text-purple-400/50 text-xs mt-0.5">Soal {session!.current_index+1}/{questions.length} — lanjutkan atau mulai ulang</p>
                    </div>
                  </div>
                )}

                {/* Timer note */}
                <div className="flex items-center justify-center gap-2 py-2 rounded-xl"
                  style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(139,92,246,.07)'}}>
                  <Clock className="w-3.5 h-3.5 text-purple-400/35"/>
                  <p className="text-[12px] text-purple-300/30 font-semibold">{TIMER_SECONDS}s per soal · Jawab cepat = koin lebih banyak</p>
                </div>

                {/* Buttons */}
                <div className="space-y-2 pt-1">
                  {hasInProg && !isReplay ? (
                    <>
                      <button onClick={()=>startQuiz('resume')}
                        className="w-full py-3.5 rounded-2xl font-black text-[15px] text-white transition-all hover:scale-[1.02] active:scale-[.98] flex items-center justify-center gap-2.5"
                        style={{background:'linear-gradient(135deg,#7c3aed,#ec4899)',boxShadow:'0 6px 24px rgba(124,58,237,.4)'}}>
                        <ArrowRight className="w-5 h-5"/> Lanjutkan Quiz
                      </button>
                      <button onClick={()=>setConfirm('restart')}
                        className="w-full py-3 rounded-2xl font-bold text-sm text-purple-300/50 hover:text-purple-200 transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
                        style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(139,92,246,.1)'}}>
                        <RotateCcw className="w-4 h-4"/> Mulai dari Awal
                      </button>
                    </>
                  ) : hasPrevCompleted ? (
                    <button onClick={()=>setConfirm('replay')}
                      className="w-full py-3.5 rounded-2xl font-black text-[15px] text-white transition-all hover:scale-[1.02] active:scale-[.98] flex items-center justify-center gap-2.5"
                      style={{background:'linear-gradient(135deg,rgba(168,85,247,.7),#a855f7)',border:'1px solid rgba(168,85,247,.3)',boxShadow:'0 6px 24px rgba(168,85,247,.2)'}}>
                      <RefreshCw className="w-5 h-5"/> Main Lagi (Tanpa Hadiah)
                    </button>
                  ) : (
                    <button onClick={()=>startQuiz('new')}
                      className="w-full py-3.5 rounded-2xl font-black text-[15px] text-white transition-all hover:scale-[1.02] active:scale-[.98] flex items-center justify-center gap-2.5"
                      style={{background:'linear-gradient(135deg,#7c3aed,#ec4899)',boxShadow:'0 6px 28px rgba(124,58,237,.42)'}}>
                      <Play className="w-5 h-5 fill-white"/> Mulai Quiz
                    </button>
                  )}
                  <Link href={`/materials/${id}`}
                    className="block text-center py-2 text-[12px] text-purple-400/30 hover:text-purple-300/55 transition-colors font-semibold">
                    ← Kembali ke Materi
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ─── QUESTION / FEEDBACK ───────────────────────────────────────────────────
  if ((screen==='question'||screen==='feedback') && currentQ) {
    const opts: {letter:'A'|'B'|'C'|'D';text:string}[] = [
      {letter:'A',text:currentQ.option_a},{letter:'B',text:currentQ.option_b},
      {letter:'C',text:currentQ.option_c},{letter:'D',text:currentQ.option_d},
    ]
    const diff = DIFF[currentQ.difficulty as keyof typeof DIFF] ?? DIFF.medium
    const prog = ((currentIdx+(isAnswered?1:0))/questions.length)*100

    function optState(l:'A'|'B'|'C'|'D'):'idle'|'correct'|'wrong'|'dimmed' {
      if (!isAnswered) return 'idle'
      if (l===selectedAnswer&&isCorrect)  return 'correct'
      if (l===selectedAnswer&&!isCorrect) return 'wrong'
      return 'dimmed'
    }

    return (
      <>
        <style>{CSS}</style>
        <SceneBG/>

        {/* Screen flash */}
        {flashResult && (
          <div className="fixed inset-0 z-20 pointer-events-none"
            style={{animation:`${flashResult==='correct'?'correctFlash':'wrongFlash'} .65s ease forwards`}}/>
        )}

        <ConfirmModal type={confirm} onCancel={()=>setConfirm(null)}
          onConfirm={()=>{setConfirm(null);if(confirm==='exit')router.push(`/materials/${id}`)}}
          qCount={questions.length} qIdx={currentIdx}/>

        <div className="relative z-10 min-h-screen flex flex-col pt-24">

          {/* ── HUD ── */}
          <div className="sticky top-0 z-30 px-4 sm:px-6 pt-3 pb-3 max-w-2xl mx-auto w-full"
            style={{background:'linear-gradient(180deg,rgba(8,4,24,.95) 80%,transparent)',backdropFilter:'blur(20px)'}}>

            <div className="flex items-center gap-2.5 mb-2.5">
              {/* Exit */}
              <button onClick={()=>setConfirm('exit')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-black transition-all hover:scale-[1.05]"
                style={{background:'rgba(244,63,94,.1)',border:'1px solid rgba(244,63,94,.2)',color:'#f87171'}}>
                <X className="w-3 h-3"/> Keluar
              </button>

              {/* Dot progress (≤20 soal) or text */}
              <div className="flex-1 flex items-center justify-center gap-1 overflow-hidden">
                {questions.length <= 20 ? (
                  questions.map((_,i) => (
                    <div key={i} className="h-1.5 flex-1 max-w-[28px] rounded-full transition-all duration-300"
                      style={{
                        background: i<currentIdx ? '#7c3aed' : i===currentIdx ? diff.color : 'rgba(139,92,246,.12)',
                        boxShadow:  i===currentIdx ? `0 0 8px ${diff.color}` : 'none',
                      }}/>
                  ))
                ) : (
                  <span className="text-[12px] font-black text-purple-300/50">
                    {currentIdx+1} / {questions.length}
                  </span>
                )}
              </div>

              {/* Diff tag */}
              <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl border ${diff.tag}`}>
                {diff.label}
              </span>

              {/* Coins */}
              {!isReplay && (
                <div className="relative flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
                  style={{background:'rgba(251,191,36,.1)',border:'1px solid rgba(251,191,36,.18)'}}>
                  <Coins className="w-3 h-3 text-yellow-400/70"/>
                  <span className="font-black text-[13px] text-yellow-300">{session?.total_coins_earned??0}</span>
                  {showCoinFloat && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 font-black text-[12px] text-yellow-300 whitespace-nowrap pointer-events-none"
                      style={{animation:'coinPop .95s ease forwards'}}>
                      +{earnedCoins}🪙
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-[3px] rounded-full overflow-hidden" style={{background:'rgba(139,92,246,.08)'}}>
              <div className="h-full rounded-full transition-all duration-500 relative overflow-hidden"
                style={{width:`${prog}%`,background:`linear-gradient(90deg,#7c3aed,${diff.color})`,boxShadow:`0 0 6px ${diff.color}88`}}>
                <div className="absolute inset-0 w-10 h-full"
                  style={{animation:'barShimmer 2.5s ease-in-out infinite',background:'linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent)'}}/>
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-8 max-w-2xl mx-auto w-full gap-4">

            {/* Timer + coins row */}
            {!isAnswered && screen==='question' && (
              <div className="flex items-center justify-center gap-6 w-full" style={{animation:'fadeIn .25s ease both'}}>
                <ArcTimer sec={timerSec}/>
                <div className="flex flex-col gap-2">
                  {!isReplay && (
                    <div>
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-yellow-400/60"/>
                        <span className="font-black text-[24px] text-yellow-300 leading-none"
                          style={{textShadow:'0 0 14px rgba(251,191,36,.45)'}}>
                          {coinsPreview}
                        </span>
                      </div>
                      <p className="text-yellow-400/35 text-[11px] font-bold mt-0.5">koin jika benar sekarang</p>
                    </div>
                  )}
                  {streak >= 2 && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-xs"
                      style={{background:'rgba(251,146,60,.15)',border:'1px solid rgba(251,146,60,.3)',color:'#fb923c',animation:'popIn .3s ease both'}}>
                      <Flame className="w-3.5 h-3.5" style={{filter:'drop-shadow(0 0 4px #fb923c)'}}/> {streak}x Streak!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status banners */}
            {isAnswered && selectedAnswer===null && (
              <div className="w-full py-3 px-4 rounded-2xl flex items-center gap-3"
                style={{animation:'popIn .3s ease both',background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.25)'}}>
                <Clock className="w-5 h-5 text-amber-400 shrink-0"/>
                <div>
                  <p className="font-black text-[14px] text-amber-300">Waktu Habis!</p>
                  <p className="text-amber-400/45 text-xs mt-0.5">Jawaban benar: <span className="font-black text-amber-300">{currentQ.correct_answer}</span></p>
                </div>
              </div>
            )}
            {isAnswered && selectedAnswer!==null && !isCorrect && screen==='feedback' && (
              <div className="w-full py-3 px-4 rounded-2xl flex items-center gap-3"
                style={{animation:'popIn .3s ease both',background:'rgba(244,63,94,.1)',border:'1px solid rgba(244,63,94,.25)'}}>
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" style={{filter:'drop-shadow(0 0 6px #f43f5e)'}}/>
                <div>
                  <p className="font-black text-[14px] text-rose-300">Jawaban Salah</p>
                  <p className="text-rose-400/45 text-xs mt-0.5">Jawaban benar: <span className="font-black text-rose-300">{currentQ.correct_answer}</span> · Lihat evaluasi di akhir</p>
                </div>
              </div>
            )}
            {isAnswered && isCorrect && (
              <div className="w-full py-3 px-4 rounded-2xl flex items-center gap-3"
                style={{animation:'popIn .3s ease both',background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.25)'}}>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" style={{filter:'drop-shadow(0 0 6px #10b981)'}}/>
                <p className="font-black text-[14px] text-emerald-300">
                  Benar!
                  {!isReplay&&earnedCoins>0&&<span className="text-yellow-300 ml-2">+🪙{earnedCoins}</span>}
                  {streak>=3&&<span className="text-orange-300 ml-2">🔥{streak}x streak!</span>}
                </p>
              </div>
            )}

            {/* Question */}
            <div className="w-full rounded-2xl p-5"
              style={{animation:'slideDown .3s ease both',
                background:`linear-gradient(135deg,rgba(${diff.rgb},.1),rgba(139,92,246,.06))`,
                border:`1px solid rgba(${diff.rgb},.3)`,
                boxShadow:`0 0 24px rgba(${diff.rgb},.15),inset 0 1px 0 rgba(${diff.rgb},.08)`}}>
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black mt-0.5"
                  style={{background:`rgba(${diff.rgb},.18)`,border:`1px solid rgba(${diff.rgb},.3)`,color:diff.color}}>
                  Q
                </div>
                <p className="text-white font-bold text-[15px] sm:text-[16px] leading-relaxed flex-1">
                  {currentQ.question_text}
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="w-full space-y-2">
              {opts.map(({letter,text}) => (
                <OptionBtn key={letter} letter={letter} text={text}
                  state={optState(letter)} disabled={isAnswered}
                  onClick={()=>{if(!isAnswered&&screen==='question')handleAnswer(letter)}}/>
              ))}
            </div>

            {/* Next */}
            {screen==='feedback' && (
              <button onClick={()=>goToQuestion(currentIdx+1)}
                className="w-full py-4 rounded-2xl font-black text-white text-[15px] transition-all hover:scale-[1.02] active:scale-[.98] flex items-center justify-center gap-2"
                style={{animation:'slideUp .3s ease both',background:'linear-gradient(135deg,#7c3aed,#ec4899)',boxShadow:'0 6px 24px rgba(124,58,237,.35)'}}>
                Soal Berikutnya <ChevronRight className="w-5 h-5"/>
              </button>
            )}
          </div>
        </div>
      </>
    )
  }

  // ─── RESULT ────────────────────────────────────────────────────────────────
  if (screen==='result') {
    const total    = resultCorrect+resultWrong
    const accuracy = total>0 ? Math.round((resultCorrect/total)*100) : 0
    const grade = accuracy>=90 ? {icon:'🏆',label:'Sempurna!',      color:'#fbbf24',rgb:'251,191,36'}
      : accuracy>=75           ? {icon:'🎯',label:'Bagus!',         color:'#34d399',rgb:'52,211,153'}
      : accuracy>=50           ? {icon:'📚',label:'Lumayan!',       color:'#60a5fa',rgb:'96,165,250'}
      :                          {icon:'💪',label:'Terus Berlatih!',color:'#f87171',rgb:'248,113,113'}

    return (
      <>
        <style>{CSS}</style>
        <SceneBG/>
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10 pt-24">
          <div className="w-full max-w-[420px] space-y-3" style={{animation:'slideUp .4s ease both'}}>

            <div className="flex justify-center mb-1">
              <div className="inline-flex items-center gap-2 bg-purple-500/15 border border-purple-400/20 rounded-full px-3.5 py-1.5 text-[11px] font-black text-purple-300 uppercase tracking-widest">
                <Trophy className="w-3 h-3 text-yellow-400"/> Hasil Quiz
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden"
              style={{background:'linear-gradient(145deg,rgba(22,12,50,.95),rgba(14,7,36,.97))',
                border:'1px solid rgba(139,92,246,.2)',
                boxShadow:'0 0 0 1px rgba(139,92,246,.06),0 32px 64px rgba(0,0,0,.6),0 0 100px rgba(139,92,246,.1)'}}>
              <div className="h-[3px]" style={{background:'linear-gradient(90deg,#7c3aed,#ec4899,#10b981)'}}/>

              <div className="p-6 space-y-4">
                {/* Grade + accuracy ring */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-[44px] leading-none" style={{filter:`drop-shadow(0 0 18px ${grade.color}88)`,animation:'popIn .5s .1s ease both'}}>
                      {grade.icon}
                    </div>
                    <h1 className="text-[22px] font-black" style={{color:grade.color,textShadow:`0 0 16px ${grade.color}55`}}>
                      {grade.label}
                    </h1>
                    <p className="text-purple-300/45 text-[12px] font-semibold">{materialTitle}</p>
                  </div>

                  {/* Accuracy ring */}
                  <div className="relative" style={{width:90,height:90}}>
                    <svg width="90" height="90" style={{transform:'rotate(-90deg)'}}>
                      <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(139,92,246,.1)" strokeWidth="5"/>
                      <circle cx="45" cy="45" r="38" fill="none"
                        stroke={grade.color} strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={2*Math.PI*38}
                        strokeDashoffset={2*Math.PI*38*(1-accuracy/100)}
                        style={{filter:`drop-shadow(0 0 8px ${grade.color}99)`,transition:'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)'}}/>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-black text-[20px] leading-none" style={{color:grade.color}}>{accuracy}%</span>
                      <span className="text-[8px] font-black text-purple-400/40 tracking-widest">AKURASI</span>
                    </div>
                  </div>
                </div>

                {/* Level up */}
                {leveledUp&&!isReplay && (
                  <div className="text-center py-3 rounded-2xl"
                    style={{animation:'popIn .4s .3s ease both',background:'rgba(251,191,36,.1)',border:'1px solid rgba(251,191,36,.3)',boxShadow:'0 0 28px rgba(251,191,36,.12)'}}>
                    <p className="font-black text-[16px] text-yellow-300" style={{textShadow:'0 0 14px rgba(251,191,36,.5)'}}>
                      ⬆️ LEVEL UP! → Level {newLevel}
                    </p>
                  </div>
                )}

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {label:'Benar',      val:String(resultCorrect), sub:`dari ${total} soal`,  color:'#10b981', icon:<CheckCircle2 className="w-3.5 h-3.5"/>},
                    {label:'Salah',      val:String(resultWrong),   sub:`dari ${total} soal`,  color:'#f43f5e', icon:<XCircle className="w-3.5 h-3.5"/>},
                    {label:'Koin',       val:isReplay?'—':`+${resultCoins}`, sub:isReplay?'tidak berlaku':'didapatkan', color:isReplay?'#3d3060':'#fbbf24', icon:<Coins className="w-3.5 h-3.5"/>},
                    {label:'Best Streak',val:bestStreak>0?`${bestStreak}x`:'—', sub:'berturut benar', color:bestStreak>=3?'#fb923c':'#4b4070', icon:<Flame className="w-3.5 h-3.5"/>},
                  ].map((s,i) => (
                    <div key={i} className="rounded-2xl p-3.5 flex items-center gap-2.5"
                      style={{animation:`popIn .4s ${.2+i*.07}s ease both`,
                        background:`rgba(${s.color==='#3d3060'||s.color==='#4b4070'?'80,60,150':s.color.slice(1).match(/../g)!.map(h=>parseInt(h,16)).join(',')},.09)`,
                        border:`1px solid rgba(${s.color==='#3d3060'||s.color==='#4b4070'?'80,60,150':s.color.slice(1).match(/../g)!.map(h=>parseInt(h,16)).join(',')},.2)`}}>
                      <div style={{color:s.color}}>{s.icon}</div>
                      <div>
                        <p className="font-black text-[17px] leading-none" style={{color:s.color}}>{s.val}</p>
                        <p className="text-[11px] text-purple-400/40 font-semibold mt-0.5">{s.label}</p>
                        <p className="text-[10px] text-purple-400/25">{s.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* XP */}
                {!isReplay&&resultXP>0 && (
                  <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
                    style={{background:'rgba(139,92,246,.1)',border:'1px solid rgba(139,92,246,.22)'}}>
                    <Zap className="w-5 h-5 text-violet-400 shrink-0" style={{filter:'drop-shadow(0 0 6px #a855f7)'}}/>
                    <div className="flex-1">
                      <p className="font-black text-sm text-purple-200">+{resultXP} XP didapat</p>
                      <p className="text-purple-400/35 text-xs">Progress level bertambah</p>
                    </div>
                    <TrendingUp className="w-4 h-4 text-purple-400/30"/>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  {sessionIdForEval && (
                    <Link href={`/materials/${id}/quiz/evaluation?session=${sessionIdForEval}`}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-bold text-sm text-blue-300 transition-all hover:scale-[1.02]"
                      style={{background:'rgba(96,165,250,.1)',border:'1px solid rgba(96,165,250,.22)'}}>
                      <BarChart3 className="w-4 h-4"/> Lihat Evaluasi Jawaban
                    </Link>
                  )}
                  <button onClick={()=>{setSession(null);setHasPrevCompleted(true);setScreen('intro')}}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-black text-[15px] text-white transition-all hover:scale-[1.02] active:scale-[.98]"
                    style={{background:'linear-gradient(135deg,#7c3aed,#ec4899)',boxShadow:'0 6px 24px rgba(124,58,237,.35)'}}>
                    <RefreshCw className="w-4 h-4"/> Main Lagi
                  </button>
                  <Link href={`/materials/${id}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 text-[12px] text-purple-400/30 hover:text-purple-300/55 transition-colors font-semibold">
                    <BookOpen className="w-3.5 h-3.5"/> Kembali ke Materi
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return null
}