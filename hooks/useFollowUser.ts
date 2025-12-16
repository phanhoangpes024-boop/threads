// hooks/useFollowUser.ts - WITH OPTIMISTIC UPDATE FOR FOLLOWERS_COUNT
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from './useCurrentUser'
import type { ProfileData } from '@/lib/data'

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
      const data = await res.json()
      return { ...data, targetUserId }
    },

    onMutate: async (targetUserId) => {
      // Cancel queries để tránh conflict
      await queryClient.cancelQueries({ queryKey: ['isFollowing', user.id, targetUserId] })
      await queryClient.cancelQueries({ queryKey: ['profile'] })

      // Lấy trạng thái hiện tại
      const isCurrentlyFollowing = queryClient.getQueryData<boolean>([
        'isFollowing', 
        user.id, 
        targetUserId
      ]) || false

      // Snapshot để rollback
      const previousFollowState = isCurrentlyFollowing
      const previousProfile = queryClient.getQueryData<ProfileData>(['profile', targetUserId])

      // ✅ OPTIMISTIC UPDATE: Toggle trạng thái follow
      queryClient.setQueryData(['isFollowing', user.id, targetUserId], !isCurrentlyFollowing)

      // ✅ OPTIMISTIC UPDATE: Tăng/giảm followers_count
      queryClient.setQueriesData<ProfileData>(
        { queryKey: ['profile'], exact: false },
        (old) => {
          if (!old || old.id !== targetUserId) return old
          
          return {
            ...old,
            followers_count: !isCurrentlyFollowing
              ? old.followers_count + 1  // Follow → +1
              : Math.max(0, old.followers_count - 1)  // Unfollow → -1
          }
        }
      )

      return { previousFollowState, previousProfile }
    },

    onError: (err, targetUserId, context) => {
      console.error('[FOLLOW ERROR]', err)

      // Rollback về trạng thái cũ
      if (context?.previousFollowState !== undefined) {
        queryClient.setQueryData(
          ['isFollowing', user.id, targetUserId],
          context.previousFollowState
        )
      }

      if (context?.previousProfile) {
        queryClient.setQueryData(
          ['profile', targetUserId],
          context.previousProfile
        )
      }
    },

    onSettled: (data, error, targetUserId) => {
      // Invalidate để đảm bảo sync với server
      queryClient.invalidateQueries({ 
        queryKey: ['isFollowing', user.id, targetUserId] 
      })

      queryClient.invalidateQueries({ 
        queryKey: ['profile'],
        exact: false 
      })

      queryClient.invalidateQueries({ 
        queryKey: ['notifications'] 
      })
    }
  })
}