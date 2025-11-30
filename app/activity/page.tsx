// app/activity/page.tsx - FIXED
'use client'

import { useState } from 'react'
import CustomScrollbar from '@/components/CustomScrollbar'
import ThreadCard from '@/components/ThreadCard'
import CommentInput from '@/components/CommentInput'
import { useThreads } from '@/hooks/useThreads'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import styles from './Activity.module.css'

export default function ActivityPage() {
  const { data: threads = [], isLoading } = useThreads()
  const { user, loading: userLoading } = useCurrentUser()
  const [activeCommentThreadId, setActiveCommentThreadId] = useState<string | null>(null)

  // Lọc threads liên quan đến user (user đã like, comment, hoặc được mention)
  // Tạm thời hiện tất cả threads
  const activityThreads = threads

  if (isLoading || userLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  return (
    <CustomScrollbar className={styles.container}>
      {activityThreads.length === 0 ? (
        <div className={styles.empty}>
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#999" strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <p>Chưa có hoạt động nào</p>
        </div>
      ) : (
        <div className={styles.threadsList}>
          {activityThreads.map((thread: any) => (
            <div key={thread.id}>
              <ThreadCard
                id={thread.id}
                username={thread.username}
                timestamp={thread.created_at}
                content={thread.content}
                imageUrls={thread.image_urls || []}
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
        </div>
      )}
    </CustomScrollbar>
  )
}