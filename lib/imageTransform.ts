// lib/imageTransform.ts - FIXED TYPESCRIPT TYPES
import { supabase } from './supabase'

interface TransformOptions {
  width?: number
  height?: number
  quality?: number
  // ✅ FIX: Không dùng format nữa vì Supabase chỉ có "origin"
}

/**
 * Transform Supabase Storage URL với resize parameters
 * ✅ SAFE: Fallback to original nếu transform fail
 */
export function transformImageUrl(
  url: string, 
  options: TransformOptions = {}
): string {
  // ✅ SAFETY: Return original nếu không phải Supabase URL
  if (!url || !url.includes('supabase.co')) {
    console.log('[imageTransform] Not Supabase URL, returning original:', url.substring(0, 60))
    return url
  }

  const {
    width = 800,
    quality = 80
  } = options

  try {
    // Parse URL để lấy path
    const urlObj = new URL(url)
    const path = urlObj.pathname.split('/storage/v1/object/public/')[1]
    
    if (!path) {
      console.log('[imageTransform] Cannot parse path, returning original')
      return url
    }

    // Extract bucket và file path
    const [bucket, ...fileParts] = path.split('/')
    const filePath = fileParts.join('/')

    if (!bucket || !filePath) {
      console.log('[imageTransform] Invalid bucket/path, returning original')
      return url
    }

    // ✅ Try transform with Supabase - KHÔNG DÙNG format
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath, {
        transform: {
          width,
          quality
          // ✅ BỎ format đi vì gây lỗi TypeScript
        }
      })

    const transformed = data.publicUrl
    
    console.log('[imageTransform] Transformed OK:', {
      original: url.substring(0, 60),
      transformed: transformed.substring(0, 60)
    })
    
    return transformed
    
  } catch (error) {
    console.error('[imageTransform] Error, returning original:', error)
    return url // ✅ Fallback to original
  }
}

/**
 * Responsive image URLs cho different viewports
 */
export function getResponsiveImageUrls(originalUrl: string) {
  return {
    thumbnail: transformImageUrl(originalUrl, { width: 200, quality: 70 }),
    small: transformImageUrl(originalUrl, { width: 400, quality: 75 }),
    medium: transformImageUrl(originalUrl, { width: 800, quality: 80 }),
    large: transformImageUrl(originalUrl, { width: 1200, quality: 85 }),
    original: originalUrl
  }
}

/**
 * Auto-detect viewport và return URL phù hợp
 * ✅ SAFE: Always return valid URL
 */
export function getOptimalImageUrl(originalUrl: string): string {
  // ✅ SAFETY: Guard
  if (!originalUrl) {
    console.error('[getOptimalImageUrl] Empty URL!')
    return ''
  }

  // ✅ SAFETY: Nếu không phải Supabase, return nguyên bản
  if (!originalUrl.includes('supabase.co')) {
    console.log('[getOptimalImageUrl] Not Supabase, returning original')
    return originalUrl
  }

  // ✅ Server-side rendering guard
  if (typeof window === 'undefined') {
    console.log('[getOptimalImageUrl] SSR, using default 800px')
    return transformImageUrl(originalUrl, { width: 800 })
  }

  const viewportWidth = window.innerWidth
  
  console.log('[getOptimalImageUrl] Viewport:', viewportWidth)
  
  // Mobile
  if (viewportWidth <= 640) {
    return transformImageUrl(originalUrl, { width: 600, quality: 75 })
  }
  
  // Tablet
  if (viewportWidth <= 1024) {
    return transformImageUrl(originalUrl, { width: 800, quality: 80 })
  }
  
  // Desktop
  return transformImageUrl(originalUrl, { width: 1200, quality: 85 })
}

/**
 * Preload critical images
 */
export function preloadImage(url: string): Promise<void> {
  if (!url) return Promise.reject('Empty URL')
  
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      console.log('[preloadImage] Loaded:', url.substring(0, 60))
      resolve()
    }
    img.onerror = (e) => {
      console.error('[preloadImage] Failed:', url.substring(0, 60), e)
      reject(e)
    }
    img.src = url
  })
}

/**
 * Lazy load images với Intersection Observer
 */
export function lazyLoadImage(
  imgElement: HTMLImageElement,
  src: string
): () => void {
  if (!src) {
    console.error('[lazyLoadImage] Empty src!')
    return () => {}
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          console.log('[lazyLoadImage] Loading:', src.substring(0, 60))
          imgElement.src = src
          observer.unobserve(imgElement)
        }
      })
    },
    {
      rootMargin: '50px',
      threshold: 0.01
    }
  )

  observer.observe(imgElement)

  return () => observer.disconnect()
}