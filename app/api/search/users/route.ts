// app/api/search/users/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  
  // 1 ký tự cũng tìm được (cho instant search)
  if (!query || query.trim().length < 1) {
    return NextResponse.json([])
  }

  try {
    // Gọi hàm RPC thông minh (Chỉ tốn 1 request)
    const { data, error } = await supabase.rpc('search_users_smart', {
      keyword: query.trim(),
      limit_count: 20
    })

    if (error) throw error

    return NextResponse.json(data)
    
  } catch (error: any) {
    console.error('[SEARCH USERS ERROR]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}