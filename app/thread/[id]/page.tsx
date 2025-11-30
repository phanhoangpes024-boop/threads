// app/thread/[id]/page.tsx - UPDATED
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import ThreadCard from '@/components/ThreadCard'
import CommentInput from '@/components/CommentInput'
import { useThread, useComments } from '@/hooks/useThreads'
import styles from './ThreadDetail.module.css'

export default function ThreadDetailPage() {
  const params = useParams()
  const threadId = params.id as string
  
  const { data: thread, isLoading: threadLoading } = useThread(threadId)
  const { data: comments = [], isLoading: commentsLoading } = useComments(threadId)
  const [showCommentInput, setShowCommentInput] = useState(false)

  if (threadLoading || commentsLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  if (!thread) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Thread not found</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <ThreadCard
        id={thread.id}
        username={thread.username || 'Unknown'}
        timestamp={thread.created_at}
        content={thread.content}
        imageUrls={thread.image_urls || []}
        likes={thread.likes_count.toString()}
        comments={thread.comments_count.toString()}
        reposts={thread.reposts_count.toString()}
        verified={thread.verified}
        avatarText={thread.avatar_text || 'U'}
        isDetailView={true}
        onCommentClick={() => setShowCommentInput(true)}
        isLiked={thread.isLiked}
      />
      
      {showCommentInput && (
        <CommentInput
          threadId={threadId}
          onCommentSubmit={() => setShowCommentInput(false)}
          autoFocus={true}
        />
      )}
      
      <div className={styles.commentsSection}>
        <div className={styles.commentsHeader}>
          <button className={styles.sortButton}>Hàng đầu</button>
          <span className={styles.viewAll}>Xem hoạt động</span>
        </div>
        
        {comments.length === 0 ? (
          <div className={styles.noComments}>Chưa có bình luận nào</div>
        ) : (
          <div className={styles.commentsList}>
            {comments.map((comment: any) => (
              <div key={comment.id} className={styles.commentItem}>
                <div className={styles.commentAvatar}>
                  <div className={styles.avatar}>{comment.avatar_text}</div>
                </div>
                <div className={styles.commentContent}>
                  <div className={styles.commentHeader}>
                    <span className={styles.commentUsername}>{comment.username}</span>
                    <span className={styles.commentTime}>
                      {new Date(comment.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className={styles.commentText}>{comment.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}