// components/ProfileClient/index.tsx - WITH OPTIMISTIC FOLLOWERS COUNT
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
}: ProfileClientProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user: currentUser } = useCurrentUser()
  const toggleLikeMutation = useToggleLike()
  const createThreadMutation = useCreateThread()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeCommentThreadId, setActiveCommentThreadId] = useState<string | null>(null)

  // ✅ Query profile với query key chuẩn
  const { data: profile = initialProfile } = useQuery<ProfileData>({
    queryKey: ['profile', initialProfile.id],
    queryFn: async () => {
      const res = await fetch(`/api/users/by-username/${initialProfile.username}`)
      if (!res.ok) throw new Error('Failed to fetch profile')
      return res.json()
    },
    initialData: initialProfile,
    staleTime: 1000 * 30,
  })

  const smartInitialThreads = (() => {
    if (typeof window === 'undefined' || !currentUser?.id) {
      return initialThreads
    }

    const feedData = queryClient.getQueryData<InfiniteData<FeedPage>>([
      'feed', 
      currentUser.id
    ])
    
    if (!feedData?.pages) return initialThreads

    const likedMap = new Map<string, boolean>()
    feedData.pages.forEach(page => {
      page.threads.forEach(t => likedMap.set(t.id, t.is_liked))
    })

    return initialThreads.map(t => ({
      ...t,
      is_liked: likedMap.has(t.id) ? likedMap.get(t.id)! : t.is_liked
    }))
  })()

  const { data: threads = [] } = useQuery<ProfileThread[]>({
    queryKey: ['profile-threads', initialProfile.id, currentUser?.id],
    
    queryFn: async () => {
      if (!currentUser?.id) return initialThreads
      
      const res = await fetch(
        `/api/users/${initialProfile.id}/threads?current_user_id=${currentUser.id}`
      )
      
      if (!res.ok) return initialThreads
      return res.json()
    },
    
    initialData: smartInitialThreads,
    staleTime: 0,
    enabled: !!currentUser?.id,
  })

  const isOwnProfile = currentUser?.id === profile.id

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
      queryClient.setQueryData(['profile', profile.id], (old: any) => ({
        ...old,
        avatar_text: updatedUser.avatar_text,
        bio: updatedUser.bio
      }))
    }
    
    router.refresh()
  }, [profile.id, router, queryClient])

  return (
    <>
      <CustomScrollbar className={styles.container}>
        <ProfileHeader
          userId={profile.id}
          name={profile.username}
          username={profile.username}
          bio={profile.bio || ''}
          avatarText={profile.avatar_text}
          avatarBg={profile.avatar_bg || '#0077B6'}
          verified={profile.verified}
          followersCount={profile.followers_count}
          isOwnProfile={isOwnProfile}
          currentUserId={currentUser?.id}
          onEditClick={handleEditProfile}
        />

        <ProfileTabs />

        {isOwnProfile && (
          <div onClick={handleOpenCreateModal}>
            <CreateThreadInput 
              avatarText={currentUser?.avatar_text || 'U'} 
              avatarBg={currentUser?.avatar_bg || '#0077B6'}
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
          avatarBg={currentUser?.avatar_bg || '#0077B6'}
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