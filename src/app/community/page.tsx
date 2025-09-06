'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { mockPosts, mockUsers } from '@/lib/mockData'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  Eye,
  Heart,
  Clock,
  User
} from 'lucide-react'
import Link from 'next/link'

interface Post {
  id: string
  title: string
  content: string
  category: string
  author_id: string
  is_anonymous: boolean
  view_count: number
  like_count: number
  created_at: string
  profiles?: {
    full_name: string
    avatar_url: string
  }
}

const categories = [
  { value: 'general', label: '일반', color: 'bg-gray-500' },
  { value: 'question', label: '질문', color: 'bg-blue-500' },
  { value: 'share', label: '정보공유', color: 'bg-green-500' },
  { value: 'discussion', label: '토론', color: 'bg-purple-500' },
]

export default function CommunityPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadPosts()
  }, [selectedCategory])

  const loadPosts = async () => {
    try {
      // 개발 모드에서는 Mock 데이터 사용
      const isDevMode = process.env.NEXT_PUBLIC_IS_DEV_MODE === 'true'
      
      if (isDevMode) {
        // Mock 데이터 필터링
        let filteredPosts = [...mockPosts]
        
        // 카테고리 필터링
        if (selectedCategory !== 'all') {
          filteredPosts = filteredPosts.filter(post => post.category === selectedCategory)
        }
        
        // 시간순 정렬 (최신순)
        filteredPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        
        // Mock 데이터를 Supabase 형식으로 변환 (profiles 객체 추가)
        const transformedPosts = filteredPosts.map(post => ({
          ...post,
          profiles: post.is_anonymous ? undefined : {
            full_name: post.author_name,
            avatar_url: mockUsers.find(user => user.id === post.author_id)?.avatar_url || ''
          }
        }))
        
        setPosts(transformedPosts)
        setLoading(false)
        return
      }

      // 프로덕션 모드에서는 Supabase 사용
      const supabase = createClient()

      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })

      // 카테고리 필터링
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      const { data, error } = await query

      if (error) {
        console.error('게시글 로드 오류:', error)
        return
      }

      setPosts(data || [])
    } catch (error) {
      console.error('게시글 로드 중 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return '방금 전'
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <PageLayout>
        {/* 헤더 섹션 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              익명 게시판
            </h1>
            <p className="text-slate-600 mt-2">편집자들 간의 지식 공유와 토론 공간</p>
          </div>

          {user && (
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/community/write" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                글쓰기
              </Link>
            </Button>
          )}
        </div>

        {/* 검색 및 필터 섹션 */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="게시글 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 카테고리 필터 */}
            <div className="flex gap-2 overflow-x-auto">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                전체
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* 게시글 목록 */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              {searchQuery || selectedCategory !== 'all' ? '검색 결과가 없습니다' : '첫 번째 게시글을 작성해보세요'}
            </h3>
            <p className="text-slate-500">
              {searchQuery || selectedCategory !== 'all' ? '다른 검색어로 시도해보세요' : '커뮤니티에 첫 발자국을 남겨보세요'}
            </p>
            {user && !searchQuery && selectedCategory === 'all' && (
              <Button asChild className="mt-4">
                <Link href="/community/write">
                  <Plus className="w-4 h-4 mr-2" />
                  첫 게시글 작성하기
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow cursor-pointer h-fit">
                <CardContent className="p-4">
                  <Link href={`/community/${post.id}`} className="block">
                    {/* 카테고리와 익명 표시 */}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          categories.find(c => c.value === post.category)?.color || 'bg-gray-500'
                        } text-white`}
                      >
                        {categories.find(c => c.value === post.category)?.label || post.category}
                      </Badge>
                      {post.is_anonymous && (
                        <Badge variant="outline" className="text-xs">
                          익명
                        </Badge>
                      )}
                    </div>

                    {/* 제목 */}
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                      {post.title}
                    </h3>

                    {/* 내용 미리보기 */}
                    <p className="text-slate-600 mb-4 line-clamp-3 text-sm">
                      {post.content}
                    </p>

                    {/* 작성자 및 시간 */}
                    <div className="flex items-center space-x-2 mb-3">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={post.is_anonymous ? undefined : post.profiles?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {post.is_anonymous ? (
                            <User className="w-3 h-3" />
                          ) : (
                            post.profiles?.full_name?.charAt(0)?.toUpperCase() || '익'
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-xs text-slate-500">
                        <div>
                          {post.is_anonymous ? '익명' : (post.profiles?.full_name || '사용자')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(post.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* 메타 정보 */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.view_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {post.like_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        0
                      </span>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 페이지네이션 (나중에 구현) */}
        {filteredPosts.length > 0 && (
          <div className="flex justify-center mt-8">
            <div className="text-sm text-slate-500">
              총 {filteredPosts.length}개의 게시글
            </div>
          </div>
        )}
    </PageLayout>
  )
}
