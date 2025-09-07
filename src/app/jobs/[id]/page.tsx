'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { mockJobs, mockUsers } from '@/lib/mockData'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Briefcase,
  Building,
  MapPin,
  DollarSign,
  Clock,
  User,
  Mail,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react'
import Link from 'next/link'

interface Job {
  id: string
  title: string
  description: string
  company: string
  location: string
  type: 'full-time' | 'part-time' | 'freelance' | 'contract'
  salary_range: string
  requirements: string[]
  poster_id: string
  is_active: boolean
  created_at: string
  profiles?: {
    full_name: string
    avatar_url: string
    email: string
  }
}

const jobTypes = [
  { value: 'full-time', label: '정규직', color: 'bg-blue-500' },
  { value: 'part-time', label: '계약직', color: 'bg-green-500' },
  { value: 'freelance', label: '프리랜서', color: 'bg-purple-500' },
  { value: 'contract', label: '외주', color: 'bg-orange-500' },
]

export default function JobDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadJob()
    }
  }, [id])

  const loadJob = async () => {
    try {
      // 개발 모드에서는 Mock 데이터 사용
      const isDevMode = process.env.NODE_ENV === 'development'
      
      if (isDevMode) {
        // Mock 데이터에서 해당 ID의 채용공고 찾기
        const mockJob = mockJobs.find(job => job.id === id)
        
        if (mockJob) {
          // Mock 데이터를 Supabase 형식으로 변환
          const transformedJob = {
            ...mockJob,
            profiles: {
              full_name: mockJob.poster_name,
              avatar_url: mockUsers.find(user => user.id === mockJob.poster_id)?.avatar_url || '',
              email: mockJob.poster_email
            }
          }
          
          setJob(transformedJob)
        } else {
          console.error('채용공고를 찾을 수 없습니다:', id)
        }
        
        setLoading(false)
        return
      }

      // 프로덕션 모드에서는 Supabase 사용
      const supabase = createClient()

      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          profiles:poster_id (
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('채용공고 로드 오류:', error)
        return
      }

      setJob(data)
    } catch (error) {
      console.error('채용공고 로드 중 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async () => {
    if (!job || !user || job.poster_id !== user.id) return

    try {
      // 개발 모드에서는 상태만 로컬에서 변경
      const isDevMode = process.env.NODE_ENV === 'development'
      
      if (isDevMode) {
        setJob(prev => prev ? { ...prev, is_active: !prev.is_active } : null)
        return
      }

      // 프로덕션 모드에서는 Supabase 업데이트
      const supabase = createClient()

      const { error } = await (supabase
        .from('jobs') as any)
        .update({ is_active: !job.is_active })
        .eq('id', Array.isArray(id) ? id[0] : id)

      if (error) {
        console.error('공고 상태 변경 오류:', error)
        return
      }

      setJob(prev => prev ? { ...prev, is_active: !prev.is_active } : null)
    } catch (error) {
      console.error('공고 상태 변경 중 오류:', error)
    }
  }

  const handleDelete = async () => {
    if (!job || !user || job.poster_id !== user.id) return

    if (!confirm('정말로 이 채용공고를 삭제하시겠습니까?')) return

    try {
      // 개발 모드에서는 바로 목록 페이지로 이동
      const isDevMode = process.env.NODE_ENV === 'development'
      
      if (isDevMode) {
        router.push('/jobs')
        return
      }

      // 프로덕션 모드에서는 Supabase에서 삭제
      const supabase = createClient()

      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('채용공고 삭제 오류:', error)
        return
      }

      router.push('/jobs')
    } catch (error) {
      console.error('채용공고 삭제 중 오류:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-8 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded"></div>
                    <div className="h-4 bg-slate-200 rounded"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>
      </PageLayout>
    )
  }

  if (!job) {
    return (
      <PageLayout className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">채용공고를 찾을 수 없습니다</h1>
          <p className="text-slate-600 mb-6">요청하신 채용공고가 존재하지 않거나 삭제되었을 수 있습니다.</p>
          <Button asChild>
            <Link href="/jobs">구인구직으로 돌아가기</Link>
          </Button>
        </div>
      </PageLayout>
    )
  }

  const isOwner = user && job.poster_id === user.id

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="icon" asChild>
              <Link href="/jobs">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">채용공고</h1>
          </div>

          {/* 채용공고 본문 */}
          <Card className="mb-8">
            <CardContent className="p-6">
              {/* 공고 비활성 상태 표시 */}
              {!job.is_active && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <EyeOff className="w-4 h-4" />
                    <span className="font-medium">이 채용공고는 현재 비공개 상태입니다</span>
                  </div>
                </div>
              )}

              {/* 제목 및 기본 정보 */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        jobTypes.find(t => t.value === job.type)?.color || 'bg-gray-500'
                      } text-white`}
                    >
                      {jobTypes.find(t => t.value === job.type)?.label || job.type}
                    </Badge>
                    {!job.is_active && (
                      <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">
                        비공개
                      </Badge>
                    )}
                  </div>
                  
                  <h1 className="text-3xl font-bold text-slate-900 mb-4">
                    {job.title}
                  </h1>

                  <div className="space-y-2 text-lg text-slate-700">
                    <div className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-slate-500" />
                      <span className="font-medium">{job.company}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-slate-500" />
                      <span>{job.location}</span>
                    </div>
                    {job.salary_range && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-slate-500" />
                        <span>{job.salary_range}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 작업자 메뉴 */}
                {isOwner && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleActive}
                    >
                      {job.is_active ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          비공개
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          공개
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4 mr-1" />
                      삭제
                    </Button>
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              {/* 업무 설명 */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">업무 설명</h2>
                <div className="prose prose-slate max-w-none">
                  <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                    {job.description}
                  </div>
                </div>
              </div>

              {/* 요구사항 */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">요구사항 및 우대사항</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.requirements.map((requirement, index) => (
                      <Badge key={index} variant="outline" className="text-sm py-1">
                        {requirement}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="my-6" />

              {/* 담당자 정보 */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">담당자 정보</h2>
                <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-lg">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={job.profiles?.avatar_url} />
                    <AvatarFallback>
                      {job.profiles?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-slate-900">
                      {job.profiles?.full_name || '담당자'}
                    </div>
                    {job.profiles?.email && (
                      <div className="text-sm text-slate-600 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {job.profiles.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 메타 정보 */}
              <div className="flex items-center pt-4 border-t">
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(job.created_at)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 관련 채용공고 (나중에 구현) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                다른 채용공고
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <p>관련 채용공고를 준비 중입니다.</p>
              </div>
            </CardContent>
          </Card>
        </div>
    </PageLayout>
  )
}