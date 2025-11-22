// app/api/users/suggestions/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { MOCK_USER } from '@/lib/currentUser'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '10')

  try {
    // Lấy danh sách users, loại trừ current user
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .neq('id', MOCK_USER.id)
      .limit(limit)

    if (error) throw error

    // TODO: Sau này có thể thêm logic:
    // - Loại trừ users đã follow
    // - Sắp xếp theo số followers
    // - Gợi ý dựa trên interests chung

    return NextResponse.json(users || [])
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 })
  }
}