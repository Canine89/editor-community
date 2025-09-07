'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/hooks/useRole'
import { 
  getAllAdvertisements, 
  deleteAdvertisement, 
  toggleAdvertisementStatus,
  getAdStatistics,
  type Advertisement,
  type AdStatistics
} from '@/lib/advertisements'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  Settings, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Calendar,
  MousePointer,
  TrendingUp,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react'

export default function AdvertisementsPage() {
  const { isAdmin, loading: adminLoading } = useAdmin()
  const router = useRouter()
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([])
  const [statistics, setStatistics] = useState<AdStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/admin')
      return
    }

    if (isAdmin) {
      loadData()
    }
  }, [isAdmin, adminLoading, router])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [adsData, statsData] = await Promise.all([
        getAllAdvertisements(),
        getAdStatistics()
      ])

      setAdvertisements(adsData)
      setStatistics(statsData)
    } catch (err) {
      console.error('Failed to load advertisements:', err)
      setError('광고 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleAdvertisementStatus(id, !currentStatus)
      await loadData() // 데이터 새로고침
    } catch (err) {
      console.error('Failed to toggle advertisement status:', err)
      setError('광고 상태 변경에 실패했습니다.')
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 광고를 삭제하시겠습니까?`)) {
      return
    }

    try {
      await deleteAdvertisement(id)
      await loadData() // 데이터 새로고침
    } catch (err) {
      console.error('Failed to delete advertisement:', err)
      setError('광고 삭제에 실패했습니다.')
    }
  }

  const getStatusBadge = (ad: Advertisement) => {
    const now = new Date()
    const startDate = new Date(ad.start_date)
    const endDate = new Date(ad.end_date)

    if (!ad.is_active) {
      return <Badge variant="secondary">비활성</Badge>
    }

    if (now < startDate) {
      return <Badge variant="outline">대기중</Badge>
    }

    if (now > endDate) {
      return <Badge variant="destructive">만료</Badge>
    }

    return <Badge variant="default">진행중</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">광고 관리</h1>
          <p className="text-gray-600 mt-2">사이트에 표시되는 광고를 관리합니다</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/advertisements/analytics">
            <Button variant="outline" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              분석
            </Button>
          </Link>
          <Link href="/admin/advertisements/settings">
            <Button variant="outline" className="gap-2">
              <Settings className="w-4 h-4" />
              설정
            </Button>
          </Link>
          <Link href="/admin/advertisements/create">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              새 광고
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 통계 카드 */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 광고</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_ads}</div>
              <p className="text-xs text-muted-foreground">
                캐러셀 {statistics.carousel_ads}개, 배너 {statistics.banner_ads}개
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성 광고</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.active_ads}</div>
              <p className="text-xs text-muted-foreground">
                현재 진행중인 광고
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 클릭수</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_clicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                전체 광고 클릭수
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 노출수</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_views.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                전체 광고 노출수
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 광고 목록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>광고 목록</CardTitle>
          <CardDescription>
            등록된 모든 광고를 확인하고 관리할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {advertisements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">등록된 광고가 없습니다</p>
              <Link href="/admin/advertisements/create">
                <Button>첫 광고 만들기</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>기간</TableHead>
                    <TableHead>클릭/노출</TableHead>
                    <TableHead>광고주</TableHead>
                    <TableHead className="w-[100px]">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advertisements.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img 
                            src={ad.image_url} 
                            alt={ad.title}
                            className="w-12 h-8 object-cover rounded border"
                          />
                          <div>
                            <p className="font-medium">{ad.title}</p>
                            {ad.description && (
                              <p className="text-sm text-gray-500 truncate max-w-[200px]">
                                {ad.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ad.type === 'carousel' ? 'default' : 'secondary'}>
                          {ad.type === 'carousel' ? '캐러셀' : '배너'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(ad)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDate(ad.start_date)}</p>
                          <p className="text-gray-500">~ {formatDate(ad.end_date)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>클릭: {ad.click_count.toLocaleString()}</p>
                          <p className="text-gray-500">노출: {ad.view_count.toLocaleString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{ad.advertiser_name}</p>
                          {ad.advertiser_email && (
                            <p className="text-gray-500">{ad.advertiser_email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/advertisements/${ad.id}`)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              수정
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.open(ad.link_url, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              링크 확인
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(ad.id, ad.is_active)}
                            >
                              {ad.is_active ? (
                                <>
                                  <EyeOff className="w-4 h-4 mr-2" />
                                  비활성화
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-2" />
                                  활성화
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(ad.id, ad.title)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}