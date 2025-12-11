// hooks/useIsFollowing.ts - FILE MỚI
import { useQuery } from '@tanstack/react-query'
import { useCurrentUser } from './useCurrentUser'

export function useIsFollowing(targetUserId: string) {
  const { user } = useCurrentUser()

  return useQuery({
    queryKey: ['isFollowing', user.id, targetUserId],
    
    queryFn: async () => {
      if (!user.id || user.id === targetUserId) return false
      
      const res = await fetch(
        `/api/users/${targetUserId}/follow?user_id=${user.id}`
      )
      
      if (!res.ok) return false
      
      const data = await res.json()
      return data.isFollowing
    },
    
    enabled: !!user.id && !!targetUserId && user.id !== targetUserId,
    staleTime: 1000 * 30, // Cache 30s
  })
}