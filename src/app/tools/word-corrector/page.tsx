'use client'

import { useState } from 'react'
import { AuthRequired } from '@/components/auth/AuthRequired'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  Eye,
  Download
} from 'lucide-react'
import Link from 'next/link'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import { cn } from '@/lib/utils'

interface CorrectionPair {
  wrong: string
  correct: string
}

interface CorrectionMatch {
  original: string
  corrected: string
  startIndex: number
  endIndex: number
  paragraphIndex: number
}

interface DocumentInfo {
  fileName: string
  fileSize: string
  paragraphs: string[]
}

function WordCorrectorContent() {
  const [currentStep, setCurrentStep] = useState(1)
  const [wordFile, setWordFile] = useState<File | null>(null)
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [wordDoc, setWordDoc] = useState<DocumentInfo | null>(null)
  const [corrections, setCorrections] = useState<CorrectionPair[]>([])
  const [matches, setMatches] = useState<CorrectionMatch[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [copiedParagraphs, setCopiedParagraphs] = useState<Set<number>>(new Set())

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleWordFileSelect = async (file: File) => {
    setError('')
    setWordFile(file)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer })
      const textResult = await mammoth.extractRawText({ arrayBuffer })
      
      // 문단별로 분리
      const htmlDoc = new DOMParser().parseFromString(htmlResult.value, 'text/html')
      const htmlParagraphs = Array.from(htmlDoc.querySelectorAll('p'))
        .map(p => p.textContent?.trim() || '')
        .filter(p => p.length > 0)
      
      const textParagraphs = textResult.value
        .split(/\n\s*\n/)
        .map(p => p.replace(/\n/g, ' ').trim())
        .filter(p => p.length > 0)
      
      const paragraphs = htmlParagraphs.length > textParagraphs.length ? htmlParagraphs : textParagraphs

      setWordDoc({
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        paragraphs
      })

      // 두 파일이 모두 선택되면 다음 단계로
      if (excelFile) {
        setCurrentStep(2)
      }
    } catch (error) {
      console.error('Word 파일 로드 오류:', error)
      setError('Word 파일을 읽는데 실패했습니다. 파일이 손상되었을 수 있습니다.')
      setWordFile(null)
      setWordDoc(null)
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

      // 두 파일이 모두 선택되면 다음 단계로
      if (wordFile) {
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
    if (!wordDoc || corrections.length === 0) return

    setIsProcessing(true)
    setCurrentStep(3)
    setError('')

    try {
      const foundMatches: CorrectionMatch[] = []

      wordDoc.paragraphs.forEach((paragraph, paragraphIndex) => {
        corrections.forEach(correction => {
          const wrongText = correction.wrong.toLowerCase()
          const paragraphLower = paragraph.toLowerCase()
          
          let index = 0
          while ((index = paragraphLower.indexOf(wrongText, index)) !== -1) {
            foundMatches.push({
              original: correction.wrong,
              corrected: correction.correct,
              startIndex: index,
              endIndex: index + correction.wrong.length,
              paragraphIndex
            })
            index += correction.wrong.length
          }
        })
      })

      setMatches(foundMatches)
    } catch (error) {
      console.error('문서 분석 오류:', error)
      setError('문서 분석 중 오류가 발생했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setWordFile(null)
    setExcelFile(null)
    setWordDoc(null)
    setCorrections([])
    setMatches([])
    setError('')
    setIsProcessing(false)
    setCopiedParagraphs(new Set())
  }

  const highlightText = (text: string, matches: CorrectionMatch[], paragraphIndex: number) => {
    const paragraphMatches = matches.filter(match => match.paragraphIndex === paragraphIndex)
    if (paragraphMatches.length === 0) return text

    let result = text
    let offset = 0

    paragraphMatches
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

  const copyToClipboard = async (text: string, paragraphIndex: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedParagraphs(prev => new Set([...prev, paragraphIndex]))
      setTimeout(() => {
        setCopiedParagraphs(prev => {
          const newSet = new Set(prev)
          newSet.delete(paragraphIndex)
          return newSet
        })
      }, 2000)
    } catch (error) {
      console.error('클립보드 복사 오류:', error)
    }
  }

  const stepLabels = ['파일 업로드', '분석 시작', '결과 확인']

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
              <Search className="w-5 h-5 text-accent-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-gradient-editorial">워드 교정 도구</h1>
            <Badge className="gradient-accent text-accent-foreground">
              <Zap className="w-3 h-3 mr-1" />
              PRO
            </Badge>
          </div>
          <p className="text-muted-foreground text-lg">워드 문서와 엑셀 교정 데이터를 비교하여 수정사항을 찾아냅니다</p>
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
          <strong>파일 형식:</strong> Word 문서(.docx)와 Excel 파일(.xlsx, .xls)이 필요합니다. 
          Excel의 A열에는 틀린 표현, B열에는 올바른 표현을 입력해주세요.
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
                파일 업로드
                {wordDoc && corrections.length > 0 && currentStep > 1 && (
                  <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Word 파일 업로드 */}
              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Word 문서 (.docx)
                </h4>
                <FileUpload
                  accept=".docx"
                  onFileSelect={handleWordFileSelect}
                  onFileRemove={() => {
                    setWordFile(null)
                    setWordDoc(null)
                    if (currentStep > 1) setCurrentStep(1)
                  }}
                  selectedFile={wordFile}
                  title="Word 문서를 업로드하세요"
                  description="교정할 문서를 선택해주세요"
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

              {/* 파일 정보 */}
              {(wordDoc || corrections.length > 0) && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  {wordDoc && (
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">{wordDoc.fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          {wordDoc.paragraphs.length}개 문단 • {wordDoc.fileSize}
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

              {wordDoc && corrections.length > 0 && (
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
                  문서 분석
                  {matches.length > 0 && (
                    <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">분석 준비 완료</h3>
                  <p className="text-muted-foreground mb-6">
                    {corrections.length}개 교정 규칙로 {wordDoc?.paragraphs.length}개 문단을 검사합니다
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
                        <Search className="w-4 h-4 mr-2" />
                        교정사항 찾기
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
                  교정사항 ({matches.length}개 발견)
                  <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                  <p className="text-primary font-semibold">
                    총 {matches.length}개의 교정사항을 발견했습니다.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    빨간색으로 표시된 부분이 수정이 필요한 텍스트입니다.
                  </p>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Array.from(new Set(matches.map(m => m.paragraphIndex))).map(paragraphIndex => {
                    const paragraphMatches = matches.filter(m => m.paragraphIndex === paragraphIndex)
                    const originalText = wordDoc!.paragraphs[paragraphIndex]
                    
                    return (
                      <div key={paragraphIndex} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-muted-foreground">
                            문단 {paragraphIndex + 1} ({paragraphMatches.length}개 교정사항)
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(originalText, paragraphIndex)}
                            className="hover-lift-editorial"
                          >
                            {copiedParagraphs.has(paragraphIndex) ? (
                              <Check className="w-3 h-3 mr-1" />
                            ) : (
                              <Copy className="w-3 h-3 mr-1" />
                            )}
                            {copiedParagraphs.has(paragraphIndex) ? '복사됨' : '복사'}
                          </Button>
                        </div>
                        <div
                          className="text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: highlightText(originalText, matches, paragraphIndex)
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
                  Word 문서(.docx)와 Excel 교정 데이터(.xlsx) 업로드
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">2.</span>
                  Excel A열에 틀린 표현, B열에 올바른 표현 입력
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">3.</span>
                  교정사항 분석 후 결과 확인 및 복사
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Excel 형식 예시 */}
          <Card className="card-editorial">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-accent" />
                Excel 형식 예시
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div className="grid grid-cols-2 gap-2 p-2 bg-muted/30 rounded">
                  <div className="font-bold text-center">A (틀린 표현)</div>
                  <div className="font-bold text-center">B (올바른 표현)</div>
                </div>
                <div className="grid grid-cols-2 gap-2 p-2 border border-border rounded text-xs">
                  <div className="text-center">되요</div>
                  <div className="text-center">돼요</div>
                </div>
                <div className="grid grid-cols-2 gap-2 p-2 border border-border rounded text-xs">
                  <div className="text-center">안됩니다</div>
                  <div className="text-center">안 됩니다</div>
                </div>
              </div>
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
                <li>• 다중 시트 Excel 지원</li>
                <li>• 실시간 교정사항 하이라이트</li>
                <li>• 문단별 결과 복사</li>
                <li>• 대소문자 구분 없는 검색</li>
                <li>• 드래그 앤 드롭 파일 업로드</li>
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

export default function WordCorrectorPage() {
  return (
    <AuthRequired 
      requireAuth={true} 
      requireRole="premium" 
      featureName="워드 교정 도구"
      fallbackMessage="구글 로그인 후 프리미엄으로 업그레이드하시면 워드 교정 도구를 사용하실 수 있습니다! Word 문서와 Excel 교정 데이터를 비교하여 자동으로 수정사항을 찾아주는 전문 도구입니다."
    >
      <WordCorrectorContent />
    </AuthRequired>
  )
}