// components/Skeletons/UserCardSkeleton.tsx
import styles from './Skeletons.module.css'

export default function UserCardSkeleton() {
  return (
    <div className={styles.userCard}>
      <div className={styles.avatar} />
      <div className={styles.userInfo}>
        <div className={styles.username} />
        <div className={styles.bio} />
      </div>
    </div>
  )
}