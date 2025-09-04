'use client'

import { useState, useEffect } from 'react'
import { useAdmin } from '@/hooks/useAdmin'
import AdminLayout from '@/components/admin/AdminLayout'
import DataTable from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Shield,
  Plus,
  Minus,
  Calendar,
  Mail,
  User,
  Crown
} from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  full_name: string
  avatar_url: string
  created_at: string
  last_sign_in_at: string
  permissions: Array<{
    id: string
    permission_type: 'master' | 'community_admin' | 'jobs_admin' | 'users_admin'
    granted_at: string
  }>
}

const permissionTypes = [
  { value: 'community_admin', label: '커뮤니티 관리자', color: 'bg-blue-500' },
  { value: 'jobs_admin', label: '구인구직 관리자', color: 'bg-green-500' },
  { value: 'users_admin', label: '사용자 관리자', color: 'bg-purple-500' },
  { value: 'master', label: '마스터 관리자', color: 'bg-red-500' },
]

export default function AdminUsersPage() {
  const { isAdmin, isMaster, getAllUsers, grantPermission, revokePermission, logActivity } = useAdmin()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false)
  const [permissionAction, setPermissionAction] = useState<'grant' | 'revoke'>('grant')
  const [selectedPermissionType, setSelectedPermissionType] = useState<string>('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
      logActivity('view_admin_users')
    }
  }, [isAdmin])

  const loadUsers = async () => {
    try {
      const data = await getAllUsers()
      setUsers(data)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGrantPermission = (user: AdminUser) => {
    setSelectedUser(user)
    setPermissionAction('grant')
    setSelectedPermissionType('')
    setPermissionDialogOpen(true)
  }

  const handleRevokePermission = (user: AdminUser, permissionType: string) => {
    setSelectedUser(user)
    setPermissionAction('revoke')
    setSelectedPermissionType(permissionType)
    setPermissionDialogOpen(true)
  }

  const confirmPermissionAction = async () => {
    if (!selectedUser || !selectedPermissionType) return

    setProcessing(true)
    try {
      let success = false
      if (permissionAction === 'grant') {
        success = await grantPermission(selectedUser.id, selectedPermissionType as any)
      } else {
        success = await revokePermission(selectedUser.id, selectedPermissionType as any)
      }

      if (success) {
        await loadUsers() // Reload to get updated permissions
        setPermissionDialogOpen(false)
        setSelectedUser(null)
        setSelectedPermissionType('')
      }
    } catch (error) {
      console.error('Failed to manage permission:', error)
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '없음'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPermissionInfo = (type: string) => {
    return permissionTypes.find(p => p.value === type) || { label: type, color: 'bg-gray-500' }
  }

  const getAvailablePermissions = (user: AdminUser) => {
    const userPermissions = user.permissions.map(p => p.permission_type)
    return permissionTypes.filter(p => !userPermissions.includes(p.value as any))
  }

  const columns = [
    {
      key: 'email',
      label: '사용자',
      sortable: true,
      render: (value: string, row: AdminUser) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.full_name || '이름 없음'}</p>
            <p className="text-xs text-slate-500">{value}</p>
          </div>
        </div>
      )
    },
    {
      key: 'permissions',
      label: '권한',
      render: (value: AdminUser['permissions'], row: AdminUser) => (
        <div className="flex flex-wrap gap-1">
          {value.length === 0 ? (
            <Badge variant="outline" className="text-xs">일반 사용자</Badge>
          ) : (
            value.map((perm) => (
              <Badge
                key={perm.id}
                variant="secondary"
                className={`text-xs ${getPermissionInfo(perm.permission_type).color} text-white`}
              >
                {perm.permission_type === 'master' && <Crown className="w-3 h-3 mr-1" />}
                {getPermissionInfo(perm.permission_type).label}
              </Badge>
            ))
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      label: '가입일',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-500" />
          <span className="text-sm">{formatDate(value)}</span>
        </div>
      )
    },
    {
      key: 'last_sign_in_at',
      label: '최근 로그인',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-500" />
          <span className="text-sm">{formatDate(value)}</span>
        </div>
      )
    }
  ]

  const actions = isMaster ? [
    {
      label: '권한 부여',
      icon: Plus,
      onClick: handleGrantPermission,
      variant: 'ghost' as const,
      className: 'text-green-600 hover:text-green-700'
    }
  ] : []

  const stats = {
    total: users.length,
    admins: users.filter(u => u.permissions.length > 0).length,
    masters: users.filter(u => u.permissions.some(p => p.permission_type === 'master')).length,
    regular: users.filter(u => u.permissions.length === 0).length
  }

  return (
    <AdminLayout title="사용자 관리" description="사용자 정보 및 관리자 권한 관리">
      <div className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
              <Users className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">관리자</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.admins}</div>
              <p className="text-xs text-slate-600">
                전체의 {stats.total > 0 ? Math.round((stats.admins / stats.total) * 100) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">마스터 관리자</CardTitle>
              <Crown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.masters}</div>
              <p className="text-xs text-slate-600">
                최고 권한 보유자
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">일반 사용자</CardTitle>
              <User className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.regular}</div>
              <p className="text-xs text-slate-600">
                관리자 권한 없음
              </p>
            </CardContent>
          </Card>
        </div>

        {!isMaster && (
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader>
              <CardTitle className="text-sm text-orange-800 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                권한 제한
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-700">
                사용자 권한 관리는 마스터 관리자만 수행할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <DataTable
          title="사용자 목록"
          data={users}
          columns={columns}
          actions={actions}
          loading={loading}
          searchPlaceholder="이름, 이메일 검색..."
          emptyMessage="등록된 사용자가 없습니다"
        />

        {/* Permission Management Dialog */}
        <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {permissionAction === 'grant' ? '권한 부여' : '권한 해제'}
              </DialogTitle>
              <DialogDescription>
                {permissionAction === 'grant' 
                  ? '사용자에게 관리자 권한을 부여합니다.'
                  : '사용자의 관리자 권한을 해제합니다.'
                }
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="py-4">
                <div className="bg-slate-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {selectedUser.full_name || '이름 없음'}
                      </p>
                      <p className="text-sm text-slate-600">{selectedUser.email}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-sm font-medium text-slate-700 mb-2">현재 권한:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedUser.permissions.length === 0 ? (
                        <Badge variant="outline" className="text-xs">일반 사용자</Badge>
                      ) : (
                        selectedUser.permissions.map((perm) => (
                          <div key={perm.id} className="flex items-center gap-1">
                            <Badge
                              variant="secondary"
                              className={`text-xs ${getPermissionInfo(perm.permission_type).color} text-white`}
                            >
                              {perm.permission_type === 'master' && <Crown className="w-3 h-3 mr-1" />}
                              {getPermissionInfo(perm.permission_type).label}
                            </Badge>
                            {permissionAction === 'grant' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                onClick={() => handleRevokePermission(selectedUser, perm.permission_type)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {permissionAction === 'grant' && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      부여할 권한 선택:
                    </label>
                    <Select value={selectedPermissionType} onValueChange={setSelectedPermissionType}>
                      <SelectTrigger>
                        <SelectValue placeholder="권한을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailablePermissions(selectedUser).map((permission) => (
                          <SelectItem key={permission.value} value={permission.value}>
                            <div className="flex items-center gap-2">
                              {permission.value === 'master' && <Crown className="w-4 h-4 text-red-500" />}
                              <span>{permission.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {permissionAction === 'revoke' && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>{getPermissionInfo(selectedPermissionType).label}</strong> 권한을 해제하시겠습니까?
                    </p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPermissionDialogOpen(false)}
                disabled={processing}
              >
                취소
              </Button>
              <Button
                onClick={confirmPermissionAction}
                disabled={processing || (permissionAction === 'grant' && !selectedPermissionType)}
                variant={permissionAction === 'revoke' ? "destructive" : "default"}
              >
                {processing ? '처리 중...' : (permissionAction === 'grant' ? '권한 부여' : '권한 해제')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}