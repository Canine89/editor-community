'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMembership } from '@/hooks/useMembership'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LogIn, Crown, Sparkles, Shield } from 'lucide-react'
import Link from 'next/link'

interface AuthRequiredProps {
  children: ReactNode
  requireAuth?: boolean
  requirePremium?: boolean
  featureName?: string
  fallbackMessage?: string
}

export function AuthRequired({
  children,
  requireAuth = true,
  requirePremium = false,
  featureName = '이 기능',
  fallbackMessage
}: AuthRequiredProps) {
  const { user } = useAuth()
  const { canAccessPremiumFeatures, tier, loading } = useMembership()

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // 로그인이 필요한 경우
  if (requireAuth && !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <LogIn className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>로그인이 필요합니다</CardTitle>
            <CardDescription>
              {fallbackMessage || `${featureName}를 사용하려면 구글 계정으로 로그인해주세요.`}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col space-y-2">
            <Button asChild className="w-full">
              <Link href="/auth">
                <LogIn className="mr-2 h-4 w-4" />
                구글로 로그인
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              구글 OAuth를 통해 안전하게 로그인하세요
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // 프리미엄 등급이 필요한 경우
  if (requirePremium && !canAccessPremiumFeatures) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mb-4">
              <Crown className="h-6 w-6 text-amber-600" />
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              프리미엄 전용 기능
              <Badge variant="secondary" className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white">
                <Crown className="h-3 w-3 mr-1" />
                PREMIUM
              </Badge>
            </CardTitle>
            <CardDescription>
              {fallbackMessage || `${featureName}는 프리미엄 회원 전용 기능입니다.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="font-semibold text-slate-700">현재 등급</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {tier === 'free' ? '무료 회원' : '프리미엄 회원'}
              </Badge>
            </div>
            <div className="text-left space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-1">
                <Shield className="h-4 w-4 text-green-500" />
                프리미엄 혜택
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• AI 맞춤법 검사기 무제한 사용</li>
                <li>• PDF 교정 도구 고급 기능</li>
                <li>• 워드 자동 교정 시스템</li>
                <li>• 우선 고객 지원</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button disabled className="w-full">
              <Crown className="mr-2 h-4 w-4" />
              프리미엄 업그레이드 (준비중)
            </Button>
            <p className="text-xs text-muted-foreground">
              결제 시스템은 곧 출시될 예정입니다
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // 조건을 모두 만족하면 자식 컴포넌트 렌더링
  return <>{children}</>
}