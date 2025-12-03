// components/ImageGallery/index.tsx - FILM STRIP FINAL
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { getOptimalImageUrl } from '@/lib/imageTransform'
import type { FeedMedia } from '@/hooks/useFeed'
import styles from './ImageGallery.module.css'

interface ImageGalleryProps {
  images: string[]
  medias?: FeedMedia[]
  mode?: 'view' | 'edit'
  onDelete?: (index: number) => void
  onImageClick?: (index: number) => void
  className?: string
}

export default function ImageGallery({
  images,
  medias = [],
  mode = 'view',
  onDelete,
  onImageClick,
  className = '',
}: ImageGalleryProps) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [isInViewport, setIsInViewport] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Drag state
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)
  const hasMoved = useRef(false)

  // ✅ Intersection Observer cho lazy load
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
      { rootMargin: '200px', threshold: 0.01 }
    )
    
    observer.observe(containerRef.current)
    
    return () => observer.disconnect()
  }, [])

  // ✅ Mouse drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return
    isDragging.current = true
    hasMoved.current = false
    scrollRef.current.style.scrollBehavior = 'auto'
    startX.current = e.pageX - scrollRef.current.offsetLeft
    scrollLeft.current = scrollRef.current.scrollLeft
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return
    e.preventDefault()
    
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX.current) * 2
    
    if (Math.abs(walk) > 5) hasMoved.current = true
    scrollRef.current.scrollLeft = scrollLeft.current - walk
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    if (scrollRef.current) {
      scrollRef.current.style.scrollBehavior = 'smooth'
    }
  }, [])

  // ✅ Touch support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!scrollRef.current) return
    const touch = e.touches[0]
    isDragging.current = true
    hasMoved.current = false
    scrollRef.current.style.scrollBehavior = 'auto'
    startX.current = touch.pageX - scrollRef.current.offsetLeft
    scrollLeft.current = scrollRef.current.scrollLeft
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !scrollRef.current) return
    const touch = e.touches[0]
    
    const x = touch.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX.current) * 1.5
    
    if (Math.abs(walk) > 5) hasMoved.current = true
    scrollRef.current.scrollLeft = scrollLeft.current - walk
  }, [])

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false
    if (scrollRef.current) {
      scrollRef.current.style.scrollBehavior = 'smooth'
    }
  }, [])

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

  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages(prev => new Set(prev).add(index))
  }, [])

  if (!images || images.length === 0) return null

  // ✅ CASE 1: Single Image
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
          {!loadedImages.has(0) && <div className={styles.skeleton} />}
          
          {isInViewport && (
            <img
              src={getOptimalImageUrl(images[0])}
              alt="Thread image"
              className={`${styles.singleImage} ${loadedImages.has(0) ? styles.loaded : ''}`}
              loading="lazy"
              onLoad={() => handleImageLoad(0)}
            />
          )}
          
          {mode === 'edit' && onDelete && (
            <button className={styles.deleteBtn} onClick={(e) => handleDelete(e, 0)}>
              ×
            </button>
          )}
        </div>
      </div>
    )
  }

  // ✅ CASE 2+: Film Strip
  return (
    <div 
      ref={containerRef}
      className={`${styles.gallery} ${styles.chainWrapper} ${className}`}
    >
      <div
        ref={scrollRef}
        className={styles.chainScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {images.map((url, index) => {
          const isLoaded = loadedImages.has(index)
          const showOverlay = index === 4 && images.length > 5
          
          return (
            <div
              key={index}
              className={styles.chainItem}
              onClick={(e) => handleImageClick(index, e)}
            >
              {!isLoaded && <div className={styles.skeleton} />}
              
              {isInViewport && (
                <img
                  src={getOptimalImageUrl(url)}
                  alt={`Image ${index + 1}`}
                  className={`${styles.chainImage} ${isLoaded ? styles.loaded : ''}`}
                  loading="lazy"
                  draggable={false}
                  onLoad={() => handleImageLoad(index)}
                />
              )}
              
              {showOverlay && (
                <div className={styles.overlay}>
                  +{images.length - 5}
                </div>
              )}
              
              {mode === 'edit' && onDelete && (
                <button className={styles.deleteBtn} onClick={(e) => handleDelete(e, index)}>
                  ×
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}