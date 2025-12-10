'use client';

import React from 'react';
import styles from './CreateThreadInput.module.css';

interface CreateThreadInputProps {
  avatarText?: string;
  placeholder?: string;
  avatarBg?: string;  // ← THÊM
}

export default function CreateThreadInput({
  avatarText = 'U',
  avatarBg = '#0077B6',  // ← THÊM
  placeholder = 'Có gì mới?',
}: CreateThreadInputProps) {
  return (
    <div className={styles.createThreadContainer}>
      <div className={styles.createThreadWrapper}>
        <div className={styles.createAvatar}>
<div className={styles.avatar} style={{ background: avatarBg }}>{avatarText}</div>
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