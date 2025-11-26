// app/activity/page.tsx
'use client';

import { useMemo, useState } from 'react';
import CustomScrollbar from '@/components/CustomScrollbar';
import ThreadCard from '@/components/ThreadCard';
import CommentInput from '@/components/CommentInput';
import { useThreads } from '@/hooks/useThreads';
import { MOCK_USER } from '@/lib/currentUser';
import styles from './Activity.module.css';

export default function ActivityPage() {
  const { data: threads = [], isLoading } = useThreads();
  const [activeCommentThreadId, setActiveCommentThreadId] = useState<string | null>(null);

  const activityThreads = useMemo(() => {
    return threads.filter(thread => {
      if (thread.user_id === MOCK_USER.id) return true;
      if (thread.isLiked) return true;
      return false;
    });
  }, [threads]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Đang tải...</div>
      </div>
    );
  }

  return (
    <CustomScrollbar className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Hoạt động</h1>
      </div>

      {activityThreads.length === 0 ? (
        <div className={styles.empty}>
          <svg viewBox="0 0 24 24" width="64" height="64" stroke="#999" fill="none" strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <p>Chưa có hoạt động nào</p>
        </div>
      ) : (
        <div className={styles.threadsList}>
          {activityThreads.map((thread) => (
            <div key={thread.id}>
              <ThreadCard
                id={thread.id}
                username={thread.username || 'Unknown'}
                timestamp={thread.created_at}
                content={thread.content}
                imageUrl={thread.image_url}
                likes={thread.likes_count.toString()}
                comments={thread.comments_count.toString()}
                reposts={thread.reposts_count.toString()}
                verified={thread.verified}
                avatarText={thread.avatar_text || 'U'}
                isLiked={thread.isLiked}
                onCommentClick={() => setActiveCommentThreadId(thread.id)}
              />
              
              {activeCommentThreadId === thread.id && (
                <CommentInput
                  threadId={thread.id}
                  onCommentSubmit={() => setActiveCommentThreadId(null)}
                  autoFocus={true}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </CustomScrollbar>
  );
}