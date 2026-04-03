import { createContext, useContext, useState, useEffect } from 'react'
import { App as CapApp } from '@capacitor/app'
import { supabase } from '../supabaseClient'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [isPremium, setIsPremium] = useState(false)
  const [trialEndsAt, setTrialEndsAt] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else {
        setIsPremium(false)
        setLoading(false)
      }
    })

    // Handle deep link callback from OAuth on mobile
    CapApp.addListener('appUrlOpen', async ({ url }) => {
      if (url.includes('login-callback')) {
        // Extract tokens from the URL hash
        const hashParams = new URLSearchParams(url.split('#')[1] || '')
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_premium, trial_ends_at')
        .eq('id', userId)
        .single()
      const trialEnd = data?.trial_ends_at ? new Date(data.trial_ends_at) : null
      const isTrialActive = trialEnd && trialEnd > new Date()
      setTrialEndsAt(trialEnd)
      setIsPremium(data?.is_premium || isTrialActive)
    } catch {
      setIsPremium(false)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setIsPremium(false)
  }

  return (
    <AuthContext.Provider value={{ user, session, isPremium, trialEndsAt, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
