// components/CommentInput/index.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MOCK_USER } from '@/lib/currentUser';
import styles from './CommentInput.module.css';

interface CommentInputProps {
  threadId: string;
  onCommentSubmit: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}

export default function CommentInput({
  threadId,
  onCommentSubmit,
  autoFocus = false,
  placeholder = 'Trả lời...',
}: CommentInputProps) {
  const [value, setValue] = useState('');
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async () => {
    if (!value.trim() || posting) return;
    
    setPosting(true);
    try {
      const res = await fetch(`/api/threads/${threadId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: MOCK_USER.id,
          content: value.trim(),
        }),
      });
      
      if (res.ok) {
        setValue('');
        onCommentSubmit();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setPosting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={styles.commentInputContainer}>
      <div className={styles.commentInputWrapper}>
        <div className={styles.avatar}>
          <div className={styles.avatarCircle}>{MOCK_USER.avatar_text}</div>
        </div>

        <div className={styles.inputSection}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            placeholder={placeholder}
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={posting}
          />
        </div>

        <button
          className={`${styles.submitButton} ${value.trim() ? styles.active : ''}`}
          disabled={!value.trim() || posting}
          onClick={handleSubmit}
        >
          {posting ? 'Đang gửi...' : 'Trả lời'}
        </button>
      </div>
    </div>
  );
}