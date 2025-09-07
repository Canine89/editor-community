'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MessageSquare, Users, FileText, User, LogOut, Settings, Shield } from 'lucide-react'

// 동적 import로 supabase 관련 코드를 클라이언트 사이드에서만 로드
export function Navigation() {
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // 클라이언트 사이드에서만 인증 상태 확인
    const initAuth = async () => {
      try {
        const { supabase } = await import('@/lib/supabase/client')

        // 현재 세션 확인
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          setIsAuthenticated(true)
          
          // 관리자 권한 확인
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('user_role')
              .eq('id', session.user.id)
              .single()
            
            const { data: permissions } = await supabase
              .from('admin_permissions')
              .select('*')
              .eq('user_id', session.user.id)
              .eq('is_active', true)
            
            const hasMasterRole = profile?.user_role === 'master'
            const hasAdminPermission = permissions && permissions.length > 0
            setIsAdmin(hasMasterRole || hasAdminPermission)
          } catch (error) {
            setIsAdmin(false)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error('Auth initialization failed:', error)
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const handleSignOut = async () => {
    try {
      const { supabase } = await import('@/lib/supabase/client')
      await supabase.auth.signOut()
      setUser(null)
      setIsAuthenticated(false)
      setIsAdmin(false)
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  return (
    <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-900/95 dark:supports-[backdrop-filter]:bg-slate-900/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* 로고 */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
              <span className="text-sm font-bold text-white">편집</span>
            </div>
            <span className="font-bold text-xl">커뮤니티</span>
          </Link>

          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/community"
              className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <MessageSquare className="w-4 h-4" />
              <span>커뮤니티</span>
            </Link>
            <Link
              href="/jobs"
              className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <Users className="w-4 h-4" />
              <span>구인구직</span>
            </Link>
            <Link
              href="/utils"
              className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <FileText className="w-4 h-4" />
              <span>유틸리티</span>
            </Link>
          </div>

          {/* 사용자 메뉴 */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {user?.email?.split('@')[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      프로필
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      설정
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        관리자 메뉴
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">로그인</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/signup">회원가입</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 모바일 메뉴 */}
        <div className="md:hidden pb-4">
          <div className="flex justify-around">
            <Link
              href="/community"
              className="flex flex-col items-center space-y-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs">커뮤니티</span>
            </Link>
            <Link
              href="/jobs"
              className="flex flex-col items-center space-y-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">구인구직</span>
            </Link>
            <Link
              href="/utils"
              className="flex flex-col items-center space-y-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <FileText className="w-5 h-5" />
              <span className="text-xs">유틸리티</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
