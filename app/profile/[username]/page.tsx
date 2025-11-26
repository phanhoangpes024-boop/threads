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
import { MOCK_USER } from '@/lib/currentUser'
import styles from './Profile.module.css'

const CreateThreadModal = dynamic(() => import('@/components/CreateThreadModal'), { ssr: false })
const EditProfileModal = dynamic(() => import('@/components/EditProfileModal'), { ssr: false })

export default function ProfilePage({ 
  params 
}: { 
  params: Promise<{ username: string }> 
}) {
  const { username } = use(params)
  const { data: threads = [] } = useThreads()
  const createMutation = useCreateThread()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeCommentThreadId, setActiveCommentThreadId] = useState<string | null>(null)

  const userThreads = useMemo(
    () => threads.filter(thread => thread.user_id === MOCK_USER.id),
    [threads]
  )

  const handlePostThread = async (content: string) => {
    await createMutation.mutateAsync({ content })
    setShowCreateModal(false)
  }

  return (
    <CustomScrollbar className={styles.container}>
      <ProfileHeader
        name="Daniel Developer"
        username={MOCK_USER.username}
        bio="Full-stack developer | Building cool stuff"
        avatarText={MOCK_USER.avatar_text}
        verified={false}
        followersCount={5}
        followersAvatars={['K', 'H', 'M']}
        onEditClick={() => setShowEditModal(true)}
      />
      
      <ProfileTabs />
      
      <div onClick={() => setShowCreateModal(true)}>
        <CreateThreadInput avatarText={MOCK_USER.avatar_text} />
      </div>
      
      {showCreateModal && (
        <CreateThreadModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handlePostThread}
          username={MOCK_USER.username}
          avatarText={MOCK_USER.avatar_text}
        />
      )}

      {showEditModal && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          currentProfile={{
            username: MOCK_USER.username,
            avatar_text: MOCK_USER.avatar_text,
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
                username={MOCK_USER.username}
                timestamp={thread.created_at}
                content={thread.content}
                imageUrl={thread.image_url}
                likes={thread.likes_count.toString()}
                comments={thread.comments_count.toString()}
                reposts={thread.reposts_count.toString()}
                verified={false}
                avatarText={MOCK_USER.avatar_text}
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