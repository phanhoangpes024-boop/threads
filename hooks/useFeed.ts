// hooks/useFeed.ts
import { useInfiniteQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query'
import { useCurrentUser } from './useCurrentUser'
import { useCallback } from 'react'

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
      // 1. Cancel các query liên quan để tránh xung đột dữ liệu
      await queryClient.cancelQueries({ queryKey: ['feed', user.id] })
      await queryClient.cancelQueries({ queryKey: ['profile-threads'] })
      
      // Snapshot dữ liệu cũ để rollback nếu lỗi
      const previousFeed = queryClient.getQueryData<InfiniteData<FeedPage>>(['feed', user.id])
      
      // Hàm update logic chung cho 1 thread
      const updateThreadLikeStatus = (thread: FeedThread | any) => {
        if (thread.id !== threadId) return thread
        
        const newIsLiked = !thread.is_liked
        return {
          ...thread,
          is_liked: newIsLiked,
          likes_count: newIsLiked 
            ? thread.likes_count + 1 
            : Math.max(0, thread.likes_count - 1)
        }
      }
      
      // 2. Update Optimistic cho FEED (Trang chủ)
      queryClient.setQueryData<InfiniteData<FeedPage>>(['feed', user.id], (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            threads: page.threads.map(updateThreadLikeStatus)
          }))
        }
      })

      // 3. ✅ Update Optimistic cho PROFILE (Trang cá nhân)
      // ✅ FIX: Dùng exact: false để match cả query có params
      queryClient.getQueryCache().findAll({ 
        queryKey: ['profile-threads'],
        exact: false 
      }).forEach(query => {
        queryClient.setQueryData(query.queryKey, (old: any) => {
            if (!old || !Array.isArray(old)) return old
            return old.map(updateThreadLikeStatus)
        })
      })
      
      return { previousFeed }
    },
    
    onSuccess: (data) => {
      const { threadId, action, likes_count } = data
      const isLiked = action === 'liked'
      
      // 1️⃣ Update FEED Cache (Sync data thật từ server)
      queryClient.setQueryData<InfiniteData<FeedPage>>(['feed', user.id], (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            threads: page.threads.map(t => 
              t.id === threadId 
                ? { ...t, is_liked: isLiked, likes_count } 
                : t
            )
          }))
        }
      })
      
      // 2️⃣ Update DETAIL Cache
      const detailKeys = queryClient.getQueryCache()
        .findAll({ queryKey: ['thread-detail', threadId] })
      
      detailKeys.forEach(query => {
        queryClient.setQueryData(query.queryKey, (old: any) => {
          if (!old) return old
          return {
            ...old,
            thread: {
              ...old.thread,
              is_liked: isLiked,
              likes_count: likes_count
            }
          }
        })
      })
      
      // 3️⃣ ✅ Update PROFILE Cache (Sync data thật từ server)
      // ✅ FIX: Dùng exact: false để match cả query có params
      const profileKeys = queryClient.getQueryCache()
        .findAll({ 
          queryKey: ['profile-threads'],
          exact: false 
        })
      
      profileKeys.forEach(query => {
        queryClient.setQueryData(query.queryKey, (old: any) => {
          if (!old || !Array.isArray(old)) return old
          
          return old.map((t: any) => 
            t.id === threadId 
              ? { ...t, is_liked: isLiked, likes_count } 
              : t
          )
        })
      })
    },
    
    onError: (err, threadId, context) => {
      console.error('[LIKE ERROR]', err)
      
      // Rollback Feed nếu lỗi
      if (context?.previousFeed) {
        queryClient.setQueryData(['feed', user.id], context.previousFeed)
      }
      // Invalidate để fetch lại dữ liệu đúng nhất
      queryClient.invalidateQueries({ 
        queryKey: ['profile-threads'],
        exact: false 
      })
    },
    
    retry: false,
  })
}

export function useRefreshFeed() {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()
  
  return useCallback(() => {
    return queryClient.invalidateQueries({ 
      queryKey: ['feed', user.id] 
    })
  }, [queryClient, user.id])
}