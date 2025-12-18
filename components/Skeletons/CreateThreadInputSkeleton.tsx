// components/Skeletons/CreateThreadInputSkeleton.tsx
import styles from './Skeletons.module.css'

export default function CreateThreadInputSkeleton() {
  return (
    <div className={styles.createInput}>
      <div className={styles.avatar} />
      <div className={styles.placeholder} />
      <div className={styles.button} />
    </div>
  )
}