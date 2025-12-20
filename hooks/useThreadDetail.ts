// hooks/useThreadDetail.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { FeedThread, FeedPage } from './useFeed'
import type { InfiniteData } from '@tanstack/react-query'

export function useThreadDetail(threadId: string, userId?: string) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['thread-detail', threadId, userId || 'guest'],
      
    initialData: () => {
      // ✅ Guest không có cache
      if (!userId || userId === 'guest') return undefined
  
      const feedKeys = [
        ['feed', 'for-you', userId],
        ['feed', 'following', userId]
      ]
  
      for (const key of feedKeys) {
        const feedData = queryClient.getQueryData<InfiniteData<FeedPage>>(key)
        const feedThread = feedData?.pages
          .flatMap(p => p.threads)
          .find(t => t.id === threadId)
    
        if (feedThread) {
          return { thread: feedThread, comments: [] }
        }
      }
      
      const profileKeys = queryClient.getQueryCache()
        .findAll({ queryKey: ['profile-threads'] })
      
      for (const query of profileKeys) {
        const threads = query.state.data as any[]
        const profileThread = threads?.find((t: any) => t.id === threadId)
        if (profileThread) {
          return { thread: profileThread, comments: [] }
        }
      }
      
      return undefined
    },
    
    queryFn: async () => {
      // ✅ FIX: 'guest' không phải UUID, không pass lên API
      const params = (userId && userId !== 'guest') ? `?user_id=${userId}` : ''
      
      const [threadRes, commentsRes] = await Promise.all([
        fetch(`/api/threads/${threadId}${params}`),
        fetch(`/api/threads/${threadId}/comments`)
      ])

      if (!threadRes.ok) throw new Error('Thread not found')
      
      const thread = await threadRes.json()
      const comments = commentsRes.ok ? await commentsRes.json() : []

      return { thread, comments }
    },
    
    enabled: !!threadId,
    staleTime: 0,
  })
}