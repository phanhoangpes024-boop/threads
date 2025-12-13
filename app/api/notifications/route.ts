import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const limit = parseInt(searchParams.get('limit') || '50')

  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  try {
    const { data, error } = await supabaseServer.rpc('get_notifications', {
      p_user_id: userId,
      p_limit: limit
    })

    if (error) throw error

    return NextResponse.json({ notifications: data || [] })
  } catch (error: any) {
    console.error('[NOTIFICATIONS API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { notification_ids } = await request.json()

  if (!notification_ids || !Array.isArray(notification_ids)) {
    return NextResponse.json({ error: 'notification_ids required' }, { status: 400 })
  }

  try {
    const { error } = await supabaseServer
      .from('notifications')
      .update({ is_read: true })
      .in('id', notification_ids)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[NOTIFICATIONS MARK READ] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}