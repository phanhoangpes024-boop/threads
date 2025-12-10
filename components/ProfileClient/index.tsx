// components/ProfileClient/index.tsx - GIẢI PHÁP ĐÚNG (Gemini)
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import CustomScrollbar from '@/components/CustomScrollbar'
import ProfileHeader from '@/components/ProfileHeader'
import ProfileTabs from '@/components/ProfileTabs'
import ThreadCard from '@/components/ThreadCard'
import CommentInput from '@/components/CommentInput'
import CreateThreadInput from '@/components/CreateThreadInput'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useToggleLike } from '@/hooks/useFeed'
import { useCreateThread } from '@/hooks/useThreads'
import type { ProfileData, ProfileThread } from '@/lib/data'
import type { InfiniteData } from '@tanstack/react-query'
import styles from './ProfileClient.module.css'

const CreateThreadModal = dynamic(() => import('@/components/CreateThreadModal'), { ssr: false })
const EditProfileModal = dynamic(() => import('@/components/EditProfileModal'), { ssr: false })

interface ProfileClientProps {
  initialProfile: ProfileData
  initialThreads: ProfileThread[]
  initialIsFollowing: boolean
}

interface FeedPage {
  threads: ProfileThread[]
  nextCursor: string | null
}

export default function ProfileClient({
  initialProfile,
  initialThreads,
  initialIsFollowing
}: ProfileClientProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user: currentUser } = useCurrentUser()
  const toggleLikeMutation = useToggleLike()
  const createThreadMutation = useCreateThread()
  
  const [profile, setProfile] = useState(initialProfile)
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeCommentThreadId, setActiveCommentThreadId] = useState<string | null>(null)

  // ✅ SMART INITIAL DATA: Merge Feed cache với SSR data
  const smartInitialThreads = (() => {
    // ✅ Guard: Server-side hoặc no user → dùng SSR data
    if (typeof window === 'undefined' || !currentUser?.id) {
      return initialThreads
    }

    // ✅ Thử lấy Feed cache
    const feedData = queryClient.getQueryData<InfiniteData<FeedPage>>([
      'feed', 
      currentUser.id
    ])
    
    if (!feedData?.pages) return initialThreads

    // ✅ Tạo Map isLiked từ Feed
    const likedMap = new Map<string, boolean>()
    feedData.pages.forEach(page => {
      page.threads.forEach(t => likedMap.set(t.id, t.is_liked))
    })

    // ✅ Merge: Có trong Feed → dùng Feed, không có → giữ nguyên SSR
    return initialThreads.map(t => ({
      ...t,
      is_liked: likedMap.has(t.id) ? likedMap.get(t.id)! : t.is_liked
    }))
  })()

  // ✅ REACT QUERY: Hiển thị instant + fetch để verify
  const { data: threads = [] } = useQuery<ProfileThread[]>({
    queryKey: ['profile-threads', initialProfile.id, currentUser?.id],
    
    queryFn: async () => {
      if (!currentUser?.id) return initialThreads
      
      // ✅ Fetch động với user_id
      const res = await fetch(
        `/api/users/${initialProfile.id}/threads?current_user_id=${currentUser.id}`
      )
      
      if (!res.ok) return initialThreads
      return res.json()
    },
    
    initialData: smartInitialThreads, // ✅ Hiển thị ngay
    staleTime: 0, // ✅ Vẫn fetch để đảm bảo đúng (5s cache)
    enabled: !!currentUser?.id,
  })

  useEffect(() => {
    setProfile(initialProfile)
  }, [initialProfile])

  useEffect(() => {
    setIsFollowing(initialIsFollowing)
  }, [initialIsFollowing])

  const isOwnProfile = currentUser?.id === profile.id

  const handleFollowToggle = async () => {
    if (!currentUser?.id || isFollowLoading) return
    setIsFollowLoading(true)
    const newIsFollowing = !isFollowing
    setIsFollowing(newIsFollowing)
    setProfile(prev => ({
      ...prev,
      followers_count: newIsFollowing ? prev.followers_count + 1 : Math.max(0, prev.followers_count - 1)
    }))

    try {
      const res = await fetch(`/api/users/${profile.id}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id })
      })
      if (!res.ok) throw new Error('Failed to toggle follow')
    } catch (error) {
      console.error('Follow error:', error)
      setIsFollowing(!newIsFollowing)
      setProfile(prev => ({
        ...prev,
        followers_count: newIsFollowing ? Math.max(0, prev.followers_count - 1) : prev.followers_count + 1
      }))
    } finally {
      setIsFollowLoading(false)
    }
  }

  // ✅ Chỉ cần gọi mutation, React Query tự sync
  const handleLike = useCallback((threadId: string) => {
    toggleLikeMutation.mutate(threadId)
  }, [toggleLikeMutation])

  const handleCommentClick = useCallback((threadId: string) => {
    setActiveCommentThreadId(threadId)
  }, [])

  const handleCommentSubmit = useCallback(() => {
    setActiveCommentThreadId(null)
    queryClient.setQueryData<ProfileThread[]>(
      ['profile-threads', initialProfile.id, currentUser?.id],
      (old) => {
        if (!old) return old
        return old.map(t => 
          t.id === activeCommentThreadId 
            ? { ...t, comments_count: t.comments_count + 1 }
            : t
        )
      }
    )
  }, [queryClient, initialProfile.id, currentUser?.id, activeCommentThreadId])

  const handleOpenCreateModal = useCallback(() => {
    setShowCreateModal(true)
  }, [])

  const handlePostThread = useCallback(async (content: string, imageUrls?: string[]) => {
    try {
      await createThreadMutation.mutateAsync({ 
        content, 
        imageUrls: imageUrls || [] 
      })
      
      setShowCreateModal(false)
      router.refresh()
      
    } catch (error) {
      console.error('Failed to create thread:', error)
      alert('Không thể tạo thread. Vui lòng thử lại.')
    }
  }, [createThreadMutation, router])

  const handleEditProfile = useCallback(() => {
    setShowEditModal(true)
  }, [])

  const handleSaveProfile = useCallback(() => {
    setShowEditModal(false)
    
    const updatedUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    if (updatedUser.id === profile.id) {
      setProfile(prev => ({
        ...prev,
        avatar_text: updatedUser.avatar_text,
        bio: updatedUser.bio
      }))
    }
    
    router.refresh()
  }, [profile.id, router])

  return (
    <>
      <CustomScrollbar className={styles.container}>
        <ProfileHeader
          userId={profile.id}
          name={profile.username}
          username={profile.username}
          bio={profile.bio || ''}
          avatarText={profile.avatar_text}
            avatarBg={profile.avatar_bg || '#0077B6'}  // ← THÊM
          verified={profile.verified}
          followersCount={profile.followers_count}
          isOwnProfile={isOwnProfile}
          isFollowing={isFollowing}
          currentUserId={currentUser?.id}
          onEditClick={handleEditProfile}
          onFollowToggle={handleFollowToggle}
        />

        <ProfileTabs />

        {isOwnProfile && (
          <div onClick={handleOpenCreateModal}>
            <CreateThreadInput avatarText={currentUser?.avatar_text || 'U'}   avatarBg={currentUser?.avatar_bg || '#0077B6'}
 />
          </div>
        )}

        <div className={styles.threadsSection}>
          {threads.length === 0 ? (
            <div className={styles.empty}>Chưa có thread nào</div>
          ) : (
            threads.map((thread) => (
              <div key={thread.id}>
                <ThreadCard
                  id={thread.id}
                  username={thread.username}
                  timestamp={thread.created_at}
                  content={thread.content}
                  medias={thread.medias}
                  likes={thread.likes_count}
                  comments={thread.comments_count}
                  reposts={thread.reposts_count}
                  verified={thread.verified}
                  avatarText={thread.avatar_text}
                  avatarBg={thread.avatar_bg || '#0077B6'}
                  isLiked={thread.is_liked}
                  onLikeClick={handleLike}
                  onCommentClick={handleCommentClick}
                />
                
                {activeCommentThreadId === thread.id && (
                  <CommentInput
                    threadId={thread.id}
                    onCommentSubmit={handleCommentSubmit}
                    autoFocus={true}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </CustomScrollbar>

      {showCreateModal && isOwnProfile && (
        <CreateThreadModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handlePostThread}
          username={currentUser?.username || ''}
          avatarText={currentUser?.avatar_text || 'U'}
            avatarBg={currentUser?.avatar_bg || '#0077B6'}  // ← THÊM

        />
      )}

      {showEditModal && isOwnProfile && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          currentProfile={{
            username: profile.username,
            avatar_text: profile.avatar_text,
            bio: profile.bio || ''
          }}
          onSave={handleSaveProfile}
        />
      )}
    </>
  )
}