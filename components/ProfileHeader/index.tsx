// components/ProfileHeader/index.tsx
'use client';

import React from 'react';
import { useFollowUser } from '@/hooks/useFollowUser';
import { useIsFollowing } from '@/hooks/useIsFollowing';
import styles from './ProfileHeader.module.css';

interface ProfileHeaderProps {
  userId: string;
  name: string;
  username: string;
  bio?: string;
  avatarText: string;
  avatarBg?: string;
  avatarUrl?: string;
  verified?: boolean;
  followersCount: number;
  followingCount?: number;
  isOwnProfile: boolean;
  currentUserId?: string;
  onEditClick?: () => void;
}

export default function ProfileHeader({
  userId,
  name,
  username,
  bio,
  avatarText,
  avatarBg = '#0077B6',
  avatarUrl,
  verified = false,
  followersCount,
  isOwnProfile,
  currentUserId,
  onEditClick,
}: ProfileHeaderProps) {
  const { data: isFollowing = false, isLoading } = useIsFollowing(userId);
  const followMutation = useFollowUser();

  const handleFollowClick = () => {
    if (!currentUserId) return;
    followMutation.mutate(userId);
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
                <svg viewBox="0 0 24 24" fill="#0095f6">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
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
                  <path d="M13.73 21a2 0 0 1-3.46 0" />
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
            disabled={followMutation.isPending || isLoading}
          >
            {isLoading ? '...' : isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
          </button>
        </div>
      )}
    </div>
  );
}