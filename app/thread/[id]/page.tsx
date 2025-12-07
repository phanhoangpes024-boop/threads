// app/thread/[id]/page.tsx
'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useQueryClient, useIsFetching } from '@tanstack/react-query' // [1] Thêm useIsFetching
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
  
  // [2] Lấy trạng thái fetching của query này để hiện loading khi refresh danh sách
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

  // -------------------------------------------------------------------
  // 👇👇👇 PHẦN ĐÃ SỬA: OPTIMISTIC UPDATE COMMENT 👇👇👇
  // -------------------------------------------------------------------
  // Lưu ý: CommentInput cần truyền content vào callback này: onCommentSubmit(content)
  const handleCommentSubmit = useCallback((content?: string) => {
    setShowCommentInput(false)
    
    // 1. Nếu có content và user info -> Thực hiện Optimistic Update (Hiển thị ngay)
    if (content && user) {
      const fakeId = `temp-${Date.now()}`
      
      // Tạo object comment giả lập
      const newOptimisticComment = {
        id: fakeId,
        content: content,
        username: user.username || 'You', // Dùng thông tin từ user hook
        avatar_text: user.avatar_text || 'Me', 
        created_at: new Date().toISOString(),
        is_optimistic: true // (Optional) Cờ để có thể style riêng nếu muốn
      }

      // Cập nhật cache ngay lập tức
      queryClient.setQueryData<any>(['thread-detail', threadId, user?.id], (old: any) => {
        if (!old) return old
        
        return {
          ...old,
          thread: {
            ...old.thread,
            comments_count: (old.thread.comments_count || 0) + 1
          },
          // Chèn comment mới lên đầu danh sách
          comments: [newOptimisticComment, ...(old.comments || [])]
        }
      })
    }

    // 2. Refresh lại data thật từ server (Background refetch)
    // Việc này sẽ kích hoạt isFetchingComments > 0
    queryClient.invalidateQueries({ 
      queryKey: ['thread-detail', threadId] 
    })
  }, [queryClient, threadId, user])
  // -------------------------------------------------------------------

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
          onCommentSubmit={handleCommentSubmit} // Đảm bảo Component này truyền text ra ngoài
          autoFocus
        />
      )}
      
      <div className={styles.commentsSection}>
        <div className={styles.commentsHeader}>
          <button className={styles.sortButton}>Top Comments</button>
          {/* [3] Hiển thị Indicator khi đang fetch lại comment thật */}
          {isFetchingComments > 0 && (
             <span style={{ fontSize: '12px', color: '#999', marginLeft: 'auto' }}>
               Updating...
             </span>
          )}
        </div>
        
        {!comments ? (
          <div className={styles.loading}>Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className={styles.noComments}>No comments yet</div>
        ) : (
          /* [4] Thêm style opacity nhẹ khi đang fetch để user biết danh sách đang được làm mới */
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
                      {/* Xử lý hiển thị thời gian cho comment vừa tạo */}
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
        )}
      </div>
    </CustomScrollbar>
  )
}