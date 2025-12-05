// hooks/useThreadDetail.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { FeedThread, FeedPage } from './useFeed'
import type { InfiniteData } from '@tanstack/react-query'

export function useThreadDetail(threadId: string, userId?: string) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['thread-detail', threadId],
    queryFn: async () => {
      const [threadRes, commentsRes] = await Promise.all([
        fetch(`/api/threads/${threadId}`),
        fetch(`/api/threads/${threadId}/comments`)
      ])

      if (!threadRes.ok) throw new Error('Thread not found')

      const thread = await threadRes.json()
      const comments = commentsRes.ok ? await commentsRes.json() : []

      return { thread, comments }
    },
    enabled: !!threadId,
    staleTime: 1000 * 60,
    
    // 🔥 PLACEHOLDER DATA - Lấy từ cache Feed
    placeholderData: () => {
      if (!userId) return undefined
      
      const feedData = queryClient.getQueryData<InfiniteData<FeedPage>>(['feed', userId])
      
      if (!feedData?.pages) return undefined
      
      for (const page of feedData.pages) {
        const found = page.threads.find(t => t.id === threadId)
        if (found) {
          return {
            thread: found,
            comments: [] // Comments chưa có, sẽ fetch sau
          }
        }
      }
      
      return undefined
    }
  })
}