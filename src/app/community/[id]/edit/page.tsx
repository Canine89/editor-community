'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

interface Post {
  id: string
  title: string
  content: string
  category: string
  is_anonymous: boolean
  author_id: string
  created_at: string
  updated_at: string
}

export default function EditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const { user, loading: authLoading } = useAuth()
  
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)

  const categories = [
    { value: 'general', label: '일반' },
    { value: 'question', label: '질문' },
    { value: 'share', label: '정보공유' },
    { value: 'discussion', label: '토론' }
  ]

  useEffect(() => {
    // 인증이 아직 로딩 중이면 대기
    if (authLoading) {
      return
    }
    
    // 인증 완료 후 사용자가 없으면 로그인 페이지로
    if (!user) {
      router.push('/auth')
      return
    }
    
    fetchPost()
  }, [user, authLoading, params.id])

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('게시글 조회 오류:', error)
        
        // 게시글을 찾을 수 없는 오류
        if (error.code === 'PGRST116') {
          alert('게시글을 찾을 수 없습니다. 삭제되었거나 존재하지 않는 게시글입니다.')
        } else if (error.message?.includes('permission')) {
          alert('게시글을 볼 권한이 없습니다.')
        } else {
          alert(`게시글을 불러오는 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`)
        }
        
        router.push('/community')
        return
      }

      if (!data) {
        alert('게시글을 찾을 수 없습니다')
        router.push('/community')
        return
      }

      const postData = data as Post
      
      // 타입 안전한 사용자 확인
      if (!user?.id) {
        alert('인증 정보를 확인할 수 없습니다')
        router.push('/auth')
        return
      }

      // 권한 확인: 작성자이거나 마스터 권한이 있어야 함
      const isAuthor = postData.author_id === user.id
      const isMaster = user.user_metadata?.user_role === 'master'
      
      if (!isAuthor && !isMaster) {
        alert('수정 권한이 없습니다. (작성자만 수정 가능)')
        router.push(`/community/${params.id}`)
        return
      }

      setPost(postData)
      setTitle(postData.title)
      setContent(postData.content)
      setCategory(postData.category)
      setIsAnonymous(postData.is_anonymous)
    } catch (error: any) {
      console.error('게시글 조회 중 예외 발생:', error)
      
      // 네트워크 오류인지 확인
      if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
        alert('네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인하고 다시 시도해주세요.')
      } else {
        alert(`게시글을 불러오는 중 예상치 못한 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`)
      }
      
      router.push('/community')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!post || !user) return

    if (!title.trim()) {
      alert('제목을 입력해주세요')
      return
    }

    if (!content.trim()) {
      alert('내용을 입력해주세요')
      return
    }

    setSaving(true)

    try {
      const { error } = await (supabase as any)
        .from('posts')
        .update({
          title: title.trim(),
          content: content.trim(),
          category,
          is_anonymous: isAnonymous,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id)
        .eq('author_id', user.id)

      if (error) {
        console.error('게시글 수정 오류:', error)
        alert('게시글 수정에 실패했습니다')
        return
      }

      alert('게시글이 수정되었습니다')
      // Next.js 라우터를 사용하여 페이지 이동
      router.push(`/community/${post.id}`)
      router.refresh()
    } catch (error) {
      console.error('게시글 수정 중 오류:', error)
      alert('게시글 수정 중 오류가 발생했습니다')
    } finally {
      setSaving(false)
    }
  }

  // 인증 상태 또는 게시글 로딩 중이면 로딩 표시
  if (authLoading || loading) {
    const loadingText = authLoading ? '인증 상태 확인 중...' : '게시글을 불러오는 중...'
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-gray-600">{loadingText}</span>
        </div>
      </div>
    )
  }

  if (!post) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">게시글 수정</h1>
          </div>

          {/* 수정 폼 */}
          <Card>
            <CardHeader>
              <CardTitle>게시글 수정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 카테고리 */}
              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 제목 */}
              <div className="space-y-2">
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="게시글 제목을 입력하세요"
                  maxLength={100}
                />
                <div className="text-sm text-gray-500 text-right">
                  {title.length}/100
                </div>
              </div>

              {/* 내용 */}
              <div className="space-y-2">
                <Label htmlFor="content">내용</Label>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="게시글 내용을 입력하세요..."
                />
                <div className="text-sm text-gray-500 text-right">
                  {content.replace(/<[^>]*>/g, '').length}/5000
                </div>
              </div>

              {/* 익명 게시 옵션 */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                />
                <Label htmlFor="anonymous" className="text-sm font-medium">
                  익명으로 게시
                </Label>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      수정 중...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      수정하기
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={saving}
                >
                  취소
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}