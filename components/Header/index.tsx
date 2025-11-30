// components/Header/index.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import MenuPopup from '@/components/MenuPopup';
import styles from './Header.module.css';

export default function Header() {
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('following');
  const [showMenu, setShowMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    setCanGoBack(window.history.length > 1);
  }, [pathname]);

  const isThreadDetail = pathname?.startsWith('/thread/');
  const isSearchResults = pathname === '/search/results';
  const isHomePage = pathname === '/';
  const isActivityPage = pathname === '/activity';

  const handleBack = () => {
    router.back();
  };

  const showBackButton = !isHomePage && canGoBack;
  
  const getPageTitle = () => {
    if (isThreadDetail) return 'Thread';
    if (isSearchResults) return 'Tìm kiếm';
    if (isActivityPage) return 'Hoạt động';
    if (pathname?.startsWith('/profile')) return 'Trang cá nhân';
    return '';
  };

  return (
    <>
      {/* Desktop Header */}
      <header className={styles.desktopHeader}>
        {showBackButton ? (
          <>
            <button className={styles.backButton} onClick={handleBack}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </button>
            <div className={styles.threadTitle}>{getPageTitle()}</div>
          </>
        ) : (
          <button className={styles.dropdownButton}>
            <span className={styles.dropdownText}>Đang theo dõi</span>
            <svg className={styles.dropdownIcon} viewBox="0 0 24 24">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}
      </header>

      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <div className={styles.mobileHeaderTop}>
          {showBackButton ? (
            <>
              <button className={styles.mobileBackButton} onClick={handleBack}>
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </button>
              <div className={styles.mobileThreadTitle}>{getPageTitle()}</div>
              <button className={styles.mobileMenuButton} onClick={() => setShowMenu(!showMenu)}>
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
              <button className={styles.mobileMenuButton} onClick={() => setShowMenu(!showMenu)}>
                <svg viewBox="0 0 24 24">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </>
          )}
        </div>
        
        {!showBackButton && (
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

        {/* Mobile Menu Popup - FIXED */}
        <MenuPopup 
          isOpen={showMenu} 
          onClose={() => setShowMenu(false)} 
          position="mobile" 
        />
      </header>
    </>
  );
}