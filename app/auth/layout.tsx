// app/auth/layout.tsx
import { ReactNode } from 'react'
import styles from './auth.module.css'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.container}>
      {children}
    </div>
  )
}