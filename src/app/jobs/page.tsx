'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { mockJobs, mockUsers, getActiveJobs, getJobsByType } from '@/lib/mockData'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  MapPin,
  Clock,
  Building,
  DollarSign,
  User
} from 'lucide-react'
import Link from 'next/link'
import { Pagination, PaginationInfo } from '@/components/ui/pagination'

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
  }
}

const jobTypes = [
  { value: 'full-time', label: '정규직', color: 'bg-blue-500' },
  { value: 'part-time', label: '계약직', color: 'bg-green-500' },
  { value: 'freelance', label: '프리랜서', color: 'bg-purple-500' },
  { value: 'contract', label: '외주', color: 'bg-orange-500' },
]

export default function JobsPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  useEffect(() => {
    loadJobs()
  }, [selectedType])

  useEffect(() => {
    setCurrentPage(1) // 검색어나 타입 변경시 첫 페이지로
  }, [searchQuery, selectedType])

  const loadJobs = async () => {
    try {
      // 개발 모드에서는 Mock 데이터 사용
      const isDevMode = process.env.NODE_ENV === 'development'
      
      if (isDevMode) {
        // Mock 데이터를 활성 상태만 필터링
        let filteredJobs = mockJobs.filter(job => job.is_active)
        
        // 타입 필터링
        if (selectedType !== 'all') {
          filteredJobs = filteredJobs.filter(job => job.type === selectedType)
        }
        
        // 시간순 정렬 (최신순)
        filteredJobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        
        // Mock 데이터를 Supabase 형식으로 변환 (profiles 객체 추가)
        const transformedJobs = filteredJobs.map(job => ({
          ...job,
          profiles: {
            full_name: job.poster_name,
            avatar_url: mockUsers.find(user => user.id === job.poster_id)?.avatar_url || ''
          }
        }))
        
        setJobs(transformedJobs)
        setLoading(false)
        return
      }

      // 프로덕션 모드에서는 Supabase 사용
      const supabase = createClient()

      let query = supabase
        .from('jobs')
        .select(`
          *,
          profiles:poster_id (
            full_name,
            avatar_url
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      // 타입 필터링
      if (selectedType !== 'all') {
        query = query.eq('type', selectedType)
      }

      const { data, error } = await query

      if (error) {
        console.error('구인구직 로드 오류:', error)
        return
      }

      setJobs(data || [])
    } catch (error) {
      console.error('구인구직 로드 중 오류:', error)
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
        day: 'numeric'
      })
    }
  }

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <PageLayout className="min-h-screen gradient-bg-editorial">
        {/* 헤더 섹션 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gradient-editorial flex items-center gap-3 animate-fade-in">
              <Briefcase className="w-8 h-8 text-blue-600" />
              구인구직 게시판
            </h1>
            <p className="text-muted-foreground mt-2">편집자들을 위한 일자리 정보 및 프리랜서 모집</p>
          </div>

          {user && (
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/jobs/write" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                채용공고 등록
              </Link>
            </Button>
          )}
        </div>

        {/* 검색 및 필터 섹션 */}
        <div className="card-editorial p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 w-4 h-4" />
              <input
                type="text"
                placeholder="직무, 회사명, 지역 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            {/* 타입 필터 */}
            <div className="flex gap-2 overflow-x-auto">
              <Button
                variant={selectedType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('all')}
              >
                전체
              </Button>
              {jobTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={selectedType === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type.value)}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* 구인구직 목록 */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-muted rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : paginatedJobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {searchQuery || selectedType !== 'all' ? '검색 결과가 없습니다' : '첫 번째 채용공고를 등록해보세요'}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedType !== 'all' ? '다른 검색어로 시도해보세요' : '편집자들을 위한 일자리를 공유해보세요'}
            </p>
            {user && !searchQuery && selectedType === 'all' && (
              <Button asChild className="mt-4">
                <Link href="/jobs/write">
                  <Plus className="w-4 h-4 mr-2" />
                  첫 채용공고 등록하기
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedJobs.map((job) => (
              <Card key={job.id} className="card-editorial hover-lift-editorial animate-scale-in cursor-pointer h-fit">
                <CardContent className="p-4">
                  <Link href={`/jobs/${job.id}`} className="block">
                    {/* 회사 로고와 타입 */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building className="w-5 h-5 text-blue-600" />
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          jobTypes.find(t => t.value === job.type)?.color || 'bg-gray-500'
                        } text-white`}
                      >
                        {jobTypes.find(t => t.value === job.type)?.label || job.type}
                      </Badge>
                    </div>

                    {/* 직무명 */}
                    <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                      {job.title}
                    </h3>

                    {/* 회사명 */}
                    <div className="flex items-center gap-2 mb-3">
                      <Building className="w-4 h-4 text-muted-foreground/80" />
                      <span className="font-medium text-foreground truncate">{job.company}</span>
                    </div>

                    {/* 위치 및 급여 */}
                    <div className="space-y-1 mb-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{job.location}</span>
                      </div>
                      {job.salary_range && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          <span className="truncate">{job.salary_range}</span>
                        </div>
                      )}
                    </div>

                    {/* 설명 미리보기 */}
                    <p className="text-muted-foreground mb-3 line-clamp-3 text-sm">
                      {job.description}
                    </p>

                    {/* 요구사항 태그들 */}
                    {job.requirements && job.requirements.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {job.requirements.slice(0, 2).map((req, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                        {job.requirements.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{job.requirements.length - 2}개 더
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* 메타 정보 */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground/80 pt-2 border-t border-border">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(job.created_at)}
                      </div>
                      {job.profiles?.full_name && (
                        <div className="flex items-center gap-1 truncate">
                          <User className="w-3 h-3" />
                          <span className="truncate">{job.profiles.full_name}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {filteredJobs.length > 0 && (
          <div className="mt-12 space-y-4">
            <PaginationInfo
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredJobs.length}
              itemsPerPage={itemsPerPage}
              itemName="채용공고"
              className="mb-4"
            />
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                className="mt-4"
              />
            )}
          </div>
        )}
    </PageLayout>
  )
}