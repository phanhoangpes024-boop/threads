// hooks/useFeed.ts - FIXED COMPLETE VERSION
import { useInfiniteQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query'
import { useCurrentUser } from './useCurrentUser'

// Types
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

// Fetch feed với infinite scroll
export function useFeed() {
  const { user } = useCurrentUser()
  
  return useInfiniteQuery<FeedPage, Error, InfiniteData<FeedPage>, string[], FeedCursor | undefined>({
    queryKey: ['feed', user.id],
    
    queryFn: async ({ pageParam }): Promise<FeedPage> => {
      const params = new URLSearchParams({
        user_id: user.id,
        limit: '20'
      })
      
      // Composite cursor
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
    
    // Composite cursor cho next page
    getNextPageParam: (lastPage): FeedCursor | undefined => {
      return lastPage.hasMore && lastPage.nextCursor 
        ? lastPage.nextCursor 
        : undefined
    },
    
    enabled: !!user.id,
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
}

// Toggle like với optimistic update
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
      
      if (!res.ok) throw new Error('Failed to toggle like')
      return res.json()
    },
    
    // Optimistic update
    onMutate: async (threadId) => {
      await queryClient.cancelQueries({ queryKey: ['feed', user.id] })
      
      const previousData = queryClient.getQueryData<InfiniteData<FeedPage>>(['feed', user.id])
      
      // Update UI ngay lập tức
      queryClient.setQueryData<InfiniteData<FeedPage>>(['feed', user.id], (old) => {
        if (!old) return old
        
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            threads: page.threads.map(thread => {
              if (thread.id === threadId) {
                const isLiked = !thread.is_liked
                return {
                  ...thread,
                  is_liked: isLiked,
                  likes_count: isLiked 
                    ? thread.likes_count + 1 
                    : Math.max(0, thread.likes_count - 1)
                }
              }
              return thread
            })
          }))
        }
      })
      
      return { previousData }
    },
    
    // Rollback on error
    onError: (err, threadId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['feed', user.id], context.previousData)
      }
    },
    
    // Sync với server response
    onSuccess: (data, threadId) => {
      queryClient.setQueryData<InfiniteData<FeedPage>>(['feed', user.id], (old) => {
        if (!old) return old
        
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            threads: page.threads.map(thread => {
              if (thread.id === threadId) {
                return {
                  ...thread,
                  is_liked: data.action === 'liked',
                  likes_count: data.likes_count
                }
              }
              return thread
            })
          }))
        }
      })
    }
  })
}

// Refresh feed (pull-to-refresh)
export function useRefreshFeed() {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()
  
  return () => {
    return queryClient.invalidateQueries({ 
      queryKey: ['feed', user.id] 
    })
  }
}