// app/api/threads/[id]/medias/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  const { data, error } = await supabase
    .from('thread_medias')
    .select('*')
    .eq('thread_id', id)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Error fetching medias:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Map sang FeedMedia format
  const medias = (data || []).map(m => ({
    id: m.id,
    url: m.url,
    type: m.media_type || 'image',
    width: m.width,
    height: m.height,
    order: m.order_index
  }))

  return NextResponse.json(medias)
}