// lib/data.ts - GIỮ NGUYÊN (KHÔNG CẦN RETRY)
import { supabase } from '@/lib/supabase'
import { cache } from 'react'

// ============================================
// TYPES
// ============================================

export interface ProfileData {
  id: string
  username: string
  email: string
  avatar_text: string
  avatar_bg: string
  verified: boolean
  bio: string | null
  followers_count: number
  following_count: number
  threads_count: number
  created_at: string
}

export interface ProfileThread {
  id: string
  user_id: string
  content: string
  created_at: string
  likes_count: number
  comments_count: number
  reposts_count: number
  username: string
  avatar_text: string
  avatar_bg: string
  verified: boolean
  is_liked: boolean
  medias: Array<{
    id: string
    url: string
    type: 'image' | 'video'
    width: number | null
    height: number | null
    order: number
  }>
}

// ============================================
// FUNCTIONS (Server-side Cached)
// ============================================

export const getProfileByUsername = cache(async (username: string): Promise<ProfileData | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, avatar_text, avatar_bg, verified, bio, followers_count, following_count, threads_count, created_at')
    .eq('username', username)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[getProfileByUsername] Error:', error)
    }
    return null
  }

  return data
})

export const getProfileThreads = cache(async (
  targetUserId: string,
  viewerId?: string | null,
  limit: number = 20,
  offset: number = 0
): Promise<ProfileThread[]> => {
  const { data, error } = await supabase.rpc('get_profile_threads', {
    p_target_user_id: targetUserId,
    p_viewer_id: viewerId ?? null,
    p_limit: limit,
    p_offset: offset
  })

  if (error) {
    console.error('[getProfileThreads] Error:', error)
    return []
  }

  return data || []
})

export const checkIsFollowing = cache(async (
  viewerId: string,
  targetUserId: string
): Promise<boolean> => {
  if (viewerId === targetUserId) return false

  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', viewerId)
    .eq('following_id', targetUserId)
    .maybeSingle()

  if (error) {
    console.error('[checkIsFollowing] Error:', error)
    return false
  }

  return !!data
})

export async function getProfileData(username: string, viewerId?: string | null) {
  const profile = await getProfileByUsername(username)
  
  if (!profile) {
    return null
  }

  const [threads, isFollowing] = await Promise.all([
    getProfileThreads(profile.id, viewerId),
    viewerId ? checkIsFollowing(viewerId, profile.id) : Promise.resolve(false)
  ])

  return {
    profile,
    threads,
    isFollowing
  }
}