'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AuthComponent from '@/components/Auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AuthPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // 이미 로그인된 사용자는 메인 페이지로 리디렉션
  useEffect(() => {
    if (user && !loading) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-500 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-slate-600 font-medium">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 이미 로그인된 사용자는 리디렉션 중이므로 아무것도 표시하지 않음
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-center mb-8">
          <Link href="/" className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>홈으로 돌아가기</span>
          </Link>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="max-w-md mx-auto space-y-8">
          {/* 웰컴 메시지 */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
              편집자 커뮤니티
            </h1>
            <p className="text-slate-600">
              전문 편집자들을 위한 플랫폼에 참여하세요
            </p>
          </div>

          {/* 인증 컴포넌트 */}
          <AuthComponent />

          {/* 추가 정보 */}
          <div className="text-center space-y-4">
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                편집자 커뮤니티에서 할 수 있는 것들
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
                <div className="text-center">
                  <div className="font-medium">💬 익명 게시판</div>
                  <div>자유로운 토론</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">💼 구인구직</div>
                  <div>일자리 연결</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">📄 문서 처리</div>
                  <div>효율적인 업무</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">🤖 AI 교정</div>
                  <div>스마트 교정</div>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              계속 진행하면{' '}
              <Link href="#" className="text-blue-600 hover:underline">
                이용약관
              </Link>
              {' '}및{' '}
              <Link href="#" className="text-blue-600 hover:underline">
                개인정보처리방침
              </Link>
              에 동의하는 것으로 간주됩니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
