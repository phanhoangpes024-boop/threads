import React, { useState } from 'react';
import ThreadCard from '@/components/ThreadCard';
import CommentInput from '@/components/CommentInput';
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
  isLiked?: boolean;
}

interface ThreadFeedProps {
  threads: Thread[];
}

export default function ThreadFeed({ threads }: ThreadFeedProps) {
  const [activeCommentThreadId, setActiveCommentThreadId] = useState<string | null>(null);

  return (
    <div className={styles.threadFeed}>
      {threads.map((thread) => (
        <div key={thread.id}>
          <ThreadCard
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
  );
}