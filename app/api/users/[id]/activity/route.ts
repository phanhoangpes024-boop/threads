// app/api/users/[id]/activity/route.ts - UPDATED
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const THREAD_SELECT = `
  id,
  user_id,
  content,
  image_urls,
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
  const { id: userId } = await context.params;

  try {
    // Parallel fetch: author threads + liked/commented IDs
    const [authorThreads, likedIds, commentedIds] = await Promise.all([
      supabase.from('threads').select(THREAD_SELECT).eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('likes').select('thread_id').eq('user_id', userId),
      supabase.from('comments').select('thread_id').eq('user_id', userId)
    ]);

    // Get unique thread IDs from likes/comments
    const threadIds = new Set([
      ...(likedIds.data?.map(l => l.thread_id) || []),
      ...(commentedIds.data?.map(c => c.thread_id) || [])
    ]);

    // Fetch related threads if any
    let relatedThreads: any[] = [];
    if (threadIds.size > 0) {
      const { data } = await supabase
        .from('threads')
        .select(THREAD_SELECT)
        .in('id', Array.from(threadIds))
        .order('created_at', { ascending: false });
      relatedThreads = data || [];
    }

    // Combine + deduplicate
    const allThreads = [...(authorThreads.data || []), ...relatedThreads];
    const uniqueMap = new Map(allThreads.map(t => [t.id, t]));
    const uniqueThreads = Array.from(uniqueMap.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Format response
    return NextResponse.json(
      uniqueThreads.map((t: any) => ({
        id: t.id,
        user_id: t.user_id,
        content: t.content,
        image_urls: t.image_urls || [],
        created_at: t.created_at,
        username: t.users?.username ?? null,
        avatar_text: t.users?.avatar_text ?? null,
        verified: t.users?.verified ?? false,
        likes_count: t.likes_count || 0,
        comments_count: t.comments_count || 0,
        reposts_count: t.reposts_count || 0,
      }))
    );
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}