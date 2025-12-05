// FILE 1: hooks/useThreadDetail.ts - FIXED TIMING BUG
// ============================================
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { FeedThread, FeedPage } from './useFeed'
import type { InfiniteData } from '@tanstack/react-query'

export function useThreadDetail(threadId: string, userId?: string) {
  const queryClient = useQueryClient()

  return useQuery({
    // ✅ FIX CRITICAL: Thêm userId vào queryKey
    // Khi userId thay đổi (undefined → 'abc123'), query TỰ ĐỘNG refetch
    queryKey: ['thread-detail', threadId, userId],
    
    queryFn: async () => {
      console.log('[useThreadDetail] Running with userId:', userId)
      
      // ✅ BƯỚC 1: Lấy từ Feed cache (userId đã có rồi)
      const feedData = queryClient.getQueryData<InfiniteData<FeedPage>>(['feed', userId || ''])
      let cachedThread: FeedThread | null = null
      
      if (feedData?.pages) {
        for (const page of feedData.pages) {
          const found = page.threads.find(t => t.id === threadId)
          if (found) {
            cachedThread = found
            console.log('[useThreadDetail] ✅ Found in Feed cache:', {
              likes: found.likes_count,
              comments: found.comments_count,
              is_liked: found.is_liked
            })
            break
          }
        }
      } else {
        console.log('[useThreadDetail] ⚠️ Feed cache NOT found for userId:', userId)
      }

      // ✅ BƯỚC 2: Fetch comments
      const commentsRes = await fetch(`/api/threads/${threadId}/comments`)
      const comments = commentsRes.ok ? await commentsRes.json() : []

      // ✅ BƯỚC 3: Ưu tiên Feed cache
      if (cachedThread) {
        return {
          thread: cachedThread,
          comments
        }
      }

      // ✅ BƯỚC 4: Fallback - Fetch từ API
      console.log('[useThreadDetail] ⚠️ No cache, calling API...')
      const params = new URLSearchParams()
      if (userId) params.append('user_id', userId)
      
      const threadRes = await fetch(`/api/threads/${threadId}?${params}`)
      if (!threadRes.ok) throw new Error('Thread not found')
      
      const thread = await threadRes.json()
      
      return { thread, comments }
    },
    
    // ✅ Chỉ chạy khi có cả threadId VÀ userId
    enabled: !!threadId && !!userId,
    
    staleTime: 0,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: 'always',
  })
}