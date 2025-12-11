// app/activity/page.tsx - CẬP NHẬT
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, UserPlus } from 'lucide-react'
import CustomScrollbar from '@/components/CustomScrollbar'
import { useNotifications, useMarkAsRead } from '@/hooks/useNotifications'
import { useFollowUser } from '@/hooks/useFollowUser'
import { useIsFollowing } from '@/hooks/useIsFollowing'
import type { Notification } from '@/hooks/useNotifications'
import styles from './Activity.module.css'

function getRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`
  return `${Math.floor(seconds / 604800)}w`
}

function NotificationItem({ notification }: { notification: Notification }) {
  const router = useRouter()
  const markAsRead = useMarkAsRead()
  const followMutation = useFollowUser()

  const actors = notification.actors || []
  if (actors.length === 0) return null
  
  const firstActor = actors[0]
  const othersCount = actors.length - 1

  // ✅ Fetch trạng thái theo dõi từ server
  const { data: isFollowing = false, isLoading } = useIsFollowing(firstActor.id)

  useEffect(() => {
    if (!notification.is_read) {
      const timer = setTimeout(() => {
        markAsRead.mutate([notification.id])
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [notification.id, notification.is_read, markAsRead])

  const handleClick = () => {
    if (notification.type === 'follow') {
      router.push(`/profile/${firstActor.username}`)
    } else if (notification.thread_id) {
      router.push(`/thread/${notification.thread_id}`)
    }
  }

  const handleFollowBack = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (followMutation.isPending) return
    followMutation.mutate(firstActor.id)
  }

  let notificationText = ''
  if (notification.type === 'like') {
    notificationText = othersCount > 0
      ? ` và ${othersCount} người khác đã thích bài viết của bạn`
      : ' đã thích bài viết của bạn'
  } else if (notification.type === 'comment') {
    notificationText = ` đã bình luận: "${notification.comment_content}"`
  } else if (notification.type === 'follow') {
    notificationText = othersCount > 0
      ? ` và ${othersCount} người khác đã theo dõi bạn`
      : ' đã theo dõi bạn'
  }

  const getBadgeIcon = () => {
    if (notification.type === 'like') {
      return <Heart className={styles.badge} fill="#f43f5e" stroke="#f43f5e" size={12} />
    }
    if (notification.type === 'comment') {
      return <MessageCircle className={styles.badge} fill="#3b82f6" stroke="#fff" size={12} />
    }
    if (notification.type === 'follow') {
      return <UserPlus className={styles.badge} fill="#10b981" stroke="#fff" size={12} />
    }
    return null
  }

  return (
    <div
      className={`${styles.notificationItem} ${!notification.is_read ? styles.unread : ''}`}
      onClick={handleClick}
    >
      <div className={styles.avatarSection}>
        <div className={styles.avatarStack}>
          {actors.map((actor, idx) => (
            <div
              key={actor.id}
              className={styles.avatar}
              style={{
                backgroundColor: actor.avatar_bg,
                zIndex: actors.length - idx,
                marginLeft: idx > 0 ? '-12px' : '0'
              }}
            >
              {actor.avatar_text}
            </div>
          ))}
          {getBadgeIcon()}
        </div>
      </div>

      <div className={styles.textSection}>
        <div className={styles.text}>
          <strong>{firstActor.username}</strong>
          {notificationText}
        </div>
        <div className={styles.time}>{getRelativeTime(notification.updated_at)}</div>
      </div>

      <div className={styles.rightSection}>
        {notification.type === 'follow' ? (
          <button 
            className={styles.followButton}
            onClick={handleFollowBack}
            disabled={followMutation.isPending || isLoading}
            style={isFollowing ? {
              background: '#f0f0f0',
              color: '#666',
              border: '1px solid #e0e0e0'
            } : undefined}
          >
            {isLoading ? '...' : isFollowing ? 'Đang theo dõi' : 'Theo dõi lại'}
          </button>
        ) : notification.thread_first_media ? (
          <img
            src={notification.thread_first_media}
            alt="Thread"
            className={styles.thumbnail}
          />
        ) : (
          <div className={styles.thumbnailPlaceholder}>
            {notification.type === 'like' && (
              <Heart size={24} stroke="#d1d5db" fill="none" />
            )}
            {notification.type === 'comment' && (
              <MessageCircle size={24} stroke="#d1d5db" fill="none" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ActivityPage() {
  const { data: notifications = [], isLoading } = useNotifications()

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Đang tải...</div>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <Heart size={48} stroke="#999" fill="none" />
          <p>Chưa có thông báo nào</p>
        </div>
      </div>
    )
  }

  return (
    <CustomScrollbar className={styles.container}>
      <div className={styles.notificationsList}>
        {notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>
    </CustomScrollbar>
  )
}