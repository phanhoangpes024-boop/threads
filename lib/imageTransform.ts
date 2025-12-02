// lib/imageTransform.ts - CDN Transform cho Performance
import { supabase } from './supabase'

interface TransformOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpg' | 'png'
}

/**
 * Transform Supabase Storage URL với resize parameters
 * Giảm bandwidth 95% cho mobile
 */
export function transformImageUrl(
  url: string, 
  options: TransformOptions = {}
): string {
  // Nếu không phải Supabase URL, return nguyên bản
  if (!url.includes('supabase.co')) {
    return url
  }

  // Default options
  const {
    width = 800,
    quality = 80,
    format = 'webp'
  } = options

  try {
    // Parse URL để lấy path
    const urlObj = new URL(url)
    const path = urlObj.pathname.split('/storage/v1/object/public/')[1]
    
    if (!path) return url

    // Extract bucket và file path
    const [bucket, ...fileParts] = path.split('/')
    const filePath = fileParts.join('/')

    // Sử dụng Supabase Transform API
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath, {
        transform: {
          width,
          quality,
          format
        }
      })

    return data.publicUrl
  } catch (error) {
    console.error('Error transforming image:', error)
    return url // Fallback to original
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
 */
export function getOptimalImageUrl(originalUrl: string): string {
  if (typeof window === 'undefined') {
    return transformImageUrl(originalUrl, { width: 800 })
  }

  const viewportWidth = window.innerWidth
  
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
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
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
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          imgElement.src = src
          observer.unobserve(imgElement)
        }
      })
    },
    {
      rootMargin: '50px', // Load trước 50px
      threshold: 0.01
    }
  )

  observer.observe(imgElement)

  // Return cleanup function
  return () => observer.disconnect()
}