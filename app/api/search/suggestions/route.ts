// app/api/search/suggestions/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.trim().length === 0) {
    return NextResponse.json([])
  }

  try {
    // Hardcoded suggestions - có thể cải thiện bằng cách:
    // 1. Lưu search history của user
    // 2. Trending topics
    // 3. Popular searches
    const suggestions = [
      'ui design',
      'design inspiration',
      'web design trends',
      'mobile app design',
      'figma tips',
      'ux research',
      'typography',
      'color theory'
    ].filter(s => s.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
      .map((text, index) => ({ id: `${index}`, text }))

    // Nếu muốn lấy suggestions từ DB (threads content):
    // const { data: threads } = await supabase
    //   .from('threads')
    //   .select('content')
    //   .ilike('content', `%${query}%`)
    //   .limit(5)
    
    // const suggestions = threads?.map((t, i) => ({
    //   id: `${i}`,
    //   text: t.content.substring(0, 50)
    // })) || []

    return NextResponse.json(suggestions)
  } catch (error) {
    console.error('Suggestions error:', error)
    return NextResponse.json([])
  }
}