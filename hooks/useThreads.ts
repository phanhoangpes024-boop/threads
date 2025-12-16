// hooks/useThreads.ts - Dùng Helper Cache
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from './useCurrentUser'
import { updateThreadInCaches } from '@/lib/cache-helper'
import type { FeedThread } from './useFeed'

// Export hooks từ useFeed
export { useFeed, useToggleLike, useRefreshFeed, useCreateThread } from './useFeed'

// ==================== SINGLE THREAD ====================

export function useThread(threadId: string) {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()
  
  return useQuery({
    queryKey: ['thread', threadId],
    
    queryFn: async () => {
      const res = await fetch(`/api/threads/${threadId}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Thread not found')
      const data = await res.json()
      
      if (!data || !data.id) {
        throw new Error('Invalid thread data')
      }
      
      return data as FeedThread
    },
    
    enabled: !!threadId,
    
    initialData: () => {
      // Tìm trong tất cả feed caches
      const feedKeys = [
        ['feed', 'for-you', user.id],
        ['feed', 'following', user.id]
      ]
      
      for (const key of feedKeys) {
        const feedData = queryClient.getQueryData<any>(key)
        if (feedData?.pages) {
          for (const page of feedData.pages) {
            const thread = page.threads?.find((t: any) => t.id === threadId)
            if (thread) return thread
          }
        }
      }
      return undefined
    }
  })
}

// ==================== COMMENTS ====================

export function useComments(threadId: string) {
  return useQuery({
    queryKey: ['comments', threadId],
    
    queryFn: async () => {
      const res = await fetch(`/api/threads/${threadId}/comments`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch comments')
      const data = await res.json()
      return Array.isArray(data) ? data : []
    },
    
    enabled: !!threadId,
  })
}

// ==================== CREATE COMMENT (Dùng Helper) ====================

export function useCreateComment(threadId: string) {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()
  
  return useMutation({
    mutationFn: async (content: string) => {
      if (!user.id) throw new Error('No user ID')
      
      const res = await fetch(`/api/threads/${threadId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          content: content.trim(),
        }),
        cache: 'no-store',
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to create comment' }))
        throw new Error(error.message || 'Failed to create comment')
      }
      
      const data = await res.json()
      if (!data || !data.id) throw new Error('Invalid response')
      
      return data
    },
    
    onSuccess: () => {
      // Invalidate comments list
      queryClient.invalidateQueries({ queryKey: ['comments', threadId] })
      
      // Update comments_count - Dùng helper (3 dòng thay vì 30 dòng)
      updateThreadInCaches(queryClient, threadId, (thread) => ({
        ...thread,
        comments_count: thread.comments_count + 1
      }))
    },
  })
}