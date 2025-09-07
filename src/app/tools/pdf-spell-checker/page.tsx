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
  FileText,
  FileSpreadsheet,
  Search,
  AlertCircle,
  Info,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Zap,
  Copy,
  Check,
  Settings,
  FileSearch
} from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import { cn } from '@/lib/utils'

// PDF.js worker 설정
if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs'
}

interface CorrectionPair {
  wrong: string
  correct: string
}

interface CorrectionMatch {
  original: string
  corrected: string
  startIndex: number
  endIndex: number
  pageIndex: number
}

interface MarginSettings {
  vertical: number
  horizontal: number
}

interface PDFPageContent {
  pageNumber: number
  content: string
  originalContent: string
}

interface PDFInfo {
  fileName: string
  fileSize: string
  totalPages: number
  pages: PDFPageContent[]
}

function PDFSpellCheckerContent() {
  const [currentStep, setCurrentStep] = useState(1)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [pdfDoc, setPdfDoc] = useState<PDFInfo | null>(null)
  const [corrections, setCorrections] = useState<CorrectionPair[]>([])
  const [matches, setMatches] = useState<CorrectionMatch[]>([])
  const [margins, setMargins] = useState<MarginSettings>({
    vertical: 15,
    horizontal: 15
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [copiedPages, setCopiedPages] = useState<Set<number>>(new Set())

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const mmToPt = (mm: number): number => {
    return mm * 2.834645669
  }

  const extractTextFromPDF = async (file: File): Promise<PDFPageContent[]> => {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await getDocument({ data: arrayBuffer }).promise
    const pages: PDFPageContent[] = []

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const viewport = page.getViewport({ scale: 1 })

      const verticalMargin = mmToPt(margins.vertical)
      const horizontalMargin = mmToPt(margins.horizontal)

      let fullText = ''
      let bodyText = ''

      textContent.items.forEach((item: any) => {
        if (item.str && item.transform) {
          const x = item.transform[4]
          const y = item.transform[5]

          fullText += item.str + ' '

          if (
            x >= horizontalMargin &&
            x <= viewport.width - horizontalMargin &&
            y >= verticalMargin &&
            y <= viewport.height - verticalMargin
          ) {
            bodyText += item.str + ' '
          }
        }
      })

      pages.push({
        pageNumber: pageNum,
        content: bodyText.trim(),
        originalContent: fullText.trim()
      })
    }

    return pages
  }

  const handlePDFFileSelect = async (file: File) => {
    setError('')
    setPdfFile(file)

    try {
      const pages = await extractTextFromPDF(file)
      
      setPdfDoc({
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        totalPages: pages.length,
        pages
      })

      if (excelFile && corrections.length > 0) {
        setCurrentStep(2)
      }
    } catch (error) {
      console.error('PDF 파일 로드 오류:', error)
      setError('PDF 파일을 읽는데 실패했습니다. 파일이 손상되었거나 암호화되어 있을 수 있습니다.')
      setPdfFile(null)
      setPdfDoc(null)
    }
  }

  const handleExcelFileSelect = async (file: File) => {
    setError('')
    setExcelFile(file)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      
      const correctionPairs: CorrectionPair[] = []
      
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]

        for (let i = 0; i < data.length; i++) {
          const row = data[i]
          if (row && row[0] && row[1] && row[0].toString().trim() && row[1].toString().trim()) {
            correctionPairs.push({
              wrong: row[0].toString().trim(),
              correct: row[1].toString().trim()
            })
          }
        }
      })

      if (correctionPairs.length === 0) {
        setError('Excel 파일의 A열(틀린 표현), B열(올바른 표현)에 데이터가 없습니다.')
        return
      }

      setCorrections(correctionPairs)

      if (pdfFile && pdfDoc) {
        setCurrentStep(2)
      }
    } catch (error) {
      console.error('Excel 파일 로드 오류:', error)
      setError('Excel 파일을 읽는데 실패했습니다. 파일이 손상되었을 수 있습니다.')
      setExcelFile(null)
      setCorrections([])
    }
  }

  const analyzeDocument = async () => {
    if (!pdfDoc || corrections.length === 0) return

    setIsProcessing(true)
    setCurrentStep(3)
    setError('')

    try {
      const foundMatches: CorrectionMatch[] = []

      pdfDoc.pages.forEach((page, pageIndex) => {
        corrections.forEach(correction => {
          const wrongText = correction.wrong.toLowerCase()
          const pageContentLower = page.content.toLowerCase()
          
          let index = 0
          while ((index = pageContentLower.indexOf(wrongText, index)) !== -1) {
            foundMatches.push({
              original: correction.wrong,
              corrected: correction.correct,
              startIndex: index,
              endIndex: index + correction.wrong.length,
              pageIndex
            })
            index += correction.wrong.length
          }
        })
      })

      setMatches(foundMatches)
    } catch (error) {
      console.error('PDF 분석 오류:', error)
      setError('PDF 분석 중 오류가 발생했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setPdfFile(null)
    setExcelFile(null)
    setPdfDoc(null)
    setCorrections([])
    setMatches([])
    setError('')
    setIsProcessing(false)
    setCopiedPages(new Set())
  }

  const highlightText = (text: string, matches: CorrectionMatch[], pageIndex: number) => {
    const pageMatches = matches.filter(match => match.pageIndex === pageIndex)
    if (pageMatches.length === 0) return text

    let result = text
    let offset = 0

    pageMatches
      .sort((a, b) => a.startIndex - b.startIndex)
      .forEach(match => {
        const beforeMatch = result.slice(0, match.startIndex + offset)
        const matchText = result.slice(match.startIndex + offset, match.endIndex + offset)
        const afterMatch = result.slice(match.endIndex + offset)
        
        const highlighted = `<mark class="bg-red-200 text-red-900 px-1 rounded">${matchText}</mark> → <mark class="bg-green-200 text-green-900 px-1 rounded">${match.corrected}</mark>`
        
        result = beforeMatch + highlighted + afterMatch
        offset += highlighted.length - matchText.length
      })

    return result
  }

  const copyToClipboard = async (text: string, pageIndex: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedPages(prev => new Set([...prev, pageIndex]))
      setTimeout(() => {
        setCopiedPages(prev => {
          const newSet = new Set(prev)
          newSet.delete(pageIndex)
          return newSet
        })
      }, 2000)
    } catch (error) {
      console.error('클립보드 복사 오류:', error)
    }
  }

  const stepLabels = ['파일 & 설정', '분석 시작', '결과 확인']

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
              <FileSearch className="w-5 h-5 text-accent-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-gradient-editorial">PDF 맞춤법 검사기</h1>
            <Badge className="gradient-accent text-accent-foreground">
              <Zap className="w-3 h-3 mr-1" />
              PRO
            </Badge>
          </div>
          <p className="text-muted-foreground text-lg">PDF 문서의 본문 영역에서 맞춤법을 검사하고 교정사항을 찾습니다</p>
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
          <strong>스마트 분석:</strong> 여백을 제외한 본문 영역만 검사하여 더 정확한 맞춤법 검사를 제공합니다.
          여백 설정을 통해 검사 영역을 조정할 수 있습니다.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* 메인 워크플로우 */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1단계: 파일 업로드 & 설정 */}
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
                파일 업로드 & 여백 설정
                {pdfDoc && corrections.length > 0 && currentStep > 1 && (
                  <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* PDF 파일 업로드 */}
              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  PDF 문서 (.pdf)
                </h4>
                <FileUpload
                  accept=".pdf"
                  onFileSelect={handlePDFFileSelect}
                  onFileRemove={() => {
                    setPdfFile(null)
                    setPdfDoc(null)
                    if (currentStep > 1) setCurrentStep(1)
                  }}
                  selectedFile={pdfFile}
                  title="PDF 문서를 업로드하세요"
                  description="맞춤법을 검사할 문서를 선택해주세요"
                />
              </div>

              {/* Excel 파일 업로드 */}
              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-accent" />
                  Excel 교정 데이터 (.xlsx, .xls)
                </h4>
                <FileUpload
                  accept=".xlsx,.xls"
                  onFileSelect={handleExcelFileSelect}
                  onFileRemove={() => {
                    setExcelFile(null)
                    setCorrections([])
                    if (currentStep > 1) setCurrentStep(1)
                  }}
                  selectedFile={excelFile}
                  title="Excel 파일을 업로드하세요"
                  description="A열: 틀린 표현, B열: 올바른 표현"
                />
              </div>

              {/* 여백 설정 */}
              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />
                  여백 설정 (mm)
                </h4>
                <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    설정한 여백 안쪽 영역만 검사하여 헤더, 푸터, 페이지 번호 등을 제외합니다.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vertical" className="text-sm">상하 여백</Label>
                      <Input
                        id="vertical"
                        type="number"
                        min="0"
                        max="50"
                        value={margins.vertical}
                        onChange={(e) => setMargins(prev => ({
                          ...prev,
                          vertical: Number(e.target.value)
                        }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="horizontal" className="text-sm">좌우 여백</Label>
                      <Input
                        id="horizontal"
                        type="number"
                        min="0"
                        max="50"
                        value={margins.horizontal}
                        onChange={(e) => setMargins(prev => ({
                          ...prev,
                          horizontal: Number(e.target.value)
                        }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMargins({ vertical: 15, horizontal: 15 })}
                    >
                      표준 (15mm)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMargins({ vertical: 20, horizontal: 20 })}
                    >
                      넓게 (20mm)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMargins({ vertical: 10, horizontal: 10 })}
                    >
                      좁게 (10mm)
                    </Button>
                  </div>
                </div>
              </div>

              {/* 파일 정보 */}
              {(pdfDoc || corrections.length > 0) && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  {pdfDoc && (
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">{pdfDoc.fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          {pdfDoc.totalPages}페이지 • {pdfDoc.fileSize}
                        </p>
                      </div>
                    </div>
                  )}
                  {corrections.length > 0 && (
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-5 h-5 text-accent" />
                      <div>
                        <p className="font-medium text-foreground">{excelFile?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {corrections.length}개 교정 규칙 로드됨
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {pdfDoc && corrections.length > 0 && (
                <Button
                  onClick={() => setCurrentStep(2)}
                  className="w-full hover-lift-editorial"
                >
                  다음 단계로
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>

          {/* 2단계: 분석 시작 */}
          {currentStep >= 2 && (
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
                  PDF 맞춤법 분석
                  {matches.length > 0 && (
                    <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <FileSearch className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">스마트 분석 준비 완료</h3>
                  <p className="text-muted-foreground mb-2">
                    여백 {margins.vertical}×{margins.horizontal}mm 설정으로 본문 영역만 검사합니다
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    {corrections.length}개 교정 규칙로 {pdfDoc?.totalPages}페이지를 정밀 검사합니다
                  </p>
                  
                  <Button
                    onClick={analyzeDocument}
                    disabled={isProcessing}
                    size="lg"
                    className="hover-lift-editorial"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        분석 중...
                      </>
                    ) : (
                      <>
                        <FileSearch className="w-4 h-4 mr-2" />
                        맞춤법 검사 시작
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3단계: 결과 */}
          {matches.length > 0 && (
            <Card className="card-editorial shadow-lg ring-2 ring-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  맞춤법 검사 결과 ({matches.length}개 발견)
                  <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                  <p className="text-primary font-semibold">
                    총 {matches.length}개의 맞춤법 오류를 발견했습니다.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    여백 {margins.vertical}×{margins.horizontal}mm 안쪽 본문 영역에서 검출된 결과입니다.
                  </p>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Array.from(new Set(matches.map(m => m.pageIndex))).map(pageIndex => {
                    const pageMatches = matches.filter(m => m.pageIndex === pageIndex)
                    const pageContent = pdfDoc!.pages[pageIndex].content
                    
                    return (
                      <div key={pageIndex} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-muted-foreground">
                            {pdfDoc!.pages[pageIndex].pageNumber}페이지 ({pageMatches.length}개 오류)
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(pageContent, pageIndex)}
                            className="hover-lift-editorial"
                          >
                            {copiedPages.has(pageIndex) ? (
                              <Check className="w-3 h-3 mr-1" />
                            ) : (
                              <Copy className="w-3 h-3 mr-1" />
                            )}
                            {copiedPages.has(pageIndex) ? '복사됨' : '복사'}
                          </Button>
                        </div>
                        <div
                          className="text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: highlightText(pageContent, matches, pageIndex)
                          }}
                        />
                      </div>
                    )
                  })}
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="hover-lift-editorial"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    새로 시작
                  </Button>
                </div>
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
                  PDF 문서와 Excel 교정 데이터 업로드
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">2.</span>
                  여백 설정으로 검사할 본문 영역 조정
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">3.</span>
                  맞춤법 검사 후 결과 확인 및 복사
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 여백 설정 팁 */}
          <Card className="card-editorial">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-accent" />
                여백 설정 팁
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>표준 (15mm):</strong> 일반 문서에 적합</li>
                <li>• <strong>넓게 (20mm):</strong> 헤더/푸터가 많은 문서</li>
                <li>• <strong>좁게 (10mm):</strong> 전체 페이지 검사 필요시</li>
                <li>• 설정에 따라 검사 영역이 달라집니다</li>
              </ul>
            </CardContent>
          </Card>

          {/* PRO 기능 */}
          <Card className="card-editorial">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                PRO 기능
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 스마트 여백 제외 검사</li>
                <li>• 페이지별 오류 하이라이트</li>
                <li>• 다중 시트 Excel 지원</li>
                <li>• 실시간 검사 결과 복사</li>
                <li>• 대용량 PDF 처리 지원</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 오류 메시지 */}
      {error && (
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

export default function PDFSpellCheckerPage() {
  return (
    <AuthRequired 
      requireAuth={true} 
      requireRole="premium" 
      featureName="PDF 맞춤법 검사기"
      fallbackMessage="구글 로그인 후 프리미엄으로 업그레이드하시면 PDF 맞춤법 검사기를 사용하실 수 있습니다! PDF 문서의 본문 영역만 정밀하게 분석하여 맞춤법을 검사하는 고급 기능을 제공합니다."
    >
      <PDFSpellCheckerContent />
    </AuthRequired>
  )
}