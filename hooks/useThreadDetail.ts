// hooks/useThreadDetail.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { FeedThread, FeedPage } from './useFeed'
import type { InfiniteData } from '@tanstack/react-query'

export function useThreadDetail(threadId: string, userId?: string) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['thread-detail', threadId],
      
    initialData: () => {
  
      // ✅ TÌM TẤT CẢ feed queries (for-you, following)
      const feedQueries = queryClient.getQueriesData<InfiniteData<FeedPage>>({ 
        queryKey: ['feed'] 
      })
      
      for (const [_, feedData] of feedQueries) {
        if (!feedData?.pages) continue
        
        const feedThread = feedData.pages
          .flatMap(p => p.threads)
          .find(t => t.id === threadId)
        
        if (feedThread) {
          return { thread: feedThread, comments: [] }
        }
      }
      
      // ✅ TÌM trong profile cache
      const profileQueries = queryClient.getQueriesData<FeedThread[]>({ 
        queryKey: ['profile-threads'] 
      })
      
      for (const [_, threads] of profileQueries) {
        if (!Array.isArray(threads)) continue
        
        const profileThread = threads.find(t => t.id === threadId)
        if (profileThread) {
          return { thread: profileThread, comments: [] }
        }
      }
      
      return undefined
    },
    
    queryFn: async () => {
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
    staleTime: 30000,
  })
}