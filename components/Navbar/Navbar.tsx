// components/Navbar/Navbar.tsx
'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useCreateThread } from '@/hooks/useThreads'
import { getCurrentUser } from '@/lib/currentUser'
import { useTheme } from '@/components/ThemeProvider'
import styles from './Navbar.module.css'

const CreateThreadModal = dynamic(() => import('@/components/CreateThreadModal'), { ssr: false })

export default function Navbar() {
  const pathname = usePathname()
  const createMutation = useCreateThread()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const currentUser = getCurrentUser()
  const { theme, toggleTheme } = useTheme()

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname?.startsWith(path)
  }

  const handleCreateThread = async (content: string) => {
    await createMutation.mutateAsync({ content })
    setShowCreateModal(false)
  }

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <nav className={styles.desktopNav}>
        <div className={styles.navLogo}>
          <a href="/" className={styles.navItem}>
            <svg viewBox="0 0 24 24" className={styles.filled}>
              <circle cx="12" cy="12" r="10" />
            </svg>
          </a>
        </div>
        
        <div className={styles.navItems}>
          <a 
            href="/" 
            className={`${styles.navItem} ${isActive('/') && !pathname?.startsWith('/search') && !pathname?.startsWith('/profile') && !pathname?.startsWith('/activity') ? styles.active : ''}`}
          >
            <svg viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </a>
          
          <a 
            href="/search" 
            className={`${styles.navItem} ${isActive('/search') ? styles.active : ''}`}
          >
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </a>
          
          <button 
            className={styles.navItem}
            onClick={() => setShowCreateModal(true)}
          >
            <svg viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          
          <a 
            href="/activity" 
            className={`${styles.navItem} ${isActive('/activity') ? styles.active : ''}`}
          >
            <svg viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </a>
          
          <a 
            href={`/profile/${currentUser.username}`}
            className={`${styles.navItem} ${isActive('/profile') ? styles.active : ''}`}
          >
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="10" r="3" />
              <path d="M6.168 18.849A4 4 0 0 1 10 16h4a4 4 0 0 1 3.834 2.855" />
            </svg>
          </a>
        </div>
        
        <div className={styles.navMenu}>
          {/* Theme Toggle */}
          <button className={styles.navItem} onClick={toggleTheme} title="Chuyển theme">
            {theme === 'light' ? (
              <svg viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24">
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
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className={styles.mobileNav}>
        <div className={styles.mobileNavItems}>
          {/* Home */}
          <a 
            href="/" 
            className={`${styles.mobileNavItem} ${isActive('/') && !pathname?.startsWith('/search') && !pathname?.startsWith('/profile') && !pathname?.startsWith('/activity') ? styles.active : ''}`}
          >
            <svg viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </a>
          
          {/* Search */}
          <a 
            href="/search" 
            className={`${styles.mobileNavItem} ${isActive('/search') ? styles.active : ''}`}
          >
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </a>
          
          {/* Create Post */}
          <button 
            className={`${styles.mobileNavItem} ${styles.plusBtn}`}
            onClick={() => setShowCreateModal(true)}
          >
            <svg viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          
          {/* Activity/Heart */}
          <a 
            href="/activity" 
            className={`${styles.mobileNavItem} ${isActive('/activity') ? styles.active : ''}`}
          >
            <svg viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </a>
          
          {/* Profile */}
          <a 
            href={`/profile/${currentUser.username}`}
            className={`${styles.mobileNavItem} ${isActive('/profile') ? styles.active : ''}`}
          >
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="10" r="3" />
              <path d="M6.168 18.849A4 4 0 0 1 10 16h4a4 4 0 0 1 3.834 2.855" />
            </svg>
          </a>
        </div>
      </nav>

      {showCreateModal && (
        <CreateThreadModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateThread}
          username={currentUser.username}
          avatarText={currentUser.avatar_text}
        />
      )}
    </>
  )
}