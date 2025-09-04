'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
  const { user } = useAuth()
  
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)

  const categories = [
    { value: 'general', label: '일반' },
    { value: 'job', label: '구인구직' },
    { value: 'qna', label: 'Q&A' },
    { value: 'tips', label: '팁/노하우' }
  ]

  useEffect(() => {
    if (!user) {
      router.push('/auth')
      return
    }
    fetchPost()
  }, [user, params.id])

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('게시글 조회 오류:', error)
        alert('게시글을 불러올 수 없습니다')
        router.push('/community')
        return
      }

      if (!data) {
        alert('게시글을 찾을 수 없습니다')
        router.push('/community')
        return
      }

      // 작성자 확인
      if ((data as any).author_id !== user?.id) {
        alert('수정 권한이 없습니다')
        router.push(`/community/${params.id}`)
        return
      }

      setPost(data as Post)
      setTitle((data as Post).title)
      setContent((data as Post).content)
      setCategory((data as Post).category)
      setIsAnonymous((data as Post).is_anonymous)
    } catch (error) {
      console.error('게시글 조회 중 오류:', error)
      alert('게시글을 불러오는 중 오류가 발생했습니다')
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
      router.push(`/community/${post.id}`)
    } catch (error) {
      console.error('게시글 수정 중 오류:', error)
      alert('게시글 수정 중 오류가 발생했습니다')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-gray-600">게시글을 불러오는 중...</span>
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
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="게시글 내용을 입력하세요"
                  rows={15}
                  maxLength={5000}
                />
                <div className="text-sm text-gray-500 text-right">
                  {content.length}/5000
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