// components/ImageGallery/index.tsx - OPTIMIZED với CDN Transform
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

  // ✅ Resize ảnh responsive: 800px desktop, 600px mobile
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
  
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)
  const hasMoved = useRef(false)
  const currentX = useRef(0)

  // ✅ Giảm rootMargin từ 400px xuống 100px
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

  const handleImageLoad = useCallback((index: number) => {
    // Component con tự quản lý
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return
    isDragging.current = true
    hasMoved.current = false
    scrollRef.current.classList.add(styles.isDragging)
    startX.current = e.pageX
    currentX.current = e.pageX
    scrollLeft.current = scrollRef.current.scrollLeft
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return
    e.preventDefault()
    
    currentX.current = e.pageX
    const deltaX = currentX.current - startX.current
    const newScroll = scrollLeft.current - deltaX
    
    const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth
    const RESISTANCE = 0.3
    
    if (Math.abs(deltaX) > 5) hasMoved.current = true
    
    if (newScroll < 0) {
      const overscroll = Math.abs(newScroll)
      const damped = overscroll * RESISTANCE
      scrollRef.current.scrollLeft = 0
      scrollRef.current.style.transform = `translateX(${Math.min(damped, 210)}px)`
    } else if (newScroll > maxScroll) {
      const overscroll = newScroll - maxScroll
      const damped = overscroll * RESISTANCE
      scrollRef.current.scrollLeft = maxScroll
      scrollRef.current.style.transform = `translateX(-${Math.min(damped, 210)}px)`
    } else {
      scrollRef.current.scrollLeft = newScroll
      scrollRef.current.style.transform = 'translateX(0)'
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    if (!scrollRef.current) return
    
    isDragging.current = false
    scrollRef.current.classList.remove(styles.isDragging)
    scrollRef.current.classList.add(styles.bouncing)
    
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.style.transform = 'translateX(0)'
        scrollRef.current.classList.remove(styles.bouncing)
      }
    }, 50)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (isDragging.current) handleMouseUp()
  }, [handleMouseUp])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!scrollRef.current) return
    isDragging.current = true
    hasMoved.current = false
    const touch = e.touches[0]
    startX.current = touch.pageX
    currentX.current = touch.pageX
    scrollLeft.current = scrollRef.current.scrollLeft
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !scrollRef.current) return
    const touch = e.touches[0]
    
    currentX.current = touch.pageX
    const deltaX = currentX.current - startX.current
    const newScroll = scrollLeft.current - deltaX
    
    const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth
    const RESISTANCE = 0.3
    
    if (Math.abs(deltaX) > 5) hasMoved.current = true
    
    if (newScroll < 0) {
      const overscroll = Math.abs(newScroll)
      const damped = overscroll * RESISTANCE
      scrollRef.current.scrollLeft = 0
      scrollRef.current.style.transform = `translateX(${Math.min(damped, 210)}px)`
    } else if (newScroll > maxScroll) {
      const overscroll = newScroll - maxScroll
      const damped = overscroll * RESISTANCE
      scrollRef.current.scrollLeft = maxScroll
      scrollRef.current.style.transform = `translateX(-${Math.min(damped, 210)}px)`
    } else {
      scrollRef.current.scrollLeft = newScroll
      scrollRef.current.style.transform = 'translateX(0)'
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    handleMouseUp()
  }, [handleMouseUp])

  const handleImageClick = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!hasMoved.current && mode === 'view' && onImageClick) {
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

  // CASE 3+: Horizontal Scroll Chain
  const MAX_VISIBLE = 5
  const displayImages = images.slice(0, MAX_VISIBLE)
  const remainingCount = images.length - MAX_VISIBLE

  return (
    <div ref={containerRef} className={`${styles.gallery} ${className}`}>
      <div
        ref={scrollRef}
        className={styles.chainScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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