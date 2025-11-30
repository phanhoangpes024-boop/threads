// components/SearchResults/index.tsx
'use client';

import React, { useState } from 'react';
import ThreadCard from '@/components/ThreadCard';
import CommentInput from '@/components/CommentInput';
import UserGrid from '@/components/UserGrid';
import styles from './SearchResults.module.css';

type TabType = 'relevant' | 'recent' | 'profiles';

interface Thread {
  id: string;
  username: string;
  avatar_text: string;
  verified: boolean;
  content: string;
image_urls: string[];
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  created_at: string;
  user_id: string;
  isLiked?: boolean;
}

interface User {
  id: string;
  username: string;
  bio?: string;
  avatar_text: string;
}

interface SearchResultsProps {
  relevantThreads: Thread[];
  recentThreads: Thread[];
  profileUsers: User[];
}

export default function SearchResults({
  relevantThreads,
  recentThreads,
  profileUsers,
}: SearchResultsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('relevant');
  const [activeCommentThreadId, setActiveCommentThreadId] = useState<string | null>(null);

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'relevant' ? styles.active : ''}`}
          onClick={() => setActiveTab('relevant')}
        >
          Liên quan nhất
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'recent' ? styles.active : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          Mới đây
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'profiles' ? styles.active : ''}`}
          onClick={() => setActiveTab('profiles')}
        >
          Trang cá nhân
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'relevant' && (
          <div className={styles.threadList}>
            {relevantThreads.length === 0 ? (
              <div className={styles.empty}>Không tìm thấy kết quả</div>
            ) : (
              relevantThreads.map((thread) => (
                <div key={thread.id}>
                  <ThreadCard
                    id={thread.id}
                    username={thread.username}
                    timestamp={thread.created_at}
                    content={thread.content}
                    imageUrls={thread.image_urls || []}
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
              ))
            )}
          </div>
        )}

        {activeTab === 'recent' && (
          <div className={styles.threadList}>
            {recentThreads.length === 0 ? (
              <div className={styles.empty}>Không tìm thấy kết quả</div>
            ) : (
              recentThreads.map((thread) => (
                <div key={thread.id}>
                  <ThreadCard
                    id={thread.id}
                    username={thread.username}
                    timestamp={thread.created_at}
                    content={thread.content}
                    imageUrls={thread.image_urls || []}
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
              ))
            )}
          </div>
        )}

        {activeTab === 'profiles' && (
          <UserGrid 
            users={profileUsers.map(u => ({
              id: u.id,
              username: u.username,
              name: u.username,
              avatarText: u.avatar_text,
              gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }))} 
          />
        )}
      </div>
    </div>
  );
}