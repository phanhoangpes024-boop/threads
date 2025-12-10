// app/thread/[id]/page.tsx
'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useQueryClient, useIsFetching } from '@tanstack/react-query'
import CustomScrollbar from '@/components/CustomScrollbar'
import ThreadCard from '@/components/ThreadCard'
import CommentInput from '@/components/CommentInput'
import { useThreadDetail } from '@/hooks/useThreadDetail'
import { useToggleLike } from '@/hooks/useFeed'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import styles from './ThreadDetail.module.css'

// Component Skeleton Loader cho Comments
function CommentSkeleton() {
  return (
    <div className={styles.commentItem}>
      <div className={styles.commentAvatar}>
        <div className={`${styles.avatar} ${styles.skeletonAvatar}`}></div>
      </div>
      <div className={styles.commentContent}>
        <div className={styles.commentHeader}>
          <div className={styles.skeletonUsername}></div>
          <div className={styles.skeletonTime}></div>
        </div>
        <div className={styles.skeletonText}></div>
        <div className={styles.skeletonTextShort}></div>
      </div>
    </div>
  )
}

export default function ThreadDetailPage() {
  const params = useParams()
  const queryClient = useQueryClient()
  const { user, loading: userLoading } = useCurrentUser()
  const threadId = params.id as string
  
  const isFetchingComments = useIsFetching({ queryKey: ['thread-detail', threadId] })
  
  const { data, isLoading, isError } = useThreadDetail(threadId, user?.id)
  const toggleLikeMutation = useToggleLike()
  const [showCommentInput, setShowCommentInput] = useState(false)

  // OPTIMISTIC UI - Đổi màu tim
  const handleLike = useCallback((id: string) => {
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

    toggleLikeMutation.mutate(id, {
      onError: () => {
        queryClient.invalidateQueries({ queryKey: ['thread-detail', threadId] })
      }
    })
  }, [threadId, toggleLikeMutation, queryClient, user?.id])

  const handleCommentClick = useCallback(() => {
    setShowCommentInput(true)
  }, [])

  // OPTIMISTIC UPDATE COMMENT
  const handleCommentSubmit = useCallback((content?: string) => {
    setShowCommentInput(false)
    
    if (content && user) {
      const fakeId = `temp-${Date.now()}`
      
      const newOptimisticComment = {
        id: fakeId,
        content: content,
        username: user.username || 'You',
        avatar_text: user.avatar_text || 'Me', 
        created_at: new Date().toISOString(),
        is_optimistic: true
      }

      queryClient.setQueryData<any>(['thread-detail', threadId, user?.id], (old: any) => {
        if (!old) return old
        
        return {
          ...old,
          thread: {
            ...old.thread,
            comments_count: (old.thread.comments_count || 0) + 1
          },
          comments: [newOptimisticComment, ...(old.comments || [])]
        }
      })
    }

    queryClient.invalidateQueries({ 
      queryKey: ['thread-detail', threadId] 
    })
  }, [queryClient, threadId, user])

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
          {isFetchingComments > 0 && comments && comments.length > 0 && (
            <span style={{ fontSize: '12px', color: '#999', marginLeft: 'auto' }}>
              Updating...
            </span>
          )}
        </div>
        
        {(() => {
          // 1. Nếu chưa có comments HOẶC (comments rỗng NHƯNG đang fetch)
          // -> Hiện Skeleton Loader
          if (!comments || (comments.length === 0 && isFetchingComments > 0)) {
            return (
              <div className={styles.commentsList}>
                <CommentSkeleton />
                <CommentSkeleton />
                <CommentSkeleton />
              </div>
            )
          }

          // 2. Khi chắc chắn không fetch nữa mà vẫn rỗng -> Hiện No comments
          if (comments.length === 0) {
            return <div className={styles.noComments}>No comments yet</div>
          }

          // 3. Có data -> Render List
          return (
            <div 
              className={styles.commentsList} 
              style={{ opacity: isFetchingComments > 0 ? 0.7 : 1, transition: 'opacity 0.2s' }}
            >
              {comments.map((comment: any) => (
                <div key={comment.id} className={styles.commentItem}>
                  <div className={styles.commentAvatar}>
                    <div className={styles.avatar}>{comment.avatar_text}</div>
                  </div>
                  <div className={styles.commentContent}>
                    <div className={styles.commentHeader}>
                      <span className={styles.commentUsername}>{comment.username}</span>
                      <span className={styles.commentTime}>
                        {comment.id.toString().startsWith('temp-') 
                          ? 'Just now' 
                          : new Date(comment.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div className={styles.commentText}>{comment.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
      </div>
    </CustomScrollbar>
  )
}