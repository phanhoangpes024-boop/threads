// components/ImageUploader/index.tsx
'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useImageUpload } from './hooks/useImageUpload'
import styles from './ImageUploader.module.css'

interface ImageUploaderProps {
  onImagesChange: (files: File[]) => void
  maxImages?: number
  maxSizePerImage?: number
  existingImages?: File[]
}

export default function ImageUploader({
  onImagesChange,
  maxImages = 10,
  existingImages = [],
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  
  const {
    files,
    previews,
    errors,
    addFiles,
    removeFile,
    reorderFiles,
  } = useImageUpload(maxImages)

  // Notify parent
  useEffect(() => {
    onImagesChange(files)
  }, [files, onImagesChange])

  // File input click
  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  // File input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length > 0) {
      addFiles(selectedFiles)
    }
    // Reset input
    e.target.value = ''
  }

  // Drag & Drop zone
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }

  // Paste from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      const imageFiles: File[] = []
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile()
          if (file) imageFiles.push(file)
        }
      }

      if (imageFiles.length > 0) {
        addFiles(imageFiles)
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [addFiles])

  // Drag to reorder thumbnails
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOverThumbnail = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    
    reorderFiles(draggedIndex, index)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const canAddMore = files.length < maxImages

  return (
    <div className={styles.container}>
      {/* Upload button */}
      <button
        type="button"
        className={styles.uploadBtn}
        onClick={handleButtonClick}
        disabled={!canAddMore}
      >
        <svg viewBox="0 0 24 24" width="20" height="20">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
          <polyline points="21 15 16 10 5 21" fill="none" stroke="currentColor" strokeWidth="2"/>
        </svg>
        <span>Thêm ảnh</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        multiple
        onChange={handleFileChange}
        className={styles.fileInput}
      />

      {/* Drag & Drop zone */}
      {canAddMore && files.length === 0 && (
        <div
          className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <svg viewBox="0 0 24 24" width="32" height="32">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="17 8 12 3 7 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>Kéo thả ảnh vào đây hoặc nhấn nút "Thêm ảnh"</p>
          <span>Tối đa {maxImages} ảnh, mỗi ảnh ≤ 5MB</span>
        </div>
      )}

      {/* Preview grid */}
      {previews.length > 0 && (
        <div className={styles.previewGrid}>
          {previews.map((preview, index) => (
            <div
              key={index}
              className={styles.thumbnail}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOverThumbnail(e, index)}
              onDragEnd={handleDragEnd}
            >
              <img src={preview} alt={`Preview ${index + 1}`} />
              
              {/* Number badge */}
              <div className={styles.badge}>{index + 1}</div>
              
              {/* Delete button */}
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => removeFile(index)}
                aria-label={`Remove image ${index + 1}`}
              >
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            </div>
          ))}

          {/* Add more button */}
          {canAddMore && (
            <button
              type="button"
              className={styles.addMoreBtn}
              onClick={handleButtonClick}
            >
              <svg viewBox="0 0 24 24" width="24" height="24">
                <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2"/>
                <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className={styles.errors}>
          {errors.map((error, i) => (
            <div key={i} className={styles.error}>
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}