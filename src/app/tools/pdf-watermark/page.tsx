'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Download, FileText, Loader2, Eye, Settings } from 'lucide-react'

interface WatermarkSettings {
  text: string
  fontSize: number
  opacity: number
  color: string
  fontFamily: string
  rotation: number
  position: 'bottom' | 'top' | 'center'
  offsetFromBottom: number // mm
}

export default function PDFWatermarkPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [watermarkSettings, setWatermarkSettings] = useState<WatermarkSettings>({
    text: '',
    fontSize: 24,
    opacity: 0.3,
    color: '#808080',
    fontFamily: 'Arial',
    rotation: 0,
    position: 'bottom',
    offsetFromBottom: 40 // 40mm
  })

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      alert('PDF 파일만 업로드할 수 있습니다')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('파일 크기는 50MB 이하만 가능합니다')
      return
    }

    setSelectedFile(file)
    alert('PDF 파일이 선택되었습니다')
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    const file = files[0]
    
    if (!file) return

    if (file.type !== 'application/pdf') {
      alert('PDF 파일만 업로드할 수 있습니다')
      return
    }

    setSelectedFile(file)
    alert('PDF 파일이 업로드되었습니다')
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const applyWatermark = async () => {
    if (!selectedFile || !watermarkSettings.text.trim()) {
      alert('PDF 파일과 워터마크 텍스트를 입력해주세요')
      return
    }

    setProcessing(true)

    try {
      // PDF 파일을 ArrayBuffer로 읽기
      const arrayBuffer = await selectedFile.arrayBuffer()
      
      // ArrayBuffer 복사 (detached 문제 방지)
      const pdfBuffer = new Uint8Array(arrayBuffer).slice()
      
      // PDF-lib 동적 임포트
      const { PDFDocument, rgb, degrees } = await import('pdf-lib')
      
      // PDF 문서 로드
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      const pages = pdfDoc.getPages()

      // 워터마크 설정
      const { text, fontSize, opacity, color, rotation, offsetFromBottom } = watermarkSettings
      
      // 색상 변환 (hex to rgb)
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255,
        } : { r: 0.5, g: 0.5, b: 0.5 }
      }

      const { r, g, b } = hexToRgb(color)
      
      // Canvas를 이용해 텍스트를 이미지로 변환
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      // 고해상도를 위한 스케일링
      const scale = 2
      
      // 텍스트 스타일 설정 (먼저 설정해서 정확한 텍스트 크기 측정)
      ctx.font = `${fontSize}px Arial, sans-serif`
      const textMetrics = ctx.measureText(text)
      const textWidth = textMetrics.width
      const textHeight = fontSize
      
      // 회전 각도에 따른 바운딩 박스 계산
      const rotationRad = (Math.abs(rotation) * Math.PI) / 180
      const rotatedWidth = textWidth * Math.abs(Math.cos(rotationRad)) + textHeight * Math.abs(Math.sin(rotationRad))
      const rotatedHeight = textWidth * Math.abs(Math.sin(rotationRad)) + textHeight * Math.abs(Math.cos(rotationRad))
      
      // 회전된 텍스트를 완전히 포함할 수 있는 캔버스 크기 계산 (충분한 여유 공간 포함)
      const padding = Math.max(textWidth, textHeight) * 0.5 // 동적 패딩
      const canvasWidth = Math.ceil(rotatedWidth + padding * 2)
      const canvasHeight = Math.ceil(rotatedHeight + padding * 2)
      
      // 캔버스 크기 설정
      canvas.width = canvasWidth * scale
      canvas.height = canvasHeight * scale
      
      // 스케일링 적용
      ctx.scale(scale, scale)
      
      // 텍스트 스타일 재설정
      ctx.font = `${fontSize}px Arial, sans-serif`
      ctx.fillStyle = color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.globalAlpha = opacity
      
      // 회전 적용 (캔버스 중앙을 기준으로)
      const centerX = canvasWidth / 2
      const centerY = canvasHeight / 2
      
      ctx.translate(centerX, centerY)
      if (rotation !== 0) {
        ctx.rotate((rotation * Math.PI) / 180)
      }
      ctx.fillText(text, 0, 0)
      
      // 캔버스를 PNG 이미지로 변환
      const imageDataUrl = canvas.toDataURL('image/png')
      const imageBytes = await fetch(imageDataUrl).then(res => res.arrayBuffer())
      
      // PDF에 이미지 임베드
      const image = await pdfDoc.embedPng(imageBytes)
      
      // 모든 페이지에 이미지 워터마크 추가
      for (const page of pages) {
        const { width, height } = page.getSize()
        
        // mm를 포인트로 변환 (1mm = 2.834645669 points)
        const offsetPoints = offsetFromBottom * 2.834645669
        
        // 이미지 크기 계산 (PDF 포인트 단위로) - 회전된 크기 고려
        const imgWidth = (canvasWidth / scale) * 0.75 // 실제 캔버스 크기 기반
        const imgHeight = (canvasHeight / scale) * 0.75
        
        // 이미지 위치 계산 (중앙 정렬)
        const x = (width - imgWidth) / 2
        const y = offsetPoints
        
        page.drawImage(image, {
          x,
          y,
          width: imgWidth,
          height: imgHeight,
          opacity: opacity
        })
      }

      // 수정된 PDF 생성
      const pdfBytes = await pdfDoc.save()
      
      // 다운로드용 Blob 생성
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      
      // 파일 다운로드
      const link = document.createElement('a')
      link.href = url
      link.download = `watermark_${selectedFile.name}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      alert('워터마크가 적용된 PDF가 다운로드되었습니다')

    } catch (error) {
      alert('워터마크 적용 중 오류가 발생했습니다')
    } finally {
      setProcessing(false)
    }
  }

  const updateWatermarkSetting = <K extends keyof WatermarkSettings>(
    key: K,
    value: WatermarkSettings[K]
  ) => {
    setWatermarkSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileText className="w-10 h-10 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">PDF 워터마크</h1>
            </div>
            <p className="text-gray-600 text-lg">
              PDF 파일에 워터마크 텍스트를 추가하세요
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 파일 업로드 및 설정 */}
            <div className="space-y-6">
              {/* 파일 업로드 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    PDF 파일 업로드
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      PDF 파일을 드래그하거나 클릭하여 선택
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      최대 50MB까지 업로드 가능
                    </p>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <label htmlFor="pdf-upload">
                      <Button variant="outline" className="cursor-pointer" asChild>
                        <span>파일 선택</span>
                      </Button>
                    </label>
                  </div>
                  {selectedFile && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-green-800">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-green-600">
                              {(selectedFile.size / 1024 / 1024).toFixed(1)} MB • PDF 문서
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedFile(null)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 워터마크 설정 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    워터마크 설정
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 워터마크 텍스트 */}
                  <div className="space-y-2">
                    <Label htmlFor="watermark-text">워터마크 텍스트</Label>
                    <Textarea
                      id="watermark-text"
                      placeholder="워터마크로 사용할 텍스트를 입력하세요"
                      value={watermarkSettings.text}
                      onChange={(e) => updateWatermarkSetting('text', e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* 폰트 크기 */}
                  <div className="space-y-3">
                    <Label>폰트 크기: {watermarkSettings.fontSize}px</Label>
                    <Slider
                      value={[watermarkSettings.fontSize]}
                      onValueChange={([value]) => updateWatermarkSetting('fontSize', value)}
                      min={8}
                      max={72}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* 투명도 */}
                  <div className="space-y-3">
                    <Label>투명도: {Math.round(watermarkSettings.opacity * 100)}%</Label>
                    <Slider
                      value={[watermarkSettings.opacity]}
                      onValueChange={([value]) => updateWatermarkSetting('opacity', value)}
                      min={0.1}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {/* 색상 */}
                  <div className="space-y-2">
                    <Label htmlFor="watermark-color">색상</Label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        id="watermark-color"
                        value={watermarkSettings.color}
                        onChange={(e) => updateWatermarkSetting('color', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <Input
                        value={watermarkSettings.color}
                        onChange={(e) => updateWatermarkSetting('color', e.target.value)}
                        placeholder="#808080"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* 회전 각도 */}
                  <div className="space-y-3">
                    <Label>회전 각도: {watermarkSettings.rotation}°</Label>
                    <Slider
                      value={[watermarkSettings.rotation]}
                      onValueChange={([value]) => updateWatermarkSetting('rotation', value)}
                      min={-180}
                      max={180}
                      step={15}
                      className="w-full"
                    />
                  </div>

                  {/* 하단 간격 */}
                  <div className="space-y-3">
                    <Label>하단 간격: {watermarkSettings.offsetFromBottom}mm</Label>
                    <Slider
                      value={[watermarkSettings.offsetFromBottom]}
                      onValueChange={([value]) => updateWatermarkSetting('offsetFromBottom', value)}
                      min={10}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 미리보기 및 처리 */}
            <div className="space-y-6">
              {/* 미리보기 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    워터마크 미리보기
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border border-gray-200 rounded-lg bg-white min-h-64 relative flex items-center justify-center">
                    {watermarkSettings.text ? (
                      <div className="text-center p-6">
                        <div
                          className="inline-block border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 relative overflow-hidden"
                          style={{
                            width: '180px',
                            height: '246px', // 188:257 비율에 맞춤 (180px * 257 / 188)
                            maxWidth: '180px'
                          }}
                        >
                          {/* PDF 문서 헤더 */}
                          <div className="absolute top-0 left-0 right-0 p-3">
                            <div className="text-xs text-gray-400 mb-2">PDF 문서</div>
                            <div className="h-1.5 bg-gray-200 rounded mb-1.5"></div>
                            <div className="h-1.5 bg-gray-200 rounded w-3/4 mb-1.5"></div>
                            <div className="h-1.5 bg-gray-200 rounded w-1/2 mb-1.5"></div>
                            <div className="h-1.5 bg-gray-200 rounded w-2/3 mb-1.5"></div>
                            <div className="h-1.5 bg-gray-200 rounded w-4/5"></div>
                          </div>
                          
                          {/* 워터마크 미리보기 - 실제 비율 반영 */}
                          <div
                            className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none select-none font-medium"
                            style={{
                              bottom: `${Math.max((watermarkSettings.offsetFromBottom / 257) * 246, 8)}px`, // 실제 비율 적용
                              fontSize: `${Math.max(watermarkSettings.fontSize * 0.35, 7)}px`,
                              opacity: watermarkSettings.opacity,
                              color: watermarkSettings.color,
                              transform: `translateX(-50%) rotate(${watermarkSettings.rotation}deg)`,
                              transformOrigin: 'center center',
                              whiteSpace: 'nowrap',
                              // 회전을 고려한 동적 크기 조정
                              width: 'auto',
                              minWidth: 'fit-content'
                            }}
                          >
                            {watermarkSettings.text}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                          A4 크기 미리보기 (188×257mm)
                        </p>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400">
                        <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">워터마크 텍스트를 입력하면<br />미리보기가 표시됩니다</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 처리 버튼 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    워터마크 적용
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={applyWatermark}
                    disabled={!selectedFile || !watermarkSettings.text.trim() || processing}
                    className="w-full"
                    size="lg"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        워터마크 적용 중...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 mr-2" />
                        워터마크 적용하기
                      </>
                    )}
                  </Button>
                  
                  {/* 진행 상태 표시 */}
                  {processing && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">워터마크 적용 중...</p>
                          <p className="text-xs text-blue-600">PDF 파일을 처리하고 있습니다</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 사용 안내 */}
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p>모든 페이지에 워터마크가 적용됩니다</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p>원본 파일은 수정되지 않습니다</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p>처리된 파일은 자동으로 다운로드됩니다</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p>한글/영문 모든 텍스트 지원</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}