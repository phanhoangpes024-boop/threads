// components/ImageGallery/index.tsx - WITH ELASTIC BOUNCE
import React, { useState, useRef, useCallback, useEffect } from 'react'
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
  
  // âœ… ELASTIC BOUNCE STATE
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)
  const hasMoved = useRef(false)
  const currentX = useRef(0)

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

  // âœ… MOUSE HANDLERS
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
    
    // âœ… ELASTIC RESISTANCE
    if (newScroll < 0) {
      // KÃ©o trÃ¡i quÃ¡
      const overscroll = Math.abs(newScroll)
      const damped = overscroll * RESISTANCE
      scrollRef.current.scrollLeft = 0
      scrollRef.current.style.transform = `translateX(${Math.min(damped, 210)}px)`
    } else if (newScroll > maxScroll) {
      // KÃ©o pháº£i quÃ¡
      const overscroll = newScroll - maxScroll
      const damped = overscroll * RESISTANCE
      scrollRef.current.scrollLeft = maxScroll
      scrollRef.current.style.transform = `translateX(-${Math.min(damped, 210)}px)`
    } else {
      // Trong giá»›i háº¡n bÃ¬nh thÆ°á»ng
      scrollRef.current.scrollLeft = newScroll
      scrollRef.current.style.transform = 'translateX(0)'
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    if (!scrollRef.current) return
    
    isDragging.current = false
    scrollRef.current.classList.remove(styles.isDragging)
    
    // âœ… BOUNCE BACK
    scrollRef.current.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
    scrollRef.current.style.transform = 'translateX(0)'
    
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.style.transition = ''
      }
    }, 400)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (isDragging.current) {
      handleMouseUp()
    }
  }, [handleMouseUp])

  // âœ… TOUCH HANDLERS
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!scrollRef.current) return
    const touch = e.touches[0]
    isDragging.current = true
    hasMoved.current = false
    scrollRef.current.classList.add(styles.isDragging)
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

  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages(prev => new Set(prev).add(index))
  }, [])

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
          {!loadedImages.has(0) && <div className={styles.skeleton} />}
          
          {isInViewport && (
            <img
              src={images[0]}
              alt="Thread image"
              className={`${styles.singleImage} ${loadedImages.has(0) ? styles.loaded : ''}`}
              loading="lazy"
              onLoad={() => handleImageLoad(0)}
            />
          )}
          
          {mode === 'edit' && onDelete && (
            <button className={styles.deleteBtn} onClick={(e) => handleDelete(e, 0)}>
              Ã—
            </button>
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
          {images.map((url, index) => {
            const isLoaded = loadedImages.has(index)
            
            return (
              <div
                key={index}
                className={styles.gridTwoItem}
                onClick={(e) => handleImageClick(index, e)}
              >
                {!isLoaded && <div className={styles.skeleton} />}
                
                {isInViewport && (
                  <img
                    src={url}
                    alt={`Image ${index + 1}`}
                    className={`${styles.gridTwoImage} ${isLoaded ? styles.loaded : ''}`}
                    loading="lazy"
                    onLoad={() => handleImageLoad(index)}
                  />
                )}
                
                {mode === 'edit' && onDelete && (
                  <button className={styles.deleteBtn} onClick={(e) => handleDelete(e, index)}>
                    Ã—
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // CASE 3+: Film Strip vá»›i ELASTIC BOUNCE
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
        onMouseLeave={handleMouseLeave}
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
                  src={url}
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
                  Ã—
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}