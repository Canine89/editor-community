'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/hooks/useAdmin'
import { 
  getAdStatistics,
  getExpiringAdvertisements,
  getAdPerformanceData,
  getAllAdvertisements,
  type Advertisement,
  type AdStatistics
} from '@/lib/advertisements'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  TrendingUp, 
  MousePointer, 
  Eye, 
  Calendar,
  AlertTriangle,
  BarChart,
  PieChart,
  Activity
} from 'lucide-react'
import Link from 'next/link'

export default function AdvertisementAnalyticsPage() {
  const { isAdmin, loading: adminLoading } = useAdmin()
  const router = useRouter()

  const [statistics, setStatistics] = useState<AdStatistics | null>(null)
  const [expiringAds, setExpiringAds] = useState<Advertisement[]>([])
  const [performanceData, setPerformanceData] = useState<Advertisement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/admin')
      return
    }

    if (isAdmin) {
      loadAnalytics()
    }
  }, [isAdmin, adminLoading, router])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      // 현재 날짜에서 30일 전과 7일 후 범위 계산
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const startDate = thirtyDaysAgo.toISOString().split('T')[0]
      const endDate = now.toISOString().split('T')[0]

      const [statsData, expiringData, performanceAnalytics] = await Promise.all([
        getAdStatistics(),
        getExpiringAdvertisements(7), // 7일 내 만료 예정
        getAdPerformanceData(startDate, endDate)
      ])

      setStatistics(statsData)
      setExpiringAds(expiringData)
      setPerformanceData(performanceAnalytics.slice(0, 10)) // 상위 10개만 표시

    } catch (err) {
      console.error('Failed to load analytics:', err)
      setError('분석 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const calculateCTR = (clicks: number, views: number): string => {
    if (views === 0) return '0.00%'
    return ((clicks / views) * 100).toFixed(2) + '%'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const getUrgencyBadge = (endDate: string) => {
    const now = new Date()
    const end = new Date(endDate)
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysLeft <= 1) {
      return <Badge variant="destructive">오늘/내일 만료</Badge>
    } else if (daysLeft <= 3) {
      return <Badge variant="secondary">3일 이내</Badge>
    } else {
      return <Badge variant="outline">{daysLeft}일 남음</Badge>
    }
  }

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">분석 데이터를 불러오는 중...</p>
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
          <h1 className="text-3xl font-bold">광고 분석</h1>
          <p className="text-gray-600 mt-2">광고 성과 및 통계를 확인합니다</p>
        </div>
        <Link href="/admin/advertisements">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            광고 관리로 돌아가기
          </Button>
        </Link>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 전체 통계 카드 */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 광고</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_ads}</div>
              <p className="text-xs text-muted-foreground">
                활성: {statistics.active_ads} | 만료: {statistics.expired_ads}
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
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_views.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                전체 광고 노출수
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 CTR</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {calculateCTR(statistics.total_clicks, statistics.total_views)}
              </div>
              <p className="text-xs text-muted-foreground">
                클릭률 (Click-Through Rate)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 광고 유형별 분포 */}
      {statistics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                광고 유형별 분포
              </CardTitle>
              <CardDescription>
                캐러셀과 배너 광고의 분포 현황
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">캐러셀 광고</span>
                  <div className="text-right">
                    <div className="text-lg font-bold">{statistics.carousel_ads}개</div>
                    <div className="text-xs text-gray-500">
                      {((statistics.carousel_ads / statistics.total_ads) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">배너 광고</span>
                  <div className="text-right">
                    <div className="text-lg font-bold">{statistics.banner_ads}개</div>
                    <div className="text-xs text-gray-500">
                      {((statistics.banner_ads / statistics.total_ads) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                광고 상태 현황
              </CardTitle>
              <CardDescription>
                현재 광고들의 상태 분포
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">활성 광고</span>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{statistics.active_ads}개</div>
                    <div className="text-xs text-gray-500">
                      {((statistics.active_ads / statistics.total_ads) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">만료된 광고</span>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">{statistics.expired_ads}개</div>
                    <div className="text-xs text-gray-500">
                      {((statistics.expired_ads / statistics.total_ads) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 만료 예정 광고 알림 */}
      {expiringAds.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              만료 예정 광고 ({expiringAds.length}개)
            </CardTitle>
            <CardDescription>
              7일 이내에 만료되는 광고들입니다. 연장 또는 새로운 광고 준비가 필요합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>광고명</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>만료일</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>광고주</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiringAds.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell className="font-medium">{ad.title}</TableCell>
                      <TableCell>
                        <Badge variant={ad.type === 'carousel' ? 'default' : 'secondary'}>
                          {ad.type === 'carousel' ? '캐러셀' : '배너'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(ad.end_date)}</TableCell>
                      <TableCell>{getUrgencyBadge(ad.end_date)}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {ad.advertiser_name}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 광고 성과 순위 (최근 30일) */}
      {performanceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              광고 성과 순위 (최근 30일)
            </CardTitle>
            <CardDescription>
              클릭수 기준 상위 성과를 보인 광고들입니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>광고명</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>클릭수</TableHead>
                    <TableHead>노출수</TableHead>
                    <TableHead>CTR</TableHead>
                    <TableHead>기간</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceData.map((ad, index) => (
                    <TableRow key={ad.id}>
                      <TableCell className="font-bold text-lg">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ad.title}</p>
                          <p className="text-xs text-gray-500">{ad.advertiser_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ad.type === 'carousel' ? 'default' : 'secondary'}>
                          {ad.type === 'carousel' ? '캐러셀' : '배너'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-blue-600">
                          {ad.click_count.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {ad.view_count.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${
                          parseFloat(calculateCTR(ad.click_count, ad.view_count)) > 2 
                            ? 'text-green-600' 
                            : parseFloat(calculateCTR(ad.click_count, ad.view_count)) > 1
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}>
                          {calculateCTR(ad.click_count, ad.view_count)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {formatDate(ad.start_date)} ~<br/>
                        {formatDate(ad.end_date)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 데이터 새로고침 */}
      <div className="flex justify-end mt-6">
        <Button onClick={loadAnalytics} disabled={loading}>
          <Activity className="w-4 h-4 mr-2" />
          데이터 새로고침
        </Button>
      </div>
    </div>
  )
}