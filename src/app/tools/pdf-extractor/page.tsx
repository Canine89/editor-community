'use client'

import { useState } from 'react'
import { AuthRequired } from '@/components/auth/AuthRequired'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ToolPageLayout } from '@/components/layout/PageLayout'
import { FileUpload } from '@/components/ui/file-upload'
import { SimpleProgress } from '@/components/ui/progress-steps'
import {
  ArrowLeft,
  Scissors,
  Download,
  FileText,
  AlertCircle,
  Info,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { PDFDocument } from 'pdf-lib'
import { cn } from '@/lib/utils'

interface ExtractedInfo {
  totalPages: number
  fileName: string
  fileSize: string
}

interface QuickOption {
  label: string
  description: string
  getRange: (total: number) => { start: number; end: number }
}

const quickOptions: QuickOption[] = [
  {
    label: '첫 페이지',
    description: '표지 또는 첫 번째 페이지만',
    getRange: () => ({ start: 1, end: 1 })
  },
  {
    label: '전반부',
    description: '문서의 앞쪽 절반',
    getRange: (total) => ({ start: 1, end: Math.ceil(total / 2) })
  },
  {
    label: '후반부', 
    description: '문서의 뒤쪽 절반',
    getRange: (total) => ({ start: Math.ceil(total / 2) + 1, end: total })
  },
  {
    label: '마지막 페이지',
    description: '문서의 마지막 페이지만',
    getRange: (total) => ({ start: total, end: total })
  }
]

function PDFExtractorContent() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo | null>(null)
  const [startPage, setStartPage] = useState('')
  const [endPage, setEndPage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [extractionComplete, setExtractionComplete] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [extractedFileName, setExtractedFileName] = useState('')

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileSelect = async (file: File) => {
    setError('')
    setSelectedFile(file)
    setCurrentStep(2)
    
    setProgress(10)
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      setProgress(30)
      
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      setProgress(50)
      
      const info = {
        totalPages: pdfDoc.getPageCount(),
        fileName: file.name,
        fileSize: formatFileSize(file.size)
      }
      
      setExtractedInfo(info)
      setProgress(100)
      
      // 기본값 설정
      setStartPage('1')
      setEndPage(info.totalPages.toString())
      
      // 잠깐 후 다음 단계로
      setTimeout(() => {
        setCurrentStep(2)
        setProgress(0)
      }, 500)
      
    } catch (error) {
      console.error('PDF 로드 오류:', error)
      setError('PDF 파일을 읽는데 실패했습니다. 파일이 손상되었거나 암호화되어 있을 수 있습니다.')
      setSelectedFile(null)
      setExtractedInfo(null)
      setCurrentStep(1)
      setProgress(0)
    }
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
    setExtractedInfo(null)
    setStartPage('')
    setEndPage('')
    setError('')
    setCurrentStep(1)
    setProgress(0)
    setExtractionComplete(false)
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl)
      setDownloadUrl(null)
    }
  }

  const handleQuickSelect = (option: QuickOption) => {
    if (!extractedInfo) return
    
    const range = option.getRange(extractedInfo.totalPages)
    setStartPage(range.start.toString())
    setEndPage(range.end.toString())
  }

  const validateRange = (): string | null => {
    if (!extractedInfo) return '파일 정보를 찾을 수 없습니다.'
    
    const start = parseInt(startPage)
    const end = parseInt(endPage)

    if (isNaN(start) || isNaN(end)) {
      return '페이지 번호는 숫자여야 합니다.'
    }

    if (start < 1 || end < 1) {
      return '페이지 번호는 1 이상이어야 합니다.'
    }

    if (start > extractedInfo.totalPages || end > extractedInfo.totalPages) {
      return `페이지 번호는 ${extractedInfo.totalPages} 이하여야 합니다.`
    }

    if (start > end) {
      return '시작 페이지는 끝 페이지보다 작거나 같아야 합니다.'
    }

    return null
  }

  const handleExtract = async () => {
    if (!selectedFile || !extractedInfo) return

    const validationError = validateRange()
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setIsProcessing(true)
    setCurrentStep(3)
    setProgress(0)

    try {
      // 1. PDF 로드
      setProgress(20)
      const arrayBuffer = await selectedFile.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)

      // 2. 새 PDF 생성
      setProgress(40)
      const newPdfDoc = await PDFDocument.create()
      
      // 3. 페이지 복사
      const start = parseInt(startPage)
      const end = parseInt(endPage)
      const pageIndices = []
      for (let i = start - 1; i < end; i++) {
        pageIndices.push(i)
      }

      setProgress(60)
      const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices)
      copiedPages.forEach((page) => newPdfDoc.addPage(page))

      // 4. PDF 생성
      setProgress(80)
      const pdfBytes = await newPdfDoc.save()

      // 5. 다운로드 준비
      setProgress(90)
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      
      // 파일명 생성
      const baseName = selectedFile.name.replace('.pdf', '')
      const fileName = start === end 
        ? `${baseName}_page_${start}.pdf`
        : `${baseName}_pages_${start}-${end}.pdf`

      setDownloadUrl(url)
      setExtractedFileName(fileName)
      
      setProgress(100)
      setExtractionComplete(true)
      
      // 자동 다운로드
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error('PDF 추출 오류:', error)
      setError('PDF 추출 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setExtractedInfo(null)
    setStartPage('')
    setEndPage('')
    setError('')
    setCurrentStep(1)
    setProgress(0)
    setIsProcessing(false)
    setExtractionComplete(false)
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl)
      setDownloadUrl(null)
    }
  }

  const stepLabels = ['파일 선택', '페이지 설정', '추출 & 다운로드']

  return (
    <ToolPageLayout>
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild className="hover-lift-editorial">
          <Link href="/tools">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 gradient-accent rounded-2xl flex items-center justify-center">
              <Scissors className="w-5 h-5 text-accent-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-gradient-editorial">PDF 페이지 추출기</h1>
            <Badge className="gradient-accent text-accent-foreground">
              <Zap className="w-3 h-3 mr-1" />
              PRO
            </Badge>
          </div>
          <p className="text-muted-foreground text-lg">원하는 페이지만 정밀하게 추출하여 새로운 PDF를 생성합니다</p>
        </div>
      </div>

      {/* 진행상황 */}
      <SimpleProgress
        currentStep={currentStep}
        totalSteps={3}
        stepLabels={stepLabels}
        className="mb-8"
      />

      {/* 안내사항 */}
      <Alert className="mb-8 border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-foreground">
          <strong>개인정보 보호:</strong> 모든 파일 처리는 브라우저에서만 이루어지며 서버로 전송되지 않습니다.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* 메인 워크플로우 */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1단계: 파일 업로드 */}
          <Card className={cn(
            'card-editorial transition-all duration-300',
            currentStep >= 1 && 'shadow-lg',
            currentStep === 1 && 'ring-2 ring-primary/20'
          )}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  1
                </div>
                PDF 파일 선택
                {selectedFile && currentStep > 1 && (
                  <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                accept=".pdf"
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                selectedFile={selectedFile}
                title="PDF 파일을 업로드하세요"
                description="파일을 드래그하거나 클릭하여 선택하세요"
                loading={currentStep === 2 && progress > 0 && progress < 100}
                progress={currentStep === 2 ? progress : undefined}
                error={currentStep === 1 ? error : ''}
              />
            </CardContent>
          </Card>

          {/* 2단계: 페이지 범위 설정 */}
          {extractedInfo && (
            <Card className={cn(
              'card-editorial transition-all duration-300',
              currentStep >= 2 && 'shadow-lg',
              currentStep === 2 && 'ring-2 ring-primary/20'
            )}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                    currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    2
                  </div>
                  페이지 범위 설정
                  {startPage && endPage && currentStep > 2 && (
                    <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 파일 정보 */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{extractedInfo.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        총 {extractedInfo.totalPages}페이지 • {extractedInfo.fileSize}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 빠른 선택 옵션 */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">빠른 선택</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {quickOptions.map((option) => (
                      <Button
                        key={option.label}
                        variant="outline"
                        onClick={() => handleQuickSelect(option)}
                        className="h-auto p-3 text-left justify-start hover-lift-editorial"
                      >
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 수동 입력 */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">직접 입력</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startPage" className="text-sm">시작 페이지</Label>
                      <Input
                        id="startPage"
                        type="number"
                        min="1"
                        max={extractedInfo.totalPages}
                        value={startPage}
                        onChange={(e) => setStartPage(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endPage" className="text-sm">끝 페이지</Label>
                      <Input
                        id="endPage"
                        type="number"
                        min="1"
                        max={extractedInfo.totalPages}
                        value={endPage}
                        onChange={(e) => setEndPage(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* 추출 미리보기 */}
                {startPage && endPage && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Scissors className="w-4 h-4" />
                      <span className="font-medium">추출 예정</span>
                    </div>
                    <p className="text-sm text-foreground mt-1">
                      {startPage === endPage 
                        ? `${startPage}페이지 (1페이지)`
                        : `${startPage}~${endPage}페이지 (${parseInt(endPage) - parseInt(startPage) + 1}페이지)`
                      }
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => setCurrentStep(3)}
                  disabled={!startPage || !endPage || !!validateRange()}
                  className="w-full hover-lift-editorial"
                >
                  다음 단계로
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* 3단계: 추출 및 다운로드 */}
          {currentStep >= 3 && (
            <Card className="card-editorial shadow-lg ring-2 ring-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  PDF 추출 및 다운로드
                  {extractionComplete && (
                    <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!extractionComplete ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <Download className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">PDF 추출 준비 완료</h3>
                    <p className="text-muted-foreground mb-6">
                      설정한 페이지 범위로 새로운 PDF를 생성합니다
                    </p>
                    
                    <Button
                      onClick={handleExtract}
                      disabled={isProcessing}
                      size="lg"
                      className="hover-lift-editorial"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          추출 중... {progress}%
                        </>
                      ) : (
                        <>
                          <Scissors className="w-4 h-4 mr-2" />
                          PDF 추출하기
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-primary mb-2">추출 완료!</h3>
                    <p className="text-muted-foreground mb-6">
                      PDF 파일이 성공적으로 추출되었습니다
                    </p>
                    
                    <div className="flex gap-3 justify-center">
                      {downloadUrl && (
                        <Button asChild size="lg" className="hover-lift-editorial">
                          <a href={downloadUrl} download={extractedFileName}>
                            <Download className="w-4 h-4 mr-2" />
                            다시 다운로드
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={resetForm}
                        size="lg"
                        className="hover-lift-editorial"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        새로 시작
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 사이드바 - 도움말 */}
        <div className="space-y-6">
          {/* 사용법 가이드 */}
          <Card className="card-editorial">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                사용법 가이드
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-bold text-primary">1.</span>
                  PDF 파일을 드래그하거나 클릭하여 업로드
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">2.</span>
                  빠른 선택 또는 직접 입력으로 페이지 범위 설정
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">3.</span>
                  추출 버튼 클릭 시 자동으로 다운로드 시작
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 기능 특징 */}
          <Card className="card-editorial">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                PRO 기능
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 빠른 페이지 선택 옵션</li>
                <li>• 실시간 추출 미리보기</li>
                <li>• 자동 파일명 생성</li>
                <li>• 진행률 표시</li>
                <li>• 드래그 앤 드롭 지원</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 오류 메시지 */}
      {error && currentStep > 1 && (
        <Alert className="mt-6 border-destructive/20 bg-destructive/5">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </ToolPageLayout>
  )
}

export default function PDFExtractorPage() {
  return (
    <AuthRequired 
      requireAuth={true} 
      requireRole="premium" 
      featureName="PDF 페이지 추출기"
      fallbackMessage="구글 로그인 후 프리미엄으로 업그레이드하시면 PDF 페이지 추출기를 사용하실 수 있습니다! PDF 파일의 특정 페이지를 정밀하게 추출하는 고급 기능을 제공합니다."
    >
      <PDFExtractorContent />
    </AuthRequired>
  )
}