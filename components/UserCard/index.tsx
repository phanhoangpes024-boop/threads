'use client';

import React, { useState, useEffect } from 'react';
import { useFollowUser } from '@/hooks/useFollowUser';
import styles from './UserCard.module.css';

interface UserCardProps {
  id: string;
  username: string;
  bio?: string;
  avatarText: string;
  gradient?: string;
  initialFollowing?: boolean;
}

export default function UserCard({
  id,
  username,
  bio,
  avatarText,
  gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  initialFollowing = false,
}: UserCardProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const followMutation = useFollowUser();

  // 1. Đồng bộ state nếu props từ cha thay đổi (ví dụ khi refetch list)
  useEffect(() => {
    setIsFollowing(initialFollowing);
  }, [initialFollowing]);

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Lưu lại giá trị cũ để rollback nếu cần
    const previousState = isFollowing;

    // 2. Optimistic Update: Đổi UI ngay lập tức
    const newState = !previousState;
    setIsFollowing(newState);

    // 3. Gọi API
    followMutation.mutate(id, {
      onError: () => {
        // 4. Nếu lỗi, trả về trạng thái cũ (Rollback)
        setIsFollowing(previousState);
        // Có thể thêm toast thông báo lỗi ở đây
        console.error("Follow thất bại");
      },
      // Nếu thành công thì không cần làm gì vì UI đã đúng rồi
    });
  };

  return (
    <div className={styles.userCard}>
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
        // Lưu ý: Nếu muốn UI thật sự "mượt", có thể bỏ disabled này. 
        // Nhưng để an toàn tránh spam request, giữ lại cũng tốt.
        disabled={followMutation.isPending} 
      >
        {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
      </button>
    </div>
  );
}