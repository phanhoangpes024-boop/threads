// components/ImageGallery/index.tsx - FIXED WITH DEBUG
'use client'

import { useState, useRef, useEffect } from 'react'
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
  const [imageDimensions, setImageDimensions] = useState<Array<{width: number, height: number}>>([])
  const [optimizedUrls, setOptimizedUrls] = useState<string[]>([])
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)
  const hasMoved = useRef(false)
  const velocity = useRef(0)
  const lastX = useRef(0)
  const lastTime = useRef(0)

  // ✅ DEBUG: Log inputs
  useEffect(() => {
    console.log('[ImageGallery] RENDER', {
      imagesCount: images.length,
      firstUrl: images[0]?.substring(0, 80),
      mode
    })
  }, [images, mode])

  // Optimize images với CDN transform
  useEffect(() => {
    console.log('[ImageGallery] Optimizing URLs...')
    const optimized = images.map(url => {
      const result = getOptimalImageUrl(url)
      console.log('[ImageGallery] Optimized:', {
        original: url.substring(0, 60),
        optimized: result.substring(0, 60)
      })
      return result
    })
    setOptimizedUrls(optimized)
  }, [images])

  // Load image dimensions với error handling
  useEffect(() => {
    console.log('[ImageGallery] Loading dimensions for', images.length, 'images')
    
    const loadImage = (src: string, index: number) => {
      const img = new Image()
      
      img.onload = () => {
        console.log('[ImageGallery] Image loaded:', index, img.width, 'x', img.height)
        setImageDimensions(prev => {
          const newDims = [...prev]
          newDims[index] = { width: img.width, height: img.height }
          return newDims
        })
        setLoadedImages(prev => new Set(prev).add(index))
      }
      
      img.onerror = (e) => {
        console.error('[ImageGallery] Failed to load image:', index, src, e)
        // Set default dimensions để vẫn render
        setImageDimensions(prev => {
          const newDims = [...prev]
          newDims[index] = { width: 400, height: 400 }
          return newDims
        })
      }
      
      img.src = src
    }
    
    images.forEach((src, i) => {
      if (src) {
        loadImage(src, i)
      } else {
        console.error('[ImageGallery] Empty URL at index:', i)
      }
    })
  }, [images])

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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    isDragging.current = true
    hasMoved.current = false
    startX.current = e.pageX - scrollRef.current.offsetLeft
    scrollLeft.current = scrollRef.current.scrollLeft
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
    
    const momentumScroll = velocity.current * 200
    
    if (Math.abs(momentumScroll) > 10) {
      scrollRef.current.style.scrollBehavior = 'smooth'
      scrollRef.current.scrollLeft -= momentumScroll
    }
  }

  const handleImageClickInternal = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!hasMoved.current && mode === 'view' && onImageClick) {
      console.log('[ImageGallery] Image clicked:', index)
      onImageClick(index)
    }
  }

  const handleDelete = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    console.log('[ImageGallery] Delete image:', index)
    onDelete?.(index)
  }

  // ✅ GUARD: Return null nếu không có ảnh
  if (!images || images.length === 0) {
    console.log('[ImageGallery] No images to display')
    return null
  }

  console.log('[ImageGallery] Rendering', images.length, 'images', {
    optimizedCount: optimizedUrls.length,
    dimensionsCount: imageDimensions.length,
    loadedCount: loadedImages.size
  })

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
          const dims = imageDimensions[index]
          const height = dims ? calculateHeight(dims.width, dims.height) : 400
          const optimizedUrl = optimizedUrls[index] || originalUrl
          
          console.log('[ImageGallery] Rendering image', index, {
            hasOptimized: !!optimizedUrls[index],
            hasDims: !!dims,
            height,
            url: optimizedUrl.substring(0, 60)
          })
          
          return (
            <div
              key={`${index}-${originalUrl}`}
              className={styles.imageItem}
              style={{ 
                height: `${height}px`,
                minHeight: '360px' // ✅ Ensure minimum height
              }}
              onClick={(e) => handleImageClickInternal(index, e)}
            >
              <img
                src={optimizedUrl}
                alt={`Image ${index + 1}`}
                className={styles.image}
                draggable={false}
                loading="lazy"
                onLoad={() => {
                  console.log('[ImageGallery] IMG onLoad event:', index)
                }}
                onError={(e) => {
                  console.error('[ImageGallery] IMG onError event:', index, optimizedUrl)
                }}
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