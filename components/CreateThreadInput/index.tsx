'use client';

import React from 'react';
import styles from './CreateThreadInput.module.css';

interface CreateThreadInputProps {
  avatarText?: string;
  placeholder?: string;
}

export default function CreateThreadInput({
  avatarText = 'U',
  placeholder = 'Có gì mới?',
}: CreateThreadInputProps) {
  return (
    <div className={styles.createThreadContainer}>
      <div className={styles.createThreadWrapper}>
        <div className={styles.createAvatar}>
          <div className={styles.avatar}>{avatarText}</div>
        </div>

        <div className={styles.createInputSection}>
          <div className={styles.placeholder}>{placeholder}</div>
        </div>

        <button className={styles.postButton}>
          Đăng
        </button>
      </div>
    </div>
  );
}