'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { createClient } from '@/lib/supabase'

export type UserRole = 'user' | 'premium' | 'employee' | 'master'

interface RoleData {
  role: UserRole
  loading: boolean
  
  // 기능별 권한
  canAccessPremiumFeatures: boolean
  canViewBookSales: boolean
  canAccessAdminPages: boolean
  
  // 역할 체크 함수
  hasRole: (requiredRole: UserRole) => boolean
  isAtLeast: (requiredRole: UserRole) => boolean
}

// 역할 계층 정의 (숫자가 높을수록 높은 권한)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  premium: 2, 
  employee: 3,
  master: 4
}

export function useRole(): RoleData {
  const { user } = useAuth()
  const [role, setRole] = useState<UserRole>('user')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // 개발 모드 체크
  const isDevMode = process.env.NODE_ENV === 'development'

  useEffect(() => {
    async function fetchUserRole() {
      if (!user) {
        setRole('user')
        setLoading(false)
        return
      }

      // 개발 모드에서는 master 권한 자동 부여
      if (isDevMode) {
        setRole('master')
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_role')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('사용자 역할 조회 오류:', error)
          setRole('user')
        } else {
          setRole((data as any)?.user_role || 'user')
        }
      } catch (error) {
        console.error('사용자 역할 조회 오류:', error)
        setRole('user')
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()
  }, [user, supabase, isDevMode])

  // 정확한 역할 매치 체크
  const hasRole = (requiredRole: UserRole): boolean => {
    if (isDevMode) return true
    return role === requiredRole
  }

  // 계층적 권한 체크 (요구 역할 이상의 권한)
  const isAtLeast = (requiredRole: UserRole): boolean => {
    if (isDevMode) return true
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole]
  }

  // 기능별 권한 계산
  const canAccessPremiumFeatures = isAtLeast('premium')
  const canViewBookSales = isAtLeast('employee') 
  const canAccessAdminPages = hasRole('master')

  return {
    role,
    loading,
    
    // 기능별 권한
    canAccessPremiumFeatures,
    canViewBookSales,
    canAccessAdminPages,
    
    // 역할 체크 함수
    hasRole,
    isAtLeast
  }
}

// 프리미엄 기능 사용 로그 기록 (기존 useMembership에서 이전)
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
    console.error('프리미엄 기능 사용 로그 기록 오류:', error)
  }
}

// useAdmin 훅 - 관리자 권한 체크
export function useAdmin() {
  const { role, loading, canAccessAdminPages } = useRole()

  return {
    isAdmin: canAccessAdminPages,
    loading,
    role
  }
}

// 관리자 활동 로그 기록 (기존 useAdmin에서 이전)
export async function logAdminActivity(
  action: string,
  targetType?: string,
  targetId?: string,
  details?: any
) {
  // 개발 모드에서는 활동 로깅을 건너뜀
  if (process.env.NODE_ENV === 'development') {
    return
  }
  
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  try {
    await (supabase as any)
      .from('admin_activity_logs')
      .insert({
        admin_id: user.id,
        action,
        target_type: targetType,
        target_id: targetId,
        details
      })
  } catch (error) {
    console.error('관리자 활동 로그 기록 오류:', error)
  }
}