'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { createJobPosting } from '@/lib/supabase/jobs'
import { Loader2, X, Plus } from 'lucide-react'

interface JobFormProps {
  onSuccess?: () => void
}

export default function JobForm({ onSuccess }: JobFormProps) {
  const [formData, setFormData] = useState({
    role: '',
    employment_type: '' as 'full-time' | 'part-time' | 'freelance' | 'contract' | '',
    pay_range: '',
    location: '',
    is_remote: false,
    description: '',
    requirements: '',
    benefits: '',
    due_date: ''
  })
  const [skills, setSkills] = useState<string[]>([])
  const [currentSkill, setCurrentSkill] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills(prev => [...prev, currentSkill.trim()])
      setCurrentSkill('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.role.trim() || !formData.employment_type || !formData.description.trim()) {
      alert('역할, 고용 형태, 공고 설명은 필수 입력사항입니다.')
      return
    }

    setIsLoading(true)

    try {
      await createJobPosting({
        ...formData,
        employment_type: formData.employment_type as 'full-time' | 'part-time' | 'freelance' | 'contract',
        skills,
        due_date: formData.due_date || undefined
      })

      // 성공 시 폼 초기화
      setFormData({
        role: '',
        employment_type: '',
        pay_range: '',
        location: '',
        is_remote: false,
        description: '',
        requirements: '',
        benefits: '',
        due_date: ''
      })
      setSkills([])

      onSuccess?.()
      alert('구인 공고가 성공적으로 등록되었습니다!')
    } catch (error) {
      console.error('구인 공고 등록 실패:', error)
      alert('구인 공고 등록에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>구인 공고 등록</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">모집 포지션 *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                placeholder="예: 시니어 비디오 편집자"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employment_type">고용 형태 *</Label>
              <Select
                value={formData.employment_type}
                onValueChange={(value) => handleInputChange('employment_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="고용 형태를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">정규직</SelectItem>
                  <SelectItem value="part-time">파트타임</SelectItem>
                  <SelectItem value="freelance">프리랜서</SelectItem>
                  <SelectItem value="contract">계약직</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 급여 및 위치 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pay_range">급여 범위</Label>
              <Input
                id="pay_range"
                value={formData.pay_range}
                onChange={(e) => handleInputChange('pay_range', e.target.value)}
                placeholder="예: 3,000만원~5,000만원"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">근무 위치</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="예: 서울시 강남구"
              />
            </div>
          </div>

          {/* 원격 근무 옵션 */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_remote"
              checked={formData.is_remote}
              onCheckedChange={(checked) => handleInputChange('is_remote', checked as boolean)}
            />
            <Label htmlFor="is_remote">원격 근무 가능</Label>
          </div>

          {/* 기술 스택 */}
          <div className="space-y-2">
            <Label>필요 기술/툴</Label>
            <div className="flex gap-2">
              <Input
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                placeholder="예: Premiere Pro"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSkill()
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addSkill}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 hover:bg-slate-300 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 공고 설명 */}
          <div className="space-y-2">
            <Label htmlFor="description">공고 설명 *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="직무에 대한 자세한 설명을 입력하세요"
              rows={6}
              required
            />
          </div>

          {/* 자격 요건 */}
          <div className="space-y-2">
            <Label htmlFor="requirements">자격 요건</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              placeholder="필요한 경력, 학력, 자격증 등을 입력하세요"
              rows={4}
            />
          </div>

          {/* 복리후생 */}
          <div className="space-y-2">
            <Label htmlFor="benefits">복리후생</Label>
            <Textarea
              id="benefits"
              value={formData.benefits}
              onChange={(e) => handleInputChange('benefits', e.target.value)}
              placeholder="급여 외 제공되는 혜택들을 입력하세요"
              rows={3}
            />
          </div>

          {/* 마감일 */}
          <div className="space-y-2">
            <Label htmlFor="due_date">모집 마감일</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => handleInputChange('due_date', e.target.value)}
            />
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  등록 중...
                </>
              ) : (
                '구인 공고 등록'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  role: '',
                  employment_type: '',
                  pay_range: '',
                  location: '',
                  is_remote: false,
                  description: '',
                  requirements: '',
                  benefits: '',
                  due_date: ''
                })
                setSkills([])
              }}
            >
              초기화
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
