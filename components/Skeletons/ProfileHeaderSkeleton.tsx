// components/Skeletons/ProfileHeaderSkeleton.tsx
import styles from './Skeletons.module.css'

export default function ProfileHeaderSkeleton() {
  return (
    <div className={styles.profileHeader}>
      {/* Header Content */}
      <div className={styles.profileHeaderContent}>
        {/* Info Section (trái) */}
        <div className={styles.profileInfoSection}>
          {/* Name Row */}
          <div className={styles.profileNameRow}>
            <div className={styles.profileName} />
          </div>
          
          {/* Username */}
          <div className={styles.profileUsername} />
          
          {/* Bio - 2 lines */}
          <div className={styles.profileBio}>
            <div className={styles.profileBioLine} />
            <div className={styles.profileBioLine} style={{ width: '70%' }} />
          </div>
          
          {/* Stats Row */}
          <div className={styles.profileStatsRow}>
            <div className={styles.profileStat} />
          </div>

          {/* Social Icons */}
          <div className={styles.profileSocialIcons}>
            <div className={styles.profileIconButton} />
            <div className={styles.profileIconButton} />
            <div className={styles.profileIconButton} />
          </div>
        </div>

        {/* Avatar Wrapper (phải) */}
        <div className={styles.profileAvatarWrapper}>
          <div className={styles.profileAvatar} />
        </div>
      </div>
      
      {/* Edit Button */}
      <div className={styles.profileEditButton} />
    </div>
  )
}