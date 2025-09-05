'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAdmin } from '@/hooks/useAdmin'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Crown, 
  Zap, 
  Shield, 
  Search, 
  User, 
  Calendar,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  membership_tier: 'free' | 'premium'
  created_at: string
  updated_at: string
}

interface MembershipHistory {
  id: string
  user_id: string
  from_tier: 'free' | 'premium' | null
  to_tier: 'free' | 'premium'
  reason: string | null
  created_at: string
  user_email?: string
}

export default function MembershipManagePage() {
  const { user } = useAuth()
  const { canAccessAdminPages } = useAdmin()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [history, setHistory] = useState<MembershipHistory[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTier, setFilterTier] = useState<'all' | 'free' | 'premium'>('all')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const supabase = createClient()

  // 관리자 권한 체크
  useEffect(() => {
    if (!user || !canAccessAdminPages()) {
      // 권한이 없으면 리다이렉트는 여기서 하지 않고, 컴포넌트 렌더링에서 처리
      return
    }
    
    loadUsers()
    loadHistory()
  }, [user, canAccessAdminPages])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, membership_tier, created_at, updated_at')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('사용자 목록 로드 오류:', error)
      setMessage({ type: 'error', text: '사용자 목록을 불러오는데 실패했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('membership_history')
        .select(`
          id, user_id, from_tier, to_tier, reason, created_at,
          profiles!membership_history_user_id_fkey(email)
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      
      const historyWithEmail = data?.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        from_tier: item.from_tier,
        to_tier: item.to_tier,
        reason: item.reason,
        created_at: item.created_at,
        user_email: item.profiles?.email
      })) || []
      
      setHistory(historyWithEmail)
    } catch (error) {
      console.error('히스토리 로드 오류:', error)
    }
  }

  const updateMembershipTier = async (userId: string, newTier: 'free' | 'premium') => {
    if (!user) return

    setUpdating(userId)
    setMessage(null)

    try {
      const { error } = await (supabase as any).rpc('update_membership_tier', {
        user_uuid: userId,
        new_tier: newTier,
        reason: `관리자(${user.email})에 의한 수동 변경`
      })

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: `회원 등급이 ${newTier === 'premium' ? '프리미엄' : '무료'}로 변경되었습니다.` 
      })
      
      // 데이터 새로고침
      await Promise.all([loadUsers(), loadHistory()])
    } catch (error) {
      console.error('회원 등급 변경 오류:', error)
      setMessage({ type: 'error', text: '회원 등급 변경에 실패했습니다.' })
    } finally {
      setUpdating(null)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTier = filterTier === 'all' || user.membership_tier === filterTier
    
    return matchesSearch && matchesTier
  })

  // 권한 체크
  if (!user || !canAccessAdminPages()) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>접근 권한 없음</CardTitle>
            <CardDescription>
              관리자만 접근할 수 있는 페이지입니다.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Crown className="w-6 h-6 text-amber-600" />
              회원 등급 관리
            </h1>
            <p className="text-slate-600">사용자의 회원 등급을 관리하고 히스토리를 확인하세요</p>
          </div>
        </div>

        {/* 알림 메시지 */}
        {message && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            {message.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 사용자 목록 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 필터 및 검색 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">사용자 목록</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">사용자 검색</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="search"
                        placeholder="이메일 또는 이름으로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="filter">등급 필터</Label>
                    <Select value={filterTier} onValueChange={(value: 'all' | 'free' | 'premium') => setFilterTier(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="free">무료</SelectItem>
                        <SelectItem value="premium">프리미엄</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 사용자 목록 */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    {searchTerm || filterTier !== 'all' ? '검색 결과가 없습니다.' : '사용자가 없습니다.'}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredUsers.map((userProfile) => (
                      <div key={userProfile.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-slate-900">
                                  {userProfile.full_name || '이름 없음'}
                                </p>
                                <Badge 
                                  variant={userProfile.membership_tier === 'premium' ? 'default' : 'secondary'}
                                  className={userProfile.membership_tier === 'premium' 
                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs' 
                                    : 'text-xs'
                                  }
                                >
                                  {userProfile.membership_tier === 'premium' ? (
                                    <>
                                      <Crown className="h-3 w-3 mr-1" />
                                      PREMIUM
                                    </>
                                  ) : (
                                    <>
                                      <Zap className="h-3 w-3 mr-1" />
                                      FREE
                                    </>
                                  )}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600">{userProfile.email}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateMembershipTier(userProfile.id, 'free')}
                              disabled={userProfile.membership_tier === 'free' || updating === userProfile.id}
                            >
                              무료로 변경
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateMembershipTier(userProfile.id, 'premium')}
                              disabled={userProfile.membership_tier === 'premium' || updating === userProfile.id}
                              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                            >
                              {updating === userProfile.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <>
                                  <Crown className="w-4 h-4 mr-1" />
                                  프리미엄
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 회원 등급 변경 히스토리 */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  최근 변경 히스토리
                </CardTitle>
                <CardDescription>
                  최근 20건의 등급 변경 내역
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 max-h-96 overflow-y-auto">
                {history.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    변경 히스토리가 없습니다.
                  </div>
                ) : (
                  <div className="divide-y">
                    {history.map((item) => (
                      <div key={item.id} className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-slate-900">
                            {item.user_email}
                          </p>
                          <div className="flex items-center gap-1 text-xs">
                            {item.from_tier && (
                              <Badge variant="outline" className="text-xs">
                                {item.from_tier === 'premium' ? 'PREMIUM' : 'FREE'}
                              </Badge>
                            )}
                            <span>→</span>
                            <Badge 
                              variant={item.to_tier === 'premium' ? 'default' : 'secondary'}
                              className={item.to_tier === 'premium' 
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs' 
                                : 'text-xs'
                              }
                            >
                              {item.to_tier === 'premium' ? 'PREMIUM' : 'FREE'}
                            </Badge>
                          </div>
                        </div>
                        {item.reason && (
                          <p className="text-xs text-slate-600 mb-1">{item.reason}</p>
                        )}
                        <p className="text-xs text-slate-400">
                          {new Date(item.created_at).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}