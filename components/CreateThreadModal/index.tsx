// components/CreateThreadModal/index.tsx
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
  avatarBg?: string;
  // ✅ EDIT MODE
  editMode?: boolean;
  initialContent?: string;
  initialImageUrls?: string[];
  threadId?: string;
}

export default function CreateThreadModal({
  isOpen,
  onClose,
  onSubmit,
  username,
  avatarText,
  avatarBg = '#0077B6',
  editMode = false,
  initialContent = '',
  initialImageUrls = [],
  threadId
}: CreateThreadModalProps) {
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageUploaderRef = useRef<ImageUploaderRef>(null);

  // ✅ Khởi tạo data khi mở modal
  useEffect(() => {
    if (isOpen) {
      if (editMode) {
        setContent(initialContent);
        setExistingImageUrls(initialImageUrls);
      } else {
        setContent('');
        setExistingImageUrls([]);
      }
    }
  }, [isOpen, editMode, initialContent, initialImageUrls]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

 // ✅ Gọi trực tiếp onClose, không qua handleClose
useEffect(() => {
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen && !posting && !uploading) {
      onClose();
    }
  };
  document.addEventListener('keydown', handleEsc);
  return () => document.removeEventListener('keydown', handleEsc);
}, [isOpen, posting, uploading, onClose]);

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
    setExistingImageUrls([]);
    onClose();
  };

  const handleImagesChange = (files: File[]) => {
    setImageFiles(files);
  };

  const handleImageButtonClick = () => {
    imageUploaderRef.current?.triggerFileInput();
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  // ✅ Xóa ảnh cũ
  const handleRemoveExistingImage = (index: number) => {
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() || posting || uploading) return;
    
    setPosting(true);
    setUploading(true);
    
    try {
      let finalImageUrls: string[] = [...existingImageUrls];
      
      // Upload ảnh mới nếu có
      if (imageFiles.length > 0) {
        const newUrls = await uploadImagesToSupabase(imageFiles);
        finalImageUrls = [...finalImageUrls, ...newUrls];
      }

      await onSubmit(content.trim(), finalImageUrls);
      
      setContent('');
      setImageFiles([]);
      setExistingImageUrls([]);
    } catch (error) {
      console.error('Lỗi khi đăng thread:', error);
      alert('Không thể đăng thread. Vui lòng thử lại.');
    } finally {
      setPosting(false);
      setUploading(false);
    }
  };

  const canPost = content.trim().length > 0 && !posting && !uploading;

  if (!isOpen) return null;

  const modalContent = (
    <div className={styles.overlay} onClick={(e) => {
      if (e.target === e.currentTarget && !posting) handleClose();
    }}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.cancelBtn} onClick={handleClose}>
              Hủy
            </button>
          </div>
          <div className={styles.headerCenter}>
            {editMode ? 'Chỉnh sửa thread' : 'Thread mới'}
          </div>
          <div className={styles.headerRight}></div>
        </div>

        <div className={styles.body}>
          <div className={styles.inputSection}>
            <div className={styles.avatar} style={{ background: avatarBg }}>
              {avatarText}
            </div>
            
            <div className={styles.inputContainer}>
              <div className={styles.username}>{username}</div>
              <div className={styles.addCaption}>Thêm chú thích</div>
              
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                placeholder={`Bạn đang nghĩ gì, ${username}?`}
                value={content}
                onChange={handleTextareaChange}
                disabled={posting || uploading}
              />

              {/* ✅ Hiển thị ảnh cũ (existing) */}
              {existingImageUrls.length > 0 && (
                <div className={styles.existingImages}>
                  {existingImageUrls.map((url, index) => (
                    <div key={url} className={styles.existingImage}>
                      <img src={url} alt={`Existing ${index + 1}`} />
                      <button
                        className={styles.removeBtn}
                        onClick={() => handleRemoveExistingImage(index)}
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

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
            {uploading ? 'Đang tải...' : posting ? 'Đang đăng...' : editMode ? 'Cập nhật' : 'Đăng'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}