import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const supabase = await createClient()
    const { roomId } = await context.params

    console.log('🎮 Starting game for room:', roomId)

    // Get room
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('*, host_user_id')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      throw new Error('Room not found')
    }

    // ✅ Generate Agora channel name
    // Format: agora-arena-<first 8 chars of roomId>
    const voiceChannelName = `agora-arena-${roomId.slice(0, 8)}`

    console.log('🎤 Agora channel name:', voiceChannelName)

    // Update room status dengan voice channel name
    const { error: updateError } = await supabase
      .from('game_rooms')
      .update({
        status: 'playing',
        current_stage: 1,
        voice_room_url: voiceChannelName, // ✅ Simpan channel name, bukan URL
      })
      .eq('id', roomId)

    if (updateError) throw updateError

    // Initialize turn queue for stage 1
    const { error: turnError } = await supabase.rpc('initialize_stage_turns', {
      p_room_id: roomId,
      p_stage_number: 1,
    })

    if (turnError) throw turnError

    console.log('✅ Game started with Agora voice channel')

    return NextResponse.json({
      success: true,
      voiceChannelName, // Return channel name
    })
  } catch (error: any) {
    console.error('❌ Start game error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}