// components/ImageGallery/index.tsx - PREMIUM: Physics-based Momentum
import React, { useState, useRef, useCallback, useEffect, memo } from 'react'
import type { FeedMedia } from '@/hooks/useFeed'
import { getOptimalImageUrl } from '@/lib/imageTransform'
import styles from './ImageGallery.module.css'

interface ImageGalleryProps {
  images: string[]
  medias?: FeedMedia[]
  mode?: 'view' | 'edit'
  onDelete?: (index: number) => void
  onImageClick?: (index: number) => void
  className?: string
}

interface ImageItemProps {
  src: string
  alt: string
  index: number
  imageClassName: string
  itemClassName: string
  mode: 'view' | 'edit'
  showOverlay?: boolean
  overlayCount?: number
  onLoad: (index: number) => void
  onDelete?: (e: React.MouseEvent, index: number) => void
  onClick?: (index: number, e: React.MouseEvent) => void
}

const ImageItem = memo(({ 
  src, 
  alt, 
  index, 
  imageClassName,
  itemClassName,
  mode,
  showOverlay,
  overlayCount,
  onLoad, 
  onDelete,
  onClick 
}: ImageItemProps) => {
  const [loaded, setLoaded] = useState(false)

  const handleLoad = useCallback(() => {
    setLoaded(true)
    onLoad(index)
  }, [index, onLoad])

  const handleClick = useCallback((e: React.MouseEvent) => {
    onClick?.(index, e)
  }, [index, onClick])

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    onDelete?.(e, index)
  }, [index, onDelete])

  const optimizedSrc = src

  return (
    <div className={itemClassName} onClick={handleClick}>
      {!loaded && <div className={styles.skeleton} />}
      
      <img
        src={optimizedSrc}
        alt={alt}
        className={`${imageClassName} ${loaded ? styles.loaded : ''}`}
        loading="lazy"
        decoding="async"
        draggable={false}
        onLoad={handleLoad}
        style={{
          objectFit: 'cover',
          width: '100%',
          height: '100%',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
      />
      
      {showOverlay && overlayCount && overlayCount > 0 && (
        <div className={styles.overlay}>
          <span>+{overlayCount}</span>
        </div>
      )}
      
      {mode === 'edit' && onDelete && (
        <button className={styles.deleteBtn} onClick={handleDeleteClick}>
          ×
        </button>
      )}
    </div>
  )
})

ImageItem.displayName = 'ImageItem'

export default function ImageGallery({
  images,
  medias = [],
  mode = 'view',
  onDelete,
  onImageClick,
  className = '',
}: ImageGalleryProps) {
  const [isInViewport, setIsInViewport] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Drag state (CHỈ cho Desktop/Mouse)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)
  const hasMoved = useRef(false)
  
  // Momentum state
  const velocity = useRef(0)
  const animationFrame = useRef<number | undefined>(undefined)
  
  // ✅ THÊM REF ĐỂ TÍNH TOÁN MƯỢT HƠN
  const lastMousePosition = useRef<{ x: number; time: number } | null>(null)

  // Lazy load observer
  useEffect(() => {
    if (!containerRef.current) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInViewport(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '100px', threshold: 0.01 }
    )
    
    observer.observe(containerRef.current)
    
    return () => observer.disconnect()
  }, [])

  // Cleanup animation frame
  useEffect(() => {
    return () => {
      if (animationFrame.current !== undefined) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [])

  const handleImageLoad = useCallback((index: number) => {
    // Component tự quản lý
  }, [])

  // ✅ 1. TỐI ƯU HÓA HÀM MOMENTUM (VẬT LÝ TRÔI)
  const applyMomentum = useCallback(() => {
    if (!scrollRef.current) return
    
    // Ma sát thấp hơn (0.97) để trôi mượt và xa hơn (cảm giác "băng")
    // Muốn trôi xa nữa thì tăng lên 0.98-0.99, muốn dừng nhanh thì giảm xuống 0.95
    velocity.current *= 0.97
    
    // Ngưỡng dừng nhỏ hơn để nó trôi đến tận cùng lực
    if (Math.abs(velocity.current) < 0.1) {
      velocity.current = 0
      if (animationFrame.current !== undefined) {
        cancelAnimationFrame(animationFrame.current)
      }
      return
    }

    scrollRef.current.scrollLeft -= velocity.current
    
    animationFrame.current = requestAnimationFrame(applyMomentum)
  }, [])

  // --- LOGIC MOUSE (DESKTOP) ĐÃ NÂNG CẤP ---

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return
    
    // Dừng momentum cũ ngay lập tức
    if (animationFrame.current !== undefined) {
      cancelAnimationFrame(animationFrame.current)
    }
    
    isDragging.current = true
    hasMoved.current = false
    
    // Thêm class vào body để tránh cursor bị nhấp nháy khi kéo ra ngoài div
    document.body.style.cursor = 'grabbing'
    scrollRef.current.classList.add(styles.isDragging)
    
    startX.current = e.pageX
    scrollLeft.current = scrollRef.current.scrollLeft
    
    // Reset bộ đếm vận tốc
    velocity.current = 0
    lastMousePosition.current = { x: e.pageX, time: Date.now() }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return
    e.preventDefault()
    
    const x = e.pageX
    const walk = x - startX.current
    
    if (Math.abs(walk) > 5) {
      hasMoved.current = true
    }
    
    scrollRef.current.scrollLeft = scrollLeft.current - walk

    // ✅ TÍNH VẬN TỐC (CÔNG THỨC MỚI)
    const now = Date.now()
    
    // Chỉ tính toán vận tốc mỗi ~16ms (1 frame) hoặc hơn để tránh nhiễu
    if (lastMousePosition.current && now - lastMousePosition.current.time > 16) {
      const dt = now - lastMousePosition.current.time
      const dx = x - lastMousePosition.current.x
      
      // Vận tốc = quãng đường / thời gian
      // Multiplier * 20 để tăng độ "văng" khi vuốt nhẹ
      const newVelocity = (dx / dt) * 20

      // Dùng Linear Interpolation (Lerp) để làm mượt vận tốc,
      // tránh trường hợp vận tốc bị giật cục do mouse polling rate
      velocity.current = velocity.current * 0.2 + newVelocity * 0.8
      
      lastMousePosition.current = { x, time: now }
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    if (!scrollRef.current) return
    
    isDragging.current = false
    document.body.style.cursor = '' // Trả lại cursor
    scrollRef.current.classList.remove(styles.isDragging)
    
    // Nếu vừa thả chuột, kiểm tra xem lần di chuyển cuối cùng cách đây bao lâu
    // Nếu > 100ms nghĩa là người dùng đã dừng tay lại rồi mới thả -> Vận tốc = 0
    const timeSinceLastMove = Date.now() - (lastMousePosition.current?.time || 0)
    
    if (timeSinceLastMove > 100) {
      velocity.current = 0
    }

    // Kích hoạt momentum nếu còn vận tốc dư
    if (Math.abs(velocity.current) > 1) {
      applyMomentum()
    }
  }, [applyMomentum])

  const handleMouseLeave = useCallback(() => {
    if (isDragging.current) {
      handleMouseUp()
    }
  }, [handleMouseUp])

  // --- MOBILE: KHÔNG CẦN JS HANDLERS ---
  // Browser native scroll làm tốt hơn chúng ta nhiều
  // ❌ ĐÃ XÓA: onTouchStart, onTouchMove, onTouchEnd

  const handleImageClick = useCallback((index: number, e: React.MouseEvent) => {
    // Nếu vừa drag thì không trigger click
    if (hasMoved.current) {
      e.stopPropagation()
      return
    }
    
    if (mode === 'view' && onImageClick) {
      onImageClick(index)
    }
  }, [mode, onImageClick])

  const handleDelete = useCallback((e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    onDelete?.(index)
  }, [onDelete])

  if (!images || images.length === 0) return null

  // CASE 1: Single Image
  if (images.length === 1) {
    const media = medias[0]
    const aspectRatio = media?.width && media?.height 
      ? `${media.width}/${media.height}` 
      : undefined
    
    return (
      <div 
        ref={containerRef}
        className={`${styles.gallery} ${styles.layoutSingle} ${className}`}
        onClick={(e) => handleImageClick(0, e)}
      >
        <div className={styles.singleWrapper} style={{ aspectRatio }}>
          {isInViewport && (
            <ImageItem
              src={images[0]}
              alt="Thread image"
              index={0}
              imageClassName={styles.singleImage}
              itemClassName=""
              mode={mode}
              onLoad={handleImageLoad}
              onDelete={onDelete ? handleDelete : undefined}
            />
          )}
        </div>
      </div>
    )
  }

  // CASE 2: Grid 2 Images
  if (images.length === 2) {
    return (
      <div 
        ref={containerRef}
        className={`${styles.gallery} ${className}`}
      >
        <div className={styles.gridTwo}>
          {isInViewport && images.map((url, index) => (
            <ImageItem
              key={index}
              src={url}
              alt={`Image ${index + 1}`}
              index={index}
              imageClassName={styles.gridTwoImage}
              itemClassName={styles.gridTwoItem}
              mode={mode}
              onLoad={handleImageLoad}
              onClick={handleImageClick}
              onDelete={onDelete ? handleDelete : undefined}
            />
          ))}
        </div>
      </div>
    )
  }

  // CASE 3+: Horizontal Scroll Chain - Physics-based momentum cho Desktop
  const MAX_VISIBLE = 5
  const displayImages = images.slice(0, MAX_VISIBLE)
  const remainingCount = images.length - MAX_VISIBLE

  return (
    <div ref={containerRef} className={`${styles.gallery} ${className}`}>
      <div
        ref={scrollRef}
        className={styles.chainScroll}
        // ✅ CHỈ GÁN SỰ KIỆN MOUSE CHO DESKTOP
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        // ❌ ĐÃ XÓA: onTouchStart, onTouchMove, onTouchEnd
        // → Mobile dùng native scroll (mượt hơn nhiều)
      >
        {isInViewport && displayImages.map((url, index) => {
          const isLastVisible = index === MAX_VISIBLE - 1
          const showOverlay = isLastVisible && remainingCount > 0
          
          return (
            <ImageItem
              key={index}
              src={url}
              alt={`Image ${index + 1}`}
              index={index}
              imageClassName={styles.chainImage}
              itemClassName={styles.chainItem}
              mode={mode}
              showOverlay={showOverlay}
              overlayCount={remainingCount}
              onLoad={handleImageLoad}
              onClick={handleImageClick}
              onDelete={onDelete ? handleDelete : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}