'use client';

import { use, useState, useEffect } from 'react';
import ProfileHeader from '@/components/ProfileHeader';
import ProfileTabs from '@/components/ProfileTabs';
import CreateThreadInput from '@/components/CreateThreadInput';
import CreateThreadModal from '@/components/CreateThreadModal';
import ThreadCard from '@/components/ThreadCard';
import { useThreads } from '@/contexts/ThreadsContext';
import { MOCK_USER } from '@/lib/currentUser';
import styles from './Profile.module.css';

export default function ProfilePage({ 
  params 
}: { 
  params: Promise<{ username: string }> 
}) {
  const { username } = use(params);
  const { threads, createThread, refreshThreads } = useThreads();
  const [showModal, setShowModal] = useState(false);

  const profileData = {
    name: 'Daniel Developer',
    username: MOCK_USER.username,
    bio: 'Full-stack developer | Building cool stuff',
    avatarText: MOCK_USER.avatar_text,
    verified: false,
    followersCount: 5,
  };

  const followersAvatars = ['K', 'H', 'M'];
  
  // Lọc threads của user hiện tại
  const userThreads = threads.filter(thread => thread.user_id === MOCK_USER.id);

  const handleInputClick = () => {
    setShowModal(true);
  };

  const handlePostThread = async (content: string) => {
    const success = await createThread(content);
    if (success) {
      await refreshThreads(); // Refresh để lấy thread mới
      setShowModal(false);
    }
  };

  return (
    <div className={styles.container}>
      <ProfileHeader
        name={profileData.name}
        username={profileData.username}
        bio={profileData.bio}
        avatarText={profileData.avatarText}
        verified={profileData.verified}
        followersCount={profileData.followersCount}
        followersAvatars={followersAvatars}
      />
      
      <ProfileTabs />
      
      <div onClick={handleInputClick}>
        <CreateThreadInput avatarText={profileData.avatarText} />
      </div>
      
      <CreateThreadModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handlePostThread}
        username={profileData.username}
        avatarText={profileData.avatarText}
      />
      
      <div className={styles.threadsSection}>
        {userThreads.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
            Chưa có thread nào
          </div>
        ) : (
          userThreads.map((thread) => (
            <ThreadCard
              key={thread.id}
              id={thread.id}
              username={profileData.username}
              timestamp={thread.created_at}
              content={thread.content}
              imageUrl={thread.image_url}
              likes={thread.likes_count.toString()}
              comments={thread.comments_count.toString()}
              reposts={thread.reposts_count.toString()}
              verified={profileData.verified}
              avatarText={profileData.avatarText}
            />
          ))
        )}
      </div>
    </div>
  );
}