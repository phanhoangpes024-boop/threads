// hooks/useFollowUser.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from './useCurrentUser'

export function useFollowUser() {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user.id) throw new Error('Not authenticated')

      const res = await fetch(`/api/users/${targetUserId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      })

      if (!res.ok) throw new Error('Failed to toggle follow')
      return res.json()
    },

    onSuccess: () => {
      // Invalidate notifications để refresh danh sách
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })
}