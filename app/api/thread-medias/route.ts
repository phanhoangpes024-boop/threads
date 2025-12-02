// app/api/thread-medias/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { thread_id, url, media_type, width, height, order_index } = await request.json()
    
    if (!thread_id || !url) {
      return NextResponse.json(
        { error: 'thread_id and url are required' }, 
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase
      .from('thread_medias')
      .insert({
        thread_id,
        url,
        media_type: media_type || 'image',
        width,
        height,
        order_index: order_index || 0
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating media:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}