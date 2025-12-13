import { useQuery } from '@tanstack/react-query'
import { useCurrentUser } from './useCurrentUser'

export function useUnreadNotifications() {
  const { user } = useCurrentUser()

  return useQuery({
    queryKey: ['unread-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0

      try {
        // GỌI API ROUTE thay vì query trực tiếp
        const res = await fetch(`/api/notifications/unread?user_id=${user.id}`)
        if (!res.ok) throw new Error('Failed to fetch unread count')
        
        const data = await res.json()
        
        console.log('✅ User ID:', user.id)
        console.log('✅ Notification chưa đọc:', data.count)
        
        return data.count || 0
      } catch (err) {
        console.error('❌ Lỗi:', err)
        return 0
      }
    },
    enabled: !!user?.id,
    refetchInterval: 5000,
  })
}