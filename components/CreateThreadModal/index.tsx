'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { uploadImagesToSupabase } from '@/lib/supabaseStorage';
import ImageUploader, { ImageUploaderRef } from '@/components/ImageUploader';
import styles from './CreateThreadModal.module.css';

interface CreateThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string, imageUrls?: string[]) => Promise<void>;
  username: string;
  avatarText: string;
    avatarBg?: string;  // ← THÊM
}

export default function CreateThreadModal({
  isOpen,
  onClose,
  onSubmit,
  username,
  avatarText,
  avatarBg = '#0077B6'  // ← THÊM

}: CreateThreadModalProps) {
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageUploaderRef = useRef<ImageUploaderRef>(null);

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
    onClose();
  };

  const handleImagesChange = (files: File[]) => {
    setImageFiles(files);
  };

  const handleImageButtonClick = () => {
    imageUploaderRef.current?.triggerFileInput();
  };

  const handleSubmit = async () => {
    if (!content.trim() || posting || uploading) return;
    
    setPosting(true);
    setUploading(true);
    
    try {
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        imageUrls = await uploadImagesToSupabase(imageFiles);
      }

      await onSubmit(content.trim(), imageUrls);
      
      setContent('');
      setImageFiles([]);
    } catch (error) {
      console.error('Lỗi khi đăng thread:', error);
      alert('Không thể đăng thread. Vui lòng thử lại.');
    } finally {
      setPosting(false);
      setUploading(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const textarea = e.target;
    textarea.style.height = '60px';
    const scrollHeight = textarea.scrollHeight;
    if (scrollHeight > 144) {
      textarea.style.height = '144px';
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.height = scrollHeight + 'px';
      textarea.style.overflowY = 'hidden';
    }
  };

  if (!isOpen) return null;
  if (typeof window === 'undefined') return null;

  const canPost = content.trim() && !posting && !uploading;

  const modalContent = (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
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
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.inputSection}>
<div className={styles.avatar} style={{ background: avatarBg }}>{avatarText}</div>            <div className={styles.inputContainer}>
              <div className={styles.userInfo}>
                <span className={styles.username}>{username}</span>
                <span className={styles.addCaption}>Thêm chú đề</span>
              </div>
              
              <div className={styles.textareaContainer}>
                <textarea
                  ref={textareaRef}
                  className={styles.textarea}
                  placeholder="Có gì mới?"
                  value={content}
                  onChange={handleTextareaChange}
                  disabled={posting || uploading}
                />
              </div>

              <div className={styles.toolbar}>
                <button 
                  className={styles.toolbarBtn}
                  aria-label="Thêm ảnh"
                  onClick={handleImageButtonClick}
                  type="button"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </button>
                <button 
                  className={styles.toolbarBtn}
                  aria-label="Thêm emoji"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                  </svg>
                </button>
              </div>

              <ImageUploader
                ref={imageUploaderRef}
                onImagesChange={handleImagesChange}
                maxImages={10}
              />
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button
            className={styles.postBtn}
            disabled={!canPost}
            onClick={handleSubmit}
          >
            {uploading ? 'Đang tải...' : posting ? 'Đang đăng...' : 'Đăng'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}