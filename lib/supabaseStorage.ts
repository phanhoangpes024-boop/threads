// lib/supabaseStorage.ts - OPTIMIZED với Compression + Retry
import { supabase } from './supabase'

const BUCKET_NAME = 'thread-images'

/**
 * ✅ Helper: Resize & Compress ảnh bằng Canvas (Client-side only)
 * Giảm dung lượng trước khi upload - UPDATED theo Gemini
 */
async function compressImage(file: File): Promise<File> {
  // Chỉ chạy trên browser và chỉ nén ảnh
  if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
    return file
  }

  // Bỏ qua nếu ảnh nhỏ (< 500KB) - giảm từ 1MB
  if (file.size < 500 * 1024) return file

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1000 // Giảm từ 1600 xuống 1000 cho mobile
        
        let width = img.width
        let height = img.height
        
        // Resize nếu quá lớn
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width)
          width = MAX_WIDTH
        }

        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        
        // ✅ Chuyển sang WebP (nhẹ hơn JPEG 30%)
        canvas.toBlob((blob) => {
          if (blob) {
            const newFileName = file.name.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp')
            
            const newFile = new File([blob], newFileName, {
              type: 'image/webp',
              lastModified: Date.now(),
            })
            console.log(`[Compression] ${(file.size/1024).toFixed(0)}KB → ${(newFile.size/1024).toFixed(0)}KB (WebP)`)
            resolve(newFile)
          } else {
            resolve(file)
          }
        }, 'image/webp', 0.8) // Quality 80%
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
    const fileExt = processedFile.name.split('.').pop() || 'webp'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${fileName}`

    // 3. Upload với retry
    const uploadFn = async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, processedFile, {
          cacheControl: '31536000',
          upsert: false
        })

      if (error) throw error
      return data
    }

    const uploadData = await withRetry(uploadFn)

    // 4. Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uploadData.path)

    return urlData.publicUrl
  } catch (error) {
    console.error('Upload error:', error)
    throw new Error('Không thể upload ảnh')
  }
}

/**
 * Upload multiple images
 */
export async function uploadImagesToSupabase(files: File[]): Promise<string[]> {
  try {
    const uploadPromises = files.map(file => uploadImageToSupabase(file))
    return await Promise.all(uploadPromises)
  } catch (error) {
    console.error('Multiple upload error:', error)
    throw new Error('Không thể upload ảnh')
  }
}

/**
 * Delete image from storage
 */
export async function deleteImageFromSupabase(url: string): Promise<void> {
  try {
    const path = url.split(`${BUCKET_NAME}/`)[1]
    if (!path) throw new Error('Invalid URL')

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path])

    if (error) throw error
  } catch (error) {
    console.error('Delete error:', error)
    throw new Error('Không thể xóa ảnh')
  }
}