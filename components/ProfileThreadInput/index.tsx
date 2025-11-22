'use client';

import React, { useState } from 'react';
import styles from './ProfileThreadInput.module.css';

interface ProfileThreadInputProps {
  avatarText: string;
  onPost?: (content: string) => void;
}

export default function ProfileThreadInput({ 
  avatarText,
  onPost 
}: ProfileThreadInputProps) {
  const [value, setValue] = useState('');

  const handlePost = () => {
    if (value.trim()) {
      onPost?.(value.trim());
      setValue('');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.avatar}>
          <div className={styles.avatarCircle}>{avatarText}</div>
        </div>

        <div className={styles.inputSection}>
          <textarea
            className={styles.textarea}
            placeholder="Có gì mới?"
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        <button
          className={`${styles.postButton} ${value.trim() ? styles.active : ''}`}
          disabled={!value.trim()}
          onClick={handlePost}
        >
          Đăng
        </button>
      </div>
    </div>
  );
}