'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRole, UserRole } from '@/hooks/useRole'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LogIn, Crown, Sparkles, Shield, Users, Building } from 'lucide-react'
import Link from 'next/link'

interface AuthRequiredProps {
  children: ReactNode
  requireAuth?: boolean
  requireRole?: UserRole
  featureName?: string
  fallbackMessage?: string
}

export function AuthRequired({
  children,
  requireAuth = true,
  requireRole,
  featureName = '이 기능',
  fallbackMessage
}: AuthRequiredProps) {
  const { user } = useAuth()
  const { role, isAtLeast, loading } = useRole()

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

  // 특정 역할이 필요한 경우
  if (requireRole && !isAtLeast(requireRole)) {
    const getRoleInfo = (role: UserRole) => {
      switch (role) {
        case 'premium':
          return {
            name: '프리미엄 회원',
            icon: Crown,
            color: 'from-amber-500 to-yellow-500',
            bgColor: 'from-amber-100 to-amber-200',
            iconColor: 'text-amber-600',
            benefits: [
              'AI 맞춤법 검사기 무제한 사용',
              'PDF 교정 도구 고급 기능', 
              '워드 자동 교정 시스템',
              '우선 고객 지원'
            ]
          }
        case 'employee':
          return {
            name: '골든래빗 임직원',
            icon: Building,
            color: 'from-orange-500 to-red-500',
            bgColor: 'from-orange-100 to-orange-200',
            iconColor: 'text-orange-600',
            benefits: [
              '모든 프리미엄 기능',
              '도서 판매 데이터 접근',
              '내부 분석 도구 사용',
              '임직원 전용 기능'
            ]
          }
        case 'master':
          return {
            name: '마스터 관리자',
            icon: Shield,
            color: 'from-red-500 to-pink-500',
            bgColor: 'from-red-100 to-red-200',
            iconColor: 'text-red-600',
            benefits: [
              '모든 기능 접근',
              '관리자 페이지 접근',
              '사용자 역할 관리',
              '시스템 전체 제어'
            ]
          }
        default:
          return {
            name: '일반 사용자',
            icon: Users,
            color: 'from-blue-500 to-purple-500',
            bgColor: 'from-blue-100 to-blue-200',
            iconColor: 'text-blue-600',
            benefits: ['기본 기능 사용']
          }
      }
    }

    const requiredRoleInfo = getRoleInfo(requireRole)
    const currentRoleInfo = getRoleInfo(role)
    const RequiredIcon = requiredRoleInfo.icon

    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <div className={`mx-auto w-12 h-12 bg-gradient-to-br ${requiredRoleInfo.bgColor} rounded-full flex items-center justify-center mb-4`}>
              <RequiredIcon className={`h-6 w-6 ${requiredRoleInfo.iconColor}`} />
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              {requiredRoleInfo.name} 전용 기능
              <Badge variant="secondary" className={`bg-gradient-to-r ${requiredRoleInfo.color} text-white`}>
                <RequiredIcon className="h-3 w-3 mr-1" />
                {requireRole.toUpperCase()}
              </Badge>
            </CardTitle>
            <CardDescription>
              {fallbackMessage || `${featureName}는 ${requiredRoleInfo.name} 이상만 사용할 수 있습니다.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-slate-500" />
                <span className="font-semibold text-slate-700">현재 역할</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {currentRoleInfo.name}
              </Badge>
            </div>
            <div className="text-left space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-1">
                <RequiredIcon className={`h-4 w-4 ${requiredRoleInfo.iconColor}`} />
                {requiredRoleInfo.name} 혜택
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {requiredRoleInfo.benefits.map((benefit, index) => (
                  <li key={index}>• {benefit}</li>
                ))}
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button disabled className="w-full">
              <RequiredIcon className="mr-2 h-4 w-4" />
              역할 업그레이드 (관리자 문의)
            </Button>
            <p className="text-xs text-muted-foreground">
              역할 변경은 관리자에게 문의하세요
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // 조건을 모두 만족하면 자식 컴포넌트 렌더링
  return <>{children}</>
}