// lib/data.ts
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

/**
 * Lấy thông tin profile của 1 user (qua username)
 * Bọc cache để dùng chung cho metadata SEO và Page UI
 */
export const getProfileByUsername = cache(async (username: string): Promise<ProfileData | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, avatar_text, verified, bio, followers_count, following_count, threads_count, created_at')
    .eq('username', username)
    .single()

  if (error) {
    // Chỉ log lỗi thật (không log "không tìm thấy user")
    if (error.code !== 'PGRST116') {
      console.error('[getProfileByUsername] Error:', error)
    }
    return null
  }

  return data
})

/**
 * Lấy danh sách threads của 1 user (dùng RPC)
 */
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

/**
 * Kiểm tra xem viewer có đang follow target user không
 */
export const checkIsFollowing = cache(async (
  viewerId: string,
  targetUserId: string
): Promise<boolean> => {
  // Tự xem profile mình thì không cần check
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

/**
 * CORE FUNCTION: Fetch song song tất cả data cho Profile page
 */
export async function getProfileData(username: string, viewerId?: string | null) {
  // 1. Lấy profile info trước
  const profile = await getProfileByUsername(username)
  
  if (!profile) {
    return null
  }

  // 2. Fetch song song: threads + follow status
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