'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Upload,
  FileText,
  FileSpreadsheet,
  Search,
  AlertCircle,
  Info,
  CheckCircle,
  Eye,
  Download,
  Copy,
  Check,
  Settings,
  FileSearch
} from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'

// PDF.js worker 설정 - 실제 설치된 버전과 일치
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
  vertical: number    // 상하 여백 (mm)
  horizontal: number  // 좌우 여백 (mm)
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

export default function PDFSpellCheckerPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [pdfDoc, setPdfDoc] = useState<PDFInfo | null>(null)
  const [corrections, setCorrections] = useState<CorrectionPair[]>([])
  const [matches, setMatches] = useState<CorrectionMatch[]>([])
  const [margins, setMargins] = useState<MarginSettings>({
    vertical: 15,    // 기본 15mm (더 보수적인 값)
    horizontal: 15   // 기본 15mm (더 보수적인 값)
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: 업로드, 2: 분석 결과
  const [copiedPages, setCopiedPages] = useState<Set<number>>(new Set())
  
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const excelInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // mm를 pt로 변환 (1mm = 2.834645669pt)
  const mmToPt = (mm: number): number => {
    return mm * 2.834645669
  }

  const extractTextFromPDF = async (file: File): Promise<PDFPageContent[]> => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const loadingTask = getDocument({ 
        data: arrayBuffer,
        // 추가 옵션으로 호환성 개선 - 실제 버전과 일치
        cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/standard_fonts/',
      })
      
      const pdf = await loadingTask.promise
      const pages: PDFPageContent[] = []

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const viewport = page.getViewport({ scale: 1.0 })

      let fullText = ''
      let filteredText = ''

      // 모든 텍스트 항목을 순회하면서 여백 필터링 적용
      textContent.items.forEach((item: any) => {
        if ('str' in item && 'transform' in item) {
          const text = item.str
          const [, , , , x, y] = item.transform
          
          // 전체 텍스트에 추가
          fullText += text + ' '

          // 여백 검사 - PDF 좌표계는 좌하단이 (0,0)
          // mm를 pt로 변환하여 사용
          const leftMarginPt = mmToPt(margins.horizontal)
          const rightMarginPt = mmToPt(margins.horizontal)
          const bottomMarginPt = mmToPt(margins.vertical)
          const topMarginPt = mmToPt(margins.vertical)
          
          const isInMargin = 
            x < leftMarginPt || 
            x > (viewport.width - rightMarginPt) ||
            y < bottomMarginPt || 
            y > (viewport.height - topMarginPt)

          if (!isInMargin) {
            filteredText += text + ' '
          }
        }
      })

      const pageData = {
        pageNumber: pageNum,
        content: filteredText.trim(),
        originalContent: fullText.trim()
      }
      
      // 디버깅 로그
      console.log(`페이지 ${pageNum} 텍스트 추출 결과:`, {
        원본텍스트길이: fullText.trim().length,
        필터링후길이: filteredText.trim().length,
        여백설정: `상하${margins.vertical}mm 좌우${margins.horizontal}mm`,
        원본샘플: fullText.trim().length > 0 ? fullText.trim().substring(0, 100) + '...' : '(텍스트 없음)'
      })
      
      pages.push(pageData)
    }

    return pages
    } catch (error) {
      console.error('PDF 텍스트 추출 오류:', error)
      throw new Error(`PDF 파일 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }
  }

  const handlePDFFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('PDF 파일만 선택할 수 있습니다.')
      return
    }

    setError('')
    setPdfFile(file)
    setIsProcessing(true)

    try {
      const pages = await extractTextFromPDF(file)
      
      setPdfDoc({
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        totalPages: pages.length,
        pages
      })
    } catch (error) {
      console.error('PDF 파일 로드 오류:', error)
      const errorMessage = error instanceof Error 
        ? `PDF 파일 로드 실패: ${error.message}` 
        : 'PDF 파일을 읽는데 실패했습니다. 파일이 손상되었거나 지원되지 않는 형식일 수 있습니다.'
      setError(errorMessage)
      setPdfFile(null)
      setPdfDoc(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMarginChange = async (field: keyof MarginSettings, value: number) => {
    const newMargins = { ...margins, [field]: value }
    setMargins(newMargins)

    // 여백이 변경되면 PDF 텍스트를 다시 추출
    if (pdfFile && !isProcessing) {
      setIsProcessing(true)
      try {
        // 새로운 여백 설정으로 텍스트 재추출
        const arrayBuffer = await pdfFile.arrayBuffer()
        const pdf = await getDocument({ data: arrayBuffer }).promise
        const pages: PDFPageContent[] = []

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum)
          const textContent = await page.getTextContent()
          const viewport = page.getViewport({ scale: 1.0 })

          let fullText = ''
          let filteredText = ''

          textContent.items.forEach((item: any) => {
            if ('str' in item && 'transform' in item) {
              const text = item.str
              const [, , , , x, y] = item.transform
              
              fullText += text + ' '

              // 새로운 여백 설정으로 검사
              const leftMarginPt = mmToPt(newMargins.horizontal)
              const rightMarginPt = mmToPt(newMargins.horizontal)
              const bottomMarginPt = mmToPt(newMargins.vertical)
              const topMarginPt = mmToPt(newMargins.vertical)
              
              const isInMargin = 
                x < leftMarginPt || 
                x > (viewport.width - rightMarginPt) ||
                y < bottomMarginPt || 
                y > (viewport.height - topMarginPt)

              if (!isInMargin) {
                filteredText += text + ' '
              }
            }
          })

          const pageData = {
            pageNumber: pageNum,
            content: filteredText.trim(),
            originalContent: fullText.trim()
          }
          
          // 디버깅 로그 (여백 변경시)
          console.log(`여백 변경 후 페이지 ${pageNum} 재추출:`, {
            원본텍스트길이: fullText.trim().length,
            필터링후길이: filteredText.trim().length,
            새여백설정: `상하${newMargins.vertical}mm 좌우${newMargins.horizontal}mm`
          })
          
          pages.push(pageData)
        }

        setPdfDoc(prev => prev ? { ...prev, pages } : null)
      } catch (error) {
        console.error('텍스트 재추출 오류:', error)
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const handleExcelFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
      setError('Excel 파일(.xlsx, .xls)만 선택할 수 있습니다.')
      return
    }

    setError('')
    setExcelFile(file)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      
      // 모든 시트에서 교정 데이터 추출
      const correctionPairs: CorrectionPair[] = []
      
      console.log(`Excel 파일에서 ${workbook.SheetNames.length}개 시트 발견:`, workbook.SheetNames)
      
      workbook.SheetNames.forEach(sheetName => {
        console.log(`시트 '${sheetName}' 처리 중...`)
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]

        // A열(틀린 것), B열(맞는 것) 추출
        let sheetPairs = 0
        for (let i = 0; i < data.length; i++) {
          const row = data[i]
          if (row && row[0] && row[1] && row[0].toString().trim() && row[1].toString().trim()) {
            correctionPairs.push({
              wrong: row[0].toString().trim(),
              correct: row[1].toString().trim()
            })
            sheetPairs++
          }
        }
        console.log(`시트 '${sheetName}'에서 ${sheetPairs}개 교정 쌍 추출`)
      })
      
      console.log(`총 ${correctionPairs.length}개 교정 쌍 로드됨`)

      if (correctionPairs.length === 0) {
        setError('Excel 파일의 A열(틀린 표현), B열(올바른 표현)에 데이터가 없습니다.')
        return
      }

      setCorrections(correctionPairs)
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
    setError('')

    try {
      const foundMatches: CorrectionMatch[] = []

      pdfDoc.pages.forEach((page, pageIndex) => {
        corrections.forEach(({ wrong, correct }) => {
          // 대소문자 구분 없이 검색
          const regex = new RegExp(wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
          let match

          while ((match = regex.exec(page.content)) !== null) {
            foundMatches.push({
              original: match[0],
              corrected: correct,
              startIndex: match.index,
              endIndex: match.index + match[0].length,
              pageIndex
            })
          }
        })
      })

      // 페이지별, 위치별로 정렬
      foundMatches.sort((a, b) => {
        if (a.pageIndex !== b.pageIndex) {
          return a.pageIndex - b.pageIndex
        }
        return a.startIndex - b.startIndex
      })

      setMatches(foundMatches)
      setStep(2)
    } catch (error) {
      console.error('문서 분석 오류:', error)
      setError('문서 분석 중 오류가 발생했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  const highlightText = (text: string, matches: CorrectionMatch[], pageIndex: number) => {
    const pageMatches = matches.filter(m => m.pageIndex === pageIndex)
    if (pageMatches.length === 0) return text

    let result = []
    let lastIndex = 0

    // 겹치지 않게 정렬된 매치들을 순서대로 처리
    pageMatches
      .sort((a, b) => a.startIndex - b.startIndex)
      .forEach((match, index) => {
        // 이전 매치와 겹치지 않는지 확인
        if (match.startIndex < lastIndex) return

        // 매치 이전 텍스트 추가
        if (match.startIndex > lastIndex) {
          result.push(text.substring(lastIndex, match.startIndex))
        }

        // 매치된 텍스트를 하이라이트
        result.push(
          <span
            key={`${pageIndex}-${index}`}
            className="bg-green-100 text-green-800 px-1 rounded relative group"
            title={`교정됨: "${match.original}" → "${match.corrected}"`}
          >
            {match.corrected}
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              원래: {match.original}
            </span>
          </span>
        )

        lastIndex = match.endIndex
      })

    // 남은 텍스트 추가
    if (lastIndex < text.length) {
      result.push(text.substring(lastIndex))
    }

    return result
  }

  const getCorrectedPageText = (pageText: string, pageIndex: number): string => {
    let correctedText = pageText
    const pageMatches = matches
      .filter(m => m.pageIndex === pageIndex)
      .sort((a, b) => b.startIndex - a.startIndex) // 뒤에서부터 교체

    pageMatches.forEach(match => {
      correctedText = 
        correctedText.substring(0, match.startIndex) +
        match.corrected +
        correctedText.substring(match.endIndex)
    })

    return correctedText
  }

  const copyPage = async (pageIndex: number) => {
    if (!pdfDoc) return

    try {
      const correctedText = getCorrectedPageText(pdfDoc.pages[pageIndex].content, pageIndex)
      await navigator.clipboard.writeText(correctedText)
      
      // 복사 상태 표시
      setCopiedPages(prev => {
        const newSet = new Set(prev)
        newSet.add(pageIndex)
        return newSet
      })
      
      // 3초 후 복사 상태 초기화
      setTimeout(() => {
        setCopiedPages(prev => {
          const newSet = new Set(prev)
          newSet.delete(pageIndex)
          return newSet
        })
      }, 3000)
    } catch (error) {
      console.error('클립보드 복사 오류:', error)
      // 클립보드 API 지원하지 않는 경우 대체 방법
      const textArea = document.createElement('textarea')
      const correctedText = getCorrectedPageText(pdfDoc.pages[pageIndex].content, pageIndex)
      textArea.value = correctedText
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      setCopiedPages(prev => {
        const newSet = new Set(prev)
        newSet.add(pageIndex)
        return newSet
      })
      setTimeout(() => {
        setCopiedPages(prev => {
          const newSet = new Set(prev)
          newSet.delete(pageIndex)
          return newSet
        })
      }, 3000)
    }
  }

  const resetTool = () => {
    setPdfFile(null)
    setExcelFile(null)
    setPdfDoc(null)
    setCorrections([])
    setMatches([])
    setError('')
    setStep(1)
    setCopiedPages(new Set())
    if (pdfInputRef.current) pdfInputRef.current.value = ''
    if (excelInputRef.current) excelInputRef.current.value = ''
  }

  const downloadCorrectedText = () => {
    if (!pdfDoc || matches.length === 0) return

    let correctedText = ''
    
    pdfDoc.pages.forEach((page, pageIndex) => {
      let correctedPageText = page.content
      const pageMatches = matches
        .filter(m => m.pageIndex === pageIndex)
        .sort((a, b) => b.startIndex - a.startIndex) // 뒤에서부터 교체

      pageMatches.forEach(match => {
        correctedPageText = 
          correctedPageText.substring(0, match.startIndex) +
          match.corrected +
          correctedPageText.substring(match.endIndex)
      })

      correctedText += `=== 페이지 ${page.pageNumber} ===\n\n${correctedPageText}\n\n`
    })

    const blob = new Blob([correctedText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `교정완료_${pdfDoc.fileName.replace('.pdf', '.txt')}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* 헤더 */}
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" size="icon" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">PDF 맞춤법 검사 결과</h1>
                <p className="text-slate-600">발견된 수정 사항을 확인하세요</p>
              </div>
            </div>

            {/* 결과 요약 */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">
                        {matches.length}개의 수정 사항 발견
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      총 {pdfDoc?.totalPages}페이지 분석 완료
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={downloadCorrectedText} disabled={matches.length === 0}>
                      <Download className="w-4 h-4 mr-2" />
                      교정본 다운로드
                    </Button>
                    <Button variant="outline" onClick={resetTool}>
                      새로 시작
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 교정 결과 */}
            {matches.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    수정할 내용이 없습니다
                  </h3>
                  <p className="text-slate-600">
                    Excel 파일의 교정 데이터와 일치하는 내용이 PDF 문서에서 발견되지 않았습니다.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pdfDoc?.pages.map((page, index) => {
                  const pageMatches = matches.filter(m => m.pageIndex === index)
                  // 매치가 있거나 텍스트가 있는 페이지만 표시
                  if (pageMatches.length === 0 && !page.content?.trim()) return null

                  return (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm text-slate-600">
                            페이지 {page.pageNumber}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {pageMatches.length > 0 && (
                              <Badge variant="secondary" className="bg-red-100 text-red-800">
                                {pageMatches.length}개 수정
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyPage(index)}
                              className="h-7 px-2 text-xs"
                            >
                              {copiedPages.has(index) ? (
                                <>
                                  <Check className="w-3 h-3 mr-1 text-green-600" />
                                  복사됨
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 mr-1" />
                                  복사
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-sm leading-relaxed mb-4 p-4 bg-slate-50 rounded-lg max-h-80 overflow-y-auto">
                          {page.content ? (
                            highlightText(page.content, matches, index)
                          ) : (
                            <div className="text-slate-500 italic p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="font-medium text-yellow-800 mb-2">⚠️ 텍스트 추출 문제 발생</div>
                              <div className="text-sm space-y-1">
                                <div>원본 텍스트 길이: <span className="font-medium">{page.originalContent?.length || 0}자</span></div>
                                <div>필터링된 텍스트 길이: <span className="font-medium">{page.content?.length || 0}자</span></div>
                                <div>현재 여백 설정: 상하 {margins.vertical}mm, 좌우 {margins.horizontal}mm</div>
                                {page.originalContent && page.originalContent.length > 0 ? (
                                  <div className="mt-3 p-2 bg-white rounded border">
                                    <div className="text-xs text-slate-600 mb-1">원본 텍스트 샘플 (처음 200자):</div>
                                    <div className="text-xs font-mono text-slate-800 max-h-20 overflow-y-auto">
                                      {page.originalContent.substring(0, 200)}
                                      {page.originalContent.length > 200 && '...'}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-red-600 font-medium">원본 텍스트 자체가 추출되지 않았습니다.</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" asChild>
              <Link href="/tools">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <FileSearch className="w-6 h-6 text-orange-600" />
                PDF 맞춤법 검사기
              </h1>
              <p className="text-slate-600">PDF 문서의 여백을 제외한 본문 텍스트에서 맞춤법을 검사합니다</p>
            </div>
          </div>

          {/* 안내사항 */}
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <Info className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>사용법:</strong> PDF 파일과 Excel 교정 데이터를 업로드하세요.
              <br />
              상하좌우 여백값을 설정하여 불필요한 텍스트(머리글, 바닥글 등)를 제외할 수 있습니다.
            </AlertDescription>
          </Alert>

          {/* PDF 파일 업로드 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                1단계: PDF 파일 업로드
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pdfFile">검사할 PDF 문서 (.pdf)</Label>
                  <Input
                    id="pdfFile"
                    ref={pdfInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handlePDFFileSelect}
                    className="cursor-pointer"
                    disabled={isProcessing}
                  />
                </div>
                
                {pdfDoc && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">{pdfDoc.fileName}</p>
                        <p className="text-sm text-green-700">
                          {pdfDoc.totalPages}페이지 • {pdfDoc.fileSize}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 여백 설정 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                2단계: 여백 설정 (mm 단위)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="marginVertical">상하 여백</Label>
                  <Input
                    id="marginVertical"
                    type="number"
                    value={margins.vertical}
                    onChange={(e) => handleMarginChange('vertical', Number(e.target.value))}
                    className="text-center"
                    min="0"
                    max="100"
                    step="1"
                  />
                  <p className="text-xs text-slate-500 mt-1">상단과 하단에 동일하게 적용</p>
                </div>
                <div>
                  <Label htmlFor="marginHorizontal">좌우 여백</Label>
                  <Input
                    id="marginHorizontal"
                    type="number"
                    value={margins.horizontal}
                    onChange={(e) => handleMarginChange('horizontal', Number(e.target.value))}
                    className="text-center"
                    min="0"
                    max="100"
                    step="1"
                  />
                  <p className="text-xs text-slate-500 mt-1">좌측과 우측에 동일하게 적용</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600">
                  <strong>참고:</strong> 기본값 15mm는 보수적인 여백 설정입니다. 
                  여백 영역의 텍스트(머리글, 바닥글, 페이지 번호 등)는 검사에서 제외됩니다.
                  텍스트가 추출되지 않으면 여백을 더 작게 조정해보세요.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 엑셀 파일 업로드 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                3단계: Excel 교정 데이터 업로드
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="excelFile">교정 데이터 Excel 파일 (.xlsx, .xls)</Label>
                  <Input
                    id="excelFile"
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelFileSelect}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-slate-600 mt-2">
                    A열: 틀린 표현, B열: 올바른 표현
                  </p>
                </div>
                
                {corrections.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FileSpreadsheet className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">
                          {excelFile?.name}
                        </p>
                        <p className="text-sm text-green-700">
                          총 <strong>{corrections.length}개의 교정 규칙</strong> 로드 완료 (전체 시트 포함)
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          💡 모든 시트의 A열(틀린 표현)과 B열(올바른 표현)을 검색합니다
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 교정 규칙 미리보기 */}
          {corrections.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  교정 규칙 미리보기
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {corrections.slice(0, 10).map((correction, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded">
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                        {correction.wrong}
                      </span>
                      <span>→</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        {correction.correct}
                      </span>
                    </div>
                  ))}
                  {corrections.length > 10 && (
                    <p className="text-xs text-slate-500 text-center pt-2">
                      ... 및 {corrections.length - 10}개 더
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 오류 메시지 */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* 분석 시작 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                4단계: 문서 분석 시작
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  PDF 문서에서 교정이 필요한 부분을 찾아 페이지별로 보여드립니다.
                </p>
                
                <div className="flex gap-3">
                  <Button
                    onClick={analyzeDocument}
                    disabled={!pdfDoc || corrections.length === 0 || isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        분석 중...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        문서 분석하기
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetTool}
                    disabled={isProcessing}
                  >
                    초기화
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 사용법 안내 */}
          <div className="mt-8 bg-slate-100 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 mb-3">💡 사용법</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• PDF 파일(.pdf)과 Excel 파일(.xlsx, .xls)을 각각 업로드하세요</li>
              <li>• 상하/좌우 여백값(mm)을 설정하여 머리글, 바닥글 등을 제외할 수 있습니다</li>
              <li>• Excel 파일의 A열에는 '틀린 표현', B열에는 '올바른 표현'을 입력하세요</li>
              <li>• 분석 결과에서 페이지별로 수정 사항을 확인할 수 있습니다</li>
              <li>• 모든 처리는 브라우저에서 진행되어 파일이 외부로 전송되지 않습니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}