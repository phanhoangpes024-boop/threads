// components/LoginPromptModal/index.tsx
'use client'

import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'

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
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center'
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          marginBottom: '12px',
          color: '#000'
        }}>
          Đăng nhập để tiếp tục
        </h2>
        
        <p style={{ 
          color: '#666', 
          marginBottom: '24px',
          fontSize: '15px'
        }}>
          Bạn cần đăng nhập để thực hiện hành động này
        </p>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px' 
        }}>
          <button
            onClick={handleLogin}
            style={{
              background: '#000',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={e => (e.currentTarget.style.opacity = '1')}
          >
            Đăng nhập
          </button>

          <button
            onClick={handleRegister}
            style={{
              background: 'white',
              color: '#000',
              border: '1px solid #e5e5e5',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#f5f5f5')}
            onMouseOut={e => (e.currentTarget.style.background = 'white')}
          >
            Đăng ký
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: '#666',
              border: 'none',
              padding: '12px',
              fontSize: '14px',
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}