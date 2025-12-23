// components/ThreadCard/index.tsx
'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import ImageGallery from '@/components/ImageGallery'
import ImageModal from '@/components/ImageModal/ImageModal'
import LoginPromptModal from '@/components/LoginPromptModal'
import ThreadMenu from '@/components/ThreadMenu'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import type { FeedMedia } from '@/hooks/useFeed'
import styles from './ThreadCard.module.css'

interface ThreadCardProps {
  id: string
  user_id?: string
  avatarBg?: string
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
  onEdit?: (threadId: string, content: string, imageUrls: string[]) => void
  onDelete?: (threadId: string) => void
}

function ThreadCard({
  id,
  user_id,
  username,
  avatarBg, 
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
  onEdit,
  onDelete,
}: ThreadCardProps) {
  const router = useRouter()
  const { user } = useCurrentUser()
  const { requireAuth, showLoginPrompt, closePrompt } = useAuthGuard()
  
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // ✅ Check thread thuộc user hiện tại
  const isOwnThread = user.id && user_id ? user.id === user_id : false

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    requireAuth(() => onLikeClick(id))
  }, [id, onLikeClick, requireAuth])

  const handleComment = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    requireAuth(() => onCommentClick(id))
  }, [id, onCommentClick, requireAuth])

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

  // ✅ Xử lý edit
  const handleEdit = useCallback(() => {
    const imageUrls = medias.map(m => m.url)
    onEdit?.(id, content, imageUrls)
  }, [id, content, medias, onEdit])

  // ✅ Xử lý delete
  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true)
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    onDelete?.(id)
    setShowDeleteConfirm(false)
  }, [id, onDelete])

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteConfirm(false)
  }, [])

  const formattedTime = useMemo(() => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Vừa xong'
    if (diffHours < 24) return `${diffHours} giờ`
    if (diffHours < 48) return 'Hôm qua'
    
    return date.toLocaleDateString('vi-VN')
  }, [timestamp])

  const imageUrls = useMemo(() => {
    if (!Array.isArray(medias) || medias.length === 0) return []
    
    return medias
      .filter(m => {
        const isImage = m.type === 'image' || (m as any).media_type === 'image'
        return isImage && m.url
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(m => m.url)
  }, [medias])

  return (
    <>
      <article 
        className={styles.threadCard}
        onClick={handleCardClick}
      >
        <div className={styles.threadContainer}>
          <div className={styles.threadAvatar}>
            <div 
              className={styles.avatar}
              style={{ background: avatarBg || '#0077B6' }}
            >
              {avatarText}
            </div>
          </div>

          <div className={styles.threadContent}>
            <div className={styles.threadHeader}>
              <div className={styles.threadHeaderLeft}>
                <span 
                  className={styles.username}
                  onClick={handleUsernameClick}
                >
                  {username}
                </span>
                
                {verified && (
                  <div className={styles.verifiedBadge}>
                    <svg viewBox="0 0 22 22">
                      <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
                    </svg>
                  </div>
                )}

                <span className={styles.timestamp}>{formattedTime}</span>
              </div>

              {/* ✅ ThreadMenu */}
              <ThreadMenu
                threadId={id}
                isOwnThread={isOwnThread}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            </div>

            <div className={styles.threadText}>{content}</div>

            {imageUrls.length > 0 && (
              <div className={`${styles.threadMedia} ${imageUrls.length === 1 ? styles.singleImage : ''}`}>
                <ImageGallery
                  images={imageUrls}
                  medias={medias}
                  onImageClick={handleImageClick}
                />
              </div>
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
      </article>

      <LoginPromptModal isOpen={showLoginPrompt} onClose={closePrompt} />

      {showImageModal && imageUrls.length > 0 && (
        <ImageModal 
          images={imageUrls}
          initialIndex={selectedImageIndex}
          onClose={handleCloseModal} 
        />
      )}

      {/* ✅ Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Xóa thread?"
        message="Bạn chắc chắn muốn xóa thread này chứ? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  )
}

export default React.memo(ThreadCard)