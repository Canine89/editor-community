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

        if (error) {
          console.error('세션 확인 오류:', error)
        }

        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
          console.log('인증 상태 확인:', session?.user ? '로그인됨' : '로그인되지 않음')
        }
      } catch (error) {
        console.error('세션 확인 중 오류:', error)
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
        console.log('🔥 인증 상태 변경 이벤트:', event)
        console.log('🔥 세션 정보:', {
          user: session?.user ? '있음' : '없음',
          user_id: session?.user?.id,
          email: session?.user?.email,
          user_metadata: session?.user?.user_metadata
        })

        // 사용자가 로그인했으면 프로필이 있는지 확인하고 없으면 생성
        if (event === 'SIGNED_IN' && session?.user && !profileCreationInProgress) {
          setProfileCreationInProgress(true)
          console.log('🔥 SIGNED_IN 이벤트 감지 - 프로필 생성 시작')

          // 비동기 함수로 프로필 생성 처리
          const createProfileIfNeeded = async () => {
            try {
              console.log('🔥 프로필 존재 확인 중...')
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', session.user.id)
                .single()

              if (profileError && profileError.code === 'PGRST116') {
                console.log('🔥 프로필이 없음 - 새로 생성 중...')
                const { error: createError } = await (supabase
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

                if (createError) {
                  console.error('❌ 프로필 생성 오류:', createError)
                } else {
                  console.log('✅ 프로필 생성 완료')
                }
              } else if (profile) {
                console.log('✅ 프로필 이미 존재')
              } else {
                console.error('❌ 프로필 확인 오류:', profileError)
              }
            } catch (error) {
              console.error('❌ 프로필 확인/생성 중 예외:', error)
            } finally {
              setProfileCreationInProgress(false)
            }
          }

          createProfileIfNeeded()
        }

        if (mounted) {
          console.log('🔥 사용자 상태 업데이트:', session?.user ? '로그인됨' : '로그아웃됨')
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
      console.log('로그아웃 완료')
    } catch (error) {
      console.error('로그아웃 오류:', error)
    }
  }

  return {
    user,
    loading,
    signOut,
  }
}
