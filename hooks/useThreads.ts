// hooks/useThreads.ts - FINAL FIXED VERSION WITH FEED TYPE
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from './useCurrentUser'
import type { FeedThread, FeedMedia } from './useFeed'

// ✅ Create thread với medias - TUẦN TỰ
export function useCreateThread() {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()
  
  return useMutation({
    mutationFn: async ({ 
      content, 
      imageUrls = [] 
    }: { 
      content: string
      imageUrls?: string[] 
    }) => {
      if (!user.id) throw new Error('No user ID')
      
      console.log('[CREATE] Starting with', imageUrls.length, 'images')
      
      // 1. Tạo thread trước
      const threadRes = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          content: content.trim(),
        }),
      })
      
      if (!threadRes.ok) {
        const error = await threadRes.json()
        throw new Error(error.error || 'Failed to create thread')
      }
      
      const thread = await threadRes.json()
      console.log('[CREATE] Thread created:', thread.id)
      
      // 2. Tạo medias TUẦN TỰ (sequential)
      const createdMedias: FeedMedia[] = []
      
      if (imageUrls.length > 0) {
        console.log('[CREATE] Creating', imageUrls.length, 'medias...')
        
        for (let index = 0; index < imageUrls.length; index++) {
          const url = imageUrls[index]
          
          try {
            const mediaRes = await fetch('/api/thread-medias', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                thread_id: thread.id,
                url,
                media_type: 'image',
                width: null,
                height: null,
                order_index: index
              })
            })
            
            if (mediaRes.ok) {
              const media = await mediaRes.json()
              
              createdMedias.push({
                id: media.id,
                url: media.url,
                type: 'image',
                width: media.width,
                height: media.height,
                order: media.order_index
              })
              
              console.log('[CREATE] Media', index, 'created OK')
            } else {
              console.error('[CREATE] Failed to create media', index)
            }
          } catch (err) {
            console.error('[CREATE] Error creating media', index, err)
          }
        }
      }
      
      // 3. Return thread với medias đã tạo
      return {
        ...thread,
        medias: createdMedias
      }
    },
    
    onSuccess: (newThread) => {
  console.log('[CREATE] Success, invalidating feed...')
  
  queryClient.invalidateQueries({ 
    queryKey: ['feed', 'for-you', user.id] 
  })
  
  queryClient.invalidateQueries({ 
    queryKey: ['feed', 'following', user.id] 
  })
  
  queryClient.invalidateQueries({ 
    queryKey: ['profile-threads', user.id]
  })
},

onError: (err) => {
  console.error('[CREATE ERROR]', err)
}
  })
}

// Export lại các hooks cũ
export { useFeed, useToggleLike, useRefreshFeed } from './useFeed'

// Fetch single thread
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
      // ✅ TÌM TRONG CẢ 2 FEED TYPES
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

// Fetch comments
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

// ✅ Create comment - FIXED
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
      queryClient.invalidateQueries({ queryKey: ['comments', threadId] })
      
      // ✅ UPDATE CẢ 2 FEED TYPES
      const feedKeys = [
        ['feed', 'for-you', user.id],
        ['feed', 'following', user.id]
      ]
      
      feedKeys.forEach(key => {
        queryClient.setQueryData<any>(key, (old: any) => {
          if (!old?.pages) return old
          
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              threads: page.threads.map((t: any) =>
                t.id === threadId ? { ...t, comments_count: t.comments_count + 1 } : t
              )
            }))
          }
        })
      })
      
      // Update thread detail cache
      queryClient.setQueryData<FeedThread>(['thread', threadId], (old: any) =>
        old ? { ...old, comments_count: old.comments_count + 1 } : old
      )
    },
  })
}