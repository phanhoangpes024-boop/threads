// hooks/useNotifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from './useCurrentUser'

export interface NotificationActor {
  id: string
  username: string
  avatar_text: string
  avatar_bg: string
}

export interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow'
  thread_id: string | null
  comment_content: string | null
  is_read: boolean
  created_at: string
  updated_at: string
  actors: NotificationActor[]
  thread_content: string | null
  thread_first_media: string | null
}

export function useNotifications() {
  const { user } = useCurrentUser()

  return useQuery<Notification[]>({
    queryKey: ['notifications', user.id],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?user_id=${user.id}`)
      if (!res.ok) throw new Error('Failed to fetch notifications')
      const data = await res.json()
      return data.notifications
    },
    enabled: !!user.id,
    staleTime: 1000 * 30, // 30s
    refetchInterval: 1000 * 60, // Poll mỗi 1 phút
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_ids: notificationIds })
      })
      if (!res.ok) throw new Error('Failed to mark as read')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })
}