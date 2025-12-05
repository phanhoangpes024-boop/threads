// FILE 2: app/thread/[id]/page.tsx - UPDATED
// ============================================
'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import CustomScrollbar from '@/components/CustomScrollbar'
import ThreadCard from '@/components/ThreadCard'
import CommentInput from '@/components/CommentInput'
import { useThreadDetail } from '@/hooks/useThreadDetail'
import { useToggleLike } from '@/hooks/useFeed'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import type { FeedPage } from '@/hooks/useFeed'
import styles from './ThreadDetail.module.css'

export default function ThreadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, loading: userLoading } = useCurrentUser()
  const threadId = params.id as string
  
  // ✅ Truyền user?.id (có thể undefined ban đầu)
  const { data, isLoading, isError } = useThreadDetail(threadId, user?.id)
  const toggleLikeMutation = useToggleLike()
  const [showCommentInput, setShowCommentInput] = useState(false)

  const handleLike = useCallback((id: string) => {
    const currentData = queryClient.getQueryData<any>(['thread-detail', threadId, user?.id])
    if (!currentData?.thread) return

    const currentIsLiked = currentData.thread.is_liked
    const currentCount = currentData.thread.likes_count

    // Optimistic update
    queryClient.setQueryData<any>(['thread-detail', threadId, user?.id], (old: any) => {
      if (!old) return old
      
      const newIsLiked = !currentIsLiked
      return {
        ...old,
        thread: {
          ...old.thread,
          is_liked: newIsLiked,
          likes_count: newIsLiked ? currentCount + 1 : Math.max(0, currentCount - 1)
        }
      }
    })

    toggleLikeMutation.mutate(id, {
      onSuccess: (result) => {
        console.log('[Thread Detail] Like success:', result)
        
        // Update thread-detail
        queryClient.setQueryData<any>(['thread-detail', threadId, user?.id], (old: any) => {
          if (!old) return old
          return {
            ...old,
            thread: {
              ...old.thread,
              is_liked: result.action === 'liked',
              likes_count: result.likes_count
            }
          }
        })

        // Update Feed cache
        if (user?.id) {
          queryClient.setQueryData<InfiniteData<FeedPage>>(
            ['feed', user.id],
            (old) => {
              if (!old) return old
              
              return {
                ...old,
                pages: old.pages.map(page => ({
                  ...page,
                  threads: page.threads.map(t =>
                    t.id === threadId
                      ? {
                          ...t,
                          is_liked: result.action === 'liked',
                          likes_count: result.likes_count
                        }
                      : t
                  )
                }))
              }
            }
          )
        }
      },
      onError: (error) => {
        console.error('[Thread Detail] Like error:', error)
        queryClient.setQueryData(['thread-detail', threadId, user?.id], currentData)
      }
    })
  }, [threadId, toggleLikeMutation, queryClient, user?.id])

  const handleCommentClick = useCallback(() => {
    setShowCommentInput(true)
  }, [])

  const handleCommentSubmit = useCallback(async () => {
    setShowCommentInput(false)
    
    await queryClient.invalidateQueries({ 
      queryKey: ['thread-detail', threadId, user?.id],
      refetchType: 'active'
    })
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const updatedData = queryClient.getQueryData<any>(['thread-detail', threadId, user?.id])
    
    if (updatedData?.thread && user?.id) {
      const newCommentsCount = updatedData.thread.comments_count
      
      queryClient.setQueryData<InfiniteData<FeedPage>>(
        ['feed', user.id],
        (old) => {
          if (!old) return old
          
          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              threads: page.threads.map(t =>
                t.id === threadId
                  ? { ...t, comments_count: newCommentsCount }
                  : t
              )
            }))
          }
        }
      )
    }
  }, [threadId, queryClient, user?.id])

  // ✅ Loading state - Đợi cả user VÀ thread
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