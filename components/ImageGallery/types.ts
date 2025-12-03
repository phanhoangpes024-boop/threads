// components/ImageGallery/types.ts - SIMPLIFIED

export interface ImageGalleryProps {
  images: string[]
  mode?: 'view' | 'edit'
  onDelete?: (index: number) => void
  onImageClick?: (index: number) => void
  className?: string
}