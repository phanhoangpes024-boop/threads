import React from 'react';
import ThreadCard from '@/components/ThreadCard';
import styles from './ThreadFeed.module.css';

interface Thread {
  id: string;
  username: string;
  created_at: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  verified?: boolean;
  avatar_text: string;
}

interface ThreadFeedProps {
  threads: Thread[];
}

export default function ThreadFeed({ threads }: ThreadFeedProps) {
  return (
    <div className={styles.threadFeed}>
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
  );
}