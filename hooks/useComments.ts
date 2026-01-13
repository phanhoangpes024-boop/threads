// hooks/useComments.ts
import { useInfiniteQuery } from '@tanstack/react-query'

export interface Comment {
  id: string
  content: string
  created_at: string
  username: string
  avatar_text: string
  avatar_bg: string
}

interface CommentsPage {
  comments: Comment[]
  nextCursor: {
    cursor: string
    cursor_id: string
  } | null
}

interface CommentsCursor {
  cursor: string
  cursor_id: string
}

export function useComments(threadId: string) {
  return useInfiniteQuery<CommentsPage, Error, any, string[], CommentsCursor | undefined>({
    queryKey: ['comments', threadId],
    
    queryFn: async ({ pageParam }): Promise<CommentsPage> => {
      const params = new URLSearchParams()
      
      if (pageParam) {
        params.append('cursor', pageParam.cursor)
        params.append('cursor_id', pageParam.cursor_id)
      }
      
      const url = `/api/threads/${threadId}/comments${params.toString() ? `?${params}` : ''}`
      const res = await fetch(url, { cache: 'no-store' })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to fetch comments' }))
        throw new Error(error.error || 'Failed to fetch comments')
      }
      
      return res.json()
    },
    
    initialPageParam: undefined,
    
    getNextPageParam: (lastPage): CommentsCursor | undefined => {
      return lastPage.nextCursor || undefined
    },
    
    enabled: !!threadId,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  })
}