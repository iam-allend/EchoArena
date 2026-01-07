import { createClient } from '@/lib/supabase/client'

export async function generateUniqueRoomCode(): Promise<string> {
  const supabase = createClient()
  
  // Call database function to generate code
  const { data, error } = await supabase.rpc('generate_room_code')
  
  if (error || !data) {
    // Fallback: generate locally
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }
  
  return data
}

export function validateRoomCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code)
}