// app/api/users/[id]/threads/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ✅ BẮT BUỘC: Không cache
export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await context.params
  const { searchParams } = new URL(request.url)
  const currentUserId = searchParams.get('current_user_id')

  console.log('🔍 [API] Profile Threads:', {
    userId,
    currentUserId,
    url: request.url
  })

  // ✅ Tạo client mới mỗi request
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // ✅ Xử lý viewerId an toàn
    const viewerId = (currentUserId && currentUserId !== 'undefined' && currentUserId !== 'null') 
      ? currentUserId 
      : null

    console.log('📡 [RPC] Calling get_user_threads:', { 
      p_user_id: userId, 
      p_viewer_id: viewerId 
    })

    const { data, error } = await supabase.rpc('get_user_threads', {
      p_user_id: userId,
      p_viewer_id: viewerId
    })

    if (error) {
      console.error('❌ [RPC] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ [RPC] Success:', { threadsCount: data?.length || 0 })

    // Map kết quả
    const threads = (data || []).map((t: any) => ({
      id: t.id,
      user_id: t.user_id,
      content: t.content,
      created_at: t.created_at,
      likes_count: t.likes_count || 0,
      comments_count: t.comments_count || 0,
      reposts_count: t.reposts_count || 0,
      username: t.username,
      avatar_text: t.avatar_text,
      avatar_bg: t.avatar_bg || '#0077B6',
      verified: t.verified || false,
      is_liked: t.is_liked || false,
      medias: Array.isArray(t.medias)
        ? t.medias.map((m: any) => ({
            id: m.id,
            url: m.url,
            type: m.type || 'image',
            width: m.width || null,
            height: m.height || null,
            order: m.order || 0
          }))
        : []
    }))

    console.log('🎯 [API] Returning threads:', threads.length)

    return NextResponse.json(threads, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      }
    })

  } catch (error) {
    console.error('💥 [API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch threads' }, 
      { status: 500 }
    )
  }
}