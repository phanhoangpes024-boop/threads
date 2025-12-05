// app/api/threads/[id]/route.ts - FIXED WITH MEDIAS
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const THREAD_SELECT = `
  id,
  user_id,
  content,
  created_at,
  likes_count,
  comments_count,
  reposts_count,
  users (username, avatar_text, verified)
`;

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  try {
    // 1️⃣ Fetch thread info
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .select(THREAD_SELECT)
      .eq('id', id)
      .single();

    if (threadError || !thread) {
      return NextResponse.json(
        { error: threadError?.message ?? "Thread not found" }, 
        { status: 404 }
      );
    }

    // 2️⃣ Fetch medias từ thread_medias
    const { data: medias, error: mediasError } = await supabase
      .from('thread_medias')
      .select('*')
      .eq('thread_id', id)
      .order('order_index', { ascending: true });

    if (mediasError) {
      console.error('Error fetching medias:', mediasError);
    }

    // 3️⃣ Check liked status (nếu có userId)
    let isLiked = false;
    if (userId) {
      const { data: likeData } = await supabase
        .from('likes')
        .select('id')
        .eq('thread_id', id)
        .eq('user_id', userId)
        .maybeSingle();
      
      isLiked = !!likeData;
    }

    const threadData = thread as any;

    // 4️⃣ Format giống Feed API
    return NextResponse.json({
      id: threadData.id,
      user_id: threadData.user_id,
      content: threadData.content,
      created_at: threadData.created_at,
      username: threadData.users?.username ?? null,
      avatar_text: threadData.users?.avatar_text ?? null,
      verified: threadData.users?.verified ?? false,
      likes_count: threadData.likes_count ?? 0,
      comments_count: threadData.comments_count ?? 0,
      reposts_count: threadData.reposts_count ?? 0,
      is_liked: isLiked,
      
      // ✅ MEDIAS - Map từ thread_medias
      medias: (medias || []).map(m => ({
        id: m.id,
        url: m.url,
        type: m.media_type || 'image',
        width: m.width,
        height: m.height,
        order: m.order_index
      }))
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}