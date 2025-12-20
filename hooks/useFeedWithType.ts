// hooks/useFeedWithType.ts
import { useInfiniteQuery } from '@tanstack/react-query'
import { useCurrentUser } from './useCurrentUser'
import type { FeedPage, FeedCursor } from './useFeed'

export type FeedType = 'for-you' | 'following'

export function useFeedWithType(feedType: FeedType) {
  const { user } = useCurrentUser()
  
  const endpoint = feedType === 'following' ? '/api/feed/following' : '/api/feed'
  
  return useInfiniteQuery<FeedPage, Error, any, string[], FeedCursor | undefined>({
    queryKey: ['feed', feedType, user?.id || 'guest'],
    
    queryFn: async ({ pageParam }): Promise<FeedPage> => {
      const params = new URLSearchParams({
        limit: '20'
      })
      
      // ✅ Chỉ thêm user_id khi có user
      if (user?.id) {
        params.append('user_id', user.id)
      }
      
      if (pageParam) {
        params.append('cursor_time', pageParam.time)
        params.append('cursor_id', pageParam.id)
      }
      
      const res = await fetch(`${endpoint}?${params}`, { 
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
    
    // ✅ Guest có thể xem feed
    enabled: true,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}