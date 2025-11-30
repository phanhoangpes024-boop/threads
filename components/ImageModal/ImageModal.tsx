// components/ImageModal/ImageModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ImageModal.module.css';

interface ImageModalProps {
  images: string[]
  initialIndex?: number
  onClose: () => void
}

export default function ImageModal({ 
  images, 
  initialIndex = 0,
  onClose 
}: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    const handleArrowKeys = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        handlePrev();
      } else if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
        handleNext();
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.addEventListener('keydown', handleArrowKeys);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('keydown', handleArrowKeys);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, currentIndex, images.length]);

  const handlePrev = () => {
    if (currentIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex(prev => prev - 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const modalContent = (
    <div className={styles.backdrop} onClick={onClose}>
      <button className={styles.closeBtn} onClick={onClose}>
        <svg viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      
      {/* Counter */}
      {images.length > 1 && (
        <div className={styles.counter}>
          {currentIndex + 1} / {images.length}
        </div>
      )}
      
      {/* Image Container */}
      <div 
        className={styles.imageContainer}
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={images[currentIndex]} 
          alt={`Image ${currentIndex + 1}`}
          className={`${styles.image} ${isTransitioning ? styles.transitioning : ''}`}
        />
      </div>
      
      {/* Navigation Arrows */}
      {currentIndex > 0 && (
        <button 
          className={`${styles.arrow} ${styles.arrowLeft}`}
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
        >
          <svg viewBox="0 0 24 24" width="32" height="32">
            <polyline points="15 18 9 12 15 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      
      {currentIndex < images.length - 1 && (
        <button 
          className={`${styles.arrow} ${styles.arrowRight}`}
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
        >
          <svg viewBox="0 0 24 24" width="32" height="32">
            <polyline points="9 18 15 12 9 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );

  if (typeof window === 'undefined') return null;
  
  return createPortal(modalContent, document.body);
}