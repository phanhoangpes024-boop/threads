// lib/supabaseServer.ts
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function getSupabaseServer() {
  const cookieStore = await cookies() // ✅ ĐÃ CÓ AWAIT
  const token = cookieStore.get('sb-access-token')?.value

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token || ''}`
        }
      },
      auth: {
        persistSession: false
      }
    }
  )
}