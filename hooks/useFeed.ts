// hooks/useFeed.ts - COMPLETE REWRITE FOR RPC
import { useInfiniteQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query'
import { useCurrentUser } from './useCurrentUser'

// ============================================
// TYPES
// ============================================

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
  verified: boolean
  is_liked: boolean
  medias: FeedMedia[]
}

export interface FeedPage {
  threads: FeedThread[]
  nextCursor: { time: string; id: string } | null
  hasMore: boolean
}

interface FeedCursor {
  time: string
  id: string
}

// ============================================
// HOOKS
// ============================================

/**
 * Fetch infinite feed with pagination
 */
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
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}

/**
 * Toggle like with RPC - No race condition!
 */
export function useToggleLike() {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()
  
  return useMutation({
    // ✅ Call RPC function
    mutationFn: async (threadId: string) => {
      console.log('[LIKE] Calling RPC:', threadId)
      
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
      
      // Validate RPC response
      if (!data.success) {
        throw new Error(data.error || 'RPC failed')
      }
      
      console.log('[LIKE] RPC response:', data)
      
      return { ...data, threadId }
    },
    
    // ✅ Optimistic update for smooth UX
    onMutate: async (threadId) => {
      console.log('[LIKE] Optimistic update:', threadId)
      
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['feed', user.id] })
      await queryClient.cancelQueries({ queryKey: ['thread', threadId] })
      
      // Snapshot previous state
      const previousFeed = queryClient.getQueryData<InfiniteData<FeedPage>>(['feed', user.id])
      const previousThread = queryClient.getQueryData<FeedThread>(['thread', threadId])
      
      // Helper: Calculate optimistic state
      const calculateOptimistic = (thread: FeedThread): FeedThread => {
        const isLiked = !thread.is_liked
        return {
          ...thread,
          is_liked: isLiked,
          likes_count: isLiked 
            ? thread.likes_count + 1 
            : Math.max(0, thread.likes_count - 1)
        }
      }
      
      // Update feed cache
      queryClient.setQueryData<InfiniteData<FeedPage>>(['feed', user.id], (old) => {
        if (!old) return old
        
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            threads: page.threads.map(t => 
              t.id === threadId ? calculateOptimistic(t) : t
            )
          }))
        }
      })
      
      // Update thread detail cache
      if (previousThread) {
        queryClient.setQueryData(['thread', threadId], calculateOptimistic(previousThread))
      }
      
      return { previousFeed, previousThread }
    },
    
    // ✅ Sync with server truth
    onSuccess: (data) => {
      const { threadId, action, likes_count } = data
      
      console.log('[LIKE] Server confirmed:', { threadId, action, likes_count })
      
      // Update with server count (100% accurate from RPC)
      const updateThread = (thread: FeedThread): FeedThread => ({
        ...thread,
        is_liked: action === 'liked',
        likes_count: likes_count // Trust database
      })
      
      // Update feed
      queryClient.setQueryData<InfiniteData<FeedPage>>(['feed', user.id], (old) => {
        if (!old) return old
        
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            threads: page.threads.map(t => 
              t.id === threadId ? updateThread(t) : t
            )
          }))
        }
      })
      
      // Update thread detail
      queryClient.setQueryData<FeedThread>(['thread', threadId], (old) => {
        if (!old) return old
        return updateThread(old)
      })
    },
    
    // ✅ Rollback on error
    onError: (err, threadId, context) => {
      console.error('[LIKE ERROR]', err)
      
      if (context?.previousFeed) {
        queryClient.setQueryData(['feed', user.id], context.previousFeed)
      }
      if (context?.previousThread) {
        queryClient.setQueryData(['thread', threadId], context.previousThread)
      }
    },
    
    // Configuration
    retry: false, // RPC either works or doesn't
  })
}

/**
 * Refresh feed manually
 */
export function useRefreshFeed() {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()
  
  return () => {
    return queryClient.invalidateQueries({ 
      queryKey: ['feed', user.id] 
    })
  }
}