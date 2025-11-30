// app/page.tsx - UPDATED to handle imageUrls
'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import CustomScrollbar from '@/components/CustomScrollbar'
import CreateThreadInput from '@/components/CreateThreadInput'
import ThreadCard from '@/components/ThreadCard'
import CommentInput from '@/components/CommentInput'
import { useThreads, useCreateThread } from '@/hooks/useThreads'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import styles from './page.module.css'

const CreateThreadModal = dynamic(
  () => import('@/components/CreateThreadModal'),
  { ssr: false }
)

export default function Home() {
  const { data: threads = [], isLoading } = useThreads()
  const createMutation = useCreateThread()
  const { user, loading: userLoading } = useCurrentUser()
  const [showModal, setShowModal] = useState(false)
  const [activeCommentThreadId, setActiveCommentThreadId] = useState<string | null>(null)

  const handlePostThread = async (content: string, imageUrls?: string[]) => {
    await createMutation.mutateAsync({ 
      content,
      imageUrls: imageUrls || []
    })
    setShowModal(false)
  }

  if (isLoading || userLoading) {
    return (
      <div className={styles.mainContainer}>
        <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
      </div>
    )
  }

  return (
    <CustomScrollbar className={styles.mainContainer}>
      <div onClick={() => setShowModal(true)}>
        <CreateThreadInput avatarText={user.avatar_text} />
      </div>
      
      {showModal && (
        <CreateThreadModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handlePostThread}
          username={user.username}
          avatarText={user.avatar_text}
        />
      )}
      
      {threads.map((thread: any) => (
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
      ))}
    </CustomScrollbar>
  )
}