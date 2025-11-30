// app/api/threads/[id]/route.ts - NEW FILE
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
  const { id } = await context.params;

  const { data: thread, error } = await supabase
    .from('threads')
    .select(THREAD_SELECT)
    .eq('id', id)
    .single();

  if (error || !thread) {
    return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 });
  }

  const threadData = thread as any;

  return NextResponse.json({
    id: threadData.id,
    user_id: threadData.user_id,
    content: threadData.content,
    image_urls: threadData.image_urls || [],
    created_at: threadData.created_at,
    username: threadData.users?.username ?? null,
    avatar_text: threadData.users?.avatar_text ?? null,
    verified: threadData.users?.verified ?? false,
    likes_count: threadData.likes_count,
    comments_count: threadData.comments_count,
    reposts_count: threadData.reposts_count,
  });
}