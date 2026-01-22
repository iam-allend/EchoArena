import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const supabase = await createClient()
    const { roomId } = await context.params

    console.log('🎮 Memulai permainan untuk room:', roomId)

    // Dapatkan room
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('*, host_user_id')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      throw new Error('Room tidak ditemukan')
    }

    // ✅ Buat nama channel Agora
    // Format: agora-arena-<8 karakter pertama roomId>
    const voiceChannelName = `agora-arena-${roomId.slice(0, 8)}`

    console.log('🎤 Nama channel Agora:', voiceChannelName)

    // Perbarui status room dengan nama channel suara
    const { error: updateError } = await supabase
      .from('game_rooms')
      .update({
        status: 'playing',
        current_stage: 1,
        voice_room_url: voiceChannelName, // ✅ Simpan nama channel, bukan URL
      })
      .eq('id', roomId)

    if (updateError) throw updateError

    // Inisialisasi antrean giliran untuk babak 1
    const { error: turnError } = await supabase.rpc('initialize_stage_turns', {
      p_room_id: roomId,
      p_stage_number: 1,
    })

    if (turnError) throw turnError

    console.log('✅ Permainan dimulai dengan channel suara Agora')

    return NextResponse.json({
      success: true,
      voiceChannelName, // Kembalikan nama channel
    })
  } catch (error: any) {
    console.error('❌ Kesalahan memulai permainan:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}