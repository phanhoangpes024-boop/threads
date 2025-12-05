import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { FeedThread, FeedPage } from './useFeed'
import type { InfiniteData } from '@tanstack/react-query'

export function useThreadDetail(threadId: string, userId?: string) {
  const queryClient = useQueryClient()

  return useQuery({
    // ✅ Key có userId để tự động refetch khi login
    queryKey: ['thread-detail', threadId, userId],
    
    initialData: () => {
      if (!userId) return undefined // Khách không có cache
      
      const feedData = queryClient.getQueryData<InfiniteData<FeedPage>>(['feed', userId])
      const thread = feedData?.pages
        .flatMap(p => p.threads)
        .find(t => t.id === threadId)
      
      if (thread) {
        return { thread, comments: [] }
      }
    },
    
    queryFn: async () => {
      // ✅ userId optional - API vẫn trả về cho khách
      const params = userId ? `?user_id=${userId}` : ''
      
      const [threadRes, commentsRes] = await Promise.all([
        fetch(`/api/threads/${threadId}${params}`),
        fetch(`/api/threads/${threadId}/comments`)
      ])

      if (!threadRes.ok) throw new Error('Thread not found')
      
      const thread = await threadRes.json()
      const comments = commentsRes.ok ? await commentsRes.json() : []

      return { thread, comments }
    },
    
    // ✅ FIX: Chỉ cần threadId, userId optional
    enabled: !!threadId,
    
    staleTime: 0,
  })
}