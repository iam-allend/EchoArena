import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const supabase = await createClient()
    const { roomId } = await context.params

    console.log('❓ Mengambil pertanyaan untuk room:', roomId)

    // ✅ Get current user from turn queue
    let currentUserId: string

    const { data: currentTurn, error: turnError } = await supabase
      .rpc('get_current_turn', {
        p_room_id: roomId
      })

    if (turnError || !currentTurn || currentTurn.length === 0) {
      console.error('❌ No active turn, using fallback:', turnError)
      
      // ✅ FALLBACK: Get first active participant
      const { data: participants } = await supabase
        .from('room_participants')
        .select('user_id')
        .eq('room_id', roomId)
        .eq('status', 'active')
        .order('joined_at', { ascending: true })
        .limit(1)

      if (!participants || participants.length === 0) {
        throw new Error('No active participants found')
      }

      console.log('✅ Using fallback user:', participants[0].user_id)
      currentUserId = participants[0].user_id
    } else {
      currentUserId = currentTurn[0].user_id
    }

    // Get room info
    const { data: room } = await supabase
      .from('game_rooms')
      .select('current_stage')
      .eq('id', roomId)
      .single()

    if (!room) throw new Error('Room tidak ditemukan')

    // ✅ Get difficulty based on stage
    const { data: difficultyData } = await supabase
      .rpc('get_stage_difficulty', {
        p_stage_number: room.current_stage
      })

    const difficulty = difficultyData || 'medium'

    console.log(`📊 Babak ${room.current_stage} → User: ${currentUserId} → Tingkat Kesulitan: ${difficulty}`)

    // ✅ Get random question (excluding used ones FOR THIS USER)
    const { data: questions, error: questionError } = await supabase
      .rpc('get_random_question_for_user', {
        p_category_id: null,
        p_difficulty: difficulty,
        p_room_id: roomId,
        p_user_id: currentUserId
      })

    if (questionError) throw questionError

    const question = questions?.[0]
    if (!question) {
      console.error('❌ Tidak ada lagi pertanyaan yang belum digunakan!')
      throw new Error('Tidak ada pertanyaan tersedia untuk tingkat kesulitan ini')
    }

    console.log('✅ Pertanyaan diambil:', question.id, '- Tingkat Kesulitan:', question.difficulty)

    // ✅ Mark question as used FOR THIS USER
    await supabase
      .from('room_used_questions')
      .insert({
        room_id: roomId,
        question_id: question.id,
        stage_number: room.current_stage,
        user_id: currentUserId
      })

    console.log('📝 Pertanyaan ditandai sebagai sudah digunakan untuk user:', currentUserId)

    // ✅ Store in active_questions PER USER
    await supabase
      .from('active_questions')
      .upsert({
        room_id: roomId,
        user_id: currentUserId,
        stage_number: room.current_stage,
        question_id: question.id,
        question_text: question.question_text,
        option_a: question.option_a,
        option_b: question.option_b,
        option_c: question.option_c,
        option_d: question.option_d,
        difficulty: question.difficulty,
        expires_at: new Date(Date.now() + 30000).toISOString(),
      }, {
        onConflict: 'room_id,user_id'
      })

    // ✅ BROADCAST via Realtime
    const broadcastChannel = supabase.channel(`room:${roomId}:broadcast`)
    
    await broadcastChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await broadcastChannel.send({
          type: 'broadcast',
          event: 'game-event',
          payload: {
            type: 'QUESTION_LOADED',
            question: question,
            stageNumber: room.current_stage,
            userId: currentUserId,
          },
        })
        
        console.log('📡 Pertanyaan disiarkan untuk user:', currentUserId)
        
        setTimeout(() => {
          supabase.removeChannel(broadcastChannel)
        }, 1000)
      }
    })

    return NextResponse.json({
      success: true,
      question,
    })
  } catch (error: any) {
    console.error('❌ Kesalahan pengambilan pertanyaan:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}