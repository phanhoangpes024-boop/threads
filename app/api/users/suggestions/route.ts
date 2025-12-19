// app/api/users/suggestions/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const currentUserId = searchParams.get('current_user_id')
  
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Math.min(parseInt(limitParam), 20) : 8

  if (!currentUserId || currentUserId === 'undefined') {
    return NextResponse.json([])
  }

  try {
    // ✅ Dùng RPC - 1 query, loại luôn users đã follow
    const { data: users, error } = await supabase.rpc('get_user_suggestions_not_followed', {
      p_current_user_id: currentUserId,
      p_limit: limit
    })

    if (error) throw error

    return NextResponse.json(users || [])
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 })
  }
}