'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const [profileCreationInProgress, setProfileCreationInProgress] = useState(false)

  useEffect(() => {
    let mounted = true

    // 현재 세션 확인
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      } catch (error) {
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    getSession()

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {

        // 사용자가 로그인했으면 프로필이 있는지 확인하고 없으면 생성
        if (event === 'SIGNED_IN' && session?.user && !profileCreationInProgress) {
          setProfileCreationInProgress(true)

          // 비동기 함수로 프로필 생성 처리
          const createProfileIfNeeded = async () => {
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', session.user.id)
                .single()

              if (profileError && profileError.code === 'PGRST116') {
                await (supabase
                  .from('profiles') as any)
                  .insert([
                    {
                      id: session.user.id,
                      email: session.user.email,
                      full_name: session.user.user_metadata?.full_name ||
                                session.user.user_metadata?.name ||
                                '익명 사용자'
                    }
                  ])
              }
            } catch (error) {
              // 조용히 처리
            } finally {
              setProfileCreationInProgress(false)
            }
          }

          createProfileIfNeeded()
        }

        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      // 조용히 처리
    }
  }

  return {
    user,
    loading,
    signOut,
  }
}
