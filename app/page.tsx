// app/page.tsx
'use client'

import CreateThreadInputSkeleton from '@/components/Skeletons/CreateThreadInputSkeleton'
import ThreadCardSkeleton from '@/components/Skeletons/ThreadCardSkeleton'
import { useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useVirtualizer } from '@tanstack/react-virtual'
import dynamic from 'next/dynamic'
import CustomScrollbar from '@/components/CustomScrollbar'
import CreateThreadInput from '@/components/CreateThreadInput'
import ThreadCard from '@/components/ThreadCard'
import CommentInput from '@/components/CommentInput'
import { useFeedWithType, type FeedType } from '@/hooks/useFeedWithType'
import { useToggleLike, useRefreshFeed, saveScrollPosition, getScrollPosition } from '@/hooks/useFeed'
import { useCreateThread } from '@/hooks/useThreads'
import { useDeleteThread, useUpdateThread } from '@/hooks/useThreadMutations'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { registerServiceWorker } from '@/lib/registerSW'
import styles from './page.module.css'

const CreateThreadModal = dynamic(
  () => import('@/components/CreateThreadModal'),
  { ssr: false }
)

export default function Home() {
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const feedType = (searchParams.get('feed') || 'for-you') as FeedType
  
  const [virtualizerKey, setVirtualizerKey] = useState(0)
  
  const { 
    data, 
    isLoading, 
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage 
  } = useFeedWithType(feedType)
  
  const toggleLikeMutation = useToggleLike()
  const createMutation = useCreateThread()
  const deleteMutation = useDeleteThread()
  const updateMutation = useUpdateThread()
  const refreshFeed = useRefreshFeed()
  const { user, loading: userLoading, isGuest } = useCurrentUser()  
  
  const [showModal, setShowModal] = useState(false)
  const [activeCommentThreadId, setActiveCommentThreadId] = useState<string | null>(null)
  
  // ✅ Edit mode state
  const [editThreadId, setEditThreadId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editImageUrls, setEditImageUrls] = useState<string[]>([])
  
  const parentRef = useRef<HTMLDivElement>(null)
  const hasRestoredScroll = useRef(false)
  
  const allThreads = (data?.pages?.flatMap((page: any) => page.threads) ?? [])
  
  const virtualizer = useVirtualizer({
    count: allThreads.length + (hasNextPage ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 600,
    overscan: 5,
    measureElement: (el) => el?.getBoundingClientRect().height ?? 400,
  })
  
  // Reset virtualizer khi đổi feed type
  useEffect(() => {
    setVirtualizerKey(prev => prev + 1)
    hasRestoredScroll.current = false
    if (parentRef.current) {
      parentRef.current.scrollTop = 0
    }
  }, [feedType])
  
  // Restore scroll position
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
  
  // Save scroll position before unload
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
  
  // Infinite scroll
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
  
  const handleLikeClick = useCallback((threadId: string) => {
    toggleLikeMutation.mutate(threadId)
  }, [toggleLikeMutation])
  
  const handleCommentClick = useCallback((threadId: string) => {
    setActiveCommentThreadId(threadId)
  }, [])
  
  const handlePostThread = useCallback(async (content: string, imageUrls?: string[]) => {
    try {
      if (editThreadId) {
        // ✅ UPDATE mode
        await updateMutation.mutateAsync({
          threadId: editThreadId,
          content,
          imageUrls: imageUrls || []
        })
      } else {
        // ✅ CREATE mode
        await createMutation.mutateAsync({ 
          content,
          imageUrls: imageUrls || []
        })
      }
      
      setShowModal(false)
      setEditThreadId(null)
      setEditContent('')
      setEditImageUrls([])
      
      hasRestoredScroll.current = false
      setVirtualizerKey(prev => prev + 1)
      
      setTimeout(() => {
        if (parentRef.current) {
          parentRef.current.scrollTop = 0
        }
      }, 150)
    } catch (error) {
      console.error('Error:', error)
    }
  }, [editThreadId, createMutation, updateMutation])

  // ✅ Xử lý edit
  const handleEdit = useCallback((threadId: string, content: string, imageUrls: string[]) => {
    setEditThreadId(threadId)
    setEditContent(content)
    setEditImageUrls(imageUrls)
    setShowModal(true)
  }, [])

  // ✅ Xử lý delete
  const handleDelete = useCallback(async (threadId: string) => {
    try {
      await deleteMutation.mutateAsync(threadId)
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }, [deleteMutation])

  const handleOpenModal = useCallback(() => {
    setEditThreadId(null)
    setEditContent('')
    setEditImageUrls([])
    setShowModal(true)
  }, [])
  
  const handleCloseModal = useCallback(() => {
    setShowModal(false)
    setEditThreadId(null)
    setEditContent('')
    setEditImageUrls([])
  }, [])
  
  // Refresh feed khi tab visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshFeed()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refreshFeed])
  
  // Register service worker
  useEffect(() => {
    registerServiceWorker()
  }, [])

  if (isLoading || userLoading) {
    return (
      <CustomScrollbar className={styles.mainContainer}>
        <div>
          <CreateThreadInputSkeleton />
          <ThreadCardSkeleton />
          <ThreadCardSkeleton hasImage />
          <ThreadCardSkeleton />
          <ThreadCardSkeleton hasImage />
          <ThreadCardSkeleton />
        </div>
      </CustomScrollbar>
    )
  }

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <>
      <CustomScrollbar className={styles.mainContainer}>
        <div ref={parentRef} key={`virtualizer-${virtualizerKey}`}>
          {!isGuest && (
            <div onClick={handleOpenModal}>
              <CreateThreadInput 
                avatarText={user.avatar_text}  
                avatarBg={user.avatar_bg || '#0077B6'}
              />
            </div>
          )}
          
          {feedType === 'following' && allThreads.length === 0 && !isLoading && (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#999'
            }}>
              Bạn chưa theo dõi ai. Hãy tìm người để theo dõi!
            </div>
          )}
          
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
              paddingBottom: '100px'
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
                    user_id={thread.user_id}
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
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                  
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
          avatarBg={user.avatar_bg || '#0077B6'}
          editMode={!!editThreadId}
          initialContent={editContent}
          initialImageUrls={editImageUrls}
          threadId={editThreadId || undefined}
        />
      )}
    </>
  )
}