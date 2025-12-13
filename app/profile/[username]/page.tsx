// app/profile/[username]/page.tsx
'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import ProfileClient from '@/components/ProfileClient'
import type { ProfileData } from '@/lib/data'

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string

  const { data: profile, isLoading, isError } = useQuery<ProfileData>({
    queryKey: ['profile', username],
    queryFn: async () => {
      const res = await fetch(`/api/users/by-username/${username}`)
      if (!res.ok) throw new Error('Profile not found')
      return res.json()
    },
    staleTime: 1000 * 60,
  })

  if (isLoading) {
    return (
      <div style={{ 
        maxWidth: '600px', 
        margin: '80px auto', 
        padding: '40px 20px', 
        textAlign: 'center', 
        color: '#999' 
      }}>
        Đang tải...
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div style={{ 
        maxWidth: '600px', 
        margin: '80px auto', 
        padding: '40px 20px', 
        textAlign: 'center', 
        color: '#999' 
      }}>
        Không tìm thấy người dùng
      </div>
    )
  }

  return (
    <ProfileClient
      initialProfile={profile}
      initialThreads={[]}
      initialIsFollowing={false}
    />
  )
}