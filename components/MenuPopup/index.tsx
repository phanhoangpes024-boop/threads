// components/MenuPopup/index.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { logout } from '@/lib/currentUser'
import styles from './MenuPopup.module.css'

interface MenuPopupProps {
  isOpen: boolean
  onClose: () => void
  position?: 'desktop' | 'mobile'
}

export default function MenuPopup({ isOpen, onClose, position = 'desktop' }: MenuPopupProps) {
  const [darkMode, setDarkMode] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    setDarkMode(savedTheme === 'dark')
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      // Delay để tránh close ngay khi click mở
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
      }, 0)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen, onClose])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('theme', newMode ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light')
  }

  const handleLogout = () => {
    onClose()
    logout()
  }

  if (!isOpen) return null
  if (typeof window === 'undefined') return null

  const content = (
    <div 
      ref={popupRef}
      className={`${styles.popup} ${position === 'mobile' ? styles.mobile : styles.desktop}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Giao diện */}
      <div className={styles.menuItem} onClick={toggleDarkMode}>
        <div className={styles.menuItemLeft}>
          <svg viewBox="0 0 24 24" className={styles.menuIcon}>
            {darkMode ? (
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <>
                <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </>
            )}
          </svg>
          <span>Giao diện</span>
        </div>
        <div className={styles.toggle}>
          <div className={`${styles.toggleTrack} ${darkMode ? styles.toggleActive : ''}`}>
            <div className={styles.toggleThumb} />
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Đăng xuất */}
      <div className={`${styles.menuItem} ${styles.logout}`} onClick={handleLogout}>
        <svg viewBox="0 0 24 24" className={styles.menuIcon}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="16 17 21 12 16 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Đăng xuất</span>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}