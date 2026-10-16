import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setLoading(false)
      return
    }

    let mounted = true
    setLoading(true)

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (!mounted) return
        if (error) {
          setError(error.message)
          setProfile(null)
        } else {
          setProfile(data)
          setError(null)
        }
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [userId])

  return { profile, loading, error }
}
