// lib/auth.ts
import { supabase } from './supabase'

export const authService = {
  signUp: async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    })
    
    if (error) throw error
    
    // Insert user record
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        username,
        avatar_text: username[0].toUpperCase()
      })
    }
    
    return { data, error }
  },

  signIn: async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({ email, password })
    
    // CRITICAL: Wait for session to be set
    if (result.data.session) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return result
  },

  signOut: async () => {
    return await supabase.auth.signOut()
  },

  getSession: async () => {
    return await supabase.auth.getSession()
  },

  getCurrentUser: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null
    
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    return userData
  }
}