// components/Skeletons/NotificationSkeleton.tsx
import styles from './Skeletons.module.css'

export default function NotificationSkeleton() {
  return (
    <div className={styles.notificationItem}>
      <div className={styles.avatar} />
      <div className={styles.notificationContent}>
        <div className={styles.notificationText} />
        <div className={styles.notificationTextShort} />
        <div className={styles.notificationTime} />
      </div>
      <div className={styles.notificationThumb} />
    </div>
  )
}