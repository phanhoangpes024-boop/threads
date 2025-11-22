'use client';

import { use, useState } from 'react';
import ProfileHeader from '@/components/ProfileHeader';
import ProfileTabs from '@/components/ProfileTabs';
import CreateThreadInput from '@/components/CreateThreadInput';
import CreateThreadModal from '@/components/CreateThreadModal';
import ThreadCard from '@/components/ThreadCard';
import { MOCK_USER } from '@/lib/currentUser';
import mockData from '@/lib/mockData.json';
import styles from './Profile.module.css';

export default function ProfilePage({ 
  params 
}: { 
  params: Promise<{ username: string }> 
}) {
  const { username } = use(params);
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
  const userThreads = mockData.threads.slice(0, 3);

  const handleInputClick = () => {
    setShowModal(true);
  };

  const handlePostThread = (content: string) => {
    console.log('New thread:', content);
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
        {userThreads.map((thread) => (
          <ThreadCard
            key={thread.id}
            id={thread.id}
            username={profileData.username}
            timestamp={thread.timestamp}
            content={thread.content}
            imageUrl={thread.imageUrl}
            likes={thread.likes}
            comments={thread.comments}
            reposts={thread.reposts}
            verified={profileData.verified}
            avatarText={profileData.avatarText}
          />
        ))}
      </div>
    </div>
  );
}