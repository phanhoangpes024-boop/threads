import { useState, useEffect, useRef } from 'react'
import styles from './ThreadMenu.module.css'

interface ThreadMenuProps {
  threadId: string
  isOwnThread: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export default function ThreadMenu({ 
  threadId, 
  isOwnThread,
  onEdit,
  onDelete 
}: ThreadMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen])

  const handleCopyLink = () => {
    const url = `${window.location.origin}/thread/${threadId}`
    navigator.clipboard.writeText(url)
    setIsOpen(false)
  }

  const handleEdit = () => {
    setIsOpen(false)
    onEdit?.()
  }

  const handleDelete = () => {
    setIsOpen(false)
    onDelete?.()
  }

  return (
    <div className={styles.container} ref={menuRef}>
      <button 
        className={styles.menuButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {isOwnThread ? (
            <>
              {/* ✅ Sao chép liên kết cho own thread */}
              <button className={styles.menuItem} onClick={handleCopyLink}>
                <svg viewBox="0 0 24 24" className={styles.icon}>
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                Sao chép liên kết
              </button>

              <button className={styles.menuItem} onClick={handleEdit}>
                <svg viewBox="0 0 24 24" className={styles.icon}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Chỉnh sửa
              </button>
              
              <button className={`${styles.menuItem} ${styles.delete}`} onClick={handleDelete}>
                <svg viewBox="0 0 24 24" className={styles.icon}>
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Xóa
              </button>
            </>
          ) : (
            <button className={styles.menuItem} onClick={handleCopyLink}>
              <svg viewBox="0 0 24 24" className={styles.icon}>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              Sao chép liên kết
            </button>
          )}
        </div>
      )}
    </div>
  )
}