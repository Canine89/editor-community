'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRole, UserRole } from '@/hooks/useRole'
import { createClient } from '@/lib/supabase'
import { mockUsers } from '@/lib/mockData'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Mail, 
  Calendar,
  Crown, 
  Zap,
  ArrowLeft,
  Shield,
  Building
} from 'lucide-react'
import Link from 'next/link'
import { AuthRequired } from '@/components/auth/AuthRequired'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  user_role: UserRole
  created_at: string
  updated_at: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const { role, canAccessPremiumFeatures, loading: roleLoading } = useRole()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      
      // 개발 모드에서는 Mock 데이터 사용
      const isDevMode = process.env.NODE_ENV === 'development'
      
      if (isDevMode) {
        // Mock 사용자 데이터에서 현재 사용자 찾기
        const mockUser = mockUsers.find(u => u.id === user.id)
        
        if (mockUser) {
          const mockProfile: UserProfile = {
            id: mockUser.id,
            email: mockUser.email,
            full_name: mockUser.full_name,
            user_role: mockUser.user_role,
            created_at: mockUser.created_at,
            updated_at: mockUser.created_at // Mock에는 updated_at이 없으므로 created_at 사용
          }
          
          setProfile(mockProfile)
        }
        
        setLoading(false)
        return
      }

      // 프로덕션 모드에서는 Supabase 사용
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, user_role, created_at, updated_at')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('프로필 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || roleLoading) {
    return (
      <PageLayout className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </PageLayout>
    )
  }

  return (
    <AuthRequired>
      <PageLayout>
          {/* 헤더 */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <User className="w-6 h-6 text-blue-600" />
                내 프로필
              </h1>
              <p className="text-slate-600">계정 정보와 멤버십 현황을 확인하세요</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 기본 정보 */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    기본 정보
                  </CardTitle>
                  <CardDescription>
                    계정의 기본 정보입니다
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {profile?.full_name || '이름 없음'}
                      </h3>
                      <p className="text-slate-600">{profile?.email}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">이메일</span>
                      </div>
                      <span className="text-sm text-slate-900">{profile?.email}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">가입일</span>
                      </div>
                      <span className="text-sm text-slate-900">
                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ko-KR') : '-'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 역할 정보 */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    사용자 역할
                  </CardTitle>
                  <CardDescription>
                    현재 역할과 권한
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <Badge 
                      variant={role === 'user' ? 'secondary' : 'default'}
                      className={role !== 'user'
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-lg px-4 py-2' 
                        : 'text-lg px-4 py-2'
                      }
                    >
                      {role === 'master' ? (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          MASTER
                        </>
                      ) : role === 'employee' ? (
                        <>
                          <Building className="h-4 w-4 mr-2" />
                          EMPLOYEE
                        </>
                      ) : role === 'premium' ? (
                        <>
                          <Crown className="h-4 w-4 mr-2" />
                          PREMIUM
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          USER
                        </>
                      )}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900">현재 권한</h4>
                    {role === 'master' ? (
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          모든 프리미엄 기능 사용
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          도서 판매 데이터 접근
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          관리자 페이지 접근
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          사용자 역할 관리
                        </li>
                      </ul>
                    ) : role === 'employee' ? (
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          모든 프리미엄 기능 사용
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          도서 판매 데이터 접근
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                          <span className="line-through">관리자 페이지</span>
                        </li>
                      </ul>
                    ) : role === 'premium' ? (
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          PDF 추출기 무제한 사용
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          워드 교정 도구 이용
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          PDF 맞춤법 검사기 이용
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          우선 고객 지원
                        </li>
                      </ul>
                    ) : (
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          PDF 워터마크 도구
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          PDF 편집기 기본 기능
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                          <span className="line-through">프리미엄 기능</span>
                        </li>
                      </ul>
                    )}
                  </div>

                  {role === 'user' && (
                    <>
                      <Separator />
                      <div className="text-center">
                        <p className="text-sm text-slate-600 mb-3">
                          더 많은 기능을 원하시나요?
                        </p>
                        <p className="text-xs text-slate-500">
                          역할 업그레이드는 관리자에게 문의하세요
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 추가 정보 */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                계정 보안
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-slate-900">계정 상태</h4>
                  <p className="text-sm text-slate-600">계정이 정상적으로 활성화되어 있습니다</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  활성
                </Badge>
              </div>
            </CardContent>
          </Card>
      </PageLayout>
    </AuthRequired>
  )
}