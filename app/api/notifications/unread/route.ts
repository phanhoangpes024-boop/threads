import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  try {
    const { count, error } = await supabaseServer
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false)

    if (error) throw error

    console.log('[UNREAD COUNT] User:', userId, 'Count:', count)
    return NextResponse.json({ count: count || 0 })
  } catch (error: any) {
    console.error('[UNREAD COUNT] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}