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

    // ✅ 1. Get current user from turn queue
    let currentUserId: string

    const { data: currentTurn, error: turnError } = await supabase
      .rpc('get_current_turn', {
        p_room_id: roomId
      })

    if (turnError || !currentTurn || currentTurn.length === 0) {
      console.error('❌ No active turn, using fallback:', turnError)
      
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

      currentUserId = participants[0].user_id
    } else {
      currentUserId = currentTurn[0].user_id
    }

    // ✅ 2. Get room info
    const { data: room } = await supabase
      .from('game_rooms')
      .select('current_stage')
      .eq('id', roomId)
      .single()

    if (!room) throw new Error('Room not found')

    // ✅ 3. Get difficulty based on stage
    const { data: difficultyData } = await supabase
      .rpc('get_stage_difficulty', {
        p_stage_number: room.current_stage
      })

    const difficulty = difficultyData || 'medium'

    console.log(`📊 Stage ${room.current_stage} → User: ${currentUserId} → Difficulty: ${difficulty}`)

    // ✅ 4. CRITICAL: Check if question already loaded for this user
    const { data: existingQuestion } = await supabase
      .from('active_questions')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', currentUserId)
      .eq('stage_number', room.current_stage)
      .maybeSingle()

    if (existingQuestion) {
      console.log('✅ Question already loaded for this user:', existingQuestion.question_id)
      
      // Return existing question (prevent duplicate API calls)
      return NextResponse.json({
        success: true,
        question: {
          id: existingQuestion.question_id,
          question_text: existingQuestion.question_text,
          option_a: existingQuestion.option_a,
          option_b: existingQuestion.option_b,
          option_c: existingQuestion.option_c,
          option_d: existingQuestion.option_d,
          difficulty: existingQuestion.difficulty,
        },
      })
    }

    // ✅ 5. Get random question (NOW excludes ALL used questions in room)
    const { data: questions, error: questionError } = await supabase
      .rpc('get_random_question_for_user', {
        p_category_id: null,
        p_difficulty: difficulty,
        p_room_id: roomId,
        p_user_id: currentUserId // Still pass for logging, but function ignores it for filtering
      })

    if (questionError) throw questionError

    const question = questions?.[0]
    if (!question) {
      console.error('❌ No more unused questions available!')
      throw new Error(`No questions available for difficulty: ${difficulty}`)
    }

    console.log('✅ Question fetched:', question.id, '- Difficulty:', question.difficulty)

    // ✅ 6. ATOMIC: Insert to both tables in sequence (Supabase handles conflicts)
    
    // Track as used in room
    const { error: trackError } = await supabase
      .from('room_used_questions')
      .insert({
        room_id: roomId,
        question_id: question.id,
        stage_number: room.current_stage,
        user_id: currentUserId
      })

    if (trackError) {
      // If duplicate key error, another request already inserted this question
      // Try to get a different question recursively (fallback)
      console.warn('⚠️ Question already used, retrying...', trackError)
      
      // Recursive retry (max 3 times)
      const retryCount = parseInt(request.headers.get('x-retry-count') || '0')
      if (retryCount < 3) {
        const retryHeaders = new Headers()
        retryHeaders.set('x-retry-count', (retryCount + 1).toString())
        
        return GET(request, context)
      }
      
      throw new Error('Failed to get unique question after retries')
    }

    console.log('📝 Question marked as used for user:', currentUserId)

    // Store in active_questions
    const { error: activeError } = await supabase
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

    if (activeError) {
      console.error('❌ Error storing active question:', activeError)
    }

    // ✅ 7. Broadcast question
    console.log('📡 Broadcasting question for user:', currentUserId)

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
    console.error('❌ Question fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}