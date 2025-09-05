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
  Check
} from 'lucide-react'
import Link from 'next/link'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

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

export default function WordCorrectorPage() {
  const [wordFile, setWordFile] = useState<File | null>(null)
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [wordDoc, setWordDoc] = useState<DocumentInfo | null>(null)
  const [corrections, setCorrections] = useState<CorrectionPair[]>([])
  const [matches, setMatches] = useState<CorrectionMatch[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: 업로드, 2: 분석 결과
  const [copiedParagraphs, setCopiedParagraphs] = useState<Set<number>>(new Set())
  
  const wordInputRef = useRef<HTMLInputElement>(null)
  const excelInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleWordFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.docx')) {
      setError('Word 파일(.docx)만 선택할 수 있습니다.')
      return
    }

    setError('')
    setWordFile(file)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      
      // 문단별로 분리 (빈 줄 제거)
      const paragraphs = result.value
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0)

      setWordDoc({
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        paragraphs
      })
    } catch (error) {
      console.error('Word 파일 로드 오류:', error)
      setError('Word 파일을 읽는데 실패했습니다. 파일이 손상되었을 수 있습니다.')
      setWordFile(null)
      setWordDoc(null)
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
    if (!wordDoc || corrections.length === 0) return

    setIsProcessing(true)
    setError('')

    try {
      const foundMatches: CorrectionMatch[] = []

      wordDoc.paragraphs.forEach((paragraph, paragraphIndex) => {
        corrections.forEach(({ wrong, correct }) => {
          // 대소문자 구분 없이 검색
          const regex = new RegExp(wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
          let match

          while ((match = regex.exec(paragraph)) !== null) {
            foundMatches.push({
              original: match[0],
              corrected: correct,
              startIndex: match.index,
              endIndex: match.index + match[0].length,
              paragraphIndex
            })
          }
        })
      })

      // 문단별, 위치별로 정렬
      foundMatches.sort((a, b) => {
        if (a.paragraphIndex !== b.paragraphIndex) {
          return a.paragraphIndex - b.paragraphIndex
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

  const highlightText = (text: string, matches: CorrectionMatch[], paragraphIndex: number) => {
    const paragraphMatches = matches.filter(m => m.paragraphIndex === paragraphIndex)
    if (paragraphMatches.length === 0) return text

    let result = []
    let lastIndex = 0

    // 겹치지 않게 정렬된 매치들을 순서대로 처리
    paragraphMatches
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
            key={`${paragraphIndex}-${index}`}
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

  const getCorrectedParagraph = (paragraphText: string, paragraphIndex: number): string => {
    let correctedText = paragraphText
    const paragraphMatches = matches
      .filter(m => m.paragraphIndex === paragraphIndex)
      .sort((a, b) => b.startIndex - a.startIndex) // 뒤에서부터 교체

    paragraphMatches.forEach(match => {
      correctedText = 
        correctedText.substring(0, match.startIndex) +
        match.corrected +
        correctedText.substring(match.endIndex)
    })

    return correctedText
  }

  const copyParagraph = async (paragraphIndex: number) => {
    if (!wordDoc) return

    try {
      const correctedText = getCorrectedParagraph(wordDoc.paragraphs[paragraphIndex], paragraphIndex)
      await navigator.clipboard.writeText(correctedText)
      
      // 복사 상태 표시
      setCopiedParagraphs(prev => {
        const newSet = new Set(prev)
        newSet.add(paragraphIndex)
        return newSet
      })
      
      // 3초 후 복사 상태 초기화
      setTimeout(() => {
        setCopiedParagraphs(prev => {
          const newSet = new Set(prev)
          newSet.delete(paragraphIndex)
          return newSet
        })
      }, 3000)
    } catch (error) {
      console.error('클립보드 복사 오류:', error)
      // 클립보드 API 지원하지 않는 경우 대체 방법
      const textArea = document.createElement('textarea')
      const correctedText = getCorrectedParagraph(wordDoc.paragraphs[paragraphIndex], paragraphIndex)
      textArea.value = correctedText
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      setCopiedParagraphs(prev => {
        const newSet = new Set(prev)
        newSet.add(paragraphIndex)
        return newSet
      })
      setTimeout(() => {
        setCopiedParagraphs(prev => {
          const newSet = new Set(prev)
          newSet.delete(paragraphIndex)
          return newSet
        })
      }, 3000)
    }
  }

  const resetTool = () => {
    setWordFile(null)
    setExcelFile(null)
    setWordDoc(null)
    setCorrections([])
    setMatches([])
    setError('')
    setStep(1)
    setCopiedParagraphs(new Set())
    if (wordInputRef.current) wordInputRef.current.value = ''
    if (excelInputRef.current) excelInputRef.current.value = ''
  }

  const downloadCorrectedText = () => {
    if (!wordDoc || matches.length === 0) return

    let correctedText = ''
    
    wordDoc.paragraphs.forEach((paragraph, paragraphIndex) => {
      let correctedParagraph = paragraph
      const paragraphMatches = matches
        .filter(m => m.paragraphIndex === paragraphIndex)
        .sort((a, b) => b.startIndex - a.startIndex) // 뒤에서부터 교체

      paragraphMatches.forEach(match => {
        correctedParagraph = 
          correctedParagraph.substring(0, match.startIndex) +
          match.corrected +
          correctedParagraph.substring(match.endIndex)
      })

      correctedText += correctedParagraph + '\n\n'
    })

    const blob = new Blob([correctedText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `교정완료_${wordDoc.fileName.replace('.docx', '.txt')}`
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
                <h1 className="text-2xl font-bold text-slate-900">교정 결과</h1>
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
                      총 {wordDoc?.paragraphs.length}개 문단 분석 완료
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
                    Excel 파일의 교정 데이터와 일치하는 내용이 Word 문서에서 발견되지 않았습니다.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {wordDoc?.paragraphs.map((paragraph, index) => {
                  const paragraphMatches = matches.filter(m => m.paragraphIndex === index)
                  if (paragraphMatches.length === 0) return null

                  return (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm text-slate-600">
                            문단 {index + 1}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              {paragraphMatches.length}개 수정
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyParagraph(index)}
                              className="h-7 px-2 text-xs"
                            >
                              {copiedParagraphs.has(index) ? (
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
                        <div className="text-sm leading-relaxed">
                          {highlightText(paragraph, matches, index)}
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
                <Search className="w-6 h-6 text-blue-600" />
                워드 교정 도구
              </h1>
              <p className="text-slate-600">워드 문서와 교정 데이터를 비교하여 수정 사항을 찾아드립니다</p>
            </div>
          </div>

          {/* 안내사항 */}
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>사용법:</strong> Word 파일(.docx)과 Excel 파일(.xlsx)을 업로드하세요.
              <br />
              Excel 파일은 A열에 '틀린 표현', B열에 '올바른 표현'이 있어야 합니다.
            </AlertDescription>
          </Alert>

          {/* 워드 파일 업로드 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                1단계: Word 파일 업로드
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="wordFile">교정할 Word 문서 (.docx)</Label>
                  <Input
                    id="wordFile"
                    ref={wordInputRef}
                    type="file"
                    accept=".docx"
                    onChange={handleWordFileSelect}
                    className="cursor-pointer"
                  />
                </div>
                
                {wordDoc && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">{wordDoc.fileName}</p>
                        <p className="text-sm text-green-700">
                          {wordDoc.paragraphs.length}개 문단 • {wordDoc.fileSize}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 엑셀 파일 업로드 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                2단계: Excel 교정 데이터 업로드
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
                3단계: 문서 분석 시작
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Word 문서에서 교정이 필요한 부분을 찾아 미리보기로 보여드립니다.
                </p>
                
                <div className="flex gap-3">
                  <Button
                    onClick={analyzeDocument}
                    disabled={!wordDoc || corrections.length === 0 || isProcessing}
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
              <li>• Word 파일(.docx)과 Excel 파일(.xlsx, .xls)을 각각 업로드하세요</li>
              <li>• Excel 파일의 A열에는 '틀린 표현', B열에는 '올바른 표현'을 입력하세요</li>
              <li>• 분석 결과에서 문단별로 수정 사항을 확인할 수 있습니다</li>
              <li>• 수정된 텍스트를 다운로드하여 참고하세요</li>
              <li>• 모든 처리는 브라우저에서 진행되어 파일이 외부로 전송되지 않습니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}