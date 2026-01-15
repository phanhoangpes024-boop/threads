// app/api/public-feed/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// ✅ 1. Tạo biến headers dùng chung để tránh gõ lại nhiều lần
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS', // Thêm OPTIONS
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
}

// ✅ 2. Thêm hàm OPTIONS để trình duyệt check quyền trước khi gọi GET
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: Request) {
  // Lấy params
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const cursorTime = searchParams.get('cursor_time') || null
  const cursorId = searchParams.get('cursor_id') || null

  try {
    const { data, error } = await supabase.rpc('get_feed_optimized', {
      p_user_id: null, // Guest mode
      p_cursor_time: cursorTime,
      p_cursor_id: cursorId,
      p_limit: limit
    })

    // ✅ XỬ LÝ LỖI RPC - Phải kèm headers ngay cả khi lỗi
    if (error) {
      console.error('[PUBLIC FEED] RPC error:', error)
      return NextResponse.json(
        { error: error.message }, 
        { 
          status: 500, 
          headers: corsHeaders // ✅ QUAN TRỌNG: Kèm headers khi lỗi
        } 
      )
    }

    // Map dữ liệu
    const threads = (data || []).map((t: any) => ({
      id: t.id,
      user_id: t.user_id,
      content: t.content,
      created_at: t.created_at,
      likes_count: t.likes_count ?? 0,
      comments_count: t.comments_count ?? 0,
      reposts_count: t.reposts_count ?? 0,
      username: t.username,
      avatar_text: t.avatar_text,
      avatar_bg: t.avatar_bg || '#0077B6',
      verified: t.verified ?? false,
      medias: Array.isArray(t.medias) 
        ? t.medias.map((m: any) => ({
            id: m.id,
            url: m.url,
            type: m.media_type || m.type || 'image',
            width: m.width ?? null,
            height: m.height ?? null,
            order: m.order_index ?? m.order ?? 0
          }))
        : []
    }))

    // ✅ TRẢ VỀ THÀNH CÔNG với headers
    return NextResponse.json(
      { threads, total: threads.length },
      {
        headers: corsHeaders // Dùng biến headers đã khai báo
      }
    )

  } catch (error) {
    console.error('[PUBLIC FEED] Error:', error)
    // ✅ XỬ LÝ LỖI SERVER - Phải kèm headers ngay cả khi lỗi
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { 
        status: 500, 
        headers: corsHeaders // ✅ QUAN TRỌNG: Kèm headers khi lỗi
      }
    )
  }
}