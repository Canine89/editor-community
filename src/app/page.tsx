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
      <div className="min-h-screen flex items-center justify-center gradient-bg-editorial">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-border rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <div className="space-y-2">
            <p className="text-foreground font-semibold text-lg">편집자 커뮤니티</p>
            <p className="text-muted-foreground font-medium">로딩 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg-editorial">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 상단 캐러셀 광고 */}
        <TopCarouselAd className="mb-12" />
        
        {/* Editorial Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gradient-editorial leading-tight">
              편집자 커뮤니티
            </h1>
            <Badge className="gradient-accent text-accent-foreground px-3 py-1.5 text-sm font-semibold rounded-full animate-float">
              <Sparkles className="w-4 h-4 mr-1" />
              베타
            </Badge>
          </div>
          <div className="space-y-4 max-w-2xl mx-auto">
            <p className="text-xl text-muted-foreground font-medium">
              전문 편집자들을 위한 종합 플랫폼
            </p>
            <p className="text-base text-muted-foreground/80">
              전문가 네트워크로 편집 업무를 한 단계 발전시키세요
            </p>
          </div>
        </div>
        {user ? (
          // 로그인된 사용자 대시보드
          <div className="space-y-16">
            {/* 환영 메시지 */}
            <div className="text-center animate-slide-up">
              <p className="text-xl text-muted-foreground font-medium mb-2">
                편집자 커뮤니티의 다양한 기능을 둘러보세요
              </p>
              <div className="w-24 h-1 gradient-primary rounded-full mx-auto"></div>
            </div>

            {/* 메인 기능 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="card-editorial group hover-lift-editorial cursor-pointer animate-scale-in">
                <CardHeader className="pb-6">
                  <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg">
                    <MessageSquare className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-2xl font-bold group-hover:text-primary transition-all duration-300">
                    익명 게시판
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground font-medium leading-relaxed">
                    편집자들 간의 지식 공유와 전문적인 토론을 위한 안전한 소통 공간
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm font-semibold text-primary group-hover:text-primary/80 transition-colors">
                    <span>커뮤니티 참여하기</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-all duration-300" />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-editorial group hover-lift-editorial cursor-pointer animate-scale-in">
                <CardHeader className="pb-6">
                  <div className="w-14 h-14 gradient-warm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg">
                    <Briefcase className="w-7 h-7 text-warning-foreground" />
                  </div>
                  <CardTitle className="text-2xl font-bold group-hover:text-warning transition-all duration-300">
                    구인구직
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground font-medium leading-relaxed">
                    편집 업계의 최신 채용 정보와 인재 연결 플랫폼
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm font-semibold text-warning group-hover:text-warning/80 transition-colors">
                    <span>채용 정보 보기</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-all duration-300" />
                  </div>
                </CardContent>
              </Card>

            </div>


            {/* 통계 섹션 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-8 card-editorial hover-glow transition-all duration-300">
                <div className="text-3xl font-bold text-gradient-editorial mb-2">
                  {statsLoading ? (
                    <div className="animate-pulse bg-muted h-10 w-20 mx-auto rounded-xl"></div>
                  ) : (
                    formatNumber(statistics.activeUsers)
                  )}
                </div>
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">활성 사용자</div>
              </div>

              <div className="text-center p-8 card-editorial hover-glow transition-all duration-300">
                <div className="text-3xl font-bold text-gradient-editorial mb-2">
                  {statsLoading ? (
                    <div className="animate-pulse bg-muted h-10 w-16 mx-auto rounded-xl"></div>
                  ) : (
                    formatNumber(statistics.totalPosts)
                  )}
                </div>
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">게시글</div>
              </div>

              <div className="text-center p-8 card-editorial hover-glow transition-all duration-300">
                <div className="text-3xl font-bold text-gradient-editorial mb-2">
                  {statsLoading ? (
                    <div className="animate-pulse bg-muted h-10 w-14 mx-auto rounded-xl"></div>
                  ) : (
                    formatNumber(statistics.totalJobs)
                  )}
                </div>
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">채용공고</div>
              </div>
            </div>
          </div>
        ) : (
          // 로그인하지 않은 사용자용 랜딩 페이지
          <div className="space-y-20">
            {/* 특징 섹션 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center group animate-scale-in">
                <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-editorial animate-float">
                  <Shield className="w-10 h-10 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors">안전한 커뮤니티</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">익명 게시판으로 자유롭고 안전한 전문 지식 교환</p>
              </div>
              <div className="text-center group animate-scale-in">
                <div className="w-20 h-20 gradient-warm rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-warm animate-pulse-slow">
                  <Zap className="w-10 h-10 text-warning-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-warning transition-colors">효율적인 업무</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">전문적인 편집 커뮤니티로 생산성 극대화</p>
              </div>
              <div className="text-center group animate-scale-in">
                <div className="w-20 h-20 gradient-accent rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-accent animate-float">
                  <Users className="w-10 h-10 text-accent-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-accent transition-colors">전문가 네트워킹</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">편집 전문가들과의 소통과 협업으로 성장</p>
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
