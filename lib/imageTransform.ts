// lib/imageTransform.ts - OPTIMIZED với Memoization Cache
import { supabase } from './supabase'

interface TransformOptions {
  width?: number
  height?: number
  quality?: number
}

// ✅ Cache để tránh transform lặp lại cùng URL
const urlCache = new Map<string, string>()

/**
 * Transform Supabase Storage URL với resize parameters
 * ✅ SAFE: Fallback to original nếu transform fail
 * ✅ OPTIMIZED: Memoization cache
 */
export function transformImageUrl(
  url: string, 
  options: TransformOptions = {}
): string {
  if (!url || !url.includes('supabase.co')) return url

  // Tạo cache key
  const cacheKey = `${url}-${JSON.stringify(options)}`
  if (urlCache.has(cacheKey)) {
    return urlCache.get(cacheKey)!
  }

  const { width = 800, quality = 80 } = options

  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname.split('/storage/v1/object/public/')[1]
    
    if (!path) return url

    const [bucket, ...fileParts] = path.split('/')
    const filePath = fileParts.join('/')

    if (!bucket || !filePath) return url

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath, {
        transform: { width, quality }
      })

    const transformed = data.publicUrl
    
    // Lưu vào cache
    urlCache.set(cacheKey, transformed)
    
    return transformed
    
  } catch (error) {
    return url 
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
 * Get optimal image URL với manual options
 */
export function getOptimalImageUrl(
  originalUrl: string,
  options?: TransformOptions
): string {
  if (!originalUrl) return ''
  if (!originalUrl.includes('supabase.co')) return originalUrl
  if (options) return transformImageUrl(originalUrl, options)

  if (typeof window === 'undefined') {
    return transformImageUrl(originalUrl, { width: 800 })
  }

  const w = window.innerWidth
  let width = 1200
  let quality = 85

  if (w <= 640) { width = 600; quality = 75 }
  else if (w <= 1024) { width = 800; quality = 80 }
  
  return transformImageUrl(originalUrl, { width, quality })
}

/**
 * Preload critical images
 */
export function preloadImage(url: string): Promise<void> {
  if (!url) return Promise.reject('Empty URL')
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = (e) => reject(e)
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
  if (!src) return () => {}
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        imgElement.src = src
        observer.unobserve(imgElement)
      }
    })
  }, { 
    rootMargin: '50px', 
    threshold: 0.01 
  })
  
  observer.observe(imgElement)
  return () => observer.disconnect()
}