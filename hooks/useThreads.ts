// hooks/useThreads.ts - UPDATED với thread_medias
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from './useCurrentUser'
import type { FeedThread, FeedMedia } from './useFeed'

// Create thread với medias
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
      
      if (!threadRes.ok) throw new Error('Failed to create thread')
      const thread = await threadRes.json()
      
      console.log('[CREATE] Thread created:', thread.id)
      
      // 2. Nếu có ảnh, tạo medias TUẦN TỰ
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
            
            if (!mediaRes.ok) {
              console.error('[CREATE] Failed to create media', index, await mediaRes.text())
            } else {
              console.log('[CREATE] Media', index, 'created OK')
            }
          } catch (err) {
            console.error('[CREATE] Error creating media', index, err)
          }
        }
      }
      
      return thread
    },
    
    // Optimistic update
    onMutate: async (variables) => {
      const { content, imageUrls = [] } = variables
      
      await queryClient.cancelQueries({ queryKey: ['feed', user.id] })
      
      const previousData = queryClient.getQueryData(['feed', user.id])
      
      // Tạo optimistic thread
      const optimisticThread: FeedThread = {
        id: 'optimistic-' + crypto.randomUUID(),
        user_id: user.id,
        username: user.username,
        avatar_text: user.avatar_text,
        verified: user.verified || false,
        content: content.trim(),
        medias: imageUrls.map((url, index) => ({
          id: 'opt-' + index,
          url,
          type: 'image',
          width: null,
          height: null,
          order: index
        })),
        likes_count: 0,
        comments_count: 0,
        reposts_count: 0,
        created_at: new Date().toISOString(),
        is_liked: false,
      }
      
      // Insert vào đầu feed
      queryClient.setQueryData<{
        pages: { threads: FeedThread[] }[]
        pageParams: unknown[]
      }>(['feed', user.id], (old) => {
        if (!old) return old
        
        const newPages = [...old.pages]
        if (newPages[0]) {
          newPages[0] = {
            ...newPages[0],
            threads: [optimisticThread, ...newPages[0].threads]
          }
        }
        
        return { ...old, pages: newPages }
      })
      
      return { previousData, optimisticId: optimisticThread.id }
    },
    
    // Success: Replace optimistic với real data
    onSuccess: (newThread, variables, context) => {
      queryClient.setQueryData<{
        pages: { threads: FeedThread[] }[]
        pageParams: unknown[]
      }>(['feed', user.id], (old) => {
        if (!old) return old
        
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            threads: page.threads.map(t => 
              t.id === context?.optimisticId 
                ? {
                    ...newThread,
                    username: user.username,
                    avatar_text: user.avatar_text,
                    verified: user.verified || false,
                    medias: [], // Sẽ được fetch lại
                    is_liked: false
                  }
                : t
            )
          }))
        }
      })
      
      // Refetch để lấy medias đầy đủ
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['feed', user.id] })
      }, 500)
    },
    
    // Error: Rollback
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['feed', user.id], context.previousData)
      }
    }
  })
}

// Export lại các hooks cũ từ useFeed
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
      const feedData = queryClient.getQueryData<any>(['feed', user.id])
      if (feedData?.pages) {
        for (const page of feedData.pages) {
          const thread = page.threads?.find((t: any) => t.id === threadId)
          if (thread) return thread
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

// Create comment
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
      
      // Update feed threads count
      queryClient.setQueryData<any>(['feed', user.id], (old: any) => {
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
      
      // Update single thread
      queryClient.setQueryData<FeedThread>(['thread', threadId], (old: any) =>
        old ? { ...old, comments_count: old.comments_count + 1 } : old
      )
    },
  })
}