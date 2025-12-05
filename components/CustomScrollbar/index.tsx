// components/CustomScrollbar/index.tsx
'use client'

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import styles from './CustomScrollbar.module.css'

interface CustomScrollbarProps {
  children: React.ReactNode
  className?: string
}

// 1. Thêm forwardRef bao bọc component
const CustomScrollbar = forwardRef<HTMLDivElement, CustomScrollbarProps>(
  ({ children, className }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const scrollbarRef = useRef<HTMLDivElement>(null)
    const thumbRef = useRef<HTMLDivElement>(null)

    // 2. MẤU CHỐT: "Nối" ref từ bên ngoài (page.tsx) vào containerRef bên trong
    useImperativeHandle(ref, () => containerRef.current!)

    useEffect(() => {
      const container = containerRef.current
      const scrollbar = scrollbarRef.current
      const thumb = thumbRef.current

      if (!container || !scrollbar || !thumb) return

      let isDragging = false
      let startY = 0
      let startScrollTop = 0

      // Update thumb size & position
      const updateScrollbar = () => {
        const containerHeight = container.clientHeight
        const scrollHeight = container.scrollHeight
        const scrollTop = container.scrollTop

        // Thumb height tỉ lệ với viewport
        const thumbHeight = Math.max(
          (containerHeight / scrollHeight) * window.innerHeight,
          30 // Min height
        )

        // Thumb position tỉ lệ với scroll progress
        const scrollRatio = scrollTop / (scrollHeight - containerHeight)
        const maxThumbTop = window.innerHeight - thumbHeight
        const thumbTop = scrollRatio * maxThumbTop

        thumb.style.height = `${thumbHeight}px`
        thumb.style.transform = `translateY(${thumbTop}px)`

        // Show/hide
        if (scrollHeight <= containerHeight) {
          scrollbar.style.display = 'none'
        } else {
          scrollbar.style.display = 'block'
        }
      }

      // Scroll event
      const handleScroll = () => {
        requestAnimationFrame(updateScrollbar)
      }

      // Thumb drag
      const handleMouseDown = (e: MouseEvent) => {
        e.preventDefault()
        isDragging = true
        startY = e.clientY
        startScrollTop = container.scrollTop
        document.body.style.userSelect = 'none'
      }

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return

        const deltaY = e.clientY - startY
        const scrollRatio =
          (container.scrollHeight - container.clientHeight) /
          (window.innerHeight - parseFloat(thumb.style.height))
        container.scrollTop = startScrollTop + deltaY * scrollRatio
      }

      const handleMouseUp = () => {
        isDragging = false
        document.body.style.userSelect = ''
      }

      container.addEventListener('scroll', handleScroll, { passive: true })
      thumb.addEventListener('mousedown', handleMouseDown)
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      // Initial update
      updateScrollbar()

      // Observe content changes
      const observer = new ResizeObserver(updateScrollbar)
      observer.observe(container)

      // Window resize
      window.addEventListener('resize', updateScrollbar)

      return () => {
        container.removeEventListener('scroll', handleScroll)
        thumb.removeEventListener('mousedown', handleMouseDown)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        window.removeEventListener('resize', updateScrollbar)
        observer.disconnect()
      }
    }, [])

    return (
      <div className={styles.wrapper}>
        {/* Container này giờ đã được expose ra ngoài qua ref */}
        <div ref={containerRef} className={`${styles.container} ${className || ''}`}>
          {children}
        </div>
        <div ref={scrollbarRef} className={styles.scrollbar}>
          <div ref={thumbRef} className={styles.thumb} />
        </div>
      </div>
    )
  }
)

// Bắt buộc phải có displayName khi dùng forwardRef để debug không bị lỗi
CustomScrollbar.displayName = 'CustomScrollbar'

export default CustomScrollbar