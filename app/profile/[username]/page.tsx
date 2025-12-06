// app/profile/[username]/page.tsx
import { notFound } from 'next/navigation'
import { getProfileData, getProfileByUsername } from '@/lib/data'
import ProfileClient from '@/components/ProfileClient'
import type { Metadata } from 'next'

// ============================================
// METADATA (SEO) - Tối ưu
// ============================================

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ username: string }> 
}): Promise<Metadata> {
  const { username } = await params
  
  // Chỉ fetch user info (nhẹ hơn), không fetch threads
  const profile = await getProfileByUsername(username)

  if (!profile) {
    return {
      title: 'User Not Found'
    }
  }

  return {
    title: `${profile.username} (@${profile.username})`,
    description: profile.bio || `${profile.threads_count} threads • ${profile.followers_count} followers`
  }
}

// ============================================
// PAGE COMPONENT
// ============================================

export default async function ProfilePage({ 
  params 
}: { 
  params: Promise<{ username: string }> 
}) {
  const { username } = await params
  
  // ⚠️ Server không đọc được localStorage
  // Sau khi làm Auth Cookie (Phase 2), đổi thành: cookies().get('token')
  const viewerId = null

  // Fetch data từ server
  const data = await getProfileData(username, viewerId)

  // 404 nếu không tìm thấy user
  if (!data) {
    notFound()
  }

  const { profile, threads, isFollowing } = data

  // Truyền xuống Client Component
  // Client sẽ tự check isOwnProfile và currentUserId bằng localStorage
  return (
    <ProfileClient
      initialProfile={profile}
      initialThreads={threads}
      initialIsFollowing={isFollowing}
    />
  )
}