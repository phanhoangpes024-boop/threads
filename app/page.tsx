'use client';

import { useState } from 'react';
import CreateThreadInput from '@/components/CreateThreadInput';
import CreateThreadModal from '@/components/CreateThreadModal';
import ThreadFeed from '@/components/ThreadFeed';
import { useThreads } from '@/contexts/ThreadsContext';
import { MOCK_USER } from '@/lib/currentUser';
import styles from './page.module.css';

export default function Home() {
  const { threads, loading, createThread } = useThreads();
  const [showModal, setShowModal] = useState(false);

  const handlePostThread = async (content: string) => {
    const success = await createThread(content);
    if (success) {
      setShowModal(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.mainContainer}>
        <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      <div onClick={() => setShowModal(true)}>
        <CreateThreadInput avatarText={MOCK_USER.avatar_text} />
      </div>
      
      <CreateThreadModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handlePostThread}
        username={MOCK_USER.username}
        avatarText={MOCK_USER.avatar_text}
      />
      
      <ThreadFeed threads={threads} />
    </div>
  );
}