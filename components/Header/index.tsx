// components/Header/index.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import { logout } from '@/lib/currentUser';
import styles from './Header.module.css';

export default function Header() {
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('following');
  const [showMenu, setShowMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
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
            <button className={styles.desktopMenuButton} onClick={() => setShowMenu(!showMenu)}>
              <svg viewBox="0 0 24 24">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
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
            <button className={styles.desktopMenuButton} onClick={() => setShowMenu(!showMenu)}>
              <svg viewBox="0 0 24 24">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </>
        )}

        {/* Desktop Menu Popup */}
        {showMenu && (
          <div className={styles.menuPopup}>
            <button className={styles.menuItem} onClick={() => { toggleTheme(); setShowMenu(false); }}>
              {theme === 'light' ? (
                <>
                  <svg viewBox="0 0 24 24" className={styles.menuIcon}>
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  <span>Chế độ tối</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className={styles.menuIcon}>
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                  <span>Chế độ sáng</span>
                </>
              )}
            </button>
            <div className={styles.divider} />
            <button className={styles.menuItem} onClick={() => { logout(); setShowMenu(false); }}>
              <svg viewBox="0 0 24 24" className={styles.menuIcon}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Đăng xuất</span>
            </button>
          </div>
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

        {/* Mobile Menu Popup */}
        {showMenu && (
          <>
            <div className={styles.menuOverlay} onClick={() => setShowMenu(false)} />
            <div className={styles.menuPopup}>
              <button className={styles.menuItem} onClick={() => { toggleTheme(); setShowMenu(false); }}>
                {theme === 'light' ? (
                  <>
                    <svg viewBox="0 0 24 24" className={styles.menuIcon}>
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    <span>Chế độ tối</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className={styles.menuIcon}>
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                    <span>Chế độ sáng</span>
                  </>
                )}
              </button>
              <div className={styles.divider} />
              <button className={styles.menuItem} onClick={() => { logout(); setShowMenu(false); }}>
                <svg viewBox="0 0 24 24" className={styles.menuIcon}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Đăng xuất</span>
              </button>
            </div>
          </>
        )}
      </header>
    </>
  );
}