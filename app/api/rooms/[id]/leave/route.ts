import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const roomId = params.id

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Update participant status to 'left'
    const { error: updateError } = await supabase
      .from('room_participants')
      .update({ status: 'left' })
      .eq('room_id', roomId)
      .eq('user_id', user.id)

    if (updateError) throw updateError

    // Check if room is now empty
    const { data: participants } = await supabase
      .from('room_participants')
      .select('id')
      .eq('room_id', roomId)
      .neq('status', 'left')

    if (!participants || participants.length === 0) {
      // Delete empty room
      await supabase
        .from('game_rooms')
        .delete()
        .eq('id', roomId)
    } else {
      // Check if host left, assign new host
      const { data: room } = await supabase
        .from('game_rooms')
        .select('host_user_id')
        .eq('id', roomId)
        .single()

      if (room?.host_user_id === user.id) {
        // Get first active participant as new host
        const { data: newHost } = await supabase
          .from('room_participants')
          .select('user_id')
          .eq('room_id', roomId)
          .eq('status', 'active')
          .limit(1)
          .single()

        if (newHost) {
          await supabase
            .from('game_rooms')
            .update({ host_user_id: newHost.user_id })
            .eq('id', roomId)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Leave room error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to leave room' },
      { status: 500 }
    )
  }
}