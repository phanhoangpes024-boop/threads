// app/api/users/suggestions/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const currentUserId = searchParams.get('current_user_id')
  
  // ✅ Validate limit
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Math.min(parseInt(limitParam), 20) : 8

  try {
    let query = supabase
      .from('users')
      .select('id, username, bio, avatar_text, verified, followers_count')
      .order('followers_count', { ascending: false })
      .limit(limit)

    // ✅ Loại trừ user hiện tại
    if (currentUserId && currentUserId !== 'undefined') {
      query = query.neq('id', currentUserId)
    }

    const { data: users, error } = await query

    if (error) throw error

    return NextResponse.json(users || [])
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 })
  }
}