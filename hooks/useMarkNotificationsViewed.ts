import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from './useCurrentUser'

export function useMarkNotificationsViewed() {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications/mark-viewed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      })
      if (!res.ok) throw new Error('Failed to mark viewed')
      return res.json()
    },
    onSuccess: () => {
      // ✅ PHẢI KHỚP VỚI queryKey bên useUnreadNotifications
      queryClient.invalidateQueries({ queryKey: ['unread-notifications', user.id] })
    }
  })
}