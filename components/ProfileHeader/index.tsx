// components/ProfileHeader/index.tsx
'use client';

import React from 'react';
import styles from './ProfileHeader.module.css';

interface ProfileHeaderProps {
  name: string;
  username: string;
  bio?: string;
  avatarText: string;
  verified?: boolean;
  followersCount: number;
  followersAvatars?: string[];
  onEditClick?: () => void;
}

export default function ProfileHeader({
  name,
  username,
  bio,
  avatarText,
  verified = false,
  followersCount,
  followersAvatars = ['A', 'B', 'C'],
  onEditClick,
}: ProfileHeaderProps) {
  return (
    <div className={styles.profileHeader}>
      <div className={styles.headerContent}>
        <div className={styles.avatarWrapper}>
          <div className={styles.avatar}>
            <div className={styles.avatarInner}>{avatarText}</div>
          </div>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.nameRow}>
            <h1 className={styles.name}>{name}</h1>
            {verified && (
              <div className={styles.verifiedBadge}>
                <svg viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
            )}
          </div>
          
          <div className={styles.username}>{username}</div>
          
          {bio && <p className={styles.bio}>{bio}</p>}
          
          <div className={styles.followersRow}>
            <div className={styles.followersAvatars}>
              {followersAvatars.slice(0, 3).map((avatar, i) => (
                <div key={i} className={styles.followerAvatar}>
                  {avatar}
                </div>
              ))}
            </div>
            <span className={styles.followersText}>
              {followersCount} người theo dõi
            </span>
          </div>
          
          <div className={styles.socialIcons}>
            <button className={styles.iconButton} aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </button>
            <button className={styles.iconButton} aria-label="Website">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <button className={styles.editButton} onClick={onEditClick}>
        Chỉnh sửa trang cá nhân
      </button>
    </div>
  );
}