// app/thread/[id]/page.tsx
'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import CustomScrollbar from '@/components/CustomScrollbar'
import ThreadCard from '@/components/ThreadCard'
import CommentInput from '@/components/CommentInput'
import { useThreadDetail } from '@/hooks/useThreadDetail'
import { useToggleLike } from '@/hooks/useFeed'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import styles from './ThreadDetail.module.css'

export default function ThreadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()
  const threadId = params.id as string
  
  const { data, isLoading, isError } = useThreadDetail(threadId, user?.id)
  const toggleLikeMutation = useToggleLike()
  const [showCommentInput, setShowCommentInput] = useState(false)

  const handleLike = (id: string) => {
    toggleLikeMutation.mutate(id)
  }

  const handleCommentClick = () => {
    setShowCommentInput(true)
  }

  // ✅ Placeholder data → Không còn loading flash
  if (isLoading && !data) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Thread not found</div>
        <button onClick={() => router.back()}>← Back</button>
      </div>
    )
  }

  const { thread, comments } = data

  return (
    <CustomScrollbar className={styles.container}>
      <ThreadCard
        id={thread.id}
        username={thread.username || 'Unknown'}
        timestamp={thread.created_at}
        content={thread.content}
        medias={thread.medias} // ✅ Đã có từ feed cache
        likes={thread.likes_count}
        comments={thread.comments_count}
        reposts={thread.reposts_count}
        verified={thread.verified}
        avatarText={thread.avatar_text || 'U'}
        isLiked={thread.is_liked}
        onLikeClick={handleLike}
        onCommentClick={handleCommentClick}
      />
      
      {showCommentInput && (
        <CommentInput
          threadId={threadId}
          onCommentSubmit={() => {
            setShowCommentInput(false)
            queryClient.invalidateQueries({ queryKey: ['thread-detail', threadId] })
          }}
          autoFocus
        />
      )}
      
      <div className={styles.commentsSection}>
        <div className={styles.commentsHeader}>
          <button className={styles.sortButton}>Top Comments</button>
        </div>
        
        {!comments ? (
          <div className={styles.loading}>Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className={styles.noComments}>No comments yet</div>
        ) : (
          <div className={styles.commentsList}>
            {comments.map((comment: any) => (
              <div key={comment.id} className={styles.commentItem}>
                <div className={styles.commentAvatar}>
                  <div className={styles.avatar}>{comment.avatar_text}</div>
                </div>
                <div className={styles.commentContent}>
                  <div className={styles.commentHeader}>
                    <span className={styles.username}>{comment.username}</span>
                    <span className={styles.timestamp}>
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
    </CustomScrollbar>
  )
}