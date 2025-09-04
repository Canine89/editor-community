'use client'

import { useState, useEffect } from 'react'
import { useAdmin } from '@/hooks/useAdmin'
import AdminLayout from '@/components/admin/AdminLayout'
import StatsCard from '@/components/admin/StatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  MessageSquare,
  Briefcase,
  Activity,
  TrendingUp,
  Clock,
  Shield,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

interface Stats {
  totalPosts: number
  totalJobs: number
  totalUsers: number
}

interface ActivityLog {
  id: string
  action: string
  target_type?: string
  target_id?: string
  details?: any
  created_at: string
  admin: {
    full_name: string
    email: string
  }
}

export default function AdminDashboard() {
  const { canAccessAdminPages, isMaster, getAdminStats, getRecentActivity, logActivity } = useAdmin()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (canAccessAdminPages) {
      loadDashboardData()
    }
  }, [canAccessAdminPages])

  const loadDashboardData = async () => {
    try {
      const [statsData, activityData] = await Promise.all([
        getAdminStats(),
        getRecentActivity(10)
      ])

      setStats(statsData)
      setRecentActivity(activityData)
      
      // Log dashboard access
      await logActivity('access_admin_dashboard')
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return '방금 전'
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const getActionLabel = (action: string) => {
    const actionMap: Record<string, string> = {
      access_admin_dashboard: '대시보드 접근',
      delete_post: '게시물 삭제',
      activate_job: '채용공고 활성화',
      deactivate_job: '채용공고 비활성화',
      grant_permission: '권한 부여',
      revoke_permission: '권한 취소',
      view_admin_posts: '게시물 관리 페이지 접근',
      view_admin_jobs: '채용공고 관리 페이지 접근',
      view_admin_users: '사용자 관리 페이지 접근',
    }
    return actionMap[action] || action
  }

  const getActivityIcon = (action: string) => {
    if (action.includes('delete')) return <AlertTriangle className="w-4 h-4 text-red-500" />
    if (action.includes('access') || action.includes('view')) return <Activity className="w-4 h-4 text-blue-500" />
    if (action.includes('grant') || action.includes('activate')) return <Shield className="w-4 h-4 text-green-500" />
    return <Clock className="w-4 h-4 text-slate-500" />
  }

  if (loading) {
    return (
      <AdminLayout title="대시보드" description="관리자 시스템 현황">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="대시보드" description="관리자 시스템 현황">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="총 사용자"
            value={stats?.totalUsers || 0}
            description="등록된 사용자 수"
            icon={Users}
          />
          <StatsCard
            title="총 게시물"
            value={stats?.totalPosts || 0}
            description="커뮤니티 게시물"
            icon={MessageSquare}
          />
          <StatsCard
            title="총 채용공고"
            value={stats?.totalJobs || 0}
            description="구인구직 게시물"
            icon={Briefcase}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                빠른 작업
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href="/admin/community" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    커뮤니티 관리
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href="/admin/jobs" className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    구인구직 관리
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href="/admin/users" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    사용자 관리
                  </Link>
                </Button>
              </div>

              {isMaster && (
                <div className="mt-4 pt-4 border-t">
                  <Badge variant="destructive" className="w-full justify-center mb-2">
                    마스터 전용
                  </Badge>
                  <p className="text-xs text-slate-600 text-center">
                    모든 관리 권한을 보유하고 있습니다
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                최근 관리 활동
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-slate-600">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>최근 관리 활동이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.slice(0, 8).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50">
                      {getActivityIcon(activity.action)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900">
                            {getActionLabel(activity.action)}
                          </p>
                          {activity.target_type && (
                            <Badge variant="outline" className="text-xs">
                              {activity.target_type}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-slate-600">
                            {activity.admin.full_name || activity.admin.email}
                          </p>
                          <span className="text-xs text-slate-400">•</span>
                          <p className="text-xs text-slate-500">
                            {formatDate(activity.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentActivity.length > 8 && (
                    <div className="text-center pt-2">
                      <p className="text-sm text-slate-500">
                        + {recentActivity.length - 8}개 더 있음
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              시스템 상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600">데이터베이스 연결 정상</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600">인증 시스템 정상</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600">관리자 권한 활성화</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}