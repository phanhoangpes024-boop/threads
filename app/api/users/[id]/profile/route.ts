// app/api/users/[id]/profile/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const userId = params.id
  const { name, avatar_text, bio } = await request.json()

  // Validate
  if (!avatar_text || avatar_text.trim().length === 0) {
    return NextResponse.json({ error: 'Avatar text is required' }, { status: 400 })
  }

  if (avatar_text.length > 2) {
    return NextResponse.json({ error: 'Avatar text must be 1-2 characters' }, { status: 400 })
  }

  if (bio && bio.length > 150) {
    return NextResponse.json({ error: 'Bio must be 150 characters or less' }, { status: 400 })
  }

  try {
    const updateData: any = {
      avatar_text: avatar_text.toUpperCase().trim(),
      bio: bio?.trim() || null,
    }

    // ✅ FIX: Dùng maybeSingle() thay vì single()
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .maybeSingle() // ← ĐÂY LÀ ĐIỂM QUAN TRỌNG

    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ✅ Check null (không tìm thấy user)
    if (!data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, user: data })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}