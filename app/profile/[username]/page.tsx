// app/profile/[username]/page.tsx
'use client'

import { use, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import CustomScrollbar from '@/components/CustomScrollbar'
import ProfileHeader from '@/components/ProfileHeader'
import ProfileTabs from '@/components/ProfileTabs'
import CreateThreadInput from '@/components/CreateThreadInput'
import ThreadCard from '@/components/ThreadCard'
import CommentInput from '@/components/CommentInput'
import { useThreads, useCreateThread } from '@/hooks/useThreads'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import styles from './Profile.module.css'

const CreateThreadModal = dynamic(() => import('@/components/CreateThreadModal'), { ssr: false })
const EditProfileModal = dynamic(() => import('@/components/EditProfileModal'), { ssr: false })

export default function ProfilePage({ 
  params 
}: { 
  params: Promise<{ username: string }> 
}) {
  const { username } = use(params)
  const { user, loading: userLoading } = useCurrentUser()
  const { data: threads = [] } = useThreads()
  const createMutation = useCreateThread()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeCommentThreadId, setActiveCommentThreadId] = useState<string | null>(null)

  const userThreads = useMemo(
    () => threads.filter(thread => thread.user_id === user.id),
    [threads, user.id]
  )

  const handlePostThread = async (content: string) => {
    await createMutation.mutateAsync({ content })
    setShowCreateModal(false)
  }

  if (userLoading) {
    return (
      <div className={styles.container}>
        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <CustomScrollbar className={styles.container}>
      <ProfileHeader
        name={user.username}
        username={user.username}
        bio={user.bio || 'Full-stack developer | Building cool stuff'}
        avatarText={user.avatar_text}
        verified={user.verified || false}
        followersCount={5}
        followersAvatars={['K', 'H', 'M']}
        onEditClick={() => setShowEditModal(true)}
      />
      
      <ProfileTabs />
      
      <div onClick={() => setShowCreateModal(true)}>
        <CreateThreadInput avatarText={user.avatar_text} />
      </div>
      
      {showCreateModal && (
        <CreateThreadModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handlePostThread}
          username={user.username}
          avatarText={user.avatar_text}
        />
      )}

      {showEditModal && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          currentProfile={{
            username: user.username,
            avatar_text: user.avatar_text,
            bio: user.bio,
          }}
          onSave={() => {}}
        />
      )}
      
      <div className={styles.threadsSection}>
        {userThreads.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
            Chưa có thread nào
          </div>
        ) : (
          userThreads.map((thread) => (
            <div key={thread.id}>
              <ThreadCard
                id={thread.id}
                username={user.username}
                timestamp={thread.created_at}
                content={thread.content}
                imageUrl={thread.image_url}
                likes={thread.likes_count.toString()}
                comments={thread.comments_count.toString()}
                reposts={thread.reposts_count.toString()}
                verified={user.verified || false}
                avatarText={user.avatar_text}
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
    </CustomScrollbar>
  )
}