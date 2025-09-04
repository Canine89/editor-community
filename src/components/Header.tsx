'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAdmin } from '@/hooks/useAdmin'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Menu,
  MessageSquare,
  Briefcase,
  Wrench,
  User,
  LogOut,
  Home,
  Sparkles,
  PenTool,
  FileText,
  ChevronDown,
  Shield,
  BarChart3
} from 'lucide-react'

export default function Header() {
  const { user, signOut } = useAuth()
  const { canAccessAdminPages, canViewBookSales, isEmployee, isMaster } = useAdmin()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: '커뮤니티', href: '/community', icon: MessageSquare },
    { name: '구인구직', href: '/jobs', icon: Briefcase },
  ]

  const tools = [
    { name: 'PDF 워터마크', href: '/tools/pdf-watermark', icon: PenTool },
    { name: 'PDF 추출기', href: '/tools/pdf-extractor', icon: FileText },
    { name: '워드 교정 도구', href: '/tools/word-corrector', icon: FileText },
    { name: 'PDF 맞춤법 검사기', href: '/tools/pdf-spell-checker', icon: FileText },
    ...(canViewBookSales() ? [{ name: '도서 판매 데이터', href: '/admin/book-sales', icon: BarChart3 }] : []),
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* 로고 */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              편집자 커뮤니티
            </span>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-1 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}

            {/* 유틸리티 드롭다운 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-1 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <Wrench className="h-4 w-4" />
                  <span>유틸리티</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {tools.map((tool) => (
                  <DropdownMenuItem key={tool.name} asChild>
                    <Link href={tool.href} className="flex items-center">
                      <tool.icon className="mr-2 h-4 w-4" />
                      <span>{tool.name}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 관리자 메뉴 */}
            {canAccessAdminPages() && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    <Shield className="h-4 w-4" />
                    <span>관리자</span>
                    <Badge variant="destructive" className="text-xs ml-1">ADMIN</Badge>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>대시보드</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/community" className="flex items-center">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span>커뮤니티 관리</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/jobs" className="flex items-center">
                      <Briefcase className="mr-2 h-4 w-4" />
                      <span>구인구직 관리</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/users" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>사용자 관리</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          {/* 사용자 메뉴 */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* 웰컴 메시지 */}
                <div className="hidden md:flex items-center space-x-3 mr-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">
                      환영합니다!
                    </p>
                    <p className="text-xs text-slate-600">
                      {user.user_metadata?.full_name || user.email}
                    </p>
                  </div>
                </div>

                {/* 아바타 드롭다운 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-slate-100">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.user_metadata?.full_name || '사용자'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>프로필</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/" className="flex items-center">
                        <Home className="mr-2 h-4 w-4" />
                        <span>홈</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>로그아웃</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth">로그인</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth">시작하기</Link>
                </Button>
              </div>
            )}

            {/* 모바일 메뉴 */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">메뉴 열기</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-6">
                  <Link
                    href="/"
                    className="flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-accent"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Home className="h-4 w-4" />
                    <span>홈</span>
                  </Link>

                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-accent"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  ))}

                  {/* 모바일 유틸리티 메뉴 */}
                  <div className="border-t pt-2 mt-2">
                    <p className="text-xs font-medium text-slate-500 px-2 mb-2">유틸리티 도구</p>
                    {tools.map((tool) => (
                      <Link
                        key={tool.name}
                        href={tool.href}
                        className="flex items-center space-x-2 px-2 py-2 rounded-lg hover:bg-accent"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <tool.icon className="h-4 w-4" />
                        <span>{tool.name}</span>
                      </Link>
                    ))}
                  </div>

                  {/* 모바일 관리자 메뉴 */}
                  {canAccessAdminPages() && (
                    <div className="border-t pt-2 mt-2">
                      <p className="text-xs font-medium text-red-500 px-2 mb-2 flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        관리자 메뉴
                        <Badge variant="destructive" className="text-xs">ADMIN</Badge>
                      </p>
                      <Link
                        href="/admin"
                        className="flex items-center space-x-2 px-2 py-2 rounded-lg hover:bg-accent"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Shield className="h-4 w-4" />
                        <span>대시보드</span>
                      </Link>
                      <Link
                        href="/admin/community"
                        className="flex items-center space-x-2 px-2 py-2 rounded-lg hover:bg-accent"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>커뮤니티 관리</span>
                      </Link>
                      <Link
                        href="/admin/jobs"
                        className="flex items-center space-x-2 px-2 py-2 rounded-lg hover:bg-accent"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Briefcase className="h-4 w-4" />
                        <span>구인구직 관리</span>
                      </Link>
                      <Link
                        href="/admin/users"
                        className="flex items-center space-x-2 px-2 py-2 rounded-lg hover:bg-accent"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        <span>사용자 관리</span>
                      </Link>
                    </div>
                  )}

                  {user && (
                    <>
                      {/* 모바일용 웰컴 메시지 */}
                      <div className="border-t pt-4 mt-4 px-2">
                        <div className="flex items-center space-x-3 mb-4">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.user_metadata?.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                              {user.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              환영합니다!
                            </p>
                            <p className="text-xs text-slate-600">
                              {user.user_metadata?.full_name || user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {!user && (
                    <>
                      <div className="border-t pt-4 mt-4">
                        <Link
                          href="/auth"
                          className="flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-accent"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <span>로그인</span>
                        </Link>
                        <Link
                          href="/auth"
                          className="flex items-center space-x-2 px-2 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <span>시작하기</span>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
