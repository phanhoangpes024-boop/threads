// components/ThreadCard/index.tsx - KING VERSION (NO BUGS)
'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ImageGallery from '@/components/ImageGallery'
import ImageModal from '@/components/ImageModal/ImageModal'
import type { FeedMedia } from '@/hooks/useFeed'
import styles from './ThreadCard.module.css'

interface ThreadCardProps {
  id: string
  avatarBg?: string // ← THÊM
  username: string
  timestamp: string
  content: string
  medias?: FeedMedia[]
  likes: number
  comments: number
  reposts: number
  verified?: boolean
  avatarText?: string
  isLiked?: boolean
  onLikeClick: (threadId: string) => void
  onCommentClick: (threadId: string) => void
}

// ✅ FIX 1: Không memo ở đây nữa
function ThreadCard({
  id,
  username,
  timestamp,
  content,
  medias = [],
  likes,
  comments,
  reposts,
  verified = false,
  avatarText = 'K',
  isLiked = false,
  onLikeClick,
  onCommentClick,
}: ThreadCardProps) {
  const router = useRouter()
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onLikeClick(id)
  }, [id, onLikeClick])

  const handleComment = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onCommentClick(id)
  }, [id, onCommentClick])

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest(`.${styles.actionButton}`) ||
      target.closest(`.${styles.menuButton}`) ||
      target.closest(`.${styles.threadMedia}`)
    ) {
      return
    }
    router.push(`/thread/${id}`)
  }, [id, router])

  const handleImageClick = useCallback((index: number) => {
    setSelectedImageIndex(index)
    setShowImageModal(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowImageModal(false)
  }, [])

  const handleUsernameClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/profile/${username}`)
  }, [username, router])

  const formatTimestamp = useCallback((ts: string) => {
    const date = new Date(ts)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Vừa xong'
    if (diffHours < 24) return `${diffHours} giờ`
    if (diffHours < 48) return 'Hôm qua'
    
    return date.toLocaleDateString('vi-VN')
  }, [])

  const imageUrls = React.useMemo(() => {
    if (!Array.isArray(medias) || medias.length === 0) return []
    
    return medias
      .filter(m => {
        const isImage = m.type === 'image' || (m as any).media_type === 'image'
        return isImage && m.url
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(m => m.url)
  }, [medias])

  const isSingleImage = imageUrls.length === 1
  const hasImages = imageUrls.length > 0

  return (
    <article 
      className={styles.threadCard} 
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <div className={styles.threadContainer}>
        <div className={styles.threadAvatar}>
  <div 
    className={styles.avatar}
    style={{ background: avatarBg || '#0077B6' }} // ← Dùng màu động
  >
    {avatarText}
  </div>
</div>

        <div className={styles.threadContent}>
          <header className={styles.threadHeader}>
            <div className={styles.threadHeaderLeft}>
              <span 
                className={styles.username}
                onClick={handleUsernameClick}
              >{username}</span>
              {verified && (
                <div className={styles.verifiedBadge}>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
              )}
              <span className={styles.timestamp}>{formatTimestamp(timestamp)}</span>
            </div>
            <div className={styles.menuButton}>
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </div>
          </header>

          <div className={styles.threadText}>{content}</div>

          {hasImages && (
            <>
              {isSingleImage ? (
                <div 
                  className={`${styles.threadMedia} ${styles.singleImage}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleImageClick(0)
                  }}
                >
                  <img 
                    src={imageUrls[0]} 
                    alt="Thread image"
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              ) : (
                <div className={styles.threadMedia}>
                  <ImageGallery
                    images={imageUrls}
                    mode="view"
                    onImageClick={handleImageClick}
                  />
                </div>
              )}
            </>
          )}

          <div className={styles.threadActions}>
            <div 
              className={`${styles.actionButton} ${isLiked ? styles.active : ''}`}
              onClick={handleLike}
            >
              <div className={styles.actionIcon}>
                <svg viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <span className={styles.actionCount}>{likes}</span>
            </div>

            <div 
              className={styles.actionButton}
              onClick={handleComment}
            >
              <div className={styles.actionIcon}>
                <svg viewBox="0 0 24 24">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <span className={styles.actionCount}>{comments}</span>
            </div>

            <div className={styles.actionButton}>
              <div className={styles.actionIcon}>
                <svg viewBox="0 0 24 24">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              </div>
              <span className={styles.actionCount}>{reposts}</span>
            </div>

            <div className={styles.actionButton}>
              <div className={styles.actionIcon}>
                <svg viewBox="0 0 24 24">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showImageModal && imageUrls.length > 0 && (
        <ImageModal 
          images={imageUrls}
          initialIndex={selectedImageIndex}
          onClose={handleCloseModal} 
        />
      )}
    </article>
  )
}

// ✅ FIX 2: areEqual chặt chẽ 100% - Check tất cả IDs
const areEqual = (prev: ThreadCardProps, next: ThreadCardProps) => {
  // Nếu medias là undefined/null
  if (!prev.medias && !next.medias) return (
    prev.id === next.id &&
    prev.likes === next.likes &&
    prev.comments === next.comments &&
    prev.reposts === next.reposts &&
    prev.isLiked === next.isLiked &&
    prev.content === next.content
  )
  
  // Nếu 1 bên có, 1 bên không có
  if (!prev.medias || !next.medias) return false
  
  // Check length
  if (prev.medias.length !== next.medias.length) return false
  
  // ✅ Check TẤT CẢ IDs (không chỉ ảnh đầu)
  const prevIds = prev.medias.map(m => m.id).join(',')
  const nextIds = next.medias.map(m => m.id).join(',')
  
  return (
    prev.id === next.id &&
    prev.likes === next.likes &&
    prev.comments === next.comments &&
    prev.reposts === next.reposts &&
    prev.isLiked === next.isLiked &&
    prev.content === next.content &&
    prevIds === nextIds  // ✅ So sánh tất cả IDs
  )
}

// ✅ FIX 1: Chỉ memo 1 lần duy nhất ở đây
export default React.memo(ThreadCard, areEqual)