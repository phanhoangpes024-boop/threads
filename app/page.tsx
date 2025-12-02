// app/page.tsx - UPDATED với Infinite Scroll
'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import CustomScrollbar from '@/components/CustomScrollbar'
import CreateThreadInput from '@/components/CreateThreadInput'
import ThreadCard from '@/components/ThreadCard'
import CommentInput from '@/components/CommentInput'
import { useFeed, useRefreshFeed } from '@/hooks/useFeed'
import { useCreateThread } from '@/hooks/useThreads'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import styles from './page.module.css'

const CreateThreadModal = dynamic(
  () => import('@/components/CreateThreadModal'),
  { ssr: false }
)

export default function Home() {
  const { 
    data, 
    isLoading, 
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage 
  } = useFeed()
  
  const createMutation = useCreateThread()
  const refreshFeed = useRefreshFeed()
  const { user, loading: userLoading } = useCurrentUser()
  
  const [showModal, setShowModal] = useState(false)
  const [activeCommentThreadId, setActiveCommentThreadId] = useState<string | null>(null)
  
  // Infinite scroll observer
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Setup infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { 
        rootMargin: '400px', // Load trước 400px
        threshold: 0.1 
      }
    )
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }
    
    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Pull to refresh (optional)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshFeed()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refreshFeed])

  const handlePostThread = async (content: string, imageUrls?: string[]) => {
    await createMutation.mutateAsync({ 
      content,
      imageUrls: imageUrls || []
    })
    setShowModal(false)
  }

  // Flatten all pages into single array
  const allThreads = data?.pages?.flatMap(page => page.threads) ?? []

  if (isLoading || userLoading) {
    return (
      <div className={styles.mainContainer}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          {/* Skeleton loader */}
          {[1, 2, 3].map(i => (
            <div key={i} style={{ 
              padding: '20px', 
              borderBottom: '1px solid #f0f0f0',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}>
              <div style={{ 
                width: '100px', 
                height: '16px', 
                background: '#e0e0e0', 
                borderRadius: '4px',
                marginBottom: '12px'
              }} />
              <div style={{ 
                width: '100%', 
                height: '60px', 
                background: '#e0e0e0', 
                borderRadius: '4px'
              }} />
            </div>
          ))}
        </div>
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
      
      {allThreads.length === 0 && !isLoading && (
        <div style={{ 
          padding: '60px 20px', 
          textAlign: 'center',
          color: '#999'
        }}>
          Chưa có thread nào. Hãy tạo thread đầu tiên! 🚀
        </div>
      )}
      
      {allThreads.map((thread) => (
        <div key={thread.id}>
          <ThreadCard
            id={thread.id}
            username={thread.username}
            timestamp={thread.created_at}
            content={thread.content}
            medias={thread.medias || []}  // ← FIX: Đảm bảo luôn là array
            likes={thread.likes_count}
            comments={thread.comments_count}
            reposts={thread.reposts_count}
            verified={thread.verified}
            avatarText={thread.avatar_text}
            isLiked={thread.is_liked}
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
      
      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} style={{ 
        padding: '20px', 
        textAlign: 'center',
        minHeight: '60px'
      }}>
        {isFetchingNextPage && (
          <div style={{ color: '#999' }}>Đang tải thêm...</div>
        )}
        {!hasNextPage && allThreads.length > 0 && (
          <div style={{ color: '#999', fontSize: '14px' }}>
            Đã hết thread 🎉
          </div>
        )}
      </div>
    </CustomScrollbar>
  )
}