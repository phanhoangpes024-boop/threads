// hooks/useFeed.ts - PRODUCTION READY với RPC & Helper Cache
import { useInfiniteQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query'
import { useCurrentUser } from './useCurrentUser'
import { updateThreadInCaches, captureAllCachesSnapshot, restoreCachesSnapshot } from '@/lib/cache-helper'
import { supabase } from '@/lib/supabase'
import { useCallback } from 'react'

// ==================== TYPES ====================

export interface FeedMedia {
  id: string
  url: string
  type: 'image' | 'video'
  width: number | null
  height: number | null
  order: number
}

export interface FeedThread {
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
  medias: FeedMedia[]
}

export interface FeedPage {
  threads: FeedThread[]
  nextCursor: { time: string; id: string } | null
  hasMore: boolean
}

export interface FeedCursor {
  time: string
  id: string
}

// ==================== SCROLL POSITION CACHE ====================

let scrollPositionCache: { pageIndex: number; offset: number } | null = null

export function saveScrollPosition(pageIndex: number, offset: number) {
  scrollPositionCache = { pageIndex, offset }
}

export function getScrollPosition() {
  return scrollPositionCache
}

export function clearScrollPosition() {
  scrollPositionCache = null
}

// ==================== MAIN FEED QUERY ====================

export function useFeed() {
  const { user } = useCurrentUser()
  
  return useInfiniteQuery<FeedPage, Error, InfiniteData<FeedPage>, string[], FeedCursor | undefined>({
    queryKey: ['feed', user.id],
    
    queryFn: async ({ pageParam }): Promise<FeedPage> => {
      const params = new URLSearchParams({
        user_id: user.id,
        limit: '20'
      })
      
      if (pageParam) {
        params.append('cursor_time', pageParam.time)
        params.append('cursor_id', pageParam.id)
      }
      
      const res = await fetch(`/api/feed?${params}`, { 
        cache: 'no-store' 
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to fetch feed' }))
        throw new Error(error.message)
      }
      
      return res.json()
    },
    
    initialPageParam: undefined,
    
    getNextPageParam: (lastPage): FeedCursor | undefined => {
      return lastPage.hasMore && lastPage.nextCursor 
        ? lastPage.nextCursor 
        : undefined
    },
    
    enabled: !!user.id,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}

// ==================== TOGGLE LIKE (Dùng Helper) ====================

export function useToggleLike() {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()
  
  return useMutation({
    mutationFn: async (threadId: string) => {
      const res = await fetch(`/api/threads/${threadId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to toggle like')
      }
      
      const data = await res.json()
      
      if (!data.success) {
        throw new Error(data.error || 'RPC failed')
      }
      
      return { ...data, threadId }
    },
    
    onMutate: async (threadId) => {
      // Cancel queries để tránh conflict
      await queryClient.cancelQueries({ queryKey: ['feed'] })
      await queryClient.cancelQueries({ queryKey: ['profile-threads'] })
      
      // Lưu snapshot để rollback nếu lỗi
      const snapshot = captureAllCachesSnapshot(queryClient)
      
      // Optimistic update - Dùng helper (3 dòng thay vì 50 dòng)
      updateThreadInCaches(queryClient, threadId, (thread) => {
        const newIsLiked = !thread.is_liked
        return {
          ...thread,
          is_liked: newIsLiked,
          likes_count: newIsLiked 
            ? thread.likes_count + 1 
            : Math.max(0, thread.likes_count - 1)
        }
      })
      
      return { snapshot }
    },
    
    onError: (err, threadId, context) => {
      console.error('[LIKE ERROR]', err)
      
      // Rollback về trạng thái cũ
      if (context?.snapshot) {
        restoreCachesSnapshot(queryClient, context.snapshot)
      }
    },
    
    onSuccess: (data, threadId) => {
      const { likes_count, action } = data
      
      // Sync với server response (đảm bảo đúng 100%)
      updateThreadInCaches(queryClient, threadId, (thread) => ({
        ...thread,
        is_liked: action === 'liked',
        likes_count
      }))
    },
    
    retry: false,
  })
}

// ==================== CREATE THREAD với RPC ====================

export function useCreateThread() {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()
  
  return useMutation({
    mutationFn: async ({ 
      content, 
      imageUrls = [] 
    }: { 
      content: string
      imageUrls?: string[] 
    }) => {
      if (!user.id) throw new Error('No user ID')
      
      console.log('[CREATE] Using RPC with', imageUrls.length, 'images')
      
      // Gọi RPC - 1 request duy nhất, atomic transaction
      const { data, error } = await supabase.rpc('create_full_thread', {
        p_user_id: user.id,
        p_content: content.trim(),
        p_media_urls: imageUrls.length > 0 ? imageUrls : null
      })
      
      if (error) {
        console.error('[CREATE] RPC Error:', error)
        throw new Error(error.message || 'Failed to create thread')
      }
      
      if (!data || data.length === 0) {
        throw new Error('RPC returned no data')
      }
      
      const result = data[0]
      console.log('[CREATE] RPC Success:', result)
      
      // Format về FeedThread
      return {
        id: result.thread_id,
        user_id: user.id,
        content: result.thread_content,
        created_at: result.thread_created_at,
        likes_count: 0,
        comments_count: 0,
        reposts_count: 0,
        username: user.username,
        avatar_text: user.avatar_text,
        avatar_bg: user.avatar_bg,
        verified: user.verified || false,
        is_liked: false,
        medias: result.medias || []
      } as FeedThread
    },
    
    onSuccess: (newThread) => {
      console.log('[CREATE] Invalidating caches...')
      
      // Invalidate tất cả feed types
      queryClient.invalidateQueries({ 
        queryKey: ['feed', 'for-you', user.id] 
      })
      
      queryClient.invalidateQueries({ 
        queryKey: ['feed', 'following', user.id] 
      })
      
      // Invalidate profile
      queryClient.invalidateQueries({ 
        queryKey: ['profile-threads', user.id]
      })
    },

    onError: (err) => {
      console.error('[CREATE ERROR]', err)
    }
  })
}

// ==================== REFRESH FEED ====================

export function useRefreshFeed() {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()
  
  return useCallback(() => {
    queryClient.invalidateQueries({ 
      queryKey: ['feed', 'for-you', user.id] 
    })
    queryClient.invalidateQueries({ 
      queryKey: ['feed', 'following', user.id] 
    })
  }, [queryClient, user.id])
}

// ==================== FEED WITH TYPE ====================

export function useFeedWithType(feedType: 'for-you' | 'following') {
  const { user } = useCurrentUser()
  
  return useInfiniteQuery<FeedPage, Error, InfiniteData<FeedPage>, string[], FeedCursor | undefined>({
    queryKey: ['feed', feedType, user.id],
    
    queryFn: async ({ pageParam }): Promise<FeedPage> => {
      const params = new URLSearchParams({
        user_id: user.id,
        limit: '20',
        feed_type: feedType // THÊM param này
      })
      
      if (pageParam) {
        params.append('cursor_time', pageParam.time)
        params.append('cursor_id', pageParam.id)
      }
      
      const res = await fetch(`/api/feed?${params}`, { 
        cache: 'no-store' 
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to fetch feed' }))
        throw new Error(error.message)
      }
      
      return res.json()
    },
    
    initialPageParam: undefined,
    
    getNextPageParam: (lastPage): FeedCursor | undefined => {
      return lastPage.hasMore && lastPage.nextCursor 
        ? lastPage.nextCursor 
        : undefined
    },
    
    enabled: !!user.id,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}