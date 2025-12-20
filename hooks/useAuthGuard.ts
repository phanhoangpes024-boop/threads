// hooks/useAuthGuard.ts
import { useState, useCallback } from 'react'
import { useCurrentUser } from './useCurrentUser'

export function useAuthGuard() {
  const { user } = useCurrentUser()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const requireAuth = useCallback((action: () => void) => {
    if (!user || !user.id) {
      setShowLoginPrompt(true)
      return false
    }
    action()
    return true
  }, [user])

  const closePrompt = useCallback(() => {
    setShowLoginPrompt(false)
  }, [])

  return {
    requireAuth,
    showLoginPrompt,
    closePrompt,
    isAuthenticated: !!(user && user.id)
  }
}