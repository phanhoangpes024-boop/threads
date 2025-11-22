// app/profile/[username]/page.tsx
'use client';

import { use, useState, useEffect } from 'react';
import ProfileHeader from '@/components/ProfileHeader';
import ProfileTabs from '@/components/ProfileTabs';
import CreateThreadInput from '@/components/CreateThreadInput';
import CreateThreadModal from '@/components/CreateThreadModal';
import EditProfileModal from '@/components/EditProfileModal';
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Daniel Developer',
    username: MOCK_USER.username,
    bio: 'Full-stack developer | Building cool stuff',
    avatarText: MOCK_USER.avatar_text,
    verified: false,
    followersCount: 5,
  });

  const followersAvatars = ['K', 'H', 'M'];
  
  // Lọc threads của user hiện tại
  const userThreads = threads.filter(thread => thread.user_id === MOCK_USER.id);

  const handleInputClick = () => {
    setShowCreateModal(true);
  };

  const handlePostThread = async (content: string) => {
    const success = await createThread(content);
    if (success) {
      await refreshThreads();
      setShowCreateModal(false);
    }
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    // Refresh profile data sau khi save
    await fetchProfileData();
  };

  const fetchProfileData = async () => {
    try {
      const res = await fetch(`/api/users/${MOCK_USER.id}`);
      const data = await res.json();
      if (data) {
        setProfileData({
          name: data.name || 'Daniel Developer',
          username: data.username,
          bio: data.bio || 'Full-stack developer | Building cool stuff',
          avatarText: data.avatar_text,
          verified: data.verified || false,
          followersCount: 5,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

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
        onEditClick={handleEditProfile}
      />
      
      <ProfileTabs />
      
      <div onClick={handleInputClick}>
        <CreateThreadInput avatarText={profileData.avatarText} />
      </div>
      
      <CreateThreadModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handlePostThread}
        username={profileData.username}
        avatarText={profileData.avatarText}
      />

      <EditProfileModal
  isOpen={showEditModal}
  onClose={() => setShowEditModal(false)}
  currentProfile={{
    name: profileData.name,
    username: profileData.username,
    avatar_text: profileData.avatarText,  // Sửa: avatarText -> avatar_text
    bio: profileData.bio,
  }}
  onSave={handleSaveProfile}
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