'use client';

import CreateThreadInput from '@/components/CreateThreadInput';
import ThreadFeed from '@/components/ThreadFeed';
import { useThreads } from '@/contexts/ThreadsContext';
import { MOCK_USER } from '@/lib/currentUser';
import styles from './page.module.css';

export default function Home() {
  const { threads, loading } = useThreads();

  if (loading) {
    return (
      <div className={styles.mainContainer}>
        <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      <CreateThreadInput avatarText={MOCK_USER.avatar_text} />
      <ThreadFeed threads={threads} />
    </div>
  );
}