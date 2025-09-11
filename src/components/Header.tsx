'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
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
  User,
  LogOut,
  Home,
  Shield,
  BarChart3,
  Edit3,
  Zap,
  Building
} from 'lucide-react'

export default function Header() {
  const { user, signOut } = useAuth()
  const { role, canAccessPremiumFeatures, canViewBookSales, canAccessAdminPages, loading } = useRole()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: '커뮤니티', href: '/community', icon: MessageSquare },
    { name: '구인구직', href: '/jobs', icon: Briefcase },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b glass-effect-warm shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* 브랜드 로고 */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-primary shadow-lg">
              <Edit3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gradient-editorial leading-tight">
                편집자 커뮤니티
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Editorial Community
              </span>
            </div>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-2 text-sm font-semibold text-foreground/80 hover:text-primary transition-all duration-200 hover:scale-105"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}


          </nav>

          {/* 사용자 메뉴 */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* 웰컴 메시지 */}
                <div className="hidden md:flex items-center space-x-4 mr-4">
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2 mb-1">
                      <p className="text-sm font-semibold text-foreground">
                        환영합니다!
                      </p>
                      {!loading && (
                        <Badge 
                          variant="outline"
                          className={
                            role === 'master' 
                              ? 'border-destructive bg-destructive/10 text-destructive font-semibold' 
                            : role === 'employee'
                              ? 'border-primary bg-primary/10 text-primary font-semibold'
                            : role === 'premium'
                              ? 'gradient-accent text-accent-foreground font-semibold border-0'
                              : 'border-muted-foreground/30 bg-muted text-muted-foreground font-semibold'
                          }
                        >
                          {role === 'master' ? (
                            <>
                              <Shield className="h-3 w-3 mr-1" />
                              MASTER
                            </>
                          ) : role === 'employee' ? (
                            <>
                              <Building className="h-3 w-3 mr-1" />
                              EMPLOYEE
                            </>
                          ) : role === 'premium' ? (
                            <>
                              <Crown className="h-3 w-3 mr-1" />
                              PREMIUM
                            </>
                          ) : (
                            <>
                              <Zap className="h-3 w-3 mr-1" />
                              USER
                            </>
                          )}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      {user.user_metadata?.full_name || user.email}
                    </p>
                  </div>
                </div>

                {/* 아바타 드롭다운 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-12 w-12 rounded-2xl hover:bg-brand-warm-50 hover:scale-105 transition-all duration-200">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="gradient-primary text-primary-foreground font-bold text-sm">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 rounded-2xl border-0 shadow-editorial backdrop-blur-md bg-card/95" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal p-4">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold leading-none text-foreground">
                            {user.user_metadata?.full_name || '사용자'}
                          </p>
                          {!loading && (
                            <Badge 
                              className={
                                role === 'master' 
                                  ? 'border-destructive bg-destructive/10 text-destructive font-semibold border' 
                                : role === 'employee'
                                  ? 'border-primary bg-primary/10 text-primary font-semibold border'
                                : role === 'premium'
                                  ? 'gradient-accent text-accent-foreground font-semibold border-0'
                                : 'border-muted-foreground/30 bg-muted text-muted-foreground font-semibold border'
                              }
                            >
                              {role === 'master' ? (
                                <>
                                  <Shield className="h-3 w-3 mr-1" />
                                  MASTER
                                </>
                              ) : role === 'employee' ? (
                                <>
                                  <Building className="h-3 w-3 mr-1" />
                                  EMPLOYEE
                                </>
                              ) : role === 'premium' ? (
                                <>
                                  <Crown className="h-3 w-3 mr-1" />
                                  PREMIUM
                                </>
                              ) : (
                                <>
                                  <Zap className="h-3 w-3 mr-1" />
                                  USER
                                </>
                              )}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs leading-none text-muted-foreground font-medium">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center p-3 rounded-xl hover:bg-brand-warm-50 transition-colors font-medium">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 mr-3">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span>프로필</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/" className="flex items-center p-3 rounded-xl hover:bg-brand-warm-50 transition-colors font-medium">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 mr-3">
                          <Home className="h-4 w-4 text-primary" />
                        </div>
                        <span>홈</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    {/* 관리자 메뉴 */}
                    {canAccessAdminPages && (
                      <>
                        <DropdownMenuSeparator className="bg-border/50" />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center justify-between p-3 rounded-xl hover:bg-destructive/5 transition-colors font-medium text-destructive">
                            <div className="flex items-center">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 mr-3">
                                <Shield className="h-4 w-4 text-destructive" />
                              </div>
                              <span>관리자 메뉴</span>
                            </div>
                            <Badge variant="destructive" className="text-xs font-semibold">ADMIN</Badge>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {/* 골든래빗 임직원 전용 메뉴 */}
                    {canViewBookSales && (
                      <>
                        <DropdownMenuSeparator className="bg-border/50" />
                        <DropdownMenuItem asChild>
                          <Link href="/admin/book-sales" className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 transition-colors font-medium text-primary">
                            <div className="flex items-center">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 mr-3">
                                <BarChart3 className="h-4 w-4 text-primary" />
                              </div>
                              <span>도서 판매 데이터</span>
                            </div>
                            <Badge className="gradient-primary text-primary-foreground text-xs font-semibold">
                              <Building className="h-3 w-3 mr-1" />
                              GR
                            </Badge>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem onClick={signOut} className="p-3 rounded-xl hover:bg-destructive/5 transition-colors font-medium text-destructive">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 mr-3">
                        <LogOut className="h-4 w-4 text-destructive" />
                      </div>
                      <span>로그아웃</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Button variant="ghost" className="font-semibold hover:bg-brand-warm-50 rounded-xl px-4 py-2 transition-all duration-200" asChild>
                  <Link href="/auth">로그인</Link>
                </Button>
                <Button className="btn-primary font-semibold px-6 py-2 shadow-lg hover:shadow-xl" asChild>
                  <Link href="/auth">시작하기</Link>
                </Button>
              </div>
            )}

            {/* 모바일 메뉴 */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-12 w-12 rounded-2xl hover:bg-brand-warm-50 hover:scale-105 transition-all duration-200">
                  <Menu className="h-5 w-5 text-foreground" />
                  <span className="sr-only">메뉴 열기</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-gradient-bg-editorial border-0 shadow-editorial">
                <div className="flex flex-col space-y-3 mt-6">
                  <Link
                    href="/"
                    className="flex items-center space-x-3 px-4 py-3 rounded-2xl hover:bg-brand-warm-50 transition-colors font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Home className="h-4 w-4 text-primary" />
                    </div>
                    <span>홈</span>
                  </Link>

                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center space-x-3 px-4 py-3 rounded-2xl hover:bg-brand-warm-50 transition-colors font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span>{item.name}</span>
                    </Link>
                  ))}



                  {user && (
                    <>
                      {/* 모바일용 웰컴 메시지 */}
                      <div className="border-t border-border/50 pt-4 mt-4 px-4">
                        <div className="flex items-center space-x-4 mb-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={user.user_metadata?.avatar_url} />
                            <AvatarFallback className="gradient-primary text-primary-foreground font-bold">
                              {user.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-foreground">
                                환영합니다!
                              </p>
                              {!loading && (
                                <Badge 
                                  className={
                                    role === 'master' 
                                      ? 'border-destructive bg-destructive/10 text-destructive font-semibold border text-xs' 
                                    : role === 'employee'
                                      ? 'border-primary bg-primary/10 text-primary font-semibold border text-xs'
                                    : role === 'premium'
                                      ? 'gradient-accent text-accent-foreground font-semibold border-0 text-xs'
                                    : 'border-muted-foreground/30 bg-muted text-muted-foreground font-semibold border text-xs'
                                  }
                                >
                                  {role === 'master' ? 'MASTER' : role === 'employee' ? 'EMPLOYEE' : role === 'premium' ? 'PRO' : 'USER'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                              {user.user_metadata?.full_name || user.email}
                            </p>
                          </div>
                        </div>

                        {/* 관리자 메뉴 (모바일) */}
                        {canAccessAdminPages && (
                          <Link
                            href="/admin"
                            className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-destructive/5 transition-colors font-medium text-destructive mb-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                                <Shield className="h-4 w-4 text-destructive" />
                              </div>
                              <span>관리자 메뉴</span>
                            </div>
                            <Badge variant="destructive" className="text-xs font-semibold">ADMIN</Badge>
                          </Link>
                        )}

                        {/* 골든래빗 임직원 전용 메뉴 (모바일) */}
                        {canViewBookSales && (
                          <Link
                            href="/admin/book-sales"
                            className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-primary/5 transition-colors font-medium text-primary mb-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                <BarChart3 className="h-4 w-4 text-primary" />
                              </div>
                              <span>도서 판매 데이터</span>
                            </div>
                            <Badge className="gradient-primary text-primary-foreground text-xs font-semibold">
                              <Building className="h-3 w-3 mr-1" />
                              GR
                            </Badge>
                          </Link>
                        )}

                        {/* 로그아웃 (모바일) */}
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false)
                            signOut()
                          }}
                          className="flex items-center space-x-3 px-4 py-3 rounded-2xl hover:bg-destructive/5 transition-colors font-medium text-destructive w-full text-left"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                            <LogOut className="h-4 w-4 text-destructive" />
                          </div>
                          <span>로그아웃</span>
                        </button>
                      </div>
                    </>
                  )}

                  {!user && (
                    <>
                      <div className="border-t border-border/50 pt-4 mt-4 px-4">
                        <Link
                          href="/auth"
                          className="flex items-center justify-center px-4 py-3 rounded-2xl hover:bg-brand-warm-50 transition-colors font-semibold mb-3"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <span>로그인</span>
                        </Link>
                        <Link
                          href="/auth"
                          className="flex items-center justify-center px-4 py-3 rounded-2xl btn-primary font-semibold shadow-lg"
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
