'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { 
  mockUsers, 
  mockPosts, 
  mockJobs, 
  mockActivities, 
  getRecentMockActivities,
  mockStats 
} from '@/lib/mockData'

interface AdminPermission {
  id: string
  user_id: string
  permission_type: 'master' | 'community_admin' | 'jobs_admin' | 'users_admin' | 'goldenrabbit_employee' | 'book_sales_viewer'
  granted_by: string | null
  granted_at: string
  is_active: boolean
}

interface AdminActivityLog {
  id: string
  admin_id: string
  action: string
  target_type?: string
  target_id?: string
  details?: any
  created_at: string
}

export function useAdmin() {
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMaster, setIsMaster] = useState(false)
  const [isEmployee, setIsEmployee] = useState(false)
  const [permissions, setPermissions] = useState<AdminPermission[]>([])
  const [loading, setLoading] = useState(true)
  
  // 개발 모드 체크 (NODE_ENV만 사용)
  const isDevMode = process.env.NODE_ENV === 'development'
  
  // 계산된 권한 상태들
  const canAccessAdminPagesValue = isDevMode || isMaster
  const canViewBookSalesValue = isDevMode || isMaster || 
    permissions.some(p => p.permission_type === 'goldenrabbit_employee') ||
    permissions.some(p => p.permission_type === 'book_sales_viewer')
  const supabase = createClient()

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      setIsAdmin(false)
      setIsMaster(false)
      setIsEmployee(false)
      setPermissions([])
      setLoading(false)
      return
    }

    // 개발 모드에서는 모든 권한 자동 부여
    if (isDevMode) {
      setIsAdmin(true)
      setIsMaster(true)
      setIsEmployee(true)
      setPermissions([
        {
          id: 'dev-master',
          user_id: user.id,
          permission_type: 'master',
          granted_by: 'dev-mode',
          granted_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: 'dev-employee',
          user_id: user.id,
          permission_type: 'goldenrabbit_employee',
          granted_by: 'dev-mode',
          granted_at: new Date().toISOString(),
          is_active: true
        }
      ])
      setLoading(false)
      return
    }

    checkAdminPermissions()
  }, [user, authLoading, isDevMode])

  const checkAdminPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_permissions')
        .select('*')
        .eq('user_id', user?.id || '')
        .eq('is_active', true)

      if (error) {
        setIsAdmin(false)
        setIsMaster(false)
        setIsEmployee(false)
        setPermissions([])
        return
      }

      const adminPermissions = (data as AdminPermission[]) || []
      setPermissions(adminPermissions)
      
      const hasAnyPermission = adminPermissions.length > 0
      const hasMasterPermission = adminPermissions.some((p: AdminPermission) => p.permission_type === 'master')
      const hasEmployeePermission = adminPermissions.some((p: AdminPermission) => p.permission_type === 'goldenrabbit_employee')
      
      setIsAdmin(hasAnyPermission)
      setIsMaster(hasMasterPermission)
      setIsEmployee(hasMasterPermission || hasEmployeePermission) // Master also has employee access
    } catch (error) {
      setIsAdmin(false)
      setIsMaster(false)
      setIsEmployee(false)
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }

  const hasPermission = (permissionType: AdminPermission['permission_type']): boolean => {
    if (isDevMode) return true // 개발 모드에서는 모든 권한 허용
    if (isMaster) return true // Master has all permissions
    return permissions.some(p => p.permission_type === permissionType)
  }

  // 실제 관리 페이지 접근 권한 (Master만)
  const canAccessAdminPages = (): boolean => {
    if (isDevMode) return true // 개발 모드에서는 모든 관리 페이지 접근 허용
    return isMaster
  }

  // 도서 판매 데이터 접근 권한 (Master + goldenrabbit_employee + book_sales_viewer)
  const canViewBookSales = (): boolean => {
    if (isDevMode) return true // 개발 모드에서는 도서 판매 데이터 접근 허용
    return isMaster || 
           hasPermission('goldenrabbit_employee') || 
           hasPermission('book_sales_viewer')
  }

  const logActivity = async (
    action: string,
    targetType?: string,
    targetId?: string,
    details?: any
  ) => {
    // 개발 모드에서는 활동 로깅을 건너뜀
    if (isDevMode) return
    
    if (!isAdmin || !user) return

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
      // Activity logging failure shouldn't break the main functionality
    }
  }

  const getAdminStats = async () => {
    if (!isAdmin) return null

    // 개발 모드에서는 Mock 데이터 반환
    if (isDevMode) {
      return Promise.resolve(mockStats)
    }

    try {
      const [postsResult, jobsResult, usersResult] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact' }),
        supabase.from('jobs').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' })
      ])

      return {
        totalPosts: postsResult.count || 0,
        totalJobs: jobsResult.count || 0,
        totalUsers: usersResult.count || 0
      }
    } catch (error) {
      return null
    }
  }

  const getRecentActivity = async (limit: number = 10) => {
    if (!isAdmin) return []

    // 개발 모드에서는 Mock 데이터 반환
    if (isDevMode) {
      return Promise.resolve(getRecentMockActivities(limit))
    }

    try {
      const { data, error } = await supabase
        .from('admin_activity_logs')
        .select(`
          *,
          admin:profiles!admin_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      return data || []
    } catch (error) {
      return []
    }
  }

  // Admin-specific data fetching functions
  const getAllPosts = async () => {
    if (!isAdmin) return []

    // 개발 모드에서는 Mock 데이터 반환
    if (isDevMode) {
      return Promise.resolve(mockPosts)
    }

    try {
      const { data, error } = await supabase
        .from('admin_posts_view')
        .select('*')
        .order('created_at', { ascending: false })

      return data || []
    } catch (error) {
      return []
    }
  }

  const getAllJobs = async () => {
    if (!isAdmin) return []

    // 개발 모드에서는 Mock 데이터 반환
    if (isDevMode) {
      return Promise.resolve(mockJobs)
    }

    try {
      const { data, error } = await supabase
        .from('admin_jobs_view')
        .select('*')
        .order('created_at', { ascending: false })

      return data || []
    } catch (error) {
      return []
    }
  }

  const getAllUsers = async () => {
    if (!isAdmin) return []

    // 개발 모드에서는 Mock 데이터 반환
    if (isDevMode) {
      // Mock 사용자 데이터를 관리자 페이지에서 기대하는 형식으로 변환
      return Promise.resolve(mockUsers.map(user => ({
        ...user,
        permissions: [] // Mock 데이터에서는 권한 정보 생략
      })))
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          permissions:admin_permissions!admin_permissions_user_id_fkey(
            id,
            permission_type,
            granted_at
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch users:', error)
        return []
      }

      // Ensure permissions is always an array
      const usersWithPermissions = (data || []).map((user: any) => ({
        ...user,
        permissions: user.permissions || []
      }))

      return usersWithPermissions
    } catch (error) {
      console.error('Error in getAllUsers:', error)
      return []
    }
  }

  // Content management functions
  const deletePost = async (postId: string) => {
    if (!hasPermission('community_admin')) return false

    try {
      const { error } = await (supabase as any)
        .from('posts')
        .delete()
        .eq('id', postId)

      if (!error) {
        await logActivity('delete_post', 'post', postId)
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  const toggleJobStatus = async (jobId: string, isActive: boolean) => {
    if (!hasPermission('jobs_admin')) return false

    try {
      const { error } = await (supabase as any)
        .from('jobs')
        .update({ is_active: isActive })
        .eq('id', jobId)

      if (!error) {
        await logActivity(
          isActive ? 'activate_job' : 'deactivate_job',
          'job',
          jobId,
          { is_active: isActive }
        )
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  const grantPermission = async (userId: string, permissionType: AdminPermission['permission_type']) => {
    if (!isMaster) return false

    try {
      const { error } = await (supabase as any)
        .from('admin_permissions')
        .upsert({
          user_id: userId,
          permission_type: permissionType,
          granted_by: user?.id,
          is_active: true
        })

      if (!error) {
        await logActivity('grant_permission', 'user', userId, { permission_type: permissionType })
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  const revokePermission = async (userId: string, permissionType: AdminPermission['permission_type']) => {
    if (!isMaster) return false

    try {
      const { error } = await (supabase as any)
        .from('admin_permissions')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('permission_type', permissionType)

      if (!error) {
        await logActivity('revoke_permission', 'user', userId, { permission_type: permissionType })
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  return {
    // Status
    isAdmin,
    isMaster,
    isEmployee,
    loading,
    permissions,
    
    // Permission checks
    hasPermission,
    canAccessAdminPages,
    canViewBookSales,
    canAccessAdminPagesValue,
    canViewBookSalesValue,
    
    // Activity logging
    logActivity,
    
    // Data fetching
    getAdminStats,
    getRecentActivity,
    getAllPosts,
    getAllJobs,
    getAllUsers,
    
    // Content management
    deletePost,
    toggleJobStatus,
    
    // Permission management (master only)
    grantPermission,
    revokePermission,
  }
}