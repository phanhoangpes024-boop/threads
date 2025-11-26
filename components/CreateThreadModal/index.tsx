'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './CreateThreadModal.module.css';

interface CreateThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string) => Promise<void>;
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
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (posting) return;
    setContent('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!content.trim() || posting) return;
    
    setPosting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
    } catch (error) {
      console.error('Error posting thread:', error);
    } finally {
      setPosting(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button 
              className={styles.cancelBtn} 
              onClick={handleClose}
              disabled={posting}
            >
              Hủy
            </button>
          </div>
          <div className={styles.headerCenter}>Thread mới</div>
          <div className={styles.headerRight}>
            <button className={styles.menuBtn} disabled={posting}>
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
                <button className={styles.dropdown} disabled={posting}>
                  Thêm chủ đề
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M6 8L2 4h8L6 8z" />
                  </svg>
                </button>
              </div>
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                placeholder="Có gì mới?"
                rows={3}
                value={content}
                onChange={handleTextareaChange}
                disabled={posting}
              />
              <div className={styles.toolbar}>
                <button className={styles.toolbarIcon} title="Thêm ảnh" disabled={posting}>
                  <svg viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                  </svg>
                </button>
                <button className={styles.toolbarIcon} title="Thêm GIF" disabled={posting}>
                  <svg viewBox="0 0 24 24">
                    <path d="M19 10.5V8.8h-4.4v6.4h1.7v-2h2v-1.7h-2v-1H19zm-7.3-1.7h1.7v6.4h-1.7V8.8zm-3.6 1.7c.4 0 .9.2 1.2.5l1.2-1C9.9 9.2 9 8.8 8.1 8.8c-1.8 0-3.2 1.4-3.2 3.2s1.4 3.2 3.2 3.2c1 0 1.8-.4 2.4-1.1v-2.5H7.7v1.2h1.2v.6c-.2.1-.5.2-.8.2-.9 0-1.6-.7-1.6-1.6 0-.8.7-1.6 1.6-1.6z" />
                  </svg>
                </button>
                <button className={styles.toolbarIcon} title="Thêm emoji" disabled={posting}>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                  </svg>
                </button>
                <button className={styles.toolbarIcon} title="Thêm danh sách" disabled={posting}>
                  <svg viewBox="0 0 24 24">
                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
                  </svg>
                </button>
                <button className={styles.toolbarIcon} title="Thêm vị trí" disabled={posting}>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.replyControl}>
            <label className={styles.checkboxContainer}>
              <input type="checkbox" disabled={posting} />
            </label>
            <label className={styles.checkboxLabel}>
              Các lựa chọn để kiểm soát câu trả lời
            </label>
          </div>
          <div className={styles.footerActions}>
            <button
              className={`${styles.postBtn} ${content.trim() && !posting ? styles.active : ''}`}
              disabled={!content.trim() || posting}
              onClick={handleSubmit}
            >
              {posting ? 'Đang đăng...' : 'Đăng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}