// components/ProfileHeader/index.tsx
'use client';

import React, { useState, useEffect } from 'react';
import styles from './ProfileHeader.module.css';

interface ProfileHeaderProps {
  userId: string;
  name: string;
  username: string;
  bio?: string;
  avatarText: string;
    avatarBg?: string;  // ← THÊM
  avatarUrl?: string;
  verified?: boolean;
  followersCount: number;
  followingCount?: number;
  isOwnProfile: boolean;
  isFollowing?: boolean;
  currentUserId?: string;
  onEditClick?: () => void;
  onFollowToggle?: (isFollowing: boolean) => void;
}

export default function ProfileHeader({
  userId,
  name,
  username,
  bio,
  avatarText,
    avatarBg = '#0077B6',  // ← THÊM
  avatarUrl,
  verified = false,
  followersCount,
  isOwnProfile,
  isFollowing: initialIsFollowing = false,
  currentUserId,
  onEditClick,
  onFollowToggle,
}: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  // ✅ Nhận kết quả từ cha khi API xong
  useEffect(() => {
    setIsFollowing(initialIsFollowing);
    setLoading(false);
  }, [initialIsFollowing]);

  const handleFollowClick = () => {
    if (!currentUserId || loading) return;
    
    // Chỉ update UI tạm thời + loading
    setIsFollowing(!isFollowing);
    setLoading(true);
    
    // Báo cho cha biết - cha sẽ gọi API
    onFollowToggle?.(!isFollowing);
  };

  return (
    <div className={styles.profileHeader}>
      <div className={styles.headerContent}>
        <div className={styles.avatarWrapper}>
          <div className={styles.avatar}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className={styles.avatarImage} />
            ) : (
              <div className={styles.avatarInner} style={{ background: avatarBg }}>
  {avatarText}
</div>
            )}
          </div>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.nameRow}>
            <h1 className={styles.name}>{name}</h1>
            {verified && (
              <div className={styles.verifiedBadge}>
                <svg viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" fill="#0095f6" />
                </svg>
              </div>
            )}
          </div>
          
          <div className={styles.username}>{username}</div>
          
          {bio && <p className={styles.bio}>{bio}</p>}
          
          <div className={styles.statsRow}>
            <span className={styles.statText}>
              {followersCount} người theo dõi
            </span>
          </div>

          {!isOwnProfile && (
            <div className={styles.socialIcons}>
              <button className={styles.iconButton} aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </button>
              <button className={styles.iconButton} aria-label="Notifications">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
              <button className={styles.iconButton} aria-label="More">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="6" cy="12" r="1.5" />
                  <circle cx="18" cy="12" r="1.5" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {isOwnProfile ? (
        <button className={styles.editButton} onClick={onEditClick}>
          Chỉnh sửa trang cá nhân
        </button>
      ) : (
        <div className={styles.actionButtons}>
          <button 
            className={`${styles.followButton} ${isFollowing ? styles.following : ''}`}
            onClick={handleFollowClick}
            disabled={loading}
          >
            {loading ? '...' : isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
          </button>
          <button className={styles.mentionButton}>
            Nhắc đến
          </button>
        </div>
      )}
    </div>
  );
}