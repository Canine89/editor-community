'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/hooks/useRole'
import { createAdvertisement, uploadAdImage, type CreateAdvertisementData } from '@/lib/advertisements'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Upload, Image as ImageIcon, Info } from 'lucide-react'
import Link from 'next/link'

interface FormData {
  title: string
  description: string
  type: 'carousel' | 'banner' | ''
  image_url: string
  link_url: string
  display_order: number
  start_date: string
  end_date: string
  advertiser_name: string
  advertiser_email: string
  advertiser_phone: string
  is_active: boolean
}

const initialFormData: FormData = {
  title: '',
  description: '',
  type: '',
  image_url: '',
  link_url: '',
  display_order: 1,
  start_date: '',
  end_date: '',
  advertiser_name: '',
  advertiser_email: '',
  advertiser_phone: '',
  is_active: true
}

export default function CreateAdvertisementPage() {
  const { isAdmin, loading: adminLoading } = useAdmin()
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleInputChange = (field: keyof FormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('이미지 크기는 10MB 이하여야 합니다.')
      return
    }

    setImageFile(file)
    setError(null)

    // 미리보기 생성
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요'
    }

    if (!formData.type) {
      newErrors.type = '광고 유형을 선택해주세요'
    }

    if (!formData.image_url && !imageFile) {
      newErrors.image_url = '이미지를 업로드하거나 URL을 입력해주세요'
    }

    if (!formData.link_url.trim()) {
      newErrors.link_url = '링크 URL을 입력해주세요'
    } else {
      try {
        new URL(formData.link_url)
      } catch {
        newErrors.link_url = '유효한 URL을 입력해주세요'
      }
    }

    if (!formData.start_date) {
      newErrors.start_date = '시작일을 선택해주세요'
    }

    if (!formData.end_date) {
      newErrors.end_date = '종료일을 선택해주세요'
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      
      if (startDate >= endDate) {
        newErrors.end_date = '종료일은 시작일보다 늦어야 합니다'
      }
    }

    if (!formData.advertiser_name.trim()) {
      newErrors.advertiser_name = '광고주명을 입력해주세요'
    }

    if (formData.display_order < 1 || formData.display_order > 100) {
      newErrors.display_order = '표시 순서는 1-100 사이의 값이어야 합니다'
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
    setError(null)
    setSuccess(null)

    try {
      let imageUrl = formData.image_url

      // 이미지 파일이 선택된 경우 업로드
      if (imageFile) {
        setUploadingImage(true)
        const fileName = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        imageUrl = await uploadAdImage(imageFile, fileName)
        setUploadingImage(false)
      }

      const adData: CreateAdvertisementData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type as 'carousel' | 'banner',
        image_url: imageUrl,
        link_url: formData.link_url.trim(),
        display_order: formData.display_order,
        start_date: formData.start_date,
        end_date: formData.end_date,
        advertiser_name: formData.advertiser_name.trim(),
        advertiser_email: formData.advertiser_email.trim() || undefined,
        advertiser_phone: formData.advertiser_phone.trim() || undefined,
        is_active: formData.is_active
      }

      await createAdvertisement(adData)
      setSuccess('광고가 성공적으로 등록되었습니다!')
      
      // 2초 후 목록 페이지로 이동
      setTimeout(() => {
        router.push('/admin/advertisements')
      }, 2000)

    } catch (err) {
      console.error('Failed to create advertisement:', err)
      setError('광고 등록에 실패했습니다. 다시 시도해주세요.')
      setUploadingImage(false)
    } finally {
      setLoading(false)
    }
  }

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    router.push('/admin')
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/advertisements">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">새 광고 등록</h1>
            <p className="text-gray-600 mt-2">새로운 광고를 등록합니다</p>
          </div>
        </div>

        {error && (
          <Alert className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>광고의 기본 정보를 입력합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">제목 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="광고 제목을 입력하세요"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="type">광고 유형 *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange('type', value)}
                  >
                    <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                      <SelectValue placeholder="광고 유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carousel">캐러셀 (1200x400px)</SelectItem>
                      <SelectItem value="banner">배너 (1200x200px)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-red-500 mt-1">{errors.type}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="광고에 대한 간단한 설명 (선택사항)"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="display_order">표시 순서</Label>
                <Input
                  id="display_order"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.display_order}
                  onChange={(e) => handleInputChange('display_order', parseInt(e.target.value))}
                  className={errors.display_order ? 'border-red-500' : ''}
                />
                <p className="text-sm text-gray-500 mt-1">
                  낮은 숫자일수록 먼저 표시됩니다 (1-100)
                </p>
                {errors.display_order && (
                  <p className="text-sm text-red-500 mt-1">{errors.display_order}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 이미지 업로드 */}
          <Card>
            <CardHeader>
              <CardTitle>광고 이미지</CardTitle>
              <CardDescription>
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 text-blue-500" />
                  <div>
                    <p>캐러셀: 1200x400px (3:1 비율) 권장</p>
                    <p>배너: 1200x200px (6:1 비율) 권장</p>
                    <p>최대 10MB, JPG/PNG/WebP 형식 지원</p>
                  </div>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="image-upload">이미지 파일 업로드</Label>
                <div className="mt-2">
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      {previewUrl ? (
                        <div className="space-y-2">
                          <img 
                            src={previewUrl} 
                            alt="미리보기" 
                            className="max-h-32 mx-auto rounded border"
                          />
                          <p className="text-sm text-gray-500">클릭하여 다른 이미지 선택</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 mx-auto text-gray-400" />
                          <p className="text-gray-500">클릭하여 이미지 업로드</p>
                        </div>
                      )}
                    </div>
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="text-center text-gray-500">또는</div>

              <div>
                <Label htmlFor="image_url">이미지 URL 직접 입력</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => handleInputChange('image_url', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className={errors.image_url ? 'border-red-500' : ''}
                />
                {errors.image_url && (
                  <p className="text-sm text-red-500 mt-1">{errors.image_url}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 링크 및 기간 */}
          <Card>
            <CardHeader>
              <CardTitle>링크 및 게재 기간</CardTitle>
              <CardDescription>광고 클릭 시 이동할 링크와 게재 기간을 설정합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="link_url">링크 URL *</Label>
                <Input
                  id="link_url"
                  value={formData.link_url}
                  onChange={(e) => handleInputChange('link_url', e.target.value)}
                  placeholder="https://example.com"
                  className={errors.link_url ? 'border-red-500' : ''}
                />
                {errors.link_url && (
                  <p className="text-sm text-red-500 mt-1">{errors.link_url}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">시작일 *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className={errors.start_date ? 'border-red-500' : ''}
                  />
                  {errors.start_date && (
                    <p className="text-sm text-red-500 mt-1">{errors.start_date}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="end_date">종료일 *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    className={errors.end_date ? 'border-red-500' : ''}
                  />
                  {errors.end_date && (
                    <p className="text-sm text-red-500 mt-1">{errors.end_date}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 광고주 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>광고주 정보</CardTitle>
              <CardDescription>광고주의 연락처 정보를 입력합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="advertiser_name">광고주명 *</Label>
                <Input
                  id="advertiser_name"
                  value={formData.advertiser_name}
                  onChange={(e) => handleInputChange('advertiser_name', e.target.value)}
                  placeholder="회사명 또는 개인명"
                  className={errors.advertiser_name ? 'border-red-500' : ''}
                />
                {errors.advertiser_name && (
                  <p className="text-sm text-red-500 mt-1">{errors.advertiser_name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="advertiser_email">이메일</Label>
                  <Input
                    id="advertiser_email"
                    type="email"
                    value={formData.advertiser_email}
                    onChange={(e) => handleInputChange('advertiser_email', e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="advertiser_phone">전화번호</Label>
                  <Input
                    id="advertiser_phone"
                    value={formData.advertiser_phone}
                    onChange={(e) => handleInputChange('advertiser_phone', e.target.value)}
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>광고 설정</CardTitle>
              <CardDescription>광고의 활성화 상태를 설정합니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', !!checked)}
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  광고 활성화 (체크 해제 시 비활성 상태로 등록)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* 제출 버튼 */}
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={loading || uploadingImage}
              className="min-w-[120px]"
            >
              {loading || uploadingImage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {uploadingImage ? '이미지 업로드 중...' : '등록 중...'}
                </>
              ) : (
                '광고 등록'
              )}
            </Button>
            <Link href="/admin/advertisements">
              <Button type="button" variant="outline" disabled={loading}>
                취소
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}