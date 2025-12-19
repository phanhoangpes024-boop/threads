// app/api/search/users/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const currentUserId = searchParams.get('current_user_id')
  
  // Validate query: phải có và không phải toàn space
  const trimmedQuery = query?.trim()
  if (!trimmedQuery || trimmedQuery.length < 1) {
    return NextResponse.json([])
  }

  try {
    const { data, error } = await supabase.rpc('search_users_smart', {
      keyword: trimmedQuery,
      p_current_user_id: currentUserId || null,
      limit_count: 20
    })

    if (error) {
      console.error('[SEARCH USERS ERROR]', error)
      throw error
    }

    return NextResponse.json(data || [])
    
  } catch (error: any) {
    console.error('[SEARCH USERS EXCEPTION]', error)
    return NextResponse.json(
      { error: error.message || 'Search failed' }, 
      { status: 500 }
    )
  }
}