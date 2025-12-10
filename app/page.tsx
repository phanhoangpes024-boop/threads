// app/page.tsx - OPTIMIZED WITH VIRTUALIZATION + CUSTOM SCROLLBAR + FEED TYPE
'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import dynamic from 'next/dynamic'
import CustomScrollbar from '@/components/CustomScrollbar'
import CreateThreadInput from '@/components/CreateThreadInput'
import ThreadCard from '@/components/ThreadCard'
import CommentInput from '@/components/CommentInput'
import { useFeedWithType, type FeedType } from '@/hooks/useFeedWithType'
import { useToggleLike, useRefreshFeed, saveScrollPosition, getScrollPosition } from '@/hooks/useFeed'
import { useCreateThread } from '@/hooks/useThreads'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { registerServiceWorker } from '@/lib/registerSW'
import styles from './page.module.css'

const CreateThreadModal = dynamic(
  () => import('@/components/CreateThreadModal'),
  { ssr: false }
)

export default function Home() {
  const queryClient = useQueryClient()
  // ✅ THÊM: Feed Type State
  const [feedType, setFeedType] = useState<FeedType>('for-you')
  
  // ✅ THÊM: Key để force remount virtualizer
  const [virtualizerKey, setVirtualizerKey] = useState(0)
  
  // ✅ THAY ĐỔI: Dùng useFeedWithType thay vì useFeed
  const { 
    data, 
    isLoading, 
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage 
  } = useFeedWithType(feedType)
  
  const toggleLikeMutation = useToggleLike()
  const createMutation = useCreateThread()
  const refreshFeed = useRefreshFeed()
  const { user, loading: userLoading } = useCurrentUser()
  
  const [showModal, setShowModal] = useState(false)
  const [activeCommentThreadId, setActiveCommentThreadId] = useState<string | null>(null)
  
  // ✅ Container ref cho virtualizer
  const parentRef = useRef<HTMLDivElement>(null)
  const hasRestoredScroll = useRef(false)
  
  // ✅ Flatten threads từ pages
  const allThreads = (data?.pages?.flatMap((page: any) => page.threads) ?? [])
  
  // ✅ VIRTUALIZER - Chỉ render items trong viewport
  const virtualizer = useVirtualizer({
    count: allThreads.length + (hasNextPage ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 600,
    overscan: 5,
    measureElement: (el) => el?.getBoundingClientRect().height ?? 400,
  })
  
  // ✅ THÊM: Listen event từ Header (chuyển tab)
  useEffect(() => {
    const handleHeaderFeedTypeChange = (e: any) => {
      if (e.detail && e.detail !== feedType) {
        setFeedType(e.detail)
        // Reset scroll khi đổi tab
        hasRestoredScroll.current = false
        if (parentRef.current) {
          parentRef.current.scrollTop = 0
        }
      }
    }
    
    window.addEventListener('headerFeedTypeChange', handleHeaderFeedTypeChange)
    return () => window.removeEventListener('headerFeedTypeChange', handleHeaderFeedTypeChange)
  }, [feedType])
  
  // ✅ THÊM: Dispatch event lên Layout khi feedType thay đổi
  useEffect(() => {
    const event = new CustomEvent('feedTypeChange', { detail: feedType })
    window.dispatchEvent(event)
  }, [feedType])
  
  // ✅ SCROLL RESTORATION
  useEffect(() => {
    if (!hasRestoredScroll.current && allThreads.length > 0) {
      const savedPosition = getScrollPosition()
      
      if (savedPosition && parentRef.current) {
        setTimeout(() => {
          if (savedPosition.pageIndex !== undefined) {
            virtualizer.scrollToIndex(savedPosition.pageIndex, {
              align: 'start',
              behavior: 'auto'
            })
          } else if (savedPosition.offset !== undefined) {
            virtualizer.scrollToOffset(savedPosition.offset, {
              align: 'start',
              behavior: 'auto'
            })
          }
          hasRestoredScroll.current = true
        }, 100)
      } else {
        hasRestoredScroll.current = true
      }
    }
  }, [allThreads.length, virtualizer])
  
  // ✅ LƯU vị trí scroll
  useEffect(() => {
    const handleBeforeUnload = () => {
      const items = virtualizer.getVirtualItems()
      if (items.length > 0) {
        saveScrollPosition(items[0].index, virtualizer.scrollOffset ?? 0)
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      handleBeforeUnload()
    }
  }, [virtualizer])
  
  // ✅ PREFETCH - Load trước khi scroll tới
  useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse()
    
    if (!lastItem) return
    
    const prefetchThreshold = typeof window !== 'undefined' && window.innerWidth <= 768 ? 4 : 10

    if (
      lastItem.index >= allThreads.length - prefetchThreshold &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [
    virtualizer.getVirtualItems(),
    allThreads.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage
  ])
  
  // ✅ STABLE CALLBACKS
  const handleLikeClick = useCallback((threadId: string) => {
    toggleLikeMutation.mutate(threadId)
  }, [toggleLikeMutation])
  
  const handleCommentClick = useCallback((threadId: string) => {
    setActiveCommentThreadId(threadId)
  }, [])
  
  // ✅ SỬA: handlePostThread với force remount virtualizer
  const handlePostThread = useCallback(async (content: string, imageUrls?: string[]) => {
    await createMutation.mutateAsync({ 
      content,
      imageUrls: imageUrls || []
    })
    setShowModal(false)
    
    // 1. Clear scroll cache TRƯỚC
    hasRestoredScroll.current = false
    
    // 2. Invalidate feed
    await queryClient.invalidateQueries({ 
      queryKey: ['feed', feedType, user.id],
      refetchType: 'active'
    })
    
    // 3. Force remount virtualizer bằng key mới
    setVirtualizerKey(prev => prev + 1)
    
    // 4. Scroll về đầu SAU khi remount xong
    setTimeout(() => {
      if (parentRef.current) {
        parentRef.current.scrollTop = 0
      }
    }, 150)
    
  }, [createMutation, queryClient, feedType, user.id])
  
  const handleOpenModal = useCallback(() => {
    setShowModal(true)
  }, [])
  
  const handleCloseModal = useCallback(() => {
    setShowModal(false)
  }, [])
  
  // ✅ Pull to refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshFeed()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refreshFeed])
  
  // ✅ Register Service Worker cho cache ảnh
  useEffect(() => {
    registerServiceWorker()
  }, [])

  if (isLoading || userLoading) {
    return (
      <CustomScrollbar className={styles.mainContainer}>
        <div style={{ padding: '20px' }}>
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
      </CustomScrollbar>
    )
  }

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <>
      {/* ✅ CustomScrollbar bọc TẤT CẢ: CreateThreadInput + Feed */}
      <CustomScrollbar className={styles.mainContainer}>
        {/* ✅ THÊM key vào container của virtualizer */}
        <div ref={parentRef} key={`virtualizer-${virtualizerKey}`}>
          {/* ✅ CreateThreadInput ở đầu, TRONG scroll container */}
          <div onClick={handleOpenModal}>
            <CreateThreadInput avatarText={user.avatar_text} />
          </div>
          
          {/* ✅ THÊM: Empty state cho Following feed */}
          {feedType === 'following' && allThreads.length === 0 && !isLoading && (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#999'
            }}>
              Bạn chưa theo dõi ai. Hãy tìm người để theo dõi!
            </div>
          )}
          
          {/* ✅ Virtual List */}
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative'
            }}
          >
            {virtualItems.map((virtualItem) => {
              const thread = allThreads[virtualItem.index]
              
              if (!thread) {
                return (
                  <div
                    key="loader"
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`
                    }}
                  >
                    <div style={{ 
                      padding: '20px', 
                      textAlign: 'center',
                      color: '#999' 
                    }}>
                      {isFetchingNextPage ? 'Đang tải thêm...' : 'Đã hết thread 🎉'}
                    </div>
                  </div>
                )
              }
              
              return (
                <div
                  key={thread.id}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`
                  }}
                >
                  <ThreadCard
                    id={thread.id}
                    username={thread.username}
                    timestamp={thread.created_at}
                    content={thread.content}
                    medias={thread.medias}
                    likes={thread.likes_count}
                    comments={thread.comments_count}
                    reposts={thread.reposts_count}
                    verified={thread.verified}
                    avatarText={thread.avatar_text}
                    avatarBg={thread.avatar_bg || '#0077B6'}
                    isLiked={thread.is_liked}
                    onLikeClick={handleLikeClick}
                    onCommentClick={handleCommentClick}
                  />
                  
                  {/* ✅ ĐƯA LẠI CommentInput vào trong ThreadCard */}
                  {activeCommentThreadId === thread.id && (
                    <CommentInput
                      threadId={thread.id}
                      onCommentSubmit={() => setActiveCommentThreadId(null)}
                      autoFocus={true}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </CustomScrollbar>
      
      {showModal && (
        <CreateThreadModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onSubmit={handlePostThread}
          username={user.username}
          avatarText={user.avatar_text}
            avatarBg={user.avatar_bg || '#0077B6'}  // ← THÊM

        />
      )}
    </>
  )
}