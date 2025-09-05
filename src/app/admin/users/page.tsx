'use client'

import { useState, useEffect } from 'react'
import { useRole, UserRole, logAdminActivity } from '@/hooks/useRole'
import { createClient } from '@/lib/supabase'
import AdminLayout from '@/components/admin/AdminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  Shield,
  Calendar,
  Mail,
  User,
  Crown,
  Building,
  Edit3,
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  full_name: string
  avatar_url: string
  created_at: string
  last_sign_in_at: string
  user_role: UserRole
}

const roleTypes = [
  { 
    value: 'user' as UserRole, 
    label: '일반 사용자', 
    color: 'bg-slate-500',
    icon: User,
    description: '기본 기능만 사용 가능'
  },
  { 
    value: 'premium' as UserRole, 
    label: '프리미엄 사용자', 
    color: 'bg-amber-500',
    icon: Crown,
    description: '프리미엄 기능 사용 가능'
  },
  { 
    value: 'employee' as UserRole, 
    label: '골든래빗 임직원', 
    color: 'bg-orange-500',
    icon: Building,
    description: '프리미엄 + 도서 데이터 접근'
  },
  { 
    value: 'master' as UserRole, 
    label: '마스터 관리자', 
    color: 'bg-red-500',
    icon: Shield,
    description: '모든 기능 + 관리자 권한'
  },
]

export default function AdminUsersPage() {
  const { canAccessAdminPages } = useRole()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole>('user')
  const [processing, setProcessing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    if (canAccessAdminPages) {
      loadUsers()
      logAdminActivity('view_admin_users')
    }
  }, [canAccessAdminPages])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, created_at, last_sign_in_at, user_role')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('사용자 조회 실패:', error)
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error('사용자 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (user: AdminUser) => {
    setSelectedUser(user)
    setSelectedNewRole(user.user_role)
    setRoleDialogOpen(true)
  }

  const updateUserRole = async () => {
    if (!selectedUser || selectedUser.user_role === selectedNewRole) {
      setRoleDialogOpen(false)
      return
    }

    setProcessing(true)
    setMessage(null)

    try {
      const { error } = await (supabase as any).rpc('update_user_role', {
        user_uuid: selectedUser.id,
        new_role: selectedNewRole,
        reason: `관리자에 의한 역할 변경: ${selectedUser.user_role} → ${selectedNewRole}`
      })

      if (error) throw error

      const roleInfo = roleTypes.find(r => r.value === selectedNewRole)
      setMessage({ 
        type: 'success', 
        text: `${selectedUser.email}의 역할이 "${roleInfo?.label}"로 변경되었습니다.` 
      })
      
      await logAdminActivity('change_user_role', 'user', selectedUser.id, {
        from_role: selectedUser.user_role,
        to_role: selectedNewRole
      })
      
      // 데이터 새로고침
      await loadUsers()
    } catch (error) {
      console.error('역할 변경 오류:', error)
      setMessage({ type: 'error', text: '역할 변경에 실패했습니다.' })
    } finally {
      setProcessing(false)
      setRoleDialogOpen(false)
    }
  }

  const getRoleInfo = (role: UserRole) => {
    return roleTypes.find(r => r.value === role) || roleTypes[0]
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === 'all' || user.user_role === filterRole
    
    return matchesSearch && matchesRole
  })

  // 권한 체크
  if (!canAccessAdminPages) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>접근 권한 없음</CardTitle>
            <CardDescription>
              마스터 관리자만 접근할 수 있는 페이지입니다.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <AdminLayout title="사용자 및 역할 관리">
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            사용자 및 역할 관리
          </h1>
          <p className="text-slate-600">모든 사용자의 역할을 통합 관리하세요</p>
        </div>

        {/* 알림 메시지 */}
        {message && (
          <Alert className={`${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
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
                <Label htmlFor="filter">역할 필터</Label>
                <Select value={filterRole} onValueChange={(value: UserRole | 'all') => setFilterRole(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {roleTypes.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
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
                {searchTerm || filterRole !== 'all' ? '검색 결과가 없습니다.' : '사용자가 없습니다.'}
              </div>
            ) : (
              <div className="divide-y">
                {filteredUsers.map((user) => {
                  const roleInfo = getRoleInfo(user.user_role)
                  const RoleIcon = roleInfo.icon

                  return (
                    <div key={user.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-slate-900">
                                {user.full_name || '이름 없음'}
                              </p>
                              <Badge 
                                variant="outline"
                                className={`text-white text-xs ${roleInfo.color}`}
                              >
                                <RoleIcon className="h-3 w-3 mr-1" />
                                {roleInfo.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600">{user.email}</p>
                            <p className="text-xs text-slate-500">
                              가입일: {new Date(user.created_at).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRoleChange(user)}
                            className="flex items-center gap-1"
                          >
                            <Edit3 className="w-4 h-4" />
                            역할 변경
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 역할 변경 다이얼로그 */}
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>사용자 역할 변경</DialogTitle>
              <DialogDescription>
                {selectedUser?.email}의 역할을 변경합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="role-select">새로운 역할</Label>
                <Select value={selectedNewRole} onValueChange={(value: UserRole) => setSelectedNewRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleTypes.map((role) => {
                      const RoleIcon = role.icon
                      return (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex items-center gap-2">
                            <RoleIcon className="h-4 w-4" />
                            <span>{role.label}</span>
                            <span className="text-xs text-slate-500">- {role.description}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRoleDialogOpen(false)}
                disabled={processing}
              >
                취소
              </Button>
              <Button
                onClick={updateUserRole}
                disabled={processing || selectedUser?.user_role === selectedNewRole}
              >
                {processing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : null}
                역할 변경
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}