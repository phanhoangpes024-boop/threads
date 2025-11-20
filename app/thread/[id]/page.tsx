'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ThreadCard from '@/components/ThreadCard';
import CommentInput from '@/components/CommentInput';
import { useThreads } from '@/contexts/ThreadsContext';
import styles from './ThreadDetail.module.css';

interface Comment {
  id: string;
  thread_id: string;
  user_id: string;
  username: string;
  avatar_text: string;
  verified: boolean;
  content: string;
  created_at: string;
}

export default function ThreadDetailPage() {
  const params = useParams();
  const threadId = params.id as string;
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCommentInput, setShowCommentInput] = useState(false);
  
  // Dùng threads từ context + refreshThreads
  const { threads, refreshThreads } = useThreads();
  
  // Tìm thread hiện tại từ context
  const thread = threads.find(t => t.id === threadId);

  const fetchComments = async () => {
    try {
      const commentsRes = await fetch(`/api/threads/${threadId}/comments`);
      const commentsData = await commentsRes.json();
      setComments(commentsData);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchComments();
      setLoading(false);
    };
    loadData();
  }, [threadId]);

  const handleCommentSubmit = async () => {
    await fetchComments();
    await refreshThreads();  // Refresh để cập nhật comments_count
    setShowCommentInput(false);
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!thread) {
    return <div className={styles.error}>Thread not found</div>;
  }

  return (
    <div className={styles.container}>
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
        isDetailView={true}
        onCommentClick={() => setShowCommentInput(true)}
      />
      
      {showCommentInput && (
        <CommentInput
          threadId={threadId}
          onCommentSubmit={handleCommentSubmit}
          autoFocus={true}
        />
      )}
      
      <div className={styles.commentsSection}>
        <div className={styles.commentsHeader}>
          <button className={styles.sortButton}>Hàng đầu</button>
          <span className={styles.viewAll}>Xem hoạt động</span>
        </div>
        
        {comments.length === 0 ? (
          <div className={styles.noComments}>Chưa có bình luận nào</div>
        ) : (
          <div className={styles.commentsList}>
            {comments.map(comment => (
              <div key={comment.id} className={styles.commentItem}>
                <div className={styles.commentAvatar}>
                  <div className={styles.avatar}>{comment.avatar_text}</div>
                </div>
                <div className={styles.commentContent}>
                  <div className={styles.commentHeader}>
                    <span className={styles.commentUsername}>{comment.username}</span>
                    <span className={styles.commentTime}>
                      {new Date(comment.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className={styles.commentText}>{comment.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}