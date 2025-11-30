'use client'

import React, { useState } from 'react'
// Bỏ next/image vì chặn click event
import ImageModal from '@/components/ImageModal/ImageModal'
import { useToggleLike } from '@/hooks/useThreads'
import styles from './ThreadCard.module.css'

interface ThreadCardProps {
  id: string
  username: string
  timestamp: string
  content: string
  imageUrl?: string
  likes: string
  comments: string
  reposts: string
  verified?: boolean
  avatarText?: string
  isDetailView?: boolean
  isLiked?: boolean
  onCommentClick?: () => void
}

export default function ThreadCard({
  id,
  username,
  timestamp,
  content,
  imageUrl,
  likes,
  comments,
  reposts,
  verified = false,
  avatarText = 'K',
  isDetailView = false,
  isLiked = false,
  onCommentClick,
}: ThreadCardProps) {
  const toggleLikeMutation = useToggleLike()
  const [showImageModal, setShowImageModal] = useState(false)

  const handleLike = () => {
    toggleLikeMutation.mutate(id)
  }

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Vừa xong'
    if (diffHours < 24) return `${diffHours} giờ`
    if (diffHours < 48) return 'Hôm qua'
    
    return date.toLocaleDateString('vi-VN')
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDetailView) return
    
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest(`.${styles.actionButton}`) ||
      target.closest(`.${styles.menuButton}`) ||
      target.closest(`.${styles.threadMedia}`)
    ) {
      return
    }
    
    window.location.href = `/thread/${id}`
  }

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowImageModal(true)
  }

  return (
    <article 
      className={styles.threadCard} 
      onClick={handleCardClick}
      style={{ cursor: isDetailView ? 'default' : 'pointer' }}
    >
      <div className={styles.threadContainer}>
        <div className={styles.threadAvatar}>
          <div className={styles.avatar}>{avatarText}</div>
        </div>

        <div className={styles.threadContent}>
          <header className={styles.threadHeader}>
            <div className={styles.threadHeaderLeft}>
              <span 
                className={styles.username}
                onClick={(e) => {
                  e.stopPropagation()
                  window.location.href = `/profile/${username}`
                }}
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

          {imageUrl && (
            <div 
              className={styles.threadMedia}
              onClick={handleImageClick}
              onKeyDown={(e) => e.key === 'Enter' && setShowImageModal(true)}
              role="button"
              tabIndex={0}
              style={{ cursor: 'zoom-in' }}
            >
              <img 
                src={imageUrl} 
                alt="Thread media"
                loading="lazy"
                style={{
                  width: '100%',
                  height: 'auto',
                  aspectRatio: '1 / 1',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </div>
          )}

          <div className={styles.threadActions}>
            <div 
              className={`${styles.actionButton} ${isLiked ? styles.active : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                handleLike()
              }}
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
              onClick={(e) => {
                e.stopPropagation()
                onCommentClick?.()
              }}
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

      {showImageModal && imageUrl && (
        <ImageModal 
          imageUrl={imageUrl} 
          onClose={() => setShowImageModal(false)} 
        />
      )}
    </article>
  )
}