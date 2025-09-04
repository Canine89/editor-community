'use client'

import { useState, useEffect } from 'react'
import { useAdmin } from '@/hooks/useAdmin'
import AdminLayout from '@/components/admin/AdminLayout'
import DataTable from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Eye,
  ToggleLeft,
  ToggleRight,
  Building,
  MapPin,
  DollarSign,
  Calendar,
  User,
  Briefcase
} from 'lucide-react'
import Link from 'next/link'

interface AdminJob {
  id: string
  title: string
  description: string
  company: string
  location: string
  type: 'full-time' | 'part-time' | 'freelance' | 'contract'
  salary_range: string
  requirements: string[]
  poster_id: string
  poster_name: string
  poster_email: string
  is_active: boolean
  created_at: string
}

const jobTypes = [
  { value: 'full-time', label: '정규직', color: 'bg-blue-500' },
  { value: 'part-time', label: '계약직', color: 'bg-green-500' },
  { value: 'freelance', label: '프리랜서', color: 'bg-purple-500' },
  { value: 'contract', label: '외주', color: 'bg-orange-500' },
]

export default function AdminJobsPage() {
  const { isAdmin, hasPermission, getAllJobs, toggleJobStatus, logActivity } = useAdmin()
  const [jobs, setJobs] = useState<AdminJob[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      loadJobs()
      logActivity('view_admin_jobs')
    }
  }, [isAdmin])

  const loadJobs = async () => {
    try {
      const data = await getAllJobs()
      setJobs(data)
    } catch (error) {
      console.error('Failed to load jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (job: AdminJob) => {
    setSelectedJob(job)
    setStatusDialogOpen(true)
  }

  const confirmToggleStatus = async () => {
    if (!selectedJob) return

    setProcessing(true)
    try {
      const success = await toggleJobStatus(selectedJob.id, !selectedJob.is_active)
      if (success) {
        setJobs(jobs.map(j => 
          j.id === selectedJob.id 
            ? { ...j, is_active: !j.is_active }
            : j
        ))
        setStatusDialogOpen(false)
        setSelectedJob(null)
      }
    } catch (error) {
      console.error('Failed to toggle job status:', error)
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getJobTypeInfo = (type: string) => {
    return jobTypes.find(t => t.value === type) || { label: type, color: 'bg-gray-500' }
  }

  const columns = [
    {
      key: 'title',
      label: '직무명',
      sortable: true,
      render: (value: string, row: AdminJob) => (
        <div className="max-w-xs">
          <p className="font-medium text-slate-900 truncate">{value}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="secondary"
              className={`text-xs ${getJobTypeInfo(row.type).color} text-white`}
            >
              {getJobTypeInfo(row.type).label}
            </Badge>
            <Badge
              variant={row.is_active ? "default" : "secondary"}
              className="text-xs"
            >
              {row.is_active ? '활성' : '비활성'}
            </Badge>
          </div>
        </div>
      )
    },
    {
      key: 'company',
      label: '회사명',
      render: (value: string, row: AdminJob) => (
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-slate-500" />
          <div>
            <p className="text-sm font-medium">{value}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {row.location}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'salary_range',
      label: '급여',
      render: (value: string) => (
        value ? (
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-slate-500" />
            <span className="text-sm">{value}</span>
          </div>
        ) : (
          <span className="text-sm text-slate-400">미설정</span>
        )
      )
    },
    {
      key: 'poster_name',
      label: '등록자',
      render: (value: string, row: AdminJob) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          <div>
            <p className="text-sm font-medium">{value || '사용자'}</p>
            <p className="text-xs text-slate-500">{row.poster_email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'created_at',
      label: '등록일',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-500" />
          <span className="text-sm">{formatDate(value)}</span>
        </div>
      )
    }
  ]

  const actions = [
    {
      label: '보기',
      icon: Eye,
      onClick: (row: AdminJob) => {
        window.open(`/jobs/${row.id}`, '_blank')
      },
      variant: 'ghost' as const
    },
    ...(hasPermission('jobs_admin') || hasPermission('master') ? [{
      label: '상태변경',
      icon: ToggleLeft,
      onClick: handleToggleStatus,
      variant: 'ghost' as const,
      className: 'text-blue-600 hover:text-blue-700'
    }] : [])
  ]

  const stats = {
    total: jobs.length,
    active: jobs.filter(j => j.is_active).length,
    inactive: jobs.filter(j => !j.is_active).length,
    byType: jobTypes.map(type => ({
      ...type,
      count: jobs.filter(j => j.type === type.value).length
    }))
  }

  return (
    <AdminLayout title="구인구직 관리" description="채용공고 게시물 관리 및 활성화 제어">
      <div className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 채용공고</CardTitle>
              <Briefcase className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성 채용공고</CardTitle>
              <ToggleRight className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-slate-600">
                전체의 {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">비활성 채용공고</CardTitle>
              <ToggleLeft className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inactive}</div>
              <p className="text-xs text-slate-600">
                전체의 {stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">직무 유형별 분포</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {stats.byType.map((type) => (
                  <Badge
                    key={type.value}
                    variant="secondary"
                    className={`${type.color} text-white text-xs`}
                  >
                    {type.label}: {type.count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs Table */}
        <DataTable
          title="채용공고 목록"
          data={jobs}
          columns={columns}
          actions={actions}
          loading={loading}
          searchPlaceholder="직무명, 회사명, 등록자 검색..."
          emptyMessage="등록된 채용공고가 없습니다"
        />

        {/* Status Toggle Dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>채용공고 상태 변경</DialogTitle>
              <DialogDescription>
                이 채용공고의 활성화 상태를 변경하시겠습니까?
              </DialogDescription>
            </DialogHeader>
            {selectedJob && (
              <div className="py-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="font-medium text-slate-900">{selectedJob.title}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    회사: {selectedJob.company}
                  </p>
                  <p className="text-sm text-slate-600">
                    등록자: {selectedJob.poster_name || selectedJob.poster_email}
                  </p>
                  <p className="text-sm text-slate-600">
                    현재 상태: <Badge variant={selectedJob.is_active ? "default" : "secondary"}>
                      {selectedJob.is_active ? '활성' : '비활성'}
                    </Badge>
                  </p>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    {selectedJob.is_active 
                      ? '비활성화하면 사용자에게 노출되지 않습니다.'
                      : '활성화하면 구인구직 게시판에 다시 노출됩니다.'
                    }
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStatusDialogOpen(false)}
                disabled={processing}
              >
                취소
              </Button>
              <Button
                onClick={confirmToggleStatus}
                disabled={processing}
                variant={selectedJob?.is_active ? "destructive" : "default"}
              >
                {processing ? '처리 중...' : (selectedJob?.is_active ? '비활성화' : '활성화')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}