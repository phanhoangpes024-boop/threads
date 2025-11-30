// components/ImageUploader/hooks/useImageUpload.ts
import { useState, useCallback } from 'react'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

export function useImageUpload(maxImages: number = 10) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: Chỉ hỗ trợ JPG, PNG, GIF, WEBP`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: Kích thước vượt quá 5MB`
    }
    return null
  }, [])

  // Add files
  const addFiles = useCallback((newFiles: File[]) => {
    const validFiles: File[] = []
    const newErrors: string[] = []

    // Check total limit
    if (files.length + newFiles.length > maxImages) {
      newErrors.push(`Chỉ được tải tối đa ${maxImages} ảnh`)
      setErrors(newErrors)
      return
    }

    // Validate each file
    newFiles.forEach(file => {
      const error = validateFile(file)
      if (error) {
        newErrors.push(error)
      } else {
        validFiles.push(file)
      }
    })

    if (newErrors.length > 0) {
      setErrors(newErrors)
      setTimeout(() => setErrors([]), 5000)
    }

    if (validFiles.length === 0) return

    // Create previews
    const newPreviews: string[] = []
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newPreviews.push(reader.result as string)
        if (newPreviews.length === validFiles.length) {
          setPreviews(prev => [...prev, ...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })

    setFiles(prev => [...prev, ...validFiles])
  }, [files.length, maxImages, validateFile])

  // Remove file
  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Reorder files
  const reorderFiles = useCallback((fromIndex: number, toIndex: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      const [moved] = newFiles.splice(fromIndex, 1)
      newFiles.splice(toIndex, 0, moved)
      return newFiles
    })

    setPreviews(prev => {
      const newPreviews = [...prev]
      const [moved] = newPreviews.splice(fromIndex, 1)
      newPreviews.splice(toIndex, 0, moved)
      return newPreviews
    })
  }, [])

  // Reset
  const reset = useCallback(() => {
    setFiles([])
    setPreviews([])
    setErrors([])
  }, [])

  return {
    files,
    previews,
    errors,
    uploading,
    setUploading,
    addFiles,
    removeFile,
    reorderFiles,
    reset,
  }
}