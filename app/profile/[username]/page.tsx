// app/profile/[username]/page.tsx - UPDATED
'use client'

import { use, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import ProfileHeader from '@/components/ProfileHeader'
import ProfileTabs from '@/components/ProfileTabs'
import CreateThreadInput from '@/components/CreateThreadInput'
import ThreadCard from '@/components/ThreadCard'
import CommentInput from '@/components/CommentInput'
import { useCreateThread } from '@/hooks/useThreads'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import styles from './Profile.module.css'

const CreateThreadModal = dynamic(() => import('@/components/CreateThreadModal'), { ssr: false })
const EditProfileModal = dynamic(() => import('@/components/EditProfileModal'), { ssr: false })

interface ProfileUser {
  id: string
  username: string
  email: string
  avatar_text: string
  verified: boolean
  bio?: string
  followers_count: number
  following_count: number
}

interface Thread {
  id: string
  user_id: string
  content: string
  image_urls: string[]
  created_at: string
  likes_count: number
  comments_count: number
  reposts_count: number
  username: string
  avatar_text: string
  verified: boolean
  isLiked: boolean
}

export default function ProfilePage({ 
  params 
}: { 
  params: Promise<{ username: string }> 
}) {
  const { username } = use(params)
  const { user: currentUser, loading: userLoading } = useCurrentUser()
  const createMutation = useCreateThread()
  
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null)
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeCommentThreadId, setActiveCommentThreadId] = useState<string | null>(null)

  const isOwnProfile = currentUser?.username === username

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/by-username/${username}`)
        if (res.ok) {
          const data = await res.json()
          setProfileUser(data)

          if (currentUser?.id && data.id !== currentUser.id) {
            const followRes = await fetch(`/api/users/${data.id}/follow?user_id=${currentUser.id}`)
            const followData = await followRes.json()
            setIsFollowing(followData.isFollowing)
          }

          const threadsRes = await fetch(`/api/users/${data.id}/threads?current_user_id=${currentUser?.id || ''}`)
          if (threadsRes.ok) {
            const threadsData = await threadsRes.json()
            setThreads(threadsData)
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!userLoading) {
      fetchProfile()
    }
  }, [username, currentUser?.id, userLoading])

  const handlePostThread = async (content: string, imageUrls?: string[]) => {
    await createMutation.mutateAsync({ 
      content,
      imageUrls: imageUrls || []
    })
    setShowCreateModal(false)
    
    if (profileUser) {
      const res = await fetch(`/api/users/${profileUser.id}/threads?current_user_id=${currentUser?.id || ''}`)
      if (res.ok) {
        setThreads(await res.json())
      }
    }
  }

  const handleFollowToggle = (newState: boolean) => {
    setIsFollowing(newState)
    if (profileUser) {
      setProfileUser({
        ...profileUser,
        followers_count: profileUser.followers_count + (newState ? 1 : -1)
      })
    }
  }

  if (loading || userLoading) {
    return (
      <div className={styles.container}>
        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
          Loading...
        </div>
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className={styles.container}>
        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
          Không tìm thấy người dùng
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <ProfileHeader
        userId={profileUser.id}
        name={profileUser.username}
        username={profileUser.username}
        bio={profileUser.bio || (isOwnProfile ? 'Full-stack developer | Building cool stuff' : '')}
        avatarText={profileUser.avatar_text}
        verified={profileUser.verified}
        followersCount={profileUser.followers_count}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        currentUserId={currentUser?.id}
        onEditClick={() => setShowEditModal(true)}
        onFollowToggle={handleFollowToggle}
      />
      
      <ProfileTabs />
      
      {isOwnProfile && (
        <div onClick={() => setShowCreateModal(true)}>
          <CreateThreadInput avatarText={currentUser.avatar_text} />
        </div>
      )}
      
      {showCreateModal && isOwnProfile && (
        <CreateThreadModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handlePostThread}
          username={currentUser.username}
          avatarText={currentUser.avatar_text}
        />
      )}

      {showEditModal && isOwnProfile && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          currentProfile={{
            username: currentUser.username,
            avatar_text: currentUser.avatar_text,
            bio: currentUser.bio,
          }}
          onSave={() => {}}
        />
      )}
      
      <div className={styles.threadsSection}>
        {threads.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
            Chưa có thread nào
          </div>
        ) : (
          threads.map((thread) => (
            <div key={thread.id}>
              <ThreadCard
                id={thread.id}
                username={thread.username}
                timestamp={thread.created_at}
                content={thread.content}
                imageUrls={thread.image_urls}
                likes={thread.likes_count.toString()}
                comments={thread.comments_count.toString()}
                reposts={thread.reposts_count.toString()}
                verified={thread.verified}
                avatarText={thread.avatar_text}
                isLiked={thread.isLiked}
                onCommentClick={() => setActiveCommentThreadId(thread.id)}
              />
              
              {activeCommentThreadId === thread.id && (
                <CommentInput
                  threadId={thread.id}
                  onCommentSubmit={() => setActiveCommentThreadId(null)}
                  autoFocus={true}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}