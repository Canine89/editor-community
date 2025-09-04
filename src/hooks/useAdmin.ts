'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { useAuth } from './useAuth'

interface AdminPermission {
  id: string
  user_id: string
  permission_type: 'master' | 'community_admin' | 'jobs_admin' | 'users_admin'
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
  const [permissions, setPermissions] = useState<AdminPermission[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      setIsAdmin(false)
      setIsMaster(false)
      setPermissions([])
      setLoading(false)
      return
    }

    checkAdminPermissions()
  }, [user, authLoading])

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
        setPermissions([])
        return
      }

      const adminPermissions = (data as AdminPermission[]) || []
      setPermissions(adminPermissions)
      
      const hasAnyPermission = adminPermissions.length > 0
      const hasMasterPermission = adminPermissions.some((p: AdminPermission) => p.permission_type === 'master')
      
      setIsAdmin(hasAnyPermission)
      setIsMaster(hasMasterPermission)
    } catch (error) {
      setIsAdmin(false)
      setIsMaster(false)
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }

  const hasPermission = (permissionType: AdminPermission['permission_type']): boolean => {
    if (isMaster) return true // Master has all permissions
    return permissions.some(p => p.permission_type === permissionType)
  }

  const logActivity = async (
    action: string,
    targetType?: string,
    targetId?: string,
    details?: any
  ) => {
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

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      return data || []
    } catch (error) {
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
    loading,
    permissions,
    
    // Permission checks
    hasPermission,
    
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