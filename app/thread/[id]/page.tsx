'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
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
  const queryClient = useQueryClient()
  const { user, loading: userLoading } = useCurrentUser()
  const threadId = params.id as string
  
  const { data, isLoading, isError } = useThreadDetail(threadId, user?.id)
  const toggleLikeMutation = useToggleLike()
  const [showCommentInput, setShowCommentInput] = useState(false)

  // ✅ OPTIMISTIC UI - Đổi màu tim ngay lập tức
  const handleLike = useCallback((id: string) => {
    // 1️⃣ OPTIMISTIC UPDATE: Đổi màu ngay lập tức cho trang Detail
    queryClient.setQueryData<any>(['thread-detail', threadId, user?.id], (old: any) => {
      if (!old?.thread) return old
      
      const newIsLiked = !old.thread.is_liked
      return {
        ...old,
        thread: {
          ...old.thread,
          is_liked: newIsLiked,
          likes_count: newIsLiked 
            ? old.thread.likes_count + 1 
            : Math.max(0, old.thread.likes_count - 1)
        }
      }
    })

    // 2️⃣ Gọi API (Logic đồng bộ cache thật sự vẫn nằm trong useFeed.ts)
    toggleLikeMutation.mutate(id, {
      onError: () => {
        // Nếu lỗi thì revert lại
        queryClient.invalidateQueries({ queryKey: ['thread-detail', threadId] })
      }
    })
  }, [threadId, toggleLikeMutation, queryClient, user?.id])

  const handleCommentClick = useCallback(() => {
    setShowCommentInput(true)
  }, [])

  const handleCommentSubmit = useCallback(() => {
    setShowCommentInput(false)
  }, [])

  if (userLoading || (isLoading && !data)) {
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
        medias={thread.medias || []}
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
          onCommentSubmit={handleCommentSubmit}
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
    </CustomScrollbar>
  )
}