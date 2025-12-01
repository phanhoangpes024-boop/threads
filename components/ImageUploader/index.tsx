// components/ImageUploader/index.tsx
'use client'

import { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useImageUpload } from './hooks/useImageUpload'
import styles from './ImageUploader.module.css'

interface ImageUploaderProps {
  onImagesChange: (files: File[]) => void
  maxImages?: number
  maxSizePerImage?: number
  existingImages?: File[]
}

export interface ImageUploaderRef {
  triggerFileInput: () => void
}

const ImageUploader = forwardRef<ImageUploaderRef, ImageUploaderProps>(({
  onImagesChange,
  maxImages = 10,
}, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  
  // Touch states
  const [touchStartIndex, setTouchStartIndex] = useState<number | null>(null)
  const [touchCurrentIndex, setTouchCurrentIndex] = useState<number | null>(null)
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)
  
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

  // Expose method qua ref
  useImperativeHandle(ref, () => ({
    triggerFileInput: () => {
      fileInputRef.current?.click()
    }
  }))

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
    e.target.value = ''
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

  // Desktop drag to reorder
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

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    const touch = e.touches[0]
    touchStartPos.current = { x: touch.clientX, y: touch.clientY }
    setTouchStartIndex(index)
    setTouchCurrentIndex(index)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartIndex === null || !touchStartPos.current) return

    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x)
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y)


    // TÃ¬m thumbnail Ä‘ang á»Ÿ vá»‹ trÃ­ ngÃ³n tay
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY)
    const thumbnailElement = elements.find(el => 
      el.classList.contains(styles.thumbnail)
    ) as HTMLElement

    if (thumbnailElement) {
      const newIndex = parseInt(thumbnailElement.dataset.index || '-1')
      if (newIndex !== -1 && newIndex !== touchCurrentIndex) {
        setTouchCurrentIndex(newIndex)
      }
    }
  }

  const handleTouchEnd = () => {
    if (touchStartIndex !== null && touchCurrentIndex !== null && touchStartIndex !== touchCurrentIndex) {
      reorderFiles(touchStartIndex, touchCurrentIndex)
    }
    
    touchStartPos.current = null
    setTouchStartIndex(null)
    setTouchCurrentIndex(null)
  }

  const canAddMore = files.length < maxImages

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        multiple
        onChange={handleFileChange}
        className={styles.fileInput}
      />

      {/* Preview grid */}
      {previews.length > 0 && (
        <div className={styles.previewGrid}>
          {previews.map((preview, index) => (
            <div
              key={index}
              data-index={index}
              className={`${styles.thumbnail} ${
                touchStartIndex === index ? styles.thumbnailDragging : ''
              } ${
                touchCurrentIndex === index && touchStartIndex !== null ? styles.thumbnailOver : ''
              }`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOverThumbnail(e, index)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, index)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img src={preview} alt={`Preview ${index + 1}`} />
              
              {/* Number badge */}
              <div className={styles.badge}>{index + 1}</div>
              
              {/* Delete button */}
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => removeFile(index)}
                onTouchEnd={(e) => {
                  e.stopPropagation()
                  removeFile(index)
                }}
                aria-label={`XÃ³a áº£nh ${index + 1}`}
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
})

ImageUploader.displayName = 'ImageUploader'

export default ImageUploader