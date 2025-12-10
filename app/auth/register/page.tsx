// app/auth/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../login/auth.module.css';

const AVATAR_COLORS = [
  '#0077B6',
  '#2A9D8F',
  '#E76F51',
  '#7B68EE',
  '#607D8B'
];

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    avatarText: '',
    avatarBg: '#0077B6', // ← MỚI
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }

    if (formData.avatarText.length < 1 || formData.avatarText.length > 2) {
      setError('Avatar phải có 1-2 ký tự');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đăng ký thất bại');
      }

      localStorage.setItem('currentUser', JSON.stringify(data.user));
      
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    if (field === 'avatarText') {
      value = value.toUpperCase().slice(0, 2);
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>@</div>
        <h1 className={styles.title}>Đăng ký</h1>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleRegister} className={styles.form}>
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label>Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={handleChange('username')}
              placeholder="username"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label>Avatar (1-2 ký tự)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="text"
                value={formData.avatarText}
                onChange={handleChange('avatarText')}
                placeholder="AB"
                required
                maxLength={2}
                disabled={loading}
                style={{ flex: 1 }}
              />
              {/* Preview Avatar */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: formData.avatarBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px',
                fontWeight: '600'
              }}>
                {formData.avatarText || 'AB'}
              </div>
            </div>
          </div>

          {/* ✅ Color Picker */}
          <div className={styles.field}>
            <label>Màu nền Avatar</label>
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              {AVATAR_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, avatarBg: color }))}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: color,
                    border: formData.avatarBg === color ? '3px solid #000' : '2px solid #e0e0e0',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label>Mật khẩu</label>
            <input
              type="password"
              value={formData.password}
              onChange={handleChange('password')}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <div className={styles.footer}>
          Đã có tài khoản?{' '}
          <a href="/auth/login" className={styles.link}>
            Đăng nhập
          </a>
        </div>
      </div>
    </div>
  );
}