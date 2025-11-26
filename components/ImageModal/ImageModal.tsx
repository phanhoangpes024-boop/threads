'use client';

import { useEffect } from 'react';
import styles from './ImageModal.module.css';

interface ImageModalProps {
  imageUrl: string;
  onClose: (e?: React.MouseEvent) => void;
}

export default function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div className={styles.backdrop} onClick={(e) => {
      e.stopPropagation();
      onClose(e);
    }}>
      <button className={styles.closeBtn} onClick={(e) => {
        e.stopPropagation();
        onClose(e);
      }}>
        <svg viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <img 
        src={imageUrl} 
        alt="Full size" 
        className={styles.image}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}