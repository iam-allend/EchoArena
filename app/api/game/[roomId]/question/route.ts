import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const supabase = await createClient()
    const { roomId } = await context.params

    console.log('❓ Getting question for room:', roomId)

    const { data: room } = await supabase
      .from('game_rooms')
      .select('current_stage')
      .eq('id', roomId)
      .single()

    if (!room) throw new Error('Room not found')

    // Get random question
    const { data: questions, error: questionError } = await supabase
      .rpc('get_random_question', {
        p_category_id: null,
        p_difficulty: null,
      })

    if (questionError) throw questionError

    const question = questions?.[0]
    if (!question) throw new Error('No questions available')

    console.log('✅ Question fetched:', question.id)

    // ✅ Store in active_questions untuk backup
    await supabase
      .from('active_questions')
      .upsert({
        room_id: roomId,
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
        onConflict: 'room_id,stage_number'
      })

    // ✅ BROADCAST via Realtime Channel
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
          },
        })
        
        console.log('📡 Question broadcasted via channel')
        
        // Cleanup
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
    console.error('❌ Get question error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}