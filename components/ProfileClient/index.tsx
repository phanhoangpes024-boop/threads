// components/ProfileClient/index.tsx - GIẢI PHÁP ĐÚNG
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
import styles from './ProfileClient.module.css'

const CreateThreadModal = dynamic(() => import('@/components/CreateThreadModal'), { ssr: false })
const EditProfileModal = dynamic(() => import('@/components/EditProfileModal'), { ssr: false })

interface ProfileClientProps {
  initialProfile: ProfileData
  initialThreads: ProfileThread[]
  initialIsFollowing: boolean
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

  // ✅ FIX: Dùng useQuery thay vì useMemo/useState
  // React Query tự động re-render khi cache thay đổi
  const { data: threads = [] } = useQuery<ProfileThread[]>({
    queryKey: ['profile-threads', initialProfile.id],
    queryFn: () => initialThreads, // Ít khi chạy vì có initialData
    initialData: initialThreads,   // Dùng SSR data ngay, không fetch lại
    staleTime: 1000 * 60 * 5,      // Data tươi trong 5 phút
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

  // ✅ FIX: Chỉ cần gọi mutation, React Query tự sync
  const handleLike = useCallback((threadId: string) => {
    toggleLikeMutation.mutate(threadId)
    // Không cần optimistic update ở đây
    // useQuery tự động re-render khi cache thay đổi
  }, [toggleLikeMutation])

  const handleCommentClick = useCallback((threadId: string) => {
    setActiveCommentThreadId(threadId)
  }, [])

  const handleCommentSubmit = useCallback(() => {
    setActiveCommentThreadId(null)
    router.refresh()
  }, [router])

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
            <CreateThreadInput avatarText={currentUser?.avatar_text || 'U'} />
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