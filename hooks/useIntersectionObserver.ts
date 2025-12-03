// hooks/useIntersectionObserver.ts - Cleanup observer khi thread ra khỏi viewport
import { useEffect, useRef } from 'react'

interface UseIntersectionObserverProps {
  onIntersect?: (isIntersecting: boolean) => void
  rootMargin?: string
  threshold?: number
  enabled?: boolean
}

export function useIntersectionObserver({
  onIntersect,
  rootMargin = '0px',
  threshold = 0.01,
  enabled = true
}: UseIntersectionObserverProps) {
  const targetRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (!enabled) return
    
    const target = targetRef.current
    if (!target) return

    // ✅ Cleanup observer cũ nếu có
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // ✅ Tạo observer mới
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          onIntersect?.(entry.isIntersecting)
        })
      },
      {
        rootMargin,
        threshold
      }
    )

    observerRef.current.observe(target)

    // ✅ CRITICAL: Cleanup khi unmount hoặc re-render
    return () => {
      if (observerRef.current && target) {
        observerRef.current.unobserve(target)
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [enabled, rootMargin, threshold, onIntersect])

  return targetRef
}