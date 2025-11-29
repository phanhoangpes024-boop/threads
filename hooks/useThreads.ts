// hooks/useThreads.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/hooks/useCurrentUser'

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
  const { user } = useCurrentUser()
  
  return useQuery({
    queryKey: ['threads'],
    queryFn: async () => {
      const url = user.id ? `/api/threads?user_id=${user.id}` : '/api/threads'
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch threads')
      const data = await res.json()
      return (data.threads || data || []) as Thread[]
    },
  })
}

// Create thread
export function useCreateThread() {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()
  
  return useMutation({
    mutationFn: async ({ content, imageUrl }: { content: string; imageUrl?: string }) => {
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
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
        user_id: user.id,
        username: user.username,
        avatar_text: user.avatar_text,
        verified: user.verified || false,
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
      queryClient.setQueryData<Thread[]>(['threads'], old =>
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
      queryClient.setQueryData(['threads'], context?.previousThreads)
    },
  })
}

// Toggle like
export function useToggleLike() {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()
  
  return useMutation({
    mutationFn: async (threadId: string) => {
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
      
      if (!data || typeof data.action !== 'string' || typeof data.likes_count !== 'number') {
        throw new Error('Invalid response from server')
      }
      
      return { 
        threadId, 
        isLiked: data.action === 'liked',
        likes_count: data.likes_count
      }
    },
    onMutate: async (threadId) => {
      await queryClient.cancelQueries({ queryKey: ['threads'] })
      await queryClient.cancelQueries({ queryKey: ['thread', threadId] })
      
      const previousThreads = queryClient.getQueryData<Thread[]>(['threads'])
      const previousThread = queryClient.getQueryData<Thread>(['thread', threadId])
      
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
      queryClient.setQueryData<Thread[]>(['threads'], old =>
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
      
      if (!data || !data.id) {
        throw new Error('Invalid thread data')
      }
      
      return data as Thread
    },
    enabled: !!threadId,
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

// Create comment
export function useCreateComment(threadId: string) {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()
  
  return useMutation({
    mutationFn: async (content: string) => {
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
      
      if (!data || !data.id) {
        throw new Error('Invalid response from server')
      }
      
      return data
    },
    onSuccess: (newComment) => {
      queryClient.invalidateQueries({ queryKey: ['comments', threadId] })
      
      queryClient.setQueryData<Thread[]>(['threads'], old =>
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