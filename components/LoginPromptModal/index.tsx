// components/LoginPromptModal/index.tsx
'use client'

import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import styles from './LoginPromptModal.module.css'

interface LoginPromptModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginPromptModal({ isOpen, onClose }: LoginPromptModalProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !mounted) return null

  const handleLogin = () => {
    router.push('/auth/login')
  }

  const handleRegister = () => {
    router.push('/auth/register')
  }

  const modalContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 className={styles.title}>Đăng nhập để tiếp tục</h2>
        
        <p className={styles.description}>
          Bạn cần đăng nhập để thực hiện hành động này
        </p>

        <div className={styles.buttons}>
          <button onClick={handleLogin} className={styles.loginBtn}>
            Đăng nhập
          </button>

          <button onClick={handleRegister} className={styles.registerBtn}>
            Đăng ký
          </button>

          <button onClick={onClose} className={styles.cancelBtn}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}