'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAdmin } from '@/hooks/useAdmin'
import { 
  getAdvertisementById, 
  updateAdvertisement, 
  uploadAdImage,
  type Advertisement,
  type UpdateAdvertisementData
} from '@/lib/advertisements'
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
import { ArrowLeft, Upload, X, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function EditAdvertisementPage() {
  const { isAdmin, loading: adminLoading } = useAdmin()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [ad, setAd] = useState<Advertisement | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'carousel' as 'carousel' | 'banner',
    image_url: '',
    link_url: '',
    display_order: 1,
    start_date: '',
    end_date: '',
    advertiser_name: '',
    advertiser_email: '',
    advertiser_phone: ''
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [useFileUpload, setUseFileUpload] = useState(false)

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/admin')
      return
    }

    if (isAdmin && id) {
      loadAdvertisement()
    }
  }, [isAdmin, adminLoading, router, id])

  const loadAdvertisement = async () => {
    try {
      setLoading(true)
      setError(null)

      const advertisement = await getAdvertisementById(id)
      
      if (!advertisement) {
        setError('광고를 찾을 수 없습니다.')
        return
      }

      setAd(advertisement)
      
      // 폼 데이터 설정
      setFormData({
        title: advertisement.title,
        description: advertisement.description || '',
        type: advertisement.type,
        image_url: advertisement.image_url,
        link_url: advertisement.link_url,
        display_order: advertisement.display_order,
        start_date: advertisement.start_date.slice(0, 16), // datetime-local format
        end_date: advertisement.end_date.slice(0, 16),
        advertiser_name: advertisement.advertiser_name,
        advertiser_email: advertisement.advertiser_email || '',
        advertiser_phone: advertisement.advertiser_phone || ''
      })

      setImagePreview(advertisement.image_url)
    } catch (err) {
      console.error('Failed to load advertisement:', err)
      setError('광고 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.title.trim()) {
      errors.title = '제목을 입력해주세요.'
    }

    if (!formData.link_url.trim()) {
      errors.link_url = '링크 URL을 입력해주세요.'
    } else {
      try {
        new URL(formData.link_url)
      } catch {
        errors.link_url = '유효한 URL을 입력해주세요.'
      }
    }

    if (!useFileUpload && !formData.image_url.trim()) {
      errors.image_url = '이미지 URL을 입력해주세요.'
    }

    if (useFileUpload && !imageFile && !imagePreview) {
      errors.imageFile = '이미지 파일을 선택해주세요.'
    }

    if (!formData.start_date) {
      errors.start_date = '시작 날짜를 선택해주세요.'
    }

    if (!formData.end_date) {
      errors.end_date = '종료 날짜를 선택해주세요.'
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      
      if (endDate <= startDate) {
        errors.end_date = '종료 날짜는 시작 날짜보다 늦어야 합니다.'
      }
    }

    if (!formData.advertiser_name.trim()) {
      errors.advertiser_name = '광고주명을 입력해주세요.'
    }

    if (formData.advertiser_email && !formData.advertiser_email.includes('@')) {
      errors.advertiser_email = '유효한 이메일 주소를 입력해주세요.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      
      // 이미지 미리보기 생성
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      let imageUrl = formData.image_url

      // 파일 업로드가 선택되고 새 파일이 있는 경우
      if (useFileUpload && imageFile) {
        setUploading(true)
        const fileName = `${Date.now()}-${imageFile.name}`
        imageUrl = await uploadAdImage(imageFile, fileName)
        setUploading(false)
      }

      const updateData: UpdateAdvertisementData = {
        id,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        image_url: imageUrl,
        link_url: formData.link_url.trim(),
        display_order: formData.display_order,
        start_date: formData.start_date,
        end_date: formData.end_date,
        advertiser_name: formData.advertiser_name.trim(),
        advertiser_email: formData.advertiser_email.trim() || undefined,
        advertiser_phone: formData.advertiser_phone.trim() || undefined
      }

      await updateAdvertisement(updateData)

      setSuccess(true)
      
      // 3초 후 목록으로 이동
      setTimeout(() => {
        router.push('/admin/advertisements')
      }, 3000)

    } catch (err) {
      console.error('Failed to update advertisement:', err)
      setError('광고 수정에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  const getImageSizeRequirement = () => {
    return formData.type === 'carousel' ? '1200x400px' : '1200x200px'
  }

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  if (error && !ad) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/admin/advertisements">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              목록으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="text-center pt-6">
            <div className="text-green-600 text-4xl mb-4">✅</div>
            <h2 className="text-xl font-semibold mb-2">수정 완료!</h2>
            <p className="text-gray-600 mb-4">
              광고가 성공적으로 수정되었습니다.<br />
              잠시 후 목록으로 이동합니다.
            </p>
            <Link href="/admin/advertisements">
              <Button>목록으로 이동</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">광고 수정</h1>
          <p className="text-gray-600 mt-2">광고 정보를 수정합니다</p>
        </div>
        <Link href="/admin/advertisements">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로 돌아가기
          </Button>
        </Link>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>
              광고의 기본 정보를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="광고 제목을 입력하세요"
                />
                {formErrors.title && (
                  <p className="text-sm text-red-600">{formErrors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">광고 유형 *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    type: value as 'carousel' | 'banner' 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="광고 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carousel">캐러셀 (상단)</SelectItem>
                    <SelectItem value="banner">배너 (하단)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="광고 설명을 입력하세요 (선택사항)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">표시 순서</Label>
              <Input
                id="display_order"
                type="number"
                min="1"
                value={formData.display_order}
                onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
              />
              <p className="text-sm text-gray-500">
                숫자가 작을수록 먼저 표시됩니다
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 이미지 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>이미지 설정</CardTitle>
            <CardDescription>
              권장 크기: {getImageSizeRequirement()} (가로x세로)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Button
                type="button"
                variant={!useFileUpload ? 'default' : 'outline'}
                onClick={() => setUseFileUpload(false)}
                size="sm"
              >
                URL 입력
              </Button>
              <Button
                type="button"
                variant={useFileUpload ? 'default' : 'outline'}
                onClick={() => setUseFileUpload(true)}
                size="sm"
              >
                파일 업로드
              </Button>
            </div>

            {!useFileUpload ? (
              <div className="space-y-2">
                <Label htmlFor="image_url">이미지 URL *</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, image_url: e.target.value }))
                    setImagePreview(e.target.value)
                  }}
                  placeholder="https://example.com/image.jpg"
                />
                {formErrors.image_url && (
                  <p className="text-sm text-red-600">{formErrors.image_url}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="image_file">이미지 파일 *</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="image_file"
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="icon">
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                {formErrors.imageFile && (
                  <p className="text-sm text-red-600">{formErrors.imageFile}</p>
                )}
              </div>
            )}

            {/* 이미지 미리보기 */}
            {imagePreview && (
              <div className="space-y-2">
                <Label>미리보기</Label>
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="미리보기"
                    className="max-w-full max-h-48 object-cover rounded border"
                    onError={() => setImagePreview(null)}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImagePreview(null)
                      setImageFile(null)
                      if (!useFileUpload) {
                        setFormData(prev => ({ ...prev, image_url: '' }))
                      }
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 링크 및 일정 */}
        <Card>
          <CardHeader>
            <CardTitle>링크 및 일정</CardTitle>
            <CardDescription>
              광고 링크와 게재 일정을 설정해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link_url">링크 URL *</Label>
              <div className="flex space-x-2">
                <Input
                  id="link_url"
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                  placeholder="https://example.com"
                  className="flex-1"
                />
                {formData.link_url && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(formData.link_url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {formErrors.link_url && (
                <p className="text-sm text-red-600">{formErrors.link_url}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">시작 날짜 *</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
                {formErrors.start_date && (
                  <p className="text-sm text-red-600">{formErrors.start_date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">종료 날짜 *</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
                {formErrors.end_date && (
                  <p className="text-sm text-red-600">{formErrors.end_date}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 광고주 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>광고주 정보</CardTitle>
            <CardDescription>
              광고주의 연락처 정보를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="advertiser_name">광고주명 *</Label>
              <Input
                id="advertiser_name"
                value={formData.advertiser_name}
                onChange={(e) => setFormData(prev => ({ ...prev, advertiser_name: e.target.value }))}
                placeholder="회사명 또는 개인명"
              />
              {formErrors.advertiser_name && (
                <p className="text-sm text-red-600">{formErrors.advertiser_name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="advertiser_email">이메일</Label>
                <Input
                  id="advertiser_email"
                  type="email"
                  value={formData.advertiser_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, advertiser_email: e.target.value }))}
                  placeholder="contact@example.com"
                />
                {formErrors.advertiser_email && (
                  <p className="text-sm text-red-600">{formErrors.advertiser_email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="advertiser_phone">전화번호</Label>
                <Input
                  id="advertiser_phone"
                  type="tel"
                  value={formData.advertiser_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, advertiser_phone: e.target.value }))}
                  placeholder="010-1234-5678"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 제출 버튼 */}
        <div className="flex items-center justify-end space-x-4">
          <Link href="/admin/advertisements">
            <Button type="button" variant="outline">
              취소
            </Button>
          </Link>
          <Button 
            type="submit" 
            disabled={submitting || uploading}
            className="min-w-[120px]"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                업로드 중...
              </>
            ) : submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                수정 중...
              </>
            ) : (
              '수정하기'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}