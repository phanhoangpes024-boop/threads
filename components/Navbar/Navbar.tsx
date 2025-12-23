// components/Navbar/Navbar.tsx
'use client'

import React, { useState, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useCreateThread } from '@/hooks/useThreads'
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import LoginPromptModal from '@/components/LoginPromptModal'
import MenuPopup from '@/components/MenuPopup'
import styles from './Navbar.module.css'

const CreateThreadModal = dynamic(() => import('@/components/CreateThreadModal'), { ssr: false })

// ✅ Constant để tránh vòng lặp re-render
const EMPTY_ARRAY: string[] = []

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const createMutation = useCreateThread()
  const { user, isGuest } = useCurrentUser()
  const { requireAuth, showLoginPrompt, closePrompt } = useAuthGuard()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  
  const { data: unreadCount = 0 } = useUnreadNotifications()

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname?.startsWith(path)
  }

  // ✅ Bỏ createMutation khỏi dependency
  const handleCreateThread = useCallback(async (content: string, imageUrls?: string[]) => {
    await createMutation.mutateAsync({ content, imageUrls: imageUrls || [] })
    setShowCreateModal(false)
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowCreateModal(false)
  }, [])

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    if (path === '/' || path === '/search') return
    
    e.preventDefault()
    requireAuth(() => router.push(path))
  }

  const handleCreateClick = () => {
    requireAuth(() => setShowCreateModal(true))
  }

  const handleSearchClick = (e: React.MouseEvent) => {
    requireAuth(() => router.push('/search'))
  }

  const handleMenuClick = () => {
    requireAuth(() => setShowMenu(!showMenu))
  }

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <nav className={styles.desktopNav}>
        <div className={styles.navLogo}>
          <Link href="/" className={styles.navItem}>
            <img src="/logo.svg" alt="Logo" style={{ width: '40px', height: '40px' }} />
          </Link>
        </div>
        
        <div className={styles.navItems}>
          <Link href="/" className={`${styles.navItem} ${isActive('/') && !pathname?.startsWith('/search') && !pathname?.startsWith('/profile') && !pathname?.startsWith('/activity') ? styles.active : ''}`}>
            <svg viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </Link>
          
          <button 
            className={`${styles.navItem} ${isActive('/search') ? styles.active : ''}`}
            onClick={handleSearchClick}
          >
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
          
          <button className={styles.navItem} onClick={handleCreateClick}>
            <svg viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          
          <Link 
            href="/activity" 
            className={`${styles.navItem} ${isActive('/activity') ? styles.active : ''}`}
            onClick={(e) => handleNavClick(e, '/activity')}
          >
            <div className={styles.iconWrapper}>
              <svg viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {!isGuest && unreadCount > 0 && <span className={styles.badge}></span>}
            </div>
          </Link>
          
          <Link 
            href={`/profile/${user.username}`} 
            className={`${styles.navItem} ${isActive('/profile') ? styles.active : ''}`}
            onClick={(e) => handleNavClick(e, `/profile/${user.username}`)}
          >
            <div 
              className={styles.avatar}
              style={{ backgroundColor: user.avatar_bg }}
            >
              {user.avatar_text}
            </div>
          </Link>
        </div>

        <div className={styles.navMenu}>
          <button className={styles.navItem} onClick={handleMenuClick}>
            <svg viewBox="0 0 24 24">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {showMenu && (
            <MenuPopup 
              isOpen={showMenu} 
              onClose={() => setShowMenu(false)} 
              position="desktop"
            />
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className={styles.mobileNav}>
        <div className={styles.mobileNavItems}>
          <Link href="/" className={`${styles.mobileNavItem} ${isActive('/') && !pathname?.startsWith('/search') && !pathname?.startsWith('/profile') && !pathname?.startsWith('/activity') ? styles.active : ''}`}>
            <svg viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </Link>

          <button 
            className={`${styles.mobileNavItem} ${isActive('/search') ? styles.active : ''}`}
            onClick={handleSearchClick}
          >
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>

          <button className={`${styles.mobileNavItem} ${styles.plusBtn}`} onClick={handleCreateClick}>
            <svg viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          <Link 
            href="/activity" 
            className={`${styles.mobileNavItem} ${isActive('/activity') ? styles.active : ''}`}
            onClick={(e) => handleNavClick(e, '/activity')}
          >
            <div className={styles.iconWrapper}>
              <svg viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {!isGuest && unreadCount > 0 && <span className={styles.badge}></span>}
            </div>
          </Link>

          <Link 
            href={`/profile/${user.username}`} 
            className={`${styles.mobileNavItem} ${isActive('/profile') ? styles.active : ''}`}
            onClick={(e) => handleNavClick(e, `/profile/${user.username}`)}
          >
            <div 
              className={styles.avatar}
              style={{ backgroundColor: user.avatar_bg }}
            >
              {user.avatar_text}
            </div>
          </Link>
        </div>
      </nav>

      {!isGuest && showCreateModal && (
        <CreateThreadModal
          isOpen={showCreateModal}
          onClose={handleCloseModal}
          onSubmit={handleCreateThread}
          username={user.username}
          avatarText={user.avatar_text}
          avatarBg={user.avatar_bg}
          editMode={false}
          initialContent=""
          initialImageUrls={EMPTY_ARRAY}
          threadId={undefined}
        />
      )}

      <LoginPromptModal isOpen={showLoginPrompt} onClose={closePrompt} />
    </>
  )
}