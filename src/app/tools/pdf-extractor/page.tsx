'use client'

import { useState, useRef } from 'react'
import { AuthRequired } from '@/components/auth/AuthRequired'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  Upload,
  Scissors,
  Download,
  FileText,
  AlertCircle,
  Info
} from 'lucide-react'
import Link from 'next/link'
import { PDFDocument } from 'pdf-lib'

interface ExtractedInfo {
  totalPages: number
  fileName: string
  fileSize: string
}

function PDFExtractorContent() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo | null>(null)
  const [startPage, setStartPage] = useState('')
  const [endPage, setEndPage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('PDF 파일만 선택할 수 있습니다.')
      return
    }

    setError('')
    setSelectedFile(file)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      
      setExtractedInfo({
        totalPages: pdfDoc.getPageCount(),
        fileName: file.name,
        fileSize: formatFileSize(file.size)
      })
      
      // 기본값 설정
      setStartPage('1')
      setEndPage(pdfDoc.getPageCount().toString())
    } catch (error) {
      console.error('PDF 로드 오류:', error)
      setError('PDF 파일을 읽는데 실패했습니다. 파일이 손상되었거나 암호화되어 있을 수 있습니다.')
      setSelectedFile(null)
      setExtractedInfo(null)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleExtract = async () => {
    if (!selectedFile || !extractedInfo) return

    const start = parseInt(startPage)
    const end = parseInt(endPage)

    // 입력 검증
    if (isNaN(start) || isNaN(end) || start < 1 || end < 1 || start > extractedInfo.totalPages || end > extractedInfo.totalPages) {
      setError(`페이지 번호는 1부터 ${extractedInfo.totalPages} 사이여야 합니다.`)
      return
    }

    if (start > end) {
      setError('시작 페이지는 끝 페이지보다 작거나 같아야 합니다.')
      return
    }

    setError('')
    setIsProcessing(true)

    try {
      // PDF 파일 로드
      const arrayBuffer = await selectedFile.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)

      // 새로운 PDF 문서 생성
      const newPdfDoc = await PDFDocument.create()

      // 지정된 페이지 범위를 복사
      const pageIndices = []
      for (let i = start - 1; i < end; i++) {
        pageIndices.push(i)
      }

      const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices)
      copiedPages.forEach((page) => newPdfDoc.addPage(page))

      // PDF 바이트 생성
      const pdfBytes = await newPdfDoc.save()

      // 다운로드 링크 생성
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      // 파일명 생성 (원본 이름에 페이지 범위 추가)
      const baseName = selectedFile.name.replace('.pdf', '')
      const extractedFileName = start === end 
        ? `${baseName}_page_${start}.pdf`
        : `${baseName}_pages_${start}-${end}.pdf`

      // 다운로드 실행
      const link = document.createElement('a')
      link.href = url
      link.download = extractedFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // URL 정리
      URL.revokeObjectURL(url)

      // 성공 메시지
      setError('')
      
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" asChild>
              <Link href="/tools">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Scissors className="w-6 h-6 text-red-600" />
                PDF 페이지 추출기
              </h1>
              <p className="text-slate-600">PDF 파일에서 원하는 페이지만 추출하여 다운로드하세요</p>
            </div>
          </div>

          {/* 안내사항 */}
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>개인정보 보호:</strong> 파일은 브라우저에서만 처리되며 서버로 전송되지 않습니다.
            </AlertDescription>
          </Alert>

          {/* 파일 업로드 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                1단계: PDF 파일 선택
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                </div>
                
                {selectedFile && extractedInfo && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">{extractedInfo.fileName}</p>
                        <p className="text-sm text-green-700">
                          총 {extractedInfo.totalPages}페이지 • {extractedInfo.fileSize}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 페이지 범위 선택 */}
          {extractedInfo && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="w-5 h-5" />
                  2단계: 추출할 페이지 범위 설정
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startPage">시작 페이지</Label>
                      <Input
                        id="startPage"
                        type="number"
                        min="1"
                        max={extractedInfo.totalPages}
                        value={startPage}
                        onChange={(e) => setStartPage(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => e.currentTarget.select()}
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endPage">끝 페이지</Label>
                      <Input
                        id="endPage"
                        type="number"
                        min="1"
                        max={extractedInfo.totalPages}
                        value={endPage}
                        onChange={(e) => setEndPage(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => e.currentTarget.select()}
                        placeholder={extractedInfo.totalPages.toString()}
                      />
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-600">
                    전체 페이지: 1 ~ {extractedInfo.totalPages}
                  </p>

                  {/* 빠른 선택 버튼들 */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStartPage('1')
                        setEndPage(Math.ceil(extractedInfo.totalPages / 2).toString())
                      }}
                    >
                      전반부
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStartPage((Math.ceil(extractedInfo.totalPages / 2) + 1).toString())
                        setEndPage(extractedInfo.totalPages.toString())
                      }}
                    >
                      후반부
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStartPage('1')
                        setEndPage(extractedInfo.totalPages.toString())
                      }}
                    >
                      전체
                    </Button>
                  </div>
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

          {/* 추출 및 다운로드 */}
          {extractedInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  3단계: PDF 추출 및 다운로드
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {startPage && endPage && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <p className="text-sm text-slate-700">
                        <strong>추출 예정:</strong> {startPage}페이지
                        {startPage !== endPage && `부터 ${endPage}페이지까지`}
                        ({parseInt(endPage) - parseInt(startPage) + 1}페이지)
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={handleExtract}
                      disabled={!startPage || !endPage || isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          추출 중...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          PDF 추출하기
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetForm}
                      disabled={isProcessing}
                    >
                      초기화
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 사용법 안내 */}
          <div className="mt-8 bg-slate-100 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 mb-3">💡 사용법</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• PDF 파일을 선택하면 전체 페이지 수가 표시됩니다</li>
              <li>• 추출할 시작 페이지와 끝 페이지를 입력하세요</li>
              <li>• 단일 페이지 추출 시에는 시작/끝 페이지를 같게 설정하세요</li>
              <li>• 빠른 선택 버튼으로 전반부/후반부/전체를 쉽게 선택할 수 있습니다</li>
              <li>• 추출된 파일은 자동으로 다운로드됩니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PDFExtractorPage() {
  return (
    <AuthRequired 
      requireAuth={true} 
      requireRole="premium" 
      featureName="PDF 텍스트 추출기"
      fallbackMessage="구글 로그인 후 프리미엄으로 업그레이드하시면 PDF 텍스트 추출기를 사용하실 수 있습니다! PDF 파일의 특정 페이지를 정밀하게 추출하는 고급 기능을 제공합니다."
    >
      <PDFExtractorContent />
    </AuthRequired>
  )
}