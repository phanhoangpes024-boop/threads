import { useQuery } from '@tanstack/react-query'
import { useCurrentUser } from './useCurrentUser'
import { supabase } from '@/lib/supabase'

export function useUnreadNotifications() {
  const { user } = useCurrentUser()

  return useQuery({
    queryKey: ['unread-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0

      try {
        // 1. Lấy last_viewed trực tiếp từ bảng users
        const { data: userData } = await supabase
          .from('users')
          .select('last_notified_viewed_at')
          .eq('id', user.id)
          .single()

        const lastViewed = userData?.last_notified_viewed_at
        
        // 2. Đếm số lượng từ bảng notifications (Chỉ đếm, không tải cả data về)
        let query = supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', user.id)

        if (lastViewed) {
          query = query.gt('created_at', lastViewed)
        }

        const { count, error } = await query
        if (error) throw error

        console.log('--- DEBUG NOTIFICATION ---')
        console.log('User ID:', user.id)
        console.log('Thời điểm xem cuối:', lastViewed)
        console.log('Số thông báo mới:', count)
        
        return count || 0
      } catch (err) {
        console.error('❌ Lỗi useUnreadNotifications:', err)
        return 0
      }
    },
    enabled: !!user?.id,
    refetchInterval: 1000 * 30, // Poll mỗi 30s
  })
}