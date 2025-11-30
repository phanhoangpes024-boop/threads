// hooks/useThreads.ts - FULL FILE (thay thế toàn bộ)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface Thread {
  id: string
  username: string | null
  avatar_text: string | null
  verified: boolean
  content: string
  image_urls: string[]  // ← Array
  likes_count: number
  comments_count: number
  reposts_count: number
  created_at: string
  user_id: string
  isLiked?: boolean
}

// Fetch threads
export function useThreads() {
  const { user } = useCurrentUser()
  
  return useQuery({
    queryKey: ['threads', user.id],
    queryFn: async () => {
      if (!user.id || user.id === '') {
        return []
      }
      
      const url = `/api/threads?user_id=${user.id}`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch threads')
      
      const data = await res.json()
      const threads = (data.threads || data || []) as Thread[]
      return threads
    },
    enabled: !!user.id && user.id !== '',
  })
}

// Create thread
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
      
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          content: content.trim(),
          image_urls: imageUrls,
        }),
        cache: 'no-store',
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to create thread' }))
        throw new Error(error.message || 'Failed to create thread')
      }
      
      const data = await res.json()
      if (!data || !data.id) throw new Error('Invalid response')
      
      return data
    },
    
    onMutate: async (variables) => {
      const { content, imageUrls = [] } = variables  // ← FIX: Destructure đúng
      
      await queryClient.cancelQueries({ queryKey: ['threads', user.id] })
      const previousThreads = queryClient.getQueryData<Thread[]>(['threads', user.id])
      
      const optimisticThread: Thread = {
        id: 'optimistic-' + crypto.randomUUID(),
        user_id: user.id,
        username: user.username,
        avatar_text: user.avatar_text,
        verified: user.verified || false,
        content: content.trim(),
        image_urls: imageUrls,  // ← Đã có trong scope
        likes_count: 0,
        comments_count: 0,
        reposts_count: 0,
        created_at: new Date().toISOString(),
        isLiked: false,
      }
      
      queryClient.setQueryData<Thread[]>(['threads', user.id], old => 
        [optimisticThread, ...(old || [])]
      )
      
      return { previousThreads, optimisticId: optimisticThread.id }
    },
    
    onSuccess: (newThread, variables, context) => {
      queryClient.setQueryData<Thread[]>(['threads', user.id], old =>
        (old || []).map(t => 
          t.id === context?.optimisticId 
            ? {
                ...newThread,
                username: user.username,
                avatar_text: user.avatar_text,
                verified: user.verified || false,
                isLiked: false,
              }
            : t
        )
      )
    },
    
    onError: (err, variables, context) => {
      queryClient.setQueryData(['threads', user.id], context?.previousThreads)
    },
  })
}

// Toggle like
export function useToggleLike() {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()
  
  return useMutation({
    mutationFn: async (threadId: string) => {
      if (!user.id) throw new Error('No user ID')
      
      const res = await fetch(`/api/threads/${threadId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
        cache: 'no-store',
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to toggle like' }))
        throw new Error(error.message || 'Failed to toggle like')
      }
      
      const data = await res.json()
      if (!data || typeof data.action !== 'string') {
        throw new Error('Invalid response from server')
      }
      
      return { 
        threadId, 
        isLiked: data.action === 'liked',
        likes_count: data.likes_count
      }
    },
    
    onMutate: async (threadId) => {
      await queryClient.cancelQueries({ queryKey: ['threads', user.id] })
      await queryClient.cancelQueries({ queryKey: ['thread', threadId] })
      
      const previousThreads = queryClient.getQueryData<Thread[]>(['threads', user.id])
      const previousThread = queryClient.getQueryData<Thread>(['thread', threadId])
      
      queryClient.setQueryData<Thread[]>(['threads', user.id], old =>
        (old || []).map(thread => {
          if (thread.id === threadId) {
            const currentLiked = thread.isLiked ?? false
            return {
              ...thread,
              likes_count: currentLiked 
                ? Math.max(0, thread.likes_count - 1)
                : thread.likes_count + 1,
              isLiked: !currentLiked,
            }
          }
          return thread
        })
      )
      
      if (previousThread) {
        const currentLiked = previousThread.isLiked ?? false
        queryClient.setQueryData<Thread>(['thread', threadId], {
          ...previousThread,
          likes_count: currentLiked 
            ? Math.max(0, previousThread.likes_count - 1)
            : previousThread.likes_count + 1,
          isLiked: !currentLiked,
        })
      }
      
      return { previousThreads, previousThread }
    },
    
    onSuccess: ({ threadId, isLiked, likes_count }) => {
      queryClient.setQueryData<Thread[]>(['threads', user.id], old =>
        (old || []).map(thread =>
          thread.id === threadId 
            ? { ...thread, isLiked, likes_count }
            : thread
        )
      )
      
      queryClient.setQueryData<Thread>(['thread', threadId], old =>
        old ? { ...old, isLiked, likes_count } : old
      )
    },
    
    onError: (err, threadId, context) => {
      queryClient.setQueryData(['threads', user.id], context?.previousThreads)
      if (context?.previousThread) {
        queryClient.setQueryData(['thread', threadId], context.previousThread)
      }
    },
  })
}

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
      
      return data as Thread
    },
    enabled: !!threadId,
    initialData: () => {
      const threads = queryClient.getQueryData<Thread[]>(['threads', user.id])
      return threads?.find(t => t.id === threadId)
    },
    initialDataUpdatedAt: () => {
      return queryClient.getQueryState(['threads', user.id])?.dataUpdatedAt
    },
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
      
      queryClient.setQueryData<Thread[]>(['threads', user.id], old =>
        (old || []).map(t =>
          t.id === threadId ? { ...t, comments_count: t.comments_count + 1 } : t
        )
      )
      
      queryClient.setQueryData<Thread>(['thread', threadId], old =>
        old ? { ...old, comments_count: old.comments_count + 1 } : old
      )
    },
  })
}