// lib/supabaseStorage.ts
import { supabase } from './supabase'

const BUCKET_NAME = 'thread-images'

/**
 * Upload single image to Supabase Storage
 */
export async function uploadImageToSupabase(file: File): Promise<string> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${fileName}`

    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
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
    // Extract filename from URL
    const urlParts = url.split('/')
    const fileName = urlParts[urlParts.length - 1]

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName])

    if (error) {
      console.error('Delete error:', error)
      throw new Error(`Delete failed: ${error.message}`)
    }
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