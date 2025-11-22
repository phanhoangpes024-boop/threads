// app/activity/page.tsx
'use client';

import { useEffect, useState } from 'react';
import ThreadCard from '@/components/ThreadCard';
import { MOCK_USER } from '@/lib/currentUser';
import styles from './Activity.module.css';

interface Thread {
  id: string;
  username: string;
  avatar_text: string;
  verified: boolean;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  created_at: string;
  user_id: string;
}

export default function ActivityPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityThreads();
  }, []);

  const fetchActivityThreads = async () => {
    try {
      // Fetch threads where user is author OR has interacted (liked/commented)
      const res = await fetch(`/api/users/${MOCK_USER.id}/activity`);
      const data = await res.json();
      setThreads(data);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Đang tải...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Hoạt động</h1>
      </div>

      {threads.length === 0 ? (
        <div className={styles.empty}>
          <svg viewBox="0 0 24 24" width="64" height="64" stroke="#999" fill="none" strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <p>Chưa có hoạt động nào</p>
        </div>
      ) : (
        <div className={styles.threadsList}>
          {threads.map((thread) => (
            <ThreadCard
              key={thread.id}
              id={thread.id}
              username={thread.username}
              timestamp={thread.created_at}
              content={thread.content}
              imageUrl={thread.image_url}
              likes={thread.likes_count.toString()}
              comments={thread.comments_count.toString()}
              reposts={thread.reposts_count.toString()}
              verified={thread.verified}
              avatarText={thread.avatar_text}
            />
          ))}
        </div>
      )}
    </div>
  );
}