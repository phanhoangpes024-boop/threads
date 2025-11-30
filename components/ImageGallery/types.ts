// components/ImageGallery/types.ts

export interface ImageGalleryProps {
  images: string[]
  mode: 'view' | 'edit'
  onDelete?: (index: number) => void
  onImageClick?: (index: number) => void
  aspectRatio?: 'auto' | '1:1' | '16:9'
  className?: string
}

export interface ImageDimensions {
  width: number
  height: number
  aspectRatio: number
}