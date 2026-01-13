'use client'

import { useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import CustomScrollbar from '@/components/CustomScrollbar'
import ThreadCard from '@/components/ThreadCard'
import CommentInput from '@/components/CommentInput'
import { useThreadDetail } from '@/hooks/useThreadDetail'
import { useComments } from '@/hooks/useComments'
import { useToggleLike } from '@/hooks/useFeed'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useQueryClient } from '@tanstack/react-query'
import styles from './ThreadDetail.module.css'

function CommentSkeleton() {
  return (
    <div className={styles.commentItem}>
      <div className={styles.commentAvatar}>
        <div className={`${styles.avatar} ${styles.skeletonAvatar}`} />
      </div>
      <div className={styles.commentContent}>
        <div className={styles.commentHeader}>
          <div className={styles.skeletonUsername} />
          <div className={styles.skeletonTime} />
        </div>
        <div className={styles.skeletonText} />
        <div className={styles.skeletonTextShort} />
      </div>
    </div>
  )
}

export default function ThreadDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const shouldOpenComment = searchParams.get('openComment') === 'true'
  const queryClient = useQueryClient()
  const { user, loading: userLoading } = useCurrentUser()
  const threadId = params.id as string
  
  const { data: thread, isLoading: threadLoading } = useThreadDetail(threadId, user?.id)
  const { 
    data: commentsData, 
    isLoading: commentsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useComments(threadId)
  
  const toggleLikeMutation = useToggleLike()
  const [showCommentInput, setShowCommentInput] = useState(shouldOpenComment)

  const allComments = commentsData?.pages.flatMap((page: any) => page.comments) || []

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const scrollTop = target.scrollTop
    const scrollHeight = target.scrollHeight
    const clientHeight = target.clientHeight

    if (scrollHeight - scrollTop - clientHeight < 100 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleLike = useCallback((id: string) => {
    queryClient.setQueryData<any>(['thread-detail', threadId], (old: any) => {
      if (!old) return old
      return {
        ...old,
        is_liked: !old.is_liked,
        likes_count: old.is_liked 
          ? Math.max(0, old.likes_count - 1)
          : old.likes_count + 1
      }
    })
    
    toggleLikeMutation.mutate(id)
  }, [threadId, toggleLikeMutation, queryClient])

  const handleCommentClick = useCallback(() => {
    setShowCommentInput(true)
  }, [])

  const handleCommentSubmit = useCallback((content?: string) => {
    
    if (content && user?.id) {
      const fakeId = `temp-${Date.now()}`
      
      queryClient.setQueryData<any>(['comments', threadId], (old: any) => {
        if (!old) return old
        
        const newComment = {
          id: fakeId,
          content,
          username: user.username || 'You',
          avatar_text: user.avatar_text || 'U',
          avatar_bg: user.avatar_bg || '#0077B6',
          created_at: new Date().toISOString(),
        }
        
        return {
          ...old,
          pages: old.pages.map((page: any, i: number) => 
            i === 0 
              ? { ...page, comments: [newComment, ...page.comments] }
              : page
          )
        }
      })
      
      queryClient.setQueryData<any>(['thread-detail', threadId], (old: any) => {
        if (!old) return old
        return {
          ...old,
          comments_count: old.comments_count + 1
        }
      })
    }

    queryClient.invalidateQueries({ queryKey: ['comments', threadId] })
    queryClient.invalidateQueries({ queryKey: ['thread-detail', threadId] })
  }, [queryClient, threadId, user])

  if (userLoading || threadLoading) {
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
    <div 
      className={styles.container}
      onScroll={handleScroll}
    >
      <CustomScrollbar>
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
            <button className={styles.sortButton}>Bình luận hàng đầu</button>
          </div>
          
          <div className={styles.commentsList}>
            {commentsLoading && allComments.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <CommentSkeleton key={i} />
              ))
            ) : allComments.length === 0 ? (
              <div className={styles.noComments}>Chưa có bình luận nào</div>
            ) : (
              <>
                {allComments.map((comment: any) => (
                  <div key={comment.id} className={styles.commentItem}>
                    <div className={styles.commentAvatar}>
                      <div 
                        className={styles.avatar}
                        style={{ backgroundColor: comment.avatar_bg }}
                      >
                        {comment.avatar_text}
                      </div>
                    </div>
                    <div className={styles.commentContent}>
                      <div className={styles.commentHeader}>
                        <span className={styles.commentUsername}>
                          {comment.username}
                        </span>
                        <span className={styles.commentTime}>
                          {new Date(comment.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className={styles.commentText}>{comment.content}</div>
                    </div>
                  </div>
                ))}
                
                {isFetchingNextPage && <CommentSkeleton />}
                
                {!hasNextPage && allComments.length > 0 && (
                  <div className={styles.endOfComments}>
                    Đã hiển thị tất cả bình luận
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CustomScrollbar>
    </div>
  )
}