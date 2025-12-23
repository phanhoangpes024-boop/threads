// hooks/useThreadMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from './useCurrentUser'

export function useDeleteThread() {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()

  return useMutation({
    mutationFn: async (threadId: string) => {
      const res = await fetch(`/api/threads/${threadId}?user_id=${user.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete thread')
      }

      return res.json()
    },

    onSuccess: (_, threadId) => {
      // Xóa khỏi feed cache
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      
      // Xóa khỏi profile cache
      queryClient.invalidateQueries({ queryKey: ['profile-threads'] })
      
      console.log('✅ Đã xóa thread:', threadId)
    },

    onError: (error) => {
      console.error('❌ Lỗi xóa thread:', error)
      alert('Không thể xóa thread. Vui lòng thử lại.')
    }
  })
}

export function useUpdateThread() {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()

  return useMutation({
    mutationFn: async ({ 
      threadId, 
      content, 
      imageUrls 
    }: { 
      threadId: string
      content: string
      imageUrls: string[]
    }) => {
      const res = await fetch(`/api/threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          content,
          image_urls: imageUrls
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update thread')
      }

      return res.json()
    },

    onSuccess: () => {
      // Refresh feed cache
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      
      // Refresh profile cache
      queryClient.invalidateQueries({ queryKey: ['profile-threads'] })
      
      console.log('✅ Đã cập nhật thread')
    },

    onError: (error) => {
      console.error('❌ Lỗi cập nhật thread:', error)
      alert('Không thể cập nhật thread. Vui lòng thử lại.')
    }
  })
}