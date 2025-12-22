// app/auth/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import styles from './register.module.css'

const AVATAR_COLORS = [
  '#1e3a8a',
  '#2A9D8F',
  '#E76F51',
  '#7B68EE',
  '#607D8B'
]

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    avatarText: '',
    avatarBg: '#1e3a8a',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      setLoading(false)
      setTimeout(() => setError(''), 3000)
      return
    }

    if (formData.avatarText.length < 1 || formData.avatarText.length > 2) {
      setError('Avatar phải có 1-2 ký tự')
      setLoading(false)
      setTimeout(() => setError(''), 3000)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Đăng ký thất bại')
      }

      localStorage.setItem('currentUser', JSON.stringify(data.user))
      
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    
    if (field === 'avatarText') {
      value = value.toUpperCase().slice(0, 2)
    }
    
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoContainer}>
          <Image 
            src="/logo.svg" 
            alt="Logo" 
            width={48} 
            height={48}
            className={styles.logo}
          />
        </div>

        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.title}>Đăng ký</h1>
          <p className={styles.subtitle}>Tạo tài khoản mới để bắt đầu</p>
        </header>

        {/* Error Toast */}
        {error && <div className={styles.error}>{error}</div>}
        
        {/* Form */}
        <form onSubmit={handleRegister} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange('email')}
              placeholder="your@email.com"
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={handleChange('username')}
              placeholder="username"
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="avatar">Avatar (1-2 ký tự)</label>
            <div className={styles.avatarInput}>
              <input
                type="text"
                id="avatar"
                value={formData.avatarText}
                onChange={handleChange('avatarText')}
                placeholder="AB"
                required
                maxLength={2}
                disabled={loading}
              />
              <div 
                className={styles.avatarPreview}
                style={{ background: formData.avatarBg }}
              >
                {formData.avatarText || 'AB'}
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <label>Màu nền Avatar</label>
            <div className={styles.colorPicker}>
              {AVATAR_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, avatarBg: color }))}
                  className={`${styles.colorButton} ${formData.avatarBg === color ? styles.colorButtonActive : ''}`}
                  style={{ background: color }}
                  disabled={loading}
                  aria-label={`Chọn màu ${color}`}
                />
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Mật khẩu</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={formData.password}
                onChange={handleChange('password')}
                placeholder="••••••••"
                required
                disabled={loading}
                autoComplete="new-password"
              />
              <button
  type="button"
  className={styles.togglePassword}
  onClick={() => setShowPassword(!showPassword)}
  disabled={loading}
>
  {showPassword ? (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
    </svg>
  ) : (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
    </svg>
  )}
</button>
            </div>
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                <span>Đang đăng ký...</span>
              </>
            ) : (
              'Đăng ký'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          Đã có tài khoản?
          <a href="/auth/login" className={styles.link}>
            Đăng nhập
          </a>
        </div>
      </div>
    </div>
  )
}