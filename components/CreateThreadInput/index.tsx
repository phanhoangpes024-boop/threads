'use client';

import React, { useState } from 'react';
import { useThreads } from '@/contexts/ThreadsContext';
import styles from './CreateThreadInput.module.css';

interface CreateThreadInputProps {
  avatarText?: string;
  placeholder?: string;
}

export default function CreateThreadInput({
  avatarText = 'U',
  placeholder = 'Có gì mới?',
}: CreateThreadInputProps) {
  const [value, setValue] = useState('');
  const { createThread } = useThreads();
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!value.trim() || posting) return;
    
    setPosting(true);
    await createThread(value.trim());
    setValue('');
    setPosting(false);
  };

  return (
    <div className={styles.createThreadContainer}>
      <div className={styles.createThreadWrapper}>
        <div className={styles.createAvatar}>
          <div className={styles.avatar}>{avatarText}</div>
        </div>

        <div className={styles.createInputSection}>
          <div className={styles.inputWrapper}>
            <textarea
              className={styles.threadInput}
              placeholder={placeholder}
              rows={1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={posting}
            />
          </div>
        </div>

        <button
          className={`${styles.postButton} ${value.trim() ? styles.active : ''}`}
          disabled={!value.trim() || posting}
          onClick={handlePost}
        >
          {posting ? 'Đang đăng...' : 'Đăng'}
        </button>
      </div>
    </div>
  );
}