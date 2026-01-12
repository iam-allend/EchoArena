import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  context: { params: Promise<{ roomId: string }> } // ✅ FIX
) {
  try {
    const supabase = await createClient()
    const { roomId } = await context.params // ✅ FIX: Await params
    const body = await request.json()

    console.log('✍️ Answer submission for room:', roomId)

    const {
      userId,
      stageNumber,
      questionId,
      selectedAnswer,
      timeTaken,
      voiceTranscript,
    } = body

    // Validate inputs
    if (!userId || !stageNumber || !questionId || !selectedAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Submit answer via function
    const { data: result, error } = await supabase
      .rpc('submit_answer', {
        p_room_id: roomId,
        p_stage_number: stageNumber,
        p_user_id: userId,
        p_question_id: questionId,
        p_selected_answer: selectedAnswer,
        p_time_taken: timeTaken,
        p_voice_transcript: voiceTranscript,
      })

    if (error) throw error

    console.log('✅ Answer submitted:', result)

    // Check if stage is complete
    const { data: stageComplete } = await supabase
      .rpc('is_stage_complete', {
        p_room_id: roomId,
        p_stage_number: stageNumber,
      })

    return NextResponse.json({
      success: true,
      result,
      stageComplete: stageComplete || false,
    })
  } catch (error: any) {
    console.error('❌ Submit answer error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}