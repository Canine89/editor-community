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
  Eye,
  Trash2,
  Edit,
  MessageSquare,
  User,
  Calendar,
  Hash
} from 'lucide-react'
import Link from 'next/link'

interface AdminPost {
  id: string
  title: string
  content: string
  category: string
  author_id: string
  author_name: string
  author_email: string
  is_anonymous: boolean
  view_count: number
  like_count: number
  comment_count: number
  created_at: string
}

const categories = [
  { value: 'general', label: '일반', color: 'bg-gray-500' },
  { value: 'question', label: '질문', color: 'bg-blue-500' },
  { value: 'share', label: '정보공유', color: 'bg-green-500' },
  { value: 'discussion', label: '토론', color: 'bg-purple-500' },
]

export default function AdminCommunityPage() {
  const { isAdmin, hasPermission, getAllPosts, deletePost, logActivity } = useAdmin()
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<AdminPost | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      loadPosts()
      logActivity('view_admin_posts')
    }
  }, [isAdmin])

  const loadPosts = async () => {
    try {
      const data = await getAllPosts()
      setPosts(data)
    } catch (error) {
      console.error('Failed to load posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePost = async (post: AdminPost) => {
    setSelectedPost(post)
    setDeleteDialogOpen(true)
  }

  const confirmDeletePost = async () => {
    if (!selectedPost) return

    setDeleting(true)
    try {
      const success = await deletePost(selectedPost.id)
      if (success) {
        setPosts(posts.filter(p => p.id !== selectedPost.id))
        setDeleteDialogOpen(false)
        setSelectedPost(null)
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryInfo = (category: string) => {
    return categories.find(c => c.value === category) || { label: category, color: 'bg-gray-500' }
  }

  const columns = [
    {
      key: 'title',
      label: '제목',
      sortable: true,
      render: (value: string, row: AdminPost) => (
        <div className="max-w-xs">
          <p className="font-medium text-slate-900 truncate">{value}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="secondary"
              className={`text-xs ${getCategoryInfo(row.category).color} text-white`}
            >
              {getCategoryInfo(row.category).label}
            </Badge>
            {row.is_anonymous && (
              <Badge variant="outline" className="text-xs">
                익명
              </Badge>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'author_name',
      label: '작성자',
      render: (value: string, row: AdminPost) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          <div>
            <p className="text-sm font-medium">
              {row.is_anonymous ? '익명' : (value || '사용자')}
            </p>
            {!row.is_anonymous && (
              <p className="text-xs text-slate-500">{row.author_email}</p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'view_count',
      label: '조회수',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-1">
          <Eye className="w-3 h-3 text-slate-500" />
          <span className="text-sm">{value}</span>
        </div>
      )
    },
    {
      key: 'like_count',
      label: '좋아요',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3 text-slate-500" />
          <span className="text-sm">{value}</span>
        </div>
      )
    },
    {
      key: 'comment_count',
      label: '댓글수',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-1">
          <Hash className="w-3 h-3 text-slate-500" />
          <span className="text-sm">{value}</span>
        </div>
      )
    },
    {
      key: 'created_at',
      label: '작성일',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-500" />
          <span className="text-sm">{formatDate(value)}</span>
        </div>
      )
    }
  ]

  const actions = [
    {
      label: '보기',
      icon: Eye,
      onClick: (row: AdminPost) => {
        window.open(`/community/${row.id}`, '_blank')
      },
      variant: 'ghost' as const
    },
    {
      label: '편집',
      icon: Edit,
      onClick: (row: AdminPost) => {
        window.open(`/community/${row.id}/edit`, '_blank')
      },
      variant: 'ghost' as const
    },
    ...(hasPermission('community_admin') || hasPermission('master') ? [{
      label: '삭제',
      icon: Trash2,
      onClick: handleDeletePost,
      variant: 'ghost' as const,
      className: 'text-red-600 hover:text-red-700'
    }] : [])
  ]

  const stats = {
    total: posts.length,
    byCategory: categories.map(cat => ({
      ...cat,
      count: posts.filter(p => p.category === cat.value).length
    })),
    anonymous: posts.filter(p => p.is_anonymous).length
  }

  return (
    <AdminLayout title="커뮤니티 관리" description="게시판 게시물 및 댓글 관리">
      <div className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 게시물</CardTitle>
              <MessageSquare className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">익명 게시물</CardTitle>
              <User className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.anonymous}</div>
              <p className="text-xs text-slate-600">
                전체의 {stats.total > 0 ? Math.round((stats.anonymous / stats.total) * 100) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">카테고리별 분포</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stats.byCategory.map((cat) => (
                  <Badge
                    key={cat.value}
                    variant="secondary"
                    className={`${cat.color} text-white`}
                  >
                    {cat.label}: {cat.count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Posts Table */}
        <DataTable
          title="게시물 목록"
          data={posts}
          columns={columns}
          actions={actions}
          loading={loading}
          searchPlaceholder="제목, 내용, 작성자 검색..."
          emptyMessage="등록된 게시물이 없습니다"
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>게시물 삭제</DialogTitle>
              <DialogDescription>
                정말로 이 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </DialogDescription>
            </DialogHeader>
            {selectedPost && (
              <div className="py-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="font-medium text-slate-900">{selectedPost.title}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    작성자: {selectedPost.is_anonymous ? '익명' : selectedPost.author_name}
                  </p>
                  <p className="text-sm text-slate-600">
                    작성일: {formatDate(selectedPost.created_at)}
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleting}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeletePost}
                disabled={deleting}
              >
                {deleting ? '삭제 중...' : '삭제'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}