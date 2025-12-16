// lib/cache-helper.ts
import { QueryClient } from '@tanstack/react-query'

/**
 * Update thread trong TẤT CẢ caches (feed, profile, detail)
 * Đảm bảo UI đồng bộ mọi nơi
 */
export function updateThreadInCaches(
  queryClient: QueryClient,
  threadId: string,
  updateFn: (thread: any) => any
) {
  // 1. Update TẤT CẢ feed caches (for-you, following)
  const feedQueries = queryClient.getQueryCache()
    .getAll()
    .filter(q => q.queryKey[0] === 'feed')
  
  feedQueries.forEach(query => {
    queryClient.setQueryData(query.queryKey, (old: any) => {
      if (!old?.pages) return old
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          threads: page.threads.map((t: any) => 
            t.id === threadId ? updateFn(t) : t
          )
        }))
      }
    })
  })

  // 2. Update TẤT CẢ profile caches
  const profileQueries = queryClient.getQueryCache()
    .getAll()
    .filter(q => q.queryKey[0] === 'profile-threads')
  
  profileQueries.forEach(query => {
    queryClient.setQueryData(query.queryKey, (old: any) => {
      if (!Array.isArray(old)) return old
      return old.map((t: any) => 
        t.id === threadId ? updateFn(t) : t
      )
    })
  })

  // 3. Update thread detail cache
  queryClient.setQueryData(['thread-detail', threadId], (old: any) => {
    if (!old?.thread) return old
    return { 
      ...old, 
      thread: updateFn(old.thread) 
    }
  })
}

/**
 * Lấy tất cả query data để rollback khi error
 */
export function captureAllCachesSnapshot(queryClient: QueryClient) {
  return {
    feeds: queryClient.getQueriesData({ queryKey: ['feed'] }),
    profiles: queryClient.getQueriesData({ queryKey: ['profile-threads'] })
  }
}

/**
 * Khôi phục cache khi có lỗi
 */
export function restoreCachesSnapshot(
  queryClient: QueryClient,
  snapshot: ReturnType<typeof captureAllCachesSnapshot>
) {
  snapshot.feeds.forEach(([key, data]) => {
    queryClient.setQueryData(key, data)
  })
  snapshot.profiles.forEach(([key, data]) => {
    queryClient.setQueryData(key, data)
  })
}