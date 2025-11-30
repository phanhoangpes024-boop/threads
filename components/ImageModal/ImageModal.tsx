'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ImageModal.module.css';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
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

  const modalContent = (
    <div className={styles.backdrop} onClick={onClose}>
      <button className={styles.closeBtn} onClick={onClose}>
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

  // Render vào body thay vì trong component tree
  if (typeof window === 'undefined') return null;
  
  return createPortal(modalContent, document.body);
}