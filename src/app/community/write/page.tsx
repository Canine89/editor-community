'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

const categories = [
  { value: 'general', label: '일반', description: '일반적인 이야기와 의견 공유' },
  { value: 'question', label: '질문', description: '편집 관련 질문과 답변' },
  { value: 'share', label: '정보공유', description: '유용한 정보와 자료 공유' },
  { value: 'discussion', label: '토론', description: '특정 주제에 대한 심도 있는 토론' },
]

export default function WritePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    isAnonymous: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 인증 로딩 중일 때는 로딩 화면 표시
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-500 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-slate-600 font-medium">인증 확인 중...</p>
        </div>
      </div>
    )
  }

  // 로그인하지 않은 사용자는 로그인 페이지로 리디렉션
  if (!user) {
    console.log('로그인하지 않은 사용자가 글쓰기 페이지에 접근 - /auth로 리디렉션')
    router.push('/auth')
    return null
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요'
    } else if (formData.title.length > 100) {
      newErrors.title = '제목은 100자 이내로 입력해주세요'
    }

    if (!formData.content.trim()) {
      newErrors.content = '내용을 입력해주세요'
    } else if (formData.content.length > 5000) {
      newErrors.content = '내용은 5000자 이내로 입력해주세요'
    }

    if (!formData.category) {
      newErrors.category = '카테고리를 선택해주세요'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      console.log('게시글 작성 시도:', {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        author_id: user.id,
        is_anonymous: formData.isAnonymous
      })

      // 먼저 posts 테이블이 존재하는지 확인
      console.log('테이블 존재 확인 중...')
      const { data: testData, error: testError } = await supabase
        .from('posts')
        .select('id')
        .limit(1)

      if (testError) {
        console.error('테이블 존재 확인 오류:', testError)
        console.error('에러 상세:', testError)

        // 구체적인 에러 메시지에 따라 안내
        if (testError.message?.includes('relation') || testError.message?.includes('does not exist')) {
          alert(`❌ 데이터베이스 테이블이 존재하지 않습니다!\n\n📋 다음 단계를 따라주세요:\n\n1. Supabase 대시보드 → SQL Editor\n2. supabase-schema.sql 파일 내용 복사\n3. SQL Editor에 붙여넣기\n4. "Run" 버튼 클릭\n\n그 후 다시 시도해주세요.`)
        } else {
          alert(`데이터베이스 오류: ${testError.message}\n\nSupabase 설정을 확인해주세요.`)
        }
        return
      }

      console.log('✅ posts 테이블 확인됨')

      // 사용자 프로필이 존재하는지 확인하고 없다면 생성
      console.log('사용자 프로필 확인 중...')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        console.log('사용자 프로필이 존재하지 않아 새로 생성합니다...')
        const { error: createProfileError } = await (supabase
          .from('profiles') as any)
          .insert([
            {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || '익명 사용자'
            }
          ])

        if (createProfileError) {
          console.error('프로필 생성 오류:', createProfileError)
          alert(`프로필 생성에 실패했습니다: ${createProfileError.message}`)
          return
        }

        console.log('✅ 사용자 프로필 생성 완료')
      }

      const { data, error } = await (supabase
        .from('posts') as any)
        .insert([
          {
            title: formData.title.trim(),
            content: formData.content.trim(),
            category: formData.category,
            author_id: user.id,
            is_anonymous: formData.isAnonymous
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('게시글 작성 오류:', error)
        alert(`게시글 작성에 실패했습니다: ${error.message}`)
        return
      }

      console.log('게시글 작성 성공:', data)

      // 성공 시 커뮤니티 페이지로 리디렉션
      router.push('/community')
    } catch (error) {
      console.error('게시글 작성 중 오류:', error)
      alert(`게시글 작성에 실패했습니다: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // 에러 메시지 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link href="/community">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">게시글 작성</h1>
            <p className="text-slate-600">편집자 커뮤니티에 글을 공유하세요</p>
          </div>
        </div>

        {/* 작성 폼 */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="w-5 h-5" />
                새 게시글
              </CardTitle>
              <CardDescription>
                작성하신 글은 커뮤니티의 모든 회원들과 공유됩니다
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 제목 */}
                <div className="space-y-2">
                  <Label htmlFor="title">제목 *</Label>
                  <Input
                    id="title"
                    placeholder="게시글 제목을 입력하세요"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.title}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    {formData.title.length}/100자
                  </p>
                </div>

                {/* 카테고리 */}
                <div className="space-y-2">
                  <Label htmlFor="category">카테고리 *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                      <SelectValue placeholder="카테고리를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div>
                            <div className="font-medium">{category.label}</div>
                            <div className="text-xs text-slate-500">{category.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.category}
                    </p>
                  )}
                </div>

                {/* 익명 여부 */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymous"
                    checked={formData.isAnonymous}
                    onCheckedChange={(checked) => handleInputChange('isAnonymous', checked as boolean)}
                  />
                  <Label htmlFor="anonymous" className="text-sm">
                    익명으로 게시하기
                  </Label>
                </div>

                {/* 내용 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="content">내용 *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPreview(!preview)}
                    >
                      {preview ? (
                        <>
                          <EyeOff className="w-3 h-3 mr-1" />
                          편집
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 mr-1" />
                          미리보기
                        </>
                      )}
                    </Button>
                  </div>

                  {preview ? (
                    <div className="min-h-[200px] p-4 border rounded-lg bg-slate-50">
                      <div className="prose prose-sm max-w-none">
                        <h3 className="text-lg font-semibold mb-2">{formData.title || '제목 없음'}</h3>
                        <div className="whitespace-pre-wrap">{formData.content || '내용 없음'}</div>
                      </div>
                    </div>
                  ) : (
                    <Textarea
                      id="content"
                      placeholder="게시글 내용을 입력하세요..."
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      className={`min-h-[200px] ${errors.content ? 'border-red-500' : ''}`}
                    />
                  )}

                  {errors.content && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.content}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    {formData.content.length}/5000자
                  </p>
                </div>

                {/* 액션 버튼들 */}
                <div className="flex gap-4 pt-6 border-t">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        게시 중...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        게시하기
                      </>
                    )}
                  </Button>

                  <Button type="button" variant="outline" asChild>
                    <Link href="/community">취소</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* 작성 팁 */}
          <Alert className="mt-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>작성 팁:</strong> 다른 사용자들에게 도움이 될 수 있는 유용한 정보를 공유해주세요.
              질문을 하실 때는 구체적인 상황과 원하시는 답변을 명확히 적어주세요.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}
