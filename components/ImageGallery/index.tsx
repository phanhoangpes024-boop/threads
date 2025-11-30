// components/ImageGallery/index.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import type { ImageGalleryProps } from './types'
import styles from './ImageGallery.module.css'

export default function ImageGallery({
  images,
  mode = 'view',
  onDelete,
  onImageClick,
  className = '',
}: ImageGalleryProps) {
  const [imageDimensions, setImageDimensions] = useState<Array<{width: number, height: number}>>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)
  const hasMoved = useRef(false)
  
  // Thêm các biến cho momentum
  const velocity = useRef(0)
  const lastX = useRef(0)
  const lastTime = useRef(0)

  // Load image dimensions
  useEffect(() => {
    const loadImage = (src: string, index: number) => {
      const img = new Image()
      img.onload = () => {
        setImageDimensions(prev => {
          const newDims = [...prev]
          newDims[index] = { width: img.width, height: img.height }
          return newDims
        })
      }
      img.src = src
    }
    images.forEach((src, i) => loadImage(src, i))
  }, [images])

  // Calculate height với logic mới
  const calculateHeight = (origWidth: number, origHeight: number) => {
    const containerWidth = containerRef.current?.clientWidth || 393
    let height = containerWidth * (origHeight / origWidth)
    const ratio = origWidth / origHeight
    
    const isSmallMobile = containerWidth < 400
    const MIN_HEIGHT = isSmallMobile ? 320 : 360
    const PANORAMA_MIN = isSmallMobile ? 260 : 280
    
    if (ratio > 3) {
      height = Math.max(PANORAMA_MIN, Math.min(480, height))
    } else {
      height = Math.max(MIN_HEIGHT, Math.min(560, height))
    }
    
    const finalWidthFromHeight = height * ratio
    if (finalWidthFromHeight < containerWidth * 0.7) {
      height = (containerWidth * 0.7) / ratio
      height = Math.max(MIN_HEIGHT, Math.min(560, height))
    }
    
    return Math.round(height)
  }

  // Mouse drag với momentum
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    isDragging.current = true
    hasMoved.current = false
    startX.current = e.pageX - scrollRef.current.offsetLeft
    scrollLeft.current = scrollRef.current.scrollLeft
    
    // Reset momentum
    lastX.current = e.pageX
    lastTime.current = Date.now()
    velocity.current = 0
    
    scrollRef.current.style.cursor = 'grabbing'
    scrollRef.current.style.scrollBehavior = 'auto'
    scrollRef.current.style.scrollSnapType = 'none'
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return
    e.preventDefault()
    
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX.current) * 2
    
    if (Math.abs(walk) > 5) {
      hasMoved.current = true
    }
    
    // Tính vận tốc
    const now = Date.now()
    const dt = now - lastTime.current
    const dx = e.pageX - lastX.current
    
    if (dt > 0) {
      velocity.current = dx / dt
    }
    
    lastX.current = e.pageX
    lastTime.current = now
    
    scrollRef.current.scrollLeft = scrollLeft.current - walk
  }

  const handleMouseUp = () => {
    if (!scrollRef.current) return
    isDragging.current = false
    scrollRef.current.style.cursor = 'grab'
    
    // Thêm momentum scroll
    const momentumScroll = velocity.current * 200
    
    if (Math.abs(momentumScroll) > 10) {
      scrollRef.current.style.scrollBehavior = 'smooth'
      scrollRef.current.scrollLeft -= momentumScroll
    }
    
    // Không bật lại snap - dừng đâu thì dừng đó
  }

  const handleImageClickInternal = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Chỉ mở modal nếu KHÔNG drag
    if (!hasMoved.current && mode === 'view' && onImageClick) {
      onImageClick(index)
    }
  }

  const handleDelete = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    onDelete?.(index)
  }

  if (images.length === 0) return null

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
        {images.map((src, index) => {
          const dims = imageDimensions[index]
          const height = dims ? calculateHeight(dims.width, dims.height) : 400
          
          return (
            <div
              key={index}
              className={styles.imageItem}
              style={{ height: `${height}px` }}
              onClick={(e) => handleImageClickInternal(index, e)}
            >
              <img
                src={src}
                alt={`Image ${index + 1}`}
                className={styles.image}
                draggable={false}
              />
              
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