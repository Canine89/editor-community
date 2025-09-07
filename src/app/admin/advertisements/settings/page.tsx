'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/hooks/useAdmin'
import { 
  getAdSettings,
  updateAdSettings,
  type AdSettings
} from '@/lib/advertisements'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Settings, Save } from 'lucide-react'
import Link from 'next/link'

const defaultSettings: AdSettings = {
  id: '',
  show_top_carousel: true,
  show_bottom_banner: true,
  carousel_auto_play: true,
  carousel_interval: 5000,
  banner_position: 'static',
  updated_at: ''
}

export default function AdvertisementSettingsPage() {
  const { isAdmin, loading: adminLoading } = useAdmin()
  const router = useRouter()

  const [settings, setSettings] = useState<AdSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    show_top_carousel: true,
    show_bottom_banner: true,
    carousel_auto_play: true,
    carousel_interval: 5000,
    banner_position: 'static' as 'fixed' | 'static'
  })

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/admin')
      return
    }

    if (isAdmin) {
      loadSettings()
    }
  }, [isAdmin, adminLoading, router])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      const adSettings = await getAdSettings()
      
      if (adSettings) {
        setSettings(adSettings)
        setFormData({
          show_top_carousel: adSettings.show_top_carousel,
          show_bottom_banner: adSettings.show_bottom_banner,
          carousel_auto_play: adSettings.carousel_auto_play,
          carousel_interval: adSettings.carousel_interval,
          banner_position: adSettings.banner_position
        })
      } else {
        // 설정이 없으면 기본값 사용
        setSettings(defaultSettings)
        setFormData({
          show_top_carousel: true,
          show_bottom_banner: true,
          carousel_auto_play: true,
          carousel_interval: 5000,
          banner_position: 'static'
        })
      }
    } catch (err) {
      console.error('Failed to load ad settings:', err)
      setError('광고 설정을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      await updateAdSettings(formData)
      
      setSuccess(true)
      
      // 성공 메시지를 3초간 표시한 후 자동으로 숨김
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
      
      // 설정 다시 로드
      await loadSettings()

    } catch (err) {
      console.error('Failed to save ad settings:', err)
      setError('광고 설정 저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setFormData({
      show_top_carousel: settings.show_top_carousel,
      show_bottom_banner: settings.show_bottom_banner,
      carousel_auto_play: settings.carousel_auto_play,
      carousel_interval: settings.carousel_interval,
      banner_position: settings.banner_position
    })
    setError(null)
    setSuccess(false)
  }

  const hasChanges = () => {
    return (
      formData.show_top_carousel !== settings.show_top_carousel ||
      formData.show_bottom_banner !== settings.show_bottom_banner ||
      formData.carousel_auto_play !== settings.carousel_auto_play ||
      formData.carousel_interval !== settings.carousel_interval ||
      formData.banner_position !== settings.banner_position
    )
  }

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">설정을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">광고 설정</h1>
          <p className="text-gray-600 mt-2">사이트 광고 표시 설정을 관리합니다</p>
        </div>
        <Link href="/admin/advertisements">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            광고 관리로 돌아가기
          </Button>
        </Link>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            ✅ 설정이 성공적으로 저장되었습니다.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* 캐러셀 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              캐러셀 광고 설정
            </CardTitle>
            <CardDescription>
              상단에 표시되는 캐러셀 광고의 동작을 설정합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="show-carousel">캐러셀 광고 표시</Label>
                <p className="text-sm text-gray-500">
                  사이트 상단에 캐러셀 광고를 표시할지 설정합니다
                </p>
              </div>
              <Switch
                id="show-carousel"
                checked={formData.show_top_carousel}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, show_top_carousel: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="auto-play">자동 재생</Label>
                <p className="text-sm text-gray-500">
                  캐러셀 광고가 자동으로 넘어가도록 설정합니다
                </p>
              </div>
              <Switch
                id="auto-play"
                checked={formData.carousel_auto_play}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, carousel_auto_play: checked }))
                }
                disabled={!formData.show_top_carousel}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carousel-interval">자동 재생 간격 (밀리초)</Label>
              <Input
                id="carousel-interval"
                type="number"
                min="1000"
                max="10000"
                step="500"
                value={formData.carousel_interval}
                onChange={(e) => 
                  setFormData(prev => ({ 
                    ...prev, 
                    carousel_interval: parseInt(e.target.value) || 5000 
                  }))
                }
                disabled={!formData.show_top_carousel || !formData.carousel_auto_play}
              />
              <p className="text-sm text-gray-500">
                권장: 3000-7000ms (3-7초)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 배너 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              배너 광고 설정
            </CardTitle>
            <CardDescription>
              하단에 표시되는 배너 광고의 동작을 설정합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="show-banner">배너 광고 표시</Label>
                <p className="text-sm text-gray-500">
                  사이트 하단에 배너 광고를 표시할지 설정합니다
                </p>
              </div>
              <Switch
                id="show-banner"
                checked={formData.show_bottom_banner}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, show_bottom_banner: checked }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-position">배너 위치</Label>
              <Select
                value={formData.banner_position}
                onValueChange={(value) => 
                  setFormData(prev => ({ 
                    ...prev, 
                    banner_position: value as 'fixed' | 'static' 
                  }))
                }
                disabled={!formData.show_bottom_banner}
              >
                <SelectTrigger>
                  <SelectValue placeholder="배너 위치 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">정적 (Static)</SelectItem>
                  <SelectItem value="fixed">고정 (Fixed)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                정적: 페이지 하단에 일반적으로 표시 | 고정: 화면 하단에 항상 고정
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 현재 설정 상태 */}
        <Card>
          <CardHeader>
            <CardTitle>현재 설정 정보</CardTitle>
            <CardDescription>
              현재 적용된 광고 설정 상태입니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">캐러셀 광고</p>
                <p className="text-gray-600">
                  {settings.show_top_carousel ? '표시함' : '숨김'} | 
                  자동재생: {settings.carousel_auto_play ? '켜짐' : '꺼짐'} | 
                  간격: {settings.carousel_interval}ms
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">배너 광고</p>
                <p className="text-gray-600">
                  {settings.show_bottom_banner ? '표시함' : '숨김'} | 
                  위치: {settings.banner_position === 'fixed' ? '고정' : '정적'}
                </p>
              </div>
            </div>
            {settings.updated_at && (
              <p className="text-xs text-gray-500 mt-4">
                마지막 수정: {new Date(settings.updated_at).toLocaleString('ko-KR')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 저장 버튼 */}
        <div className="flex items-center justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={handleReset}
            disabled={saving || !hasChanges()}
          >
            초기화
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving || !hasChanges()}
            className="min-w-[120px]"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                저장 중...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                설정 저장
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}