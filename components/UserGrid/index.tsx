// components/UserGrid/index.tsx
'use client';

import React, { useState } from 'react';
import styles from './UserGrid.module.css';

interface User {
  id: string;
  username: string;
  name: string;
  avatarText: string;
  gradient?: string;
}

interface UserGridProps {
  users: User[];
  onAddToggle?: (userId: string, isAdded: boolean) => void;
}

export default function UserGrid({ users, onAddToggle }: UserGridProps) {
  const [addedUsers, setAddedUsers] = useState<Set<string>>(new Set());

  const handleAdd = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newAdded = new Set(addedUsers);
    const isAdded = !addedUsers.has(userId);
    
    if (isAdded) {
      newAdded.add(userId);
    } else {
      newAdded.delete(userId);
    }
    
    setAddedUsers(newAdded);
    onAddToggle?.(userId, isAdded);
  };

  return (
    <div className={styles.userGrid}>
      {users.map((user) => {
        const isAdded = addedUsers.has(user.id);
        return (
          <div key={user.id} className={styles.userCard}>
            <div className={styles.avatarWrapper}>
              <div
                className={styles.avatar}
                style={{ background: user.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                {user.avatarText}
              </div>
              <div
                className={`${styles.addButton} ${isAdded ? styles.added : ''}`}
                onClick={(e) => handleAdd(user.id, e)}
              >
                {isAdded ? '✓' : '+'}
              </div>
            </div>
            <div className={styles.username}>{user.username}</div>
            <div className={styles.name}>{user.name}</div>
          </div>
        );
      })}
    </div>
  );
}