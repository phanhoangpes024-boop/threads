import UserCardSkeleton from '@/components/Skeletons/UserCardSkeleton'

export default function Loading() {
  return (
    <div style={{ padding: '20px' }}>
      <UserCardSkeleton />
      <UserCardSkeleton />
      <UserCardSkeleton />
      <UserCardSkeleton />
    </div>
  )
}