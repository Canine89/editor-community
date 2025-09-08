'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ToolPageLayout } from '@/components/layout/PageLayout'
import {
  ArrowLeft,
  QrCode,
  Download,
  Palette,
  Settings,
  Smartphone,
  Mail,
  Phone,
  Wifi,
  User,
  FileText,
  Link as LinkIcon,
  AlertCircle
} from 'lucide-react'
import {
  generateQRCode,
  downloadQRCode,
  downloadSVGQRCode,
  validateQRData,
  type QRCodeData,
  type QRCodeOptions,
  defaultQROptions
} from '@/lib/qr-generator'
import { cn } from '@/lib/utils'

const dataTypes = [
  { value: 'url', label: 'URL/웹사이트', icon: LinkIcon },
  { value: 'text', label: '텍스트', icon: FileText },
  { value: 'email', label: '이메일', icon: Mail },
  { value: 'phone', label: '전화번호', icon: Phone },
  { value: 'sms', label: 'SMS', icon: Smartphone },
  { value: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { value: 'vcard', label: '연락처(vCard)', icon: User }
] as const

export default function QRGeneratorPage() {
  const [qrData, setQRData] = useState<QRCodeData>({
    type: 'url',
    value: ''
  })
  const [qrOptions, setQROptions] = useState<QRCodeOptions>(defaultQROptions)
  const [qrImage, setQRImage] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string>('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // QR 코드 실시간 생성
  useEffect(() => {
    const generateQR = async () => {
      if (!qrData.value.trim()) {
        setQRImage('')
        return
      }

      const validation = validateQRData(qrData)
      if (!validation.valid) {
        setError(validation.error || '')
        setQRImage('')
        return
      }

      setError('')
      setIsGenerating(true)

      try {
        const qr = await generateQRCode(qrData, qrOptions)
        setQRImage(qr)
      } catch (err) {
        setError('QR 코드 생성 중 오류가 발생했습니다.')
        setQRImage('')
      } finally {
        setIsGenerating(false)
      }
    }

    const debounce = setTimeout(generateQR, 300)
    return () => clearTimeout(debounce)
  }, [qrData, qrOptions])

  const handleDownload = (format: 'png' | 'svg') => {
    if (!qrImage) return

    if (format === 'svg') {
      generateQRCode(qrData, { ...qrOptions, type: 'svg' })
        .then(svg => downloadSVGQRCode(svg, `qrcode-${Date.now()}`))
    } else {
      downloadQRCode(qrImage, `qrcode-${Date.now()}`)
    }
  }

  const renderDataInput = () => {
    switch (qrData.type) {
      case 'url':
        return (
          <div className="space-y-2">
            <Label htmlFor="url">웹사이트 URL</Label>
            <Input
              id="url"
              placeholder="https://example.com"
              value={qrData.value}
              onChange={(e) => setQRData({ ...qrData, value: e.target.value })}
            />
          </div>
        )

      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor="text">텍스트 내용</Label>
            <Textarea
              id="text"
              placeholder="QR 코드에 포함할 텍스트를 입력하세요"
              value={qrData.value}
              onChange={(e) => setQRData({ ...qrData, value: e.target.value })}
              rows={3}
            />
          </div>
        )

      case 'email':
        return (
          <div className="space-y-2">
            <Label htmlFor="email">이메일 주소</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@domain.com"
              value={qrData.value}
              onChange={(e) => setQRData({ ...qrData, value: e.target.value })}
            />
          </div>
        )

      case 'phone':
        return (
          <div className="space-y-2">
            <Label htmlFor="phone">전화번호</Label>
            <Input
              id="phone"
              placeholder="010-1234-5678"
              value={qrData.value}
              onChange={(e) => setQRData({ ...qrData, value: e.target.value })}
            />
          </div>
        )

      case 'sms':
        return (
          <div className="space-y-2">
            <Label htmlFor="sms">휴대폰 번호</Label>
            <Input
              id="sms"
              placeholder="010-1234-5678"
              value={qrData.value}
              onChange={(e) => setQRData({ ...qrData, value: e.target.value })}
            />
          </div>
        )

      case 'wifi':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ssid">Wi-Fi 이름 (SSID)</Label>
              <Input
                id="ssid"
                placeholder="MyWiFi"
                value={qrData.ssid || ''}
                onChange={(e) => setQRData({ ...qrData, ssid: e.target.value, value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="WiFi 비밀번호"
                value={qrData.password || ''}
                onChange={(e) => setQRData({ ...qrData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="security">보안 방식</Label>
              <Select
                value={qrData.security || 'WPA'}
                onValueChange={(value: 'WPA' | 'WEP' | 'nopass') => 
                  setQRData({ ...qrData, security: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WPA">WPA/WPA2</SelectItem>
                  <SelectItem value="WEP">WEP</SelectItem>
                  <SelectItem value="nopass">보안 없음</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 'vcard':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                placeholder="홍길동"
                value={qrData.name || ''}
                onChange={(e) => setQRData({ ...qrData, name: e.target.value, value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">회사/조직</Label>
              <Input
                id="organization"
                placeholder="편집자 커뮤니티"
                value={qrData.organization || ''}
                onChange={(e) => setQRData({ ...qrData, organization: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vcard-phone">전화번호</Label>
              <Input
                id="vcard-phone"
                placeholder="010-1234-5678"
                value={qrData.phone || ''}
                onChange={(e) => setQRData({ ...qrData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vcard-email">이메일</Label>
              <Input
                id="vcard-email"
                type="email"
                placeholder="example@domain.com"
                value={qrData.email || ''}
                onChange={(e) => setQRData({ ...qrData, email: e.target.value })}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <ToolPageLayout>
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Link href="/tools">
              <ArrowLeft className="w-4 h-4 mr-2" />
              유틸리티로 돌아가기
            </Link>
          </Button>
        </div>
        
        <div className="text-center">
          <div className="w-16 h-16 gradient-primary rounded-3xl flex items-center justify-center shadow-editorial mx-auto mb-4">
            <QrCode className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gradient-editorial mb-2">
            QR 코드 생성기
          </h1>
          <p className="text-lg text-muted-foreground">
            URL, 텍스트, 연락처 등을 QR 코드로 변환하여 쉽게 공유하세요
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 설정 패널 */}
        <div className="space-y-6">
          {/* 데이터 타입 선택 */}
          <Card className="card-editorial">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                QR 코드 유형
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {dataTypes.map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant={qrData.type === value ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "justify-start h-auto p-3",
                      qrData.type === value && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => setQRData({ type: value, value: '' })}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    <span className="text-xs">{label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 데이터 입력 */}
          <Card className="card-editorial">
            <CardHeader>
              <CardTitle>내용 입력</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderDataInput()}
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* 고급 설정 */}
          <Card className="card-editorial">
            <CardHeader>
              <CardTitle 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  고급 설정
                </div>
                <Button variant="ghost" size="sm">
                  {showAdvanced ? '접기' : '펼치기'}
                </Button>
              </CardTitle>
            </CardHeader>
            {showAdvanced && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>크기</Label>
                  <Select
                    value={qrOptions.width.toString()}
                    onValueChange={(value) => 
                      setQROptions({ ...qrOptions, width: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="128">128px (소)</SelectItem>
                      <SelectItem value="256">256px (중)</SelectItem>
                      <SelectItem value="512">512px (대)</SelectItem>
                      <SelectItem value="1024">1024px (매우 큰)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>오류 수정 레벨</Label>
                  <Select
                    value={qrOptions.errorCorrectionLevel}
                    onValueChange={(value: 'L' | 'M' | 'Q' | 'H') =>
                      setQROptions({ ...qrOptions, errorCorrectionLevel: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">낮음 (~7%)</SelectItem>
                      <SelectItem value="M">보통 (~15%)</SelectItem>
                      <SelectItem value="Q">높음 (~25%)</SelectItem>
                      <SelectItem value="H">최고 (~30%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>색상</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dark-color" className="text-xs">전경색</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="dark-color"
                          type="color"
                          value={qrOptions.color.dark}
                          onChange={(e) =>
                            setQROptions({
                              ...qrOptions,
                              color: { ...qrOptions.color, dark: e.target.value }
                            })
                          }
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          value={qrOptions.color.dark}
                          onChange={(e) =>
                            setQROptions({
                              ...qrOptions,
                              color: { ...qrOptions.color, dark: e.target.value }
                            })
                          }
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="light-color" className="text-xs">배경색</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="light-color"
                          type="color"
                          value={qrOptions.color.light}
                          onChange={(e) =>
                            setQROptions({
                              ...qrOptions,
                              color: { ...qrOptions.color, light: e.target.value }
                            })
                          }
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          value={qrOptions.color.light}
                          onChange={(e) =>
                            setQROptions({
                              ...qrOptions,
                              color: { ...qrOptions.color, light: e.target.value }
                            })
                          }
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* 미리보기 및 다운로드 */}
        <div className="space-y-6">
          <Card className="card-editorial">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                미리보기
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="w-64 h-64 border-2 border-dashed border-muted rounded-lg flex items-center justify-center bg-muted/20">
                  {isGenerating ? (
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">생성 중...</p>
                    </div>
                  ) : qrImage ? (
                    <img 
                      src={qrImage} 
                      alt="QR Code" 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        내용을 입력하면<br />QR 코드가 생성됩니다
                      </p>
                    </div>
                  )}
                </div>

                {qrImage && !isGenerating && (
                  <div className="flex gap-2 w-full">
                    <Button 
                      onClick={() => handleDownload('png')}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PNG 다운로드
                    </Button>
                    <Button 
                      onClick={() => handleDownload('svg')}
                      variant="outline"
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      SVG 다운로드
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 사용법 안내 */}
          <Card className="card-editorial border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-blue-800">사용법</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-700 space-y-2">
              <p>1. 위에서 QR 코드 유형을 선택하세요</p>
              <p>2. 해당하는 내용을 입력하세요</p>
              <p>3. 고급 설정에서 크기와 색상을 조정할 수 있습니다</p>
              <p>4. 미리보기를 확인하고 원하는 형식으로 다운로드하세요</p>
              <Separator className="bg-blue-200" />
              <p className="text-xs">
                💡 <strong>팁:</strong> 더 많은 QR 코드를 한번에 만들고 관리하고 싶다면{' '}
                <Link href="/tools/smart-link-generator" className="underline font-medium">
                  스마트 링크 도구 (프리미엄)
                </Link>를 이용해보세요!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolPageLayout>
  )
}