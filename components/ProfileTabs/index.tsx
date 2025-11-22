'use client';

import React, { useState } from 'react';
import styles from './ProfileTabs.module.css';

type TabType = 'threads' | 'replies' | 'media' | 'reposts';

interface ProfileTabsProps {
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
}

export default function ProfileTabs({ 
  activeTab = 'threads',
  onTabChange 
}: ProfileTabsProps) {
  const [active, setActive] = useState<TabType>(activeTab);

  const handleTabClick = (tab: TabType) => {
    setActive(tab);
    onTabChange?.(tab);
  };

  return (
    <nav className={styles.tabs}>
      <button
        className={`${styles.tab} ${active === 'threads' ? styles.active : ''}`}
        onClick={() => handleTabClick('threads')}
      >
        Thread
      </button>
      <button
        className={`${styles.tab} ${active === 'replies' ? styles.active : ''}`}
        onClick={() => handleTabClick('replies')}
      >
        Thread trả lời
      </button>
      <button
        className={`${styles.tab} ${active === 'media' ? styles.active : ''}`}
        onClick={() => handleTabClick('media')}
      >
        File phương tiện
      </button>
      <button
        className={`${styles.tab} ${active === 'reposts' ? styles.active : ''}`}
        onClick={() => handleTabClick('reposts')}
      >
        Bài đăng lại
      </button>
    </nav>
  );
}