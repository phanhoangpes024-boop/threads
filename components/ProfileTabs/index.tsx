// components/ProfileTabs/index.tsx
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
      {/* ✅ CHỈ GIỮ 1 TAB */}
      <button
        className={`${styles.tab} ${styles.active}`}
        onClick={() => handleTabClick('threads')}
      >
        Bài đăng của tôi
      </button>
      
      {/* ❌ ẨN 3 TAB NÀY */}
      {/* 
      <button className={`${styles.tab} ${active === 'replies' ? styles.active : ''}`}>
        Thread trả lời
      </button>
      <button className={`${styles.tab} ${active === 'media' ? styles.active : ''}`}>
        File phương tiện
      </button>
      <button className={`${styles.tab} ${active === 'reposts' ? styles.active : ''}`}>
        Bài đăng lại
      </button>
      */}
    </nav>
  );
}