import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Fungsi bantuan untuk memvalidasi UUID
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }  
) {
  try {
    const supabase = await createClient()
    
    
    const { id: roomId } = await context.params
    
   
    console.log('🔍 Menerima roomId:', roomId, typeof roomId)
    
    if (!roomId || roomId === 'undefined') {
      console.error('❌ roomId tidak valid:', roomId)
      return NextResponse.json(
        { error: 'ID Room tidak valid' },
        { status: 400 }
      )
    }

    if (!isValidUUID(roomId)) {
      console.error('❌ roomId bukan UUID yang valid:', roomId)
      return NextResponse.json(
        { error: 'ID Room harus berupa UUID yang valid' },
        { status: 400 }
      )
    }
    
    // ✅ VALIDASI 2: Parse body permintaan
    let userId: string
    try {
      const body = await request.json()
      userId = body.userId
      console.log('🔍 Menerima userId:', userId, typeof userId)
    } catch (parseError) {
      console.error('❌ Gagal mengurai permintaan:', parseError)
      return NextResponse.json(
        { error: 'Permintaan tidak valid' },
        { status: 400 }
      )
    }

    // ✅ VALIDASI 3: Cek userId
    if (!userId || userId === 'undefined') {
      console.error('❌ userId tidak valid:', userId)
      return NextResponse.json(
        { error: 'ID Pengguna diperlukan dan tidak boleh undefined' },
        { status: 400 }
      )
    }

    if (!isValidUUID(userId)) {
      console.error('❌ userId bukan UUID yang valid:', userId)
      return NextResponse.json(
        { error: 'ID Pengguna harus berupa UUID yang valid' },
        { status: 400 }
      )
    }

    console.log('✅ UUID Valid - userId:', userId, 'roomId:', roomId)

    // Verifikasi pengguna ada
    const { data: userExists, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (userError || !userExists) {
      console.error('❌ Verifikasi pengguna gagal:', userError)
      return NextResponse.json(
        { error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      )
    }

    console.log('✅ Pengguna terverifikasi')

    // Perbarui status peserta menjadi 'left'
    const { error: updateError } = await supabase
      .from('room_participants')
      .update({ status: 'left' })
      .eq('room_id', roomId)
      .eq('user_id', userId)

    if (updateError) {
      console.error('❌ Gagal memperbarui peserta:', updateError)
      return NextResponse.json(
        { 
          error: 'Gagal memperbarui status peserta',
          details: updateError.message 
        },
        { status: 500 }
      )
    }

    console.log('✅ Peserta ditandai keluar')

    // Periksa apakah room sekarang kosong
    const { data: participants, error: participantsError } = await supabase
      .from('room_participants')
      .select('id, user_id')
      .eq('room_id', roomId)
      .neq('status', 'left')

    if (participantsError) {
      console.error('❌ Gagal memeriksa peserta:', participantsError)
      // Jangan throw, peserta sudah keluar
    }

    if (!participants || participants.length === 0) {
      // Hapus room yang kosong
      console.log('🗑️ Room kosong, menghapus...')
      const { error: deleteError } = await supabase
        .from('game_rooms')
        .delete()
        .eq('id', roomId)
      
      if (deleteError) {
        console.error('⚠️ Gagal menghapus room:', deleteError)
        // Jangan throw, peserta sudah keluar
      } else {
        console.log('✅ Room dihapus')
      }
    } else {
      // Periksa jika host keluar, tetapkan host baru
      const { data: room } = await supabase
        .from('game_rooms')
        .select('host_user_id')
        .eq('id', roomId)
        .single()

      if (room?.host_user_id === userId) {
        console.log('👑 Host keluar, menetapkan host baru...')
        
        const newHostId = participants[0]?.user_id

        if (newHostId && isValidUUID(newHostId)) {
          const { error: hostError } = await supabase
            .from('game_rooms')
            .update({ host_user_id: newHostId })
            .eq('id', roomId)

          if (hostError) {
            console.error('⚠️ Gagal memperbarui host:', hostError)
          } else {
            console.log('✅ Host baru ditetapkan:', newHostId)
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Berhasil keluar dari room'
    })
  } catch (error: any) {
    console.error('❌ Kesalahan keluar room:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Gagal keluar dari room',
        details: error.details || error.hint || null
      },
      { status: 500 }
    )
  }
}