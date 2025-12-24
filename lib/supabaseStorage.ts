// lib/supabaseStorage.ts - OPTIMIZED với Compression + Retry
import { supabase } from './supabase'

const BUCKET_NAME = 'thread-images'

/**
 * Helper: Resize & Compress ảnh bằng Canvas (Client-side only)
 * Giảm dung lượng trước khi upload
 */
async function compressImage(file: File): Promise<File> {
  // Chỉ chạy trên browser và chỉ nén ảnh
  if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
    return file
  }

  // Bỏ qua nếu ảnh nhỏ (< 1MB)
  if (file.size < 1024 * 1024) return file

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1600 // Giảm từ 1920 xuống 1600 cho mobile
        const scaleSize = MAX_WIDTH / img.width
        
        // Nếu ảnh nhỏ hơn max width thì giữ nguyên
        if (scaleSize >= 1) {
          resolve(file)
          return
        }

        canvas.width = MAX_WIDTH
        canvas.height = img.height * scaleSize
        
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        canvas.toBlob((blob) => {
  if (blob) {
    // ✅ Đổi extension thành .webp
    const newFileName = file.name.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp')
    
    const newFile = new File([blob], newFileName, {
      type: 'image/webp',  // ✅ Đổi type
      lastModified: Date.now(),
    })
    console.log(`[Compression] ${(file.size/1024).toFixed(0)}KB → ${(newFile.size/1024).toFixed(0)}KB (WebP)`)
    resolve(newFile)
  } else {
    resolve(file)
  }
}, 'image/webp', 0.85)  // ✅ Format WebP, quality 85%
      }
      img.onerror = () => resolve(file)
    }
    reader.onerror = () => resolve(file)
  })
}

/**
 * Helper: Retry mechanism với exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>, 
  retries = 3, 
  delay = 1000
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries === 0) throw error
    await new Promise(resolve => setTimeout(resolve, delay))
    return withRetry(fn, retries - 1, delay * 2)
  }
}

/**
 * Upload single image to Supabase Storage
 * ✅ Nâng cấp: Auto-compression + Retry
 */
export async function uploadImageToSupabase(file: File): Promise<string> {
  try {
    // 1. Nén ảnh trước khi upload
    const processedFile = await compressImage(file)

    // 2. Generate unique filename
    const fileExt = processedFile.name.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${fileName}`

    // 3. Upload file với Retry logic
    await withRetry(async () => {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error
    })

    // 4. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

/**
 * Upload multiple images to Supabase Storage
 */
export async function uploadImagesToSupabase(files: File[]): Promise<string[]> {
  try {
    const uploadPromises = files.map(file => uploadImageToSupabase(file))
    const urls = await Promise.all(uploadPromises)
    return urls
  } catch (error) {
    console.error('Error uploading images:', error)
    throw error
  }
}

/**
 * Delete image from Supabase Storage
 */
export async function deleteImageFromSupabase(url: string): Promise<void> {
  try {
    const urlParts = url.split('/')
    const fileName = urlParts[urlParts.length - 1]

    await withRetry(async () => {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([fileName])

      if (error) throw error
    })
  } catch (error) {
    console.error('Error deleting image:', error)
    throw error
  }
}

/**
 * Delete multiple images from Supabase Storage
 */
export async function deleteImagesFromSupabase(urls: string[]): Promise<void> {
  try {
    const deletePromises = urls.map(url => deleteImageFromSupabase(url))
    await Promise.all(deletePromises)
  } catch (error) {
    console.error('Error deleting images:', error)
    throw error
  }
}