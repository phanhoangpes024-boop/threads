// components/Skeletons/ProfileTabsSkeleton.tsx
import styles from './Skeletons.module.css'

export default function ProfileTabsSkeleton() {
  return (
    <nav className={styles.profileTabs}>
      <div className={styles.profileTab} />
      <div className={styles.profileTab} />
      <div className={styles.profileTab} />
      <div className={styles.profileTab} />
    </nav>
  )
}