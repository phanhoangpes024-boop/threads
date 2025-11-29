// components/CommentInput/index.tsx
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useCreateComment } from '@/hooks/useThreads'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import styles from './CommentInput.module.css'

interface CommentInputProps {
  threadId: string
  onCommentSubmit: () => void
  autoFocus?: boolean
  placeholder?: string
}

export default function CommentInput({
  threadId,
  onCommentSubmit,
  autoFocus = false,
  placeholder = 'Trả lời...',
}: CommentInputProps) {
  const { user } = useCurrentUser()
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const createCommentMutation = useCreateComment(threadId)

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  const handleSubmit = async () => {
    if (!value.trim() || createCommentMutation.isPending) return
    
    await createCommentMutation.mutateAsync(value.trim())
    setValue('')
    onCommentSubmit()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className={styles.commentInputContainer}>
      <div className={styles.commentInputWrapper}>
        <div className={styles.avatar}>
          <div className={styles.avatarCircle}>{user.avatar_text}</div>
        </div>

        <div className={styles.inputSection}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            placeholder={placeholder}
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={createCommentMutation.isPending}
          />
        </div>

        <button
          className={`${styles.submitButton} ${value.trim() ? styles.active : ''}`}
          disabled={!value.trim() || createCommentMutation.isPending}
          onClick={handleSubmit}
        >
          {createCommentMutation.isPending ? 'Đang gửi...' : 'Trả lời'}
        </button>
      </div>
    </div>
  )
}