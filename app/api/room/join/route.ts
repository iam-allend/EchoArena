import { createClient } from '@/lib/supabase/server'
import { validateRoomCode } from '@/lib/room/utils'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { roomCode, userId } = await request.json()

    console.log('🔍 Permintaan bergabung ke room:', { roomCode, userId })

    // Validate room code format
    if (!validateRoomCode(roomCode.toUpperCase())) {
      return NextResponse.json(
        { error: 'Format kode room tidak valid' },
        { status: 400 }
      )
    }

    // Validate userId
    if (!userId) {
      return NextResponse.json(
        { error: 'ID Pengguna diperlukan' },
        { status: 400 }
      )
    }

    // Verify user exists in database
    const { data: userExists, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (userError || !userExists) {
      return NextResponse.json(
        { error: 'Pengguna tidak valid' },
        { status: 401 }
      )
    }

    // Check if room exists and available
    const { data: rooms, error: roomError } = await supabase.rpc(
      'get_available_room',
      { p_room_code: roomCode.toUpperCase() }
    )

    if (roomError) {
      console.error('❌ Kesalahan RPC:', roomError)
      throw roomError
    }

    if (!rooms || rooms.length === 0) {
      return NextResponse.json(
        { error: 'Room tidak ditemukan atau sudah dimulai' },
        { status: 404 }
      )
    }

    const room = rooms[0]
    console.log('✅ Room ditemukan:', room.id)

    // ✅ CHECK: Apakah user sudah pernah join room ini?
    const { data: existing, error: existingError } = await supabase
      .from('room_participants')
      .select('id, status')
      .eq('room_id', room.id)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingError) {
      console.error('❌ Kesalahan memeriksa peserta yang ada:', existingError)
      throw existingError
    }

    if (existing) {
      console.log('🔍 Peserta yang ada ditemukan:', existing)
      
      // ✅ CASE 1: User masih active di room (belum leave)
      if (existing.status === 'active') {
        console.log('✅ Pengguna sudah aktif di room')
        return NextResponse.json({
          success: true,
          message: 'Sudah berada di dalam room',
          room: {
            id: room.id,
            code: room.room_code,
            hostId: room.host_user_id,
          },
        })
      }

      // ✅ CASE 2: User sebelumnya leave, sekarang join lagi
      if (existing.status === 'left') {
        console.log('🔄 Pengguna bergabung kembali, memperbarui status...')
        
        const { error: updateError } = await supabase
          .from('room_participants')
          .update({ 
            status: 'active',
            lives_remaining: 3, // Reset lives
            total_score: 0,     // Reset score
            joined_at: new Date().toISOString() // Update join time
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error('❌ Gagal memperbarui peserta:', updateError)
          throw updateError
        }

        console.log('✅ Status peserta diperbarui menjadi aktif')
        
        return NextResponse.json({
          success: true,
          message: 'Berhasil bergabung kembali',
          room: {
            id: room.id,
            code: room.room_code,
            hostId: room.host_user_id,
          },
        })
      }

      // ✅ CASE 3: User eliminated (optional - tergantung game logic)
      if (existing.status === 'eliminated') {
        return NextResponse.json(
          { error: 'Anda telah tereliminasi dari room ini' },
          { status: 403 }
        )
      }
    }

    // ✅ CASE 4: User belum pernah join room ini, insert baru
    console.log('➕ Menambahkan peserta baru...')
    
    const { error: participantError } = await supabase
      .from('room_participants')
      .insert({
        room_id: room.id,
        user_id: userId,
        lives_remaining: 3,
        total_score: 0,
        status: 'active',
      })

    if (participantError) {
      console.error('❌ Gagal menambahkan peserta:', participantError)
      throw participantError
    }

    console.log('✅ Peserta baru ditambahkan')

    return NextResponse.json({
      success: true,
      message: 'Berhasil bergabung ke room',
      room: {
        id: room.id,
        code: room.room_code,
        hostId: room.host_user_id,
      },
    })
  } catch (error: any) {
    console.error('❌ Kesalahan saat bergabung room:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Gagal bergabung ke room',
        details: error.details || null
      },
      { status: 500 }
    )
  }
}