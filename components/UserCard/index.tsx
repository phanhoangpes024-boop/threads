// components/UserCard/index.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useFollowUser } from '@/hooks/useFollowUser';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import LoginPromptModal from '@/components/LoginPromptModal';
import styles from './UserCard.module.css';

interface UserCardProps {
  id: string;
  username: string;
  bio?: string;
  avatarText: string;
  gradient?: string;
  initialFollowing?: boolean;
  onClick?: () => void;
}

export default function UserCard({
  id,
  username,
  bio,
  avatarText,
  gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  initialFollowing = false,
  onClick,
}: UserCardProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const followMutation = useFollowUser();
  const { requireAuth, showLoginPrompt, closePrompt } = useAuthGuard();

  useEffect(() => {
    setIsFollowing(initialFollowing);
  }, [initialFollowing]);

  // ✅ Follow với auth guard
  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();

    requireAuth(() => {
      const previousState = isFollowing;
      const newState = !previousState;
      setIsFollowing(newState);

      followMutation.mutate(id, {
        onError: () => {
          setIsFollowing(previousState);
          console.error("Follow thất bại");
        },
      });
    });
  };

  const handleCardClick = () => {
    onClick?.();
  };

  return (
    <>
      <div className={styles.userCard} onClick={handleCardClick}>
        <div className={styles.avatar} style={{ background: gradient }}>
          {avatarText}
        </div>
        <div className={styles.userInfo}>
          <div className={styles.username}>{username}</div>
          {bio && <div className={styles.userBio}>{bio}</div>}
        </div>
        <button
          className={`${styles.followButton} ${isFollowing ? styles.following : ''}`}
          onClick={handleFollow}
          disabled={followMutation.isPending} 
        >
          {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
        </button>
      </div>

      {/* ✅ Login Prompt Modal */}
      <LoginPromptModal isOpen={showLoginPrompt} onClose={closePrompt} />
    </>
  );
}