// components/Header/index.tsx
'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Header.module.css';

export default function Header() {
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('following');
  const pathname = usePathname();
  const router = useRouter();
  
  // Check if we're on thread detail page
  const isThreadDetail = pathname?.startsWith('/thread/');

  return (
    <>
      {/* Desktop Header */}
      <header className={styles.desktopHeader}>
        {isThreadDetail ? (
          <>
            <button 
              className={styles.backButton}
              onClick={() => router.push('/')}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </button>
            <div className={styles.threadTitle}>Thread</div>
            <button className={styles.desktopMenuButton}>
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <button className={styles.dropdownButton}>
              <span className={styles.dropdownText}>Đang theo dõi</span>
              <svg className={styles.dropdownIcon} viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <button className={styles.desktopMenuButton}>
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          </>
        )}
      </header>

      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <div className={styles.mobileHeaderTop}>
          {isThreadDetail ? (
            <>
              <button 
                className={styles.mobileBackButton}
                onClick={() => router.push('/')}
              >
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </button>
              <div className={styles.mobileThreadTitle}>Thread</div>
              <button className={styles.mobileMenuButton}>
                <svg viewBox="0 0 24 24">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <div className={styles.mobileLogo}>@</div>
              <button className={styles.mobileMenuButton}>
                <svg viewBox="0 0 24 24">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </>
          )}
        </div>
        
        {!isThreadDetail && (
          <nav className={styles.mobileTabs}>
            <button
              className={`${styles.mobileTab} ${activeTab === 'for-you' ? styles.active : ''}`}
              onClick={() => setActiveTab('for-you')}
            >
              Dành cho bạn
            </button>
            <button
              className={`${styles.mobileTab} ${activeTab === 'following' ? styles.active : ''}`}
              onClick={() => setActiveTab('following')}
            >
              Đang theo dõi
            </button>
          </nav>
        )}
      </header>
    </>
  );
}