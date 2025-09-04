'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Briefcase,
  Building,
  MapPin,
  DollarSign,
  FileText,
  Plus,
  X
} from 'lucide-react'
import Link from 'next/link'

const jobTypes = [
  { value: 'full-time', label: '정규직' },
  { value: 'part-time', label: '계약직' },
  { value: 'freelance', label: '프리랜서' },
  { value: 'contract', label: '외주' },
]

export default function JobWritePage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    type: '',
    salary_range: '',
  })
  
  const [requirements, setRequirements] = useState<string[]>([])
  const [newRequirement, setNewRequirement] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 로그인하지 않은 사용자는 리다이렉트
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">로그인이 필요합니다</h1>
          <p className="text-slate-600 mb-6">채용공고를 등록하려면 로그인해주세요.</p>
          <Button asChild>
            <Link href="/auth">로그인하기</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addRequirement = () => {
    if (newRequirement.trim() && !requirements.includes(newRequirement.trim())) {
      setRequirements(prev => [...prev, newRequirement.trim()])
      setNewRequirement('')
    }
  }

  const removeRequirement = (requirement: string) => {
    setRequirements(prev => prev.filter(req => req !== requirement))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.company.trim() || !formData.type) {
      alert('필수 항목을 모두 입력해주세요.')
      return
    }

    setSubmitting(true)

    try {
      const supabase = createClient()

      const { data, error } = await (supabase
        .from('jobs') as any)
        .insert([
          {
            title: formData.title.trim(),
            description: formData.description.trim(),
            company: formData.company.trim(),
            location: formData.location.trim() || '미정',
            type: formData.type,
            salary_range: formData.salary_range.trim() || null,
            requirements: requirements.length > 0 ? requirements : null,
            poster_id: user.id,
            is_active: true
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('채용공고 등록 오류:', error)
        alert('채용공고 등록 중 오류가 발생했습니다.')
        return
      }

      // 성공적으로 등록되면 상세 페이지로 이동
      router.push(`/jobs/${data.id}`)
    } catch (error) {
      console.error('채용공고 등록 중 오류:', error)
      alert('채용공고 등록 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" asChild>
              <Link href="/jobs">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-blue-600" />
                채용공고 등록
              </h1>
              <p className="text-slate-600">편집자들을 위한 채용공고를 등록해보세요</p>
            </div>
          </div>

          {/* 등록 폼 */}
          <Card>
            <CardHeader>
              <CardTitle>채용공고 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 직무명 */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    직무명 *
                  </Label>
                  <Input
                    id="title"
                    placeholder="예: 콘텐츠 편집자, 기술 문서 작성자"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>

                {/* 회사명 */}
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-medium flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    회사명 *
                  </Label>
                  <Input
                    id="company"
                    placeholder="회사명을 입력하세요"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    required
                  />
                </div>

                {/* 근무 형태 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">근무 형태 *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="근무 형태를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 근무지 */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    근무지
                  </Label>
                  <Input
                    id="location"
                    placeholder="예: 서울 강남구, 재택근무, 하이브리드"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                </div>

                {/* 급여 */}
                <div className="space-y-2">
                  <Label htmlFor="salary_range" className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    급여
                  </Label>
                  <Input
                    id="salary_range"
                    placeholder="예: 연봉 4000-5000만원, 시급 2만원, 프로젝트당 100만원"
                    value={formData.salary_range}
                    onChange={(e) => handleInputChange('salary_range', e.target.value)}
                  />
                </div>

                {/* 업무 설명 */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    업무 설명 *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="구체적인 업무 내용, 팀 소개, 회사 문화 등을 작성해주세요..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="min-h-[120px]"
                    required
                  />
                </div>

                {/* 요구사항 */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">요구사항 및 우대사항</Label>
                  
                  {/* 요구사항 추가 입력 */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="예: 3년 이상 편집 경험, Adobe Creative Suite 사용 가능"
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addRequirement()
                        }
                      }}
                    />
                    <Button type="button" onClick={addRequirement} size="icon" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* 요구사항 목록 */}
                  {requirements.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {requirements.map((requirement) => (
                        <Badge key={requirement} variant="secondary" className="gap-1">
                          {requirement}
                          <button
                            type="button"
                            onClick={() => removeRequirement(requirement)}
                            className="ml-1 hover:bg-slate-300 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* 제출 버튼 */}
                <div className="flex justify-end gap-4 pt-6 border-t">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/jobs">취소</Link>
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        등록 중...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        채용공고 등록
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}