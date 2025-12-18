// components/Skeletons/ThreadCardSkeleton.tsx
import styles from './Skeletons.module.css'

export default function ThreadCardSkeleton({ 
  hasImage = false 
}: { 
  hasImage?: boolean 
}) {
  return (
    <div className={styles.card}>
      <div className={styles.avatar} />
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.username} />
          <div className={styles.time} />
        </div>
        <div className={styles.text} />
        <div className={styles.text} style={{ width: '70%' }} />
        {hasImage && <div className={styles.image} />}
        <div className={styles.actions}>
          {[1,2,3,4].map(i => (
            <div key={i} className={styles.action}>
              <div className={styles.icon} />
              <div className={styles.count} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}