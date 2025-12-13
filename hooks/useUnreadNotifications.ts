import { useQuery } from '@tanstack/react-query'
import { useCurrentUser } from './useCurrentUser'
import { supabase } from '@/lib/supabase'

export function useUnreadNotifications() {
  const { user } = useCurrentUser()

  return useQuery({
    queryKey: ['unread-notifications', user.id],
    queryFn: async () => {
      // Lấy last_notified_viewed_at từ users
      const { data: userData } = await supabase
        .from('users')
        .select('last_notified_viewed_at')
        .eq('id', user.id)
        .single()

      if (!userData?.last_notified_viewed_at) return 0

      // Đếm notifications mới hơn last_viewed
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .gt('created_at', userData.last_notified_viewed_at)

      return count || 0
    },
    enabled: !!user.id,
    staleTime: 1000 * 30, // 30s
    refetchInterval: 1000 * 60, // Poll mỗi 1 phút
  })
}