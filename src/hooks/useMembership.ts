'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { createClient } from '@/lib/supabase'

export type MembershipTier = 'free' | 'premium'

interface MembershipData {
  tier: MembershipTier
  canAccessPremiumFeatures: boolean
  loading: boolean
}

export function useMembership(): MembershipData {
  const { user } = useAuth()
  const [tier, setTier] = useState<MembershipTier>('free')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchMembershipTier() {
      if (!user) {
        setTier('free')
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('membership_tier')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('회원 등급 조회 오류:', error)
          setTier('free')
        } else {
          setTier((data as any)?.membership_tier || 'free')
        }
      } catch (error) {
        console.error('회원 등급 조회 오류:', error)
        setTier('free')
      } finally {
        setLoading(false)
      }
    }

    fetchMembershipTier()
  }, [user, supabase])

  return {
    tier,
    canAccessPremiumFeatures: tier === 'premium',
    loading
  }
}

// 유료 기능 사용 로그 기록
export async function logPremiumUsage(
  featureName: string,
  usageDetails?: Record<string, any>
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  try {
    await (supabase as any)
      .from('premium_usage_logs')
      .insert({
        user_id: user.id,
        feature_name: featureName,
        usage_details: usageDetails
      })
  } catch (error) {
    console.error('유료 기능 사용 로그 기록 오류:', error)
  }
}

