// components/EditProfileModal/index.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import styles from './EditProfileModal.module.css';

const AVATAR_COLORS = [
  '#0077B6',
  '#2A9D8F',
  '#E76F51',
  '#7B68EE',
  '#607D8B'
];

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: {
    name?: string;
    username: string;
    avatar_text: string;
    avatar_bg?: string; // ← MỚI
    bio?: string;
  };
  onSave: () => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  currentProfile,
  onSave,
}: EditProfileModalProps) {
  const { user } = useCurrentUser();
  const [name, setName] = useState(currentProfile.name || '');
  const [avatarText, setAvatarText] = useState(currentProfile.avatar_text);
  const [avatarBg, setAvatarBg] = useState(currentProfile.avatar_bg || '#0077B6'); // ← MỚI
  const [bio, setBio] = useState(currentProfile.bio || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(currentProfile.name || '');
      setAvatarText(currentProfile.avatar_text);
      setAvatarBg(currentProfile.avatar_bg || '#0077B6'); // ← MỚI
      setBio(currentProfile.bio || '');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, currentProfile]);

  const handleSave = async () => {
    if (saving) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          avatar_text: avatarText.trim().toUpperCase().slice(0, 2),
          avatar_bg: avatarBg, // ← MỚI
          bio: bio.trim(),
        }),
      });

      if (res.ok) {
        const updatedUser = {
          ...user,
          avatar_text: avatarText.trim().toUpperCase().slice(0, 2),
          avatar_bg: avatarBg, // ← MỚI
          bio: bio.trim(),
        };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        onSave();
        onClose();
        window.location.reload();
      } else {
        alert('Có lỗi xảy ra khi lưu thay đổi');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Có lỗi xảy ra khi lưu thay đổi');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 2);
    setAvatarText(value);
  };

  if (!isOpen) return null;
  if (typeof window === 'undefined') return null;

  const modalContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <h2 className={styles.title}>Chỉnh sửa trang cá nhân</h2>
        </div>

        <div className={styles.body}>
          {/* Name + Avatar Preview */}
          <div className={styles.field}>
            <label className={styles.label}>Tên đầy đủ</label>
            <div className={styles.nameRow}>
              <input
                type="text"
                className={styles.input}
                placeholder="Nhập tên đầy đủ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
              />
              <div 
                className={styles.avatarPreview}
                style={{ background: avatarBg }} // ← Dùng màu đã chọn
              >
                {avatarText || 'PH'}
              </div>
            </div>
          </div>

          {/* Username */}
          <div className={styles.field}>
            <label className={styles.label}>Username</label>
            <div className={styles.usernameRow}>
              <svg className={styles.lockIcon} viewBox="0 0 24 24" width="16" height="16">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              <input
                type="text"
                className={`${styles.input} ${styles.disabled}`}
                value={`@${currentProfile.username}`}
                disabled
              />
            </div>
          </div>

          {/* Avatar Text */}
          <div className={styles.field}>
            <label className={styles.label}>Avatar (1-2 ký tự)</label>
            <input
              type="text"
              className={styles.input}
              placeholder="VD: PH"
              value={avatarText}
              onChange={handleAvatarTextChange}
              maxLength={2}
            />
          </div>

          {/* ✅ Color Picker */}
          <div className={styles.field}>
            <label className={styles.label}>Màu nền Avatar</label>
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              {AVATAR_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAvatarBg(color)}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: color,
                    border: avatarBg === color ? '3px solid #000' : '2px solid #e0e0e0',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className={styles.field}>
            <label className={styles.label}>Tiểu sử</label>
            <textarea
              className={styles.textarea}
              placeholder="Viết tiểu sử của bạn..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={150}
              rows={3}
            />
            <div className={styles.charCount}>{bio.length}/150</div>
          </div>
        </div>

        <div className={styles.footer}>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving || !avatarText.trim()}
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}