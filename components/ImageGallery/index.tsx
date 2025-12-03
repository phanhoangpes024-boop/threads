// components/ImageGallery/index.tsx - OPTIMIZED WITH LAZY LOAD
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { getOptimalImageUrl } from '@/lib/imageTransform'
import type { ImageGalleryProps } from './types'
import styles from './ImageGallery.module.css'

export default function ImageGallery({
  images,
  mode = 'view',
  onDelete,
  onImageClick,
  className = '',
}: ImageGalleryProps) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [isInViewport, setIsInViewport] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  
  // Drag state
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)
  const hasMoved = useRef(false)

  // ✅ INTERSECTION OBSERVER với DEBOUNCE
  useEffect(() => {
    if (!containerRef.current) return
    
    let timeoutId: NodeJS.Timeout
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // ✅ Debounce 150ms để tránh load quá nhiều ảnh cùng lúc
          clearTimeout(timeoutId)
          timeoutId = setTimeout(() => {
            setIsInViewport(entry.isIntersecting)
          }, 150)
        })
      },
      {
        rootMargin: '200px',
        threshold: 0.01
      }
    )
    
    observerRef.current.observe(containerRef.current)
    
    return () => {
      clearTimeout(timeoutId)
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  // ✅ Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return
    isDragging.current = true
    hasMoved.current = false
    startX.current = e.pageX - scrollRef.current.offsetLeft
    scrollLeft.current = scrollRef.current.scrollLeft
    scrollRef.current.style.cursor = 'grabbing'
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return
    e.preventDefault()
    
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX.current) * 2
    
    if (Math.abs(walk) > 15) {
      hasMoved.current = true
    }
    
    scrollRef.current.scrollLeft = scrollLeft.current - walk
  }, [])

  const handleMouseUp = useCallback(() => {
    if (!scrollRef.current) return
    isDragging.current = false
    scrollRef.current.style.cursor = 'grab'
  }, [])

  const handleImageClickInternal = useCallback((index: number, e: React.MouseEvent) => {
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

  if (!images || images.length === 0) {
    return null
  }

  return (
    <div ref={containerRef} className={`${styles.gallery} ${className}`}>
      <div
        ref={scrollRef}
        className={styles.scrollContainer}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {images.map((originalUrl, index) => {
          const optimizedUrl = getOptimalImageUrl(originalUrl)
          const isLoaded = loadedImages.has(index)
          
          return (
            <div
              key={`${index}-${originalUrl}`}
              className={styles.imageItem}
              onClick={(e) => handleImageClickInternal(index, e)}
              style={{
                // ✅ ASPECT RATIO cố định để tránh layout shift
                aspectRatio: '4 / 3',
                minHeight: '360px'
              }}
            >
              {/* ✅ Skeleton placeholder */}
              {!isLoaded && (
                <div className={styles.skeleton} />
              )}
              
              {/* ✅ Chỉ load ảnh khi vào viewport */}
              {isInViewport && (
                <img
                  src={optimizedUrl}
                  alt={`Image ${index + 1}`}
                  className={`${styles.image} ${isLoaded ? styles.loaded : ''}`}
                  draggable={false}
                  loading="lazy"
                  onLoad={() => handleImageLoad(index)}
                  onError={(e) => {
                    console.error('[ImageGallery] Failed to load:', index)
                    handleImageLoad(index) // Mark as loaded để ẩn skeleton
                  }}
                />
              )}
              
              {mode === 'edit' && onDelete && (
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => handleDelete(e, index)}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" />
                    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}