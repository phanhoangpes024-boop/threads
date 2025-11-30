// components/CreateThreadModal/index.tsx - UPDATED with ImageUploader
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ImageUploader from '@/components/ImageUploader';
import ImageGallery from '@/components/ImageGallery';
import { uploadImagesToSupabase } from '@/lib/supabaseStorage';
import styles from './CreateThreadModal.module.css';

interface CreateThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string, imageUrls?: string[]) => Promise<void>;
  username: string;
  avatarText: string;
}

export default function CreateThreadModal({
  isOpen,
  onClose,
  onSubmit,
  username,
  avatarText
}: CreateThreadModalProps) {
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Generate previews from files
  useEffect(() => {
    if (imageFiles.length === 0) {
      setImagePreviews([]);
      return;
    }

    const newPreviews: string[] = [];
    let loaded = 0;

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        loaded++;
        if (loaded === imageFiles.length) {
          setImagePreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [imageFiles]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !posting) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, posting]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    if (posting || uploading) return;
    setContent('');
    setImageFiles([]);
    setImagePreviews([]);
    onClose();
  };

  const handleDeleteImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() || posting || uploading) return;
    
    setPosting(true);
    setUploading(true);
    
    try {
      // Upload images to Supabase if any
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        imageUrls = await uploadImagesToSupabase(imageFiles);
      }

      // Submit thread with image URLs
      await onSubmit(content.trim(), imageUrls);
      
      // Reset
      setContent('');
      setImageFiles([]);
      setImagePreviews([]);
    } catch (error) {
      console.error('Error posting thread:', error);
      alert('Không thể đăng thread. Vui lòng thử lại.');
    } finally {
      setPosting(false);
      setUploading(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  if (!isOpen) return null;
  if (typeof window === 'undefined') return null;

  const canPost = content.trim() && !posting && !uploading;

  const modalContent = (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button 
              className={styles.cancelBtn} 
              onClick={handleClose}
              disabled={posting || uploading}
            >
              Hủy
            </button>
          </div>
          <div className={styles.headerCenter}>Thread mới</div>
          <div className={styles.headerRight}>
            <button className={styles.menuBtn} disabled={posting || uploading}>
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <div className={styles.inputSection}>
            <div className={styles.avatar}>{avatarText}</div>
            <div className={styles.inputContainer}>
              <div className={styles.userInfo}>
                <span className={styles.username}>{username}</span>
              </div>
              
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                placeholder="Có gì mới?"
                rows={3}
                value={content}
                onChange={handleTextareaChange}
                disabled={posting || uploading}
              />

              {/* Image Uploader */}
              <ImageUploader 
                onImagesChange={setImageFiles}
                maxImages={10}
              />

              {/* Preview Gallery */}
              {imagePreviews.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <ImageGallery
                    images={imagePreviews}
                    mode="edit"
                    onDelete={handleDeleteImage}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerActions}>
            <button
              className={`${styles.postBtn} ${canPost ? styles.active : ''}`}
              disabled={!canPost}
              onClick={handleSubmit}
            >
              {uploading ? 'Đang tải...' : posting ? 'Đang đăng...' : 'Đăng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}