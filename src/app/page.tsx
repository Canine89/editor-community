'use client'

import { useAuth } from '@/hooks/useAuth'
import AuthComponent from '@/components/Auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TopCarouselAd, BottomBannerAd } from '@/components/ads'
import {
  FileText,
  Users,
  Briefcase,
  Wrench,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Zap,
  Shield
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { getStatistics, formatNumber, type Statistics } from '@/lib/statistics'

export default function Home() {
  const { user, loading, signOut } = useAuth()
  const [statistics, setStatistics] = useState<Statistics>({
    activeUsers: 0,
    totalPosts: 0,
    totalJobs: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        const stats = await getStatistics()
        setStatistics(stats)
      } catch (error) {
        console.error('통계 데이터 로드 중 오류:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    if (user) {
      loadStatistics()
    } else {
      setStatsLoading(false)
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-500 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-slate-600 font-medium">편집자 커뮤니티 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 상단 캐러셀 광고 */}
        <TopCarouselAd className="mb-8" />
        
        {/* Hero Section */}
        <div className="relative overflow-hidden mb-16">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-xl"></div>
          <div className="relative px-4 py-16">
            <div className="text-center max-w-4xl mx-auto">
              <Badge variant="secondary" className="mb-4 px-3 py-1">
                <Sparkles className="w-3 h-3 mr-1" />
                베타 버전
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent mb-6 leading-tight">
                편집자 커뮤니티
              </h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto">
                전문 편집자들을 위한 종합 플랫폼
                <br />
                지식 공유, 취업 지원, 효율적인 업무 도구까지
              </p>
            </div>
          </div>
        </div>
        {user ? (
          // 로그인된 사용자 대시보드
          <div className="space-y-12">
            {/* 환영 메시지 - 헤더로 이동됨 */}
            <div className="text-center">
              <p className="text-lg text-slate-600 mb-8">
                편집자 커뮤니티의 다양한 기능을 둘러보세요
              </p>
            </div>

            {/* 메인 기능 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-1 cursor-pointer">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                    익명 게시판
                  </CardTitle>
                  <CardDescription className="text-base">
                    편집자들 간의 지식 공유와 전문적인 토론
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-slate-500">
                    <span>커뮤니티 참여하기</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-1 cursor-pointer">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-green-600 transition-colors">
                    구인구직
                  </CardTitle>
                  <CardDescription className="text-base">
                    편집 관련 일자리 찾기와 인재 채용
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-slate-500">
                    <span>채용 정보 보기</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-1 cursor-pointer md:col-span-2 lg:col-span-1">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Wrench className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">
                    유틸리티 도구
                  </CardTitle>
                  <CardDescription className="text-base">
                    PDF/워드 파일 처리 및 AI 자동 교정
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-slate-500">
                    <span>도구 사용하기</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 통계 섹션 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="text-2xl font-bold text-slate-900">
                  {statsLoading ? (
                    <div className="animate-pulse bg-slate-200 h-8 w-16 mx-auto rounded"></div>
                  ) : (
                    formatNumber(statistics.activeUsers)
                  )}
                </div>
                <div className="text-sm text-slate-600">활성 사용자</div>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="text-2xl font-bold text-slate-900">
                  {statsLoading ? (
                    <div className="animate-pulse bg-slate-200 h-8 w-12 mx-auto rounded"></div>
                  ) : (
                    formatNumber(statistics.totalPosts)
                  )}
                </div>
                <div className="text-sm text-slate-600">게시글</div>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="text-2xl font-bold text-slate-900">
                  {statsLoading ? (
                    <div className="animate-pulse bg-slate-200 h-8 w-10 mx-auto rounded"></div>
                  ) : (
                    formatNumber(statistics.totalJobs)
                  )}
                </div>
                <div className="text-sm text-slate-600">채용공고</div>
              </div>
            </div>
          </div>
        ) : (
          // 로그인하지 않은 사용자용 랜딩 페이지
          <div className="space-y-16">
            {/* 특징 섹션 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">안전한 커뮤니티</h3>
                <p className="text-slate-600">익명 게시판으로 자유로운 의견 교환</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">효율적인 업무</h3>
                <p className="text-slate-600">AI 기반 자동 교정으로 생산성 향상</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">네트워킹</h3>
                <p className="text-slate-600">편집 전문가들과의 소통과 협업</p>
              </div>
            </div>

          </div>
        )}

        {/* 하단 배너 광고 */}
        <div className="mt-16">
          <BottomBannerAd position="static" />
        </div>
      </div>
    </div>
  )
}
