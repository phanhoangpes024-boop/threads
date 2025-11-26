import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MOCK_USER } from '@/lib/currentUser'

interface Thread {
  id: string
  username: string | null
  avatar_text: string | null
  verified: boolean
  content: string
  image_url?: string
  likes_count: number
  comments_count: number
  reposts_count: number
  created_at: string
  user_id: string
  isLiked?: boolean
}

// Fetch threads
export function useThreads() {
  return useQuery({
    queryKey: ['threads'],
    queryFn: async () => {
      const res = await fetch('/api/threads', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch threads')
      const data = await res.json()
      return (data.threads || data || []) as Thread[]
    },
  })
}

// Create thread
export function useCreateThread() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ content, imageUrl }: { content: string; imageUrl?: string }) => {
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: MOCK_USER.id,
          content: content.trim(),
          image_url: imageUrl,
        }),
        cache: 'no-store',
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to create thread' }))
        throw new Error(error.message || 'Failed to create thread')
      }
      
      const data = await res.json()
      
      // Validate response
      if (!data || !data.id) {
        throw new Error('Invalid response from server')
      }
      
      return data
    },
    onMutate: async ({ content, imageUrl }) => {
      await queryClient.cancelQueries({ queryKey: ['threads'] })
      
      const previousThreads = queryClient.getQueryData<Thread[]>(['threads'])
      
      const optimisticThread: Thread = {
        id: 'optimistic-' + crypto.randomUUID(),
        user_id: MOCK_USER.id,
        username: MOCK_USER.username,
        avatar_text: MOCK_USER.avatar_text,
        verified: false,
        content: content.trim(),
        image_url: imageUrl,
        likes_count: 0,
        comments_count: 0,
        reposts_count: 0,
        created_at: new Date().toISOString(),
        isLiked: false,
      }
      
      queryClient.setQueryData<Thread[]>(['threads'], old => 
        [optimisticThread, ...(old || [])]
      )
      
      return { previousThreads, optimisticId: optimisticThread.id }
    },
    onSuccess: (newThread, variables, context) => {
      // Replace optimistic với real data
      queryClient.setQueryData<Thread[]>(['threads'], old =>
        (old || []).map(t => 
          t.id === context?.optimisticId 
            ? {
                ...newThread,
                username: MOCK_USER.username,
                avatar_text: MOCK_USER.avatar_text,
                verified: false,
                isLiked: false,
              }
            : t
        )
      )
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['threads'], context?.previousThreads)
    },
  })
}

// Toggle like - FIXED: Sync đầy đủ likes_count từ server
export function useToggleLike() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (threadId: string) => {
      const res = await fetch(`/api/threads/${threadId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: MOCK_USER.id }),
        cache: 'no-store',
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to toggle like' }))
        throw new Error(error.message || 'Failed to toggle like')
      }
      
      const data = await res.json()
      
      // Validate response
      if (!data || typeof data.action !== 'string' || typeof data.likes_count !== 'number') {
        throw new Error('Invalid response from server')
      }
      
      return { 
        threadId, 
        isLiked: data.action === 'liked',
        likes_count: data.likes_count // ← Server trả về count chính xác
      }
    },
    onMutate: async (threadId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['threads'] })
      await queryClient.cancelQueries({ queryKey: ['thread', threadId] })
      
      const previousThreads = queryClient.getQueryData<Thread[]>(['threads'])
      const previousThread = queryClient.getQueryData<Thread>(['thread', threadId])
      
      // Optimistic update for threads list
      queryClient.setQueryData<Thread[]>(['threads'], old =>
        (old || []).map(thread =>
          thread.id === threadId
            ? {
                ...thread,
                likes_count: thread.isLiked 
                  ? thread.likes_count - 1 
                  : thread.likes_count + 1,
                isLiked: !thread.isLiked,
              }
            : thread
        )
      )
      
      // Optimistic update for single thread (detail page)
      if (previousThread) {
        queryClient.setQueryData<Thread>(['thread', threadId], {
          ...previousThread,
          likes_count: previousThread.isLiked 
            ? previousThread.likes_count - 1 
            : previousThread.likes_count + 1,
          isLiked: !previousThread.isLiked,
        })
      }
      
      return { previousThreads, previousThread }
    },
    onSuccess: ({ threadId, isLiked, likes_count }) => {
      // FIXED: Sync cả isLiked VÀ likes_count từ server
      queryClient.setQueryData<Thread[]>(['threads'], old =>
        (old || []).map(thread =>
          thread.id === threadId 
            ? { ...thread, isLiked, likes_count } // ← Sync đầy đủ
            : thread
        )
      )
      
      // Update single thread cache
      queryClient.setQueryData<Thread>(['thread', threadId], old =>
        old ? { ...old, isLiked, likes_count } : old
      )
    },
    onError: (err, threadId, context) => {
      queryClient.setQueryData(['threads'], context?.previousThreads)
      if (context?.previousThread) {
        queryClient.setQueryData(['thread', threadId], context.previousThread)
      }
    },
  })
}

// Fetch single thread
export function useThread(threadId: string) {
  const queryClient = useQueryClient()
  
  return useQuery({
    queryKey: ['thread', threadId],
    queryFn: async () => {
      const res = await fetch(`/api/threads/${threadId}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Thread not found')
      const data = await res.json()
      
      // Validate response
      if (!data || !data.id) {
        throw new Error('Invalid thread data')
      }
      
      return data as Thread
    },
    enabled: !!threadId,
    // Initialize from threads cache if available
    initialData: () => {
      const threads = queryClient.getQueryData<Thread[]>(['threads'])
      return threads?.find(t => t.id === threadId)
    },
    initialDataUpdatedAt: () => {
      return queryClient.getQueryState(['threads'])?.dataUpdatedAt
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

// Create comment - FIXED: Validate response và sync đầy đủ
export function useCreateComment(threadId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/threads/${threadId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: MOCK_USER.id,
          content: content.trim(),
        }),
        cache: 'no-store',
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to create comment' }))
        throw new Error(error.message || 'Failed to create comment')
      }
      
      const data = await res.json()
      
      // Validate response
      if (!data || !data.id) {
        throw new Error('Invalid response from server')
      }
      
      return data
    },
    onSuccess: (newComment) => {
      // Invalidate comments để fetch lại
      queryClient.invalidateQueries({ queryKey: ['comments', threadId] })
      
      // Update threads list comment count
      queryClient.setQueryData<Thread[]>(['threads'], old =>
        (old || []).map(t =>
          t.id === threadId ? { ...t, comments_count: t.comments_count + 1 } : t
        )
      )
      
      // Update single thread comment count
      queryClient.setQueryData<Thread>(['thread', threadId], old =>
        old ? { ...old, comments_count: old.comments_count + 1 } : old
      )
    },
  })
}