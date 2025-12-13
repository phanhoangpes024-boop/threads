import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { user_id } = await request.json()

  if (!user_id) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  try {
    const { error } = await supabase
      .from('users')
      .update({ last_notified_viewed_at: new Date().toISOString() })
      .eq('id', user_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[MARK VIEWED] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}