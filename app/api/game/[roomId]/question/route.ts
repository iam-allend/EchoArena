import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  context: { params: Promise<{ roomId: string }> } // ✅ FIX
) {
  try {
    const supabase = await createClient()
    const { roomId } = await context.params // ✅ FIX: Await params

    console.log('❓ Getting question for room:', roomId)

    // Get random question
    const { data: questions } = await supabase
      .rpc('get_random_question', {
        p_category_id: null,
        p_difficulty: null,
      })

    const question = questions?.[0]

    if (!question) {
      throw new Error('No questions available')
    }

    console.log('✅ Question fetched:', question.id)

    return NextResponse.json({
      success: true,
      question,
    })
  } catch (error: any) {
    console.error('❌ Get question error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}