'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { mockUsers } from '@/lib/mockData'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const [profileCreationInProgress, setProfileCreationInProgress] = useState(false)

  useEffect(() => {
    let mounted = true

    // 개발 모드에서는 Mock 데이터 사용
    const isDevMode = process.env.NODE_ENV === 'development'
    
    if (isDevMode) {
      // 개발 모드에서는 항상 마스터 권한 사용자로 설정
      const mockMasterUser = mockUsers.find(user => user.user_role === 'master')
      
      if (mockMasterUser && mounted) {
        // Supabase User 형식으로 변환
        const mockUser: User = {
          id: mockMasterUser.id,
          email: mockMasterUser.email,
          created_at: mockMasterUser.created_at,
          app_metadata: {},
          user_metadata: {
            full_name: mockMasterUser.full_name,
            avatar_url: mockMasterUser.avatar_url,
            user_role: mockMasterUser.user_role
          },
          aud: 'authenticated',
          confirmation_sent_at: mockMasterUser.created_at,
          confirmed_at: mockMasterUser.created_at,
          email_confirmed_at: mockMasterUser.created_at,
          identities: [],
          last_sign_in_at: new Date().toISOString(),
          phone: '',
          role: 'authenticated'
        }
        
        setUser(mockUser)
        setLoading(false)
      }
      return
    }

    // 프로덕션 모드에서는 Supabase 사용
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
      // 개발 모드에서는 로그아웃 무효화
      const isDevMode = process.env.NODE_ENV === 'development'
      if (isDevMode) {
        return
      }
      
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