// components/SearchResults/index.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ThreadCard from '@/components/ThreadCard';
import CommentInput from '@/components/CommentInput';
import UserGrid from '@/components/UserGrid';
import { useToggleLike } from '@/hooks/useFeed';
import styles from './SearchResults.module.css';

type TabType = 'posts' | 'profiles';

interface SearchResultsProps {
  recentThreads: any[];
  profileUsers: any[];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function SearchResults({
  recentThreads,
  profileUsers,
  activeTab,
}: SearchResultsProps) {
  const router = useRouter();
  const [activeCommentThreadId, setActiveCommentThreadId] = useState<string | null>(null);
  const toggleLikeMutation = useToggleLike();

  const handleLike = (threadId: string) => {
    toggleLikeMutation.mutate(threadId);
  };

  // ✅ THÊM HANDLER
  const handleUserClick = (username: string) => {
    router.push(`/profile/${username}`);
  };

  const mappedUsers = profileUsers.map(u => ({
    id: u.id,
    username: u.username,
    bio: u.bio || '',
    avatarText: u.avatar_text,
    avatar_bg: u.avatar_bg
  }));

  return (
    <>
      {activeTab === 'posts' && (
        <div className={styles.threadList}>
          {recentThreads.length === 0 ? (
            <div className={styles.empty}>Không tìm thấy bài viết</div>
          ) : (
            recentThreads.map((thread) => (
              <div key={thread.id}>
                <ThreadCard
                  id={thread.id}
                  username={thread.username}
                  timestamp={thread.created_at}
                  content={thread.content}
                  medias={thread.medias || []}
                  likes={thread.likes_count}
                  comments={thread.comments_count}
                  reposts={thread.reposts_count}
                  verified={thread.verified}
                  avatarText={thread.avatar_text}
                  avatarBg={thread.avatar_bg || '#0077B6'}
                  isLiked={thread.isLiked}
                  onLikeClick={handleLike}
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
        profileUsers.length === 0 ? (
          <div className={styles.empty}>Không tìm thấy tài khoản</div>
        ) : (
          <UserGrid 
            users={mappedUsers}
            onUserClick={handleUserClick} // ✅ PASS HANDLER
          />
        )
      )}
    </>
  );
}