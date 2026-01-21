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

    // Get room info
    const { data: room } = await supabase
      .from('game_rooms')
      .select('current_stage')
      .eq('id', roomId)
      .single()

    if (!room) throw new Error('Room not found')

    // ✅ Get difficulty based on stage
    const { data: difficultyData } = await supabase
      .rpc('get_stage_difficulty', {
        p_stage_number: room.current_stage
      })

    const difficulty = difficultyData || 'medium'

    console.log(`📊 Stage ${room.current_stage} → Difficulty: ${difficulty}`)

    // ✅ Get random question (excluding used ones)
    const { data: questions, error: questionError } = await supabase
      .rpc('get_random_question', {
        p_category_id: null,
        p_difficulty: difficulty,
        p_room_id: roomId // ✅ Pass room_id to exclude used questions
      })

    if (questionError) throw questionError

    const question = questions?.[0]
    if (!question) {
      console.error('❌ No more unused questions available!')
      throw new Error('No questions available for this difficulty')
    }

    console.log('✅ Question fetched:', question.id, '- Difficulty:', question.difficulty)

    // ✅ Mark question as used
    await supabase
      .from('room_used_questions')
      .insert({
        room_id: roomId,
        question_id: question.id,
        stage_number: room.current_stage
      })
      .select()

    console.log('📝 Question marked as used')

    // Store in active_questions
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
          },
        })
        
        console.log('📡 Question broadcasted')
        
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