// hooks/useThreadDetail.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { FeedThread, FeedPage } from './useFeed'
import type { InfiniteData } from '@tanstack/react-query'

export function useThreadDetail(threadId: string, userId?: string) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['thread-detail', threadId],
    
    initialData: () => {
      const feedQueries = queryClient.getQueriesData<InfiniteData<FeedPage>>({ 
        queryKey: ['feed'] 
      })
      
      for (const [_, feedData] of feedQueries) {
        if (!feedData?.pages) continue
        
        const feedThread = feedData.pages
          .flatMap(p => p.threads)
          .find(t => t.id === threadId)
        
        if (feedThread) {
          return feedThread
        }
      }
      
      const profileQueries = queryClient.getQueriesData<FeedThread[]>({ 
        queryKey: ['profile-threads'] 
      })
      
      for (const [_, threads] of profileQueries) {
        if (!Array.isArray(threads)) continue
        
        const profileThread = threads.find(t => t.id === threadId)
        if (profileThread) {
          return profileThread
        }
      }
      
      return undefined
    },
    
    initialDataUpdatedAt: 0,
    
    queryFn: async () => {
      const params = userId ? `?user_id=${userId}` : ''
      const res = await fetch(`/api/threads/${threadId}${params}`)

      if (!res.ok) throw new Error('Thread not found')
      
      return res.json()
    },
    
    enabled: !!threadId,
    staleTime: 30000,
  })
}