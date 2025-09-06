'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  FileText,
  Search,
  Download,
  Copy,
  Check,
  AlertCircle,
  Info,
  RefreshCw,
  Zap,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react'
import { 
  getSpellChecker, 
  SpellMatch, 
  SpellCheckResult, 
  SPELL_CATEGORIES, 
  CategoryKey,
  clearSpellCheckerCache 
} from '@/lib/spell-checker'

interface CategorySettings {
  [key: string]: boolean
}

export default function ITSpellCheckerPage() {
  // 상태 관리
  const [text, setText] = useState('')
  const [result, setResult] = useState<SpellCheckResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [copiedText, setCopiedText] = useState(false)
  
  // 카테고리 설정
  const [categorySettings, setCategorySettings] = useState<CategorySettings>({
    basic: true,
    it_terms: true, 
    foreign: true,
    punctuation: true,
    grammar: true,
    numbers: true
  })

  // UI 설정
  const [showPreview, setShowPreview] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  // 초기화
  useEffect(() => {
    initializeSpellChecker()
  }, [])

  const initializeSpellChecker = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      await getSpellChecker()
    } catch (err) {
      console.error('초기화 오류:', err)
      setError('맞춤법 검사기를 초기화할 수 없습니다. 페이지를 새로고침해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  // 텍스트 검사 (디바운스 적용)
  const checkSpelling = useCallback(async (textToCheck: string) => {
    if (!textToCheck.trim()) {
      setResult(null)
      return
    }

    try {
      setIsChecking(true)
      setError('')

      const enabledCategories = Object.entries(categorySettings)
        .filter(([_, enabled]) => enabled)
        .map(([category, _]) => category)


      const engine = await getSpellChecker()
      const checkResult = engine.checkText(textToCheck, {
        enabledCategories,
        strictMode: false,
        ignoreCase: false
      })

      setResult(checkResult)
      

    } catch (err) {
      console.error('검사 오류:', err)
      setError('맞춤법 검사 중 오류가 발생했습니다.')
      setResult(null)
    } finally {
      setIsChecking(false)
    }
  }, [categorySettings])

  // 텍스트 변경 처리 (디바운스)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (text) {
        checkSpelling(text)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [text, checkSpelling])

  // 수정된 텍스트 생성
  const getCorrectedText = async () => {
    if (!result || !result.matches.length) return text

    const engine = await getSpellChecker()
    return engine.applyCorrections(text, result.matches)
  }

  // 텍스트 복사
  const copyText = async (textToCopy: string, isOriginal: boolean = false) => {
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopiedText(true)
      setTimeout(() => setCopiedText(false), 2000)
    } catch (err) {
      console.error('복사 실패:', err)
      // 대체 복사 방법
      const textArea = document.createElement('textarea')
      textArea.value = textToCopy
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedText(true)
      setTimeout(() => setCopiedText(false), 2000)
    }
  }

  // 카테고리 설정 변경
  const toggleCategory = (category: CategoryKey) => {
    setCategorySettings(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  // 모든 카테고리 토글
  const toggleAllCategories = (enabled: boolean) => {
    const newSettings: CategorySettings = {}
    Object.keys(SPELL_CATEGORIES).forEach(key => {
      newSettings[key] = enabled
    })
    setCategorySettings(newSettings)
  }

  // 텍스트 하이라이팅
  const highlightText = (text: string, matches: SpellMatch[]): React.ReactNode[] => {
    if (!matches.length) return [text]

    const result: React.ReactNode[] = []
    let lastIndex = 0

    matches
      .sort((a, b) => a.startIndex - b.startIndex)
      .forEach((match, index) => {
        // 이전 매치와 현재 매치 사이의 텍스트
        if (match.startIndex > lastIndex) {
          result.push(text.substring(lastIndex, match.startIndex))
        }

        // 오류 하이라이트
        const categoryInfo = SPELL_CATEGORIES[match.category as CategoryKey]
        result.push(
          <span
            key={`error-${index}`}
            className={`relative inline-block bg-red-100 text-red-800 px-1 rounded border-b-2 border-red-300 cursor-help`}
            title={`${match.description}\n원래: ${match.original}\n수정: ${match.corrected}\n카테고리: ${categoryInfo?.name || match.category}`}
          >
            {match.original}
            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
              → {match.corrected}
            </span>
          </span>
        )

        lastIndex = match.endIndex
      })

    // 마지막 매치 이후 텍스트
    if (lastIndex < text.length) {
      result.push(text.substring(lastIndex))
    }

    return result
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">맞춤법 검사기를 초기화하고 있습니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href="/tools">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              IT 맞춤법 검사기
            </h1>
            <p className="text-slate-600">IT 원고에 특화된 실시간 맞춤법 검사 도구</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              {showSettings ? '설정 닫기' : '설정'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearSpellCheckerCache()}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              초기화
            </Button>
          </div>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 메인 에디터 영역 */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">텍스트 입력</CardTitle>
                  <div className="flex items-center gap-2">
                    {isChecking && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        검사 중...
                      </div>
                    )}
                    {result && (
                      <Badge variant={result.totalErrors > 0 ? "destructive" : "default"}>
                        {result.totalErrors > 0 ? `${result.totalErrors}개 오류` : '오류 없음'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="맞춤법을 검사할 텍스트를 입력하세요. 실시간으로 오류를 감지합니다.

예시:
- 로그인이 안됩니다 → 로그인이 안 됩니다
- database 연결 → 데이터베이스 연결
- javascript 코드 → JavaScript 코드"
                  className="min-h-[300px] resize-none"
                  maxLength={50000}
                />
                <div className="flex items-center justify-between mt-3 text-sm text-slate-500">
                  <span>{text.length.toLocaleString()}자</span>
                  {result && (
                    <span>검사 시간: {result.processingTime.toFixed(1)}ms</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 미리보기 */}
            {showPreview && result && result.totalErrors > 0 && (
              <Card className="mt-6">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">수정 미리보기</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const corrected = await getCorrectedText()
                          await copyText(corrected)
                        }}
                        disabled={copiedText}
                        className="gap-2"
                      >
                        {copiedText ? (
                          <>
                            <Check className="w-4 h-4 text-green-600" />
                            복사됨
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            복사
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="text-sm leading-relaxed">
                      {highlightText(text, result.matches)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 사이드바 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 설정 패널 */}
            {showSettings && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">검사 설정</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">모든 카테고리</Label>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleAllCategories(true)}
                        className="h-6 px-2 text-xs"
                      >
                        전체 선택
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleAllCategories(false)}
                        className="h-6 px-2 text-xs"
                      >
                        전체 해제
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {Object.entries(SPELL_CATEGORIES).map(([key, info]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={key} className="text-xs flex-1 cursor-pointer">
                        {info.name}
                      </Label>
                      <Switch
                        id={key}
                        checked={categorySettings[key]}
                        onCheckedChange={() => toggleCategory(key as CategoryKey)}
                      />
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">미리보기 표시</Label>
                    <Switch
                      checked={showPreview}
                      onCheckedChange={setShowPreview}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 오류 요약 */}
            {result && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">검사 결과</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.totalErrors === 0 ? (
                    <div className="text-center py-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-sm font-medium text-green-700">오류가 없습니다!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-slate-700">
                        총 {result.totalErrors}개 오류 발견
                      </div>
                      
                      {Object.entries(result.categoryCounts).map(([category, count]) => {
                        const info = SPELL_CATEGORIES[category as CategoryKey]
                        return (
                          <div key={category} className="flex items-center justify-between">
                            <span className="text-xs text-slate-600">{info?.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {count}개
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 사용 안내 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  사용법
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• 실시간으로 맞춤법을 검사합니다</li>
                  <li>• 빨간색으로 표시된 부분에 마우스를 올리면 수정 제안을 확인할 수 있습니다</li>
                  <li>• 카테고리별로 검사 항목을 선택할 수 있습니다</li>
                  <li>• 수정된 텍스트를 복사하여 사용하세요</li>
                  <li>• IT 용어와 한글이 혼재된 텍스트에 특화되어 있습니다</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}