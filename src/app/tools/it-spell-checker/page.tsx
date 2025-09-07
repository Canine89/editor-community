'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { AuthRequired } from '@/components/auth/AuthRequired'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ToolPageLayout } from '@/components/layout/PageLayout'
import { SimpleProgress } from '@/components/ui/progress-steps'
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
  Settings,
  CheckCircle,
  ArrowRight,
  Lightbulb
} from 'lucide-react'
import { 
  getSpellChecker, 
  SpellMatch, 
  SpellCheckResult, 
  SPELL_CATEGORIES, 
  CategoryKey,
  clearSpellCheckerCache 
} from '@/lib/spell-checker'
import { cn } from '@/lib/utils'

interface CategorySettings {
  [key: string]: boolean
}

// 수정된 텍스트 표시 컴포넌트
function CorrectedTextDisplay({ text, result, getCorrectedText }: {
  text: string
  result: SpellCheckResult | null
  getCorrectedText: () => Promise<string>
}) {
  const [correctedText, setCorrectedText] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (text && result) {
      setIsLoading(true)
      getCorrectedText().then(corrected => {
        setCorrectedText(corrected)
        setIsLoading(false)
      }).catch(() => {
        setCorrectedText(text)
        setIsLoading(false)
      })
    }
  }, [text, result, getCorrectedText])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        수정된 텍스트 생성 중...
      </div>
    )
  }

  return (
    <pre className="whitespace-pre-wrap font-sans text-foreground">
      {correctedText || '수정된 텍스트가 여기에 표시됩니다.'}
    </pre>
  )
}

function ITSpellCheckerContent() {
  // 상태 관리
  const [text, setText] = useState('')
  const [result, setResult] = useState<SpellCheckResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [copiedText, setCopiedText] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  
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

  // 단계별 라벨
  const stepLabels = ['텍스트 입력', '맞춤법 검사', '결과 확인']

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
      setCurrentStep(1)
      return
    }

    try {
      setIsChecking(true)
      setError('')
      setCurrentStep(2) // 검사 중 단계

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
      setCurrentStep(3) // 결과 확인 단계

    } catch (err) {
      console.error('검사 오류:', err)
      setError('맞춤법 검사 중 오류가 발생했습니다.')
      setResult(null)
      setCurrentStep(1)
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
            className={`relative inline-block bg-red-100 text-destructive px-1 rounded border-b-2 border-destructive/30 cursor-help`}
            title={`${match.description}\n원래: ${match.original}\n수정: ${match.corrected}\n카테고리: ${categoryInfo?.name || match.category}`}
          >
            {match.original}
            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-popover text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
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
      <ToolPageLayout>
        <Card className="card-editorial max-w-md mx-auto mt-12">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 border-4 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">시스템 초기화 중</h3>
            <p className="text-muted-foreground">맞춤법 검사 엔진을 로딩하고 있습니다...</p>
          </CardContent>
        </Card>
      </ToolPageLayout>
    )
  }

  return (
    <ToolPageLayout>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="hover-lift-editorial">
            <Link href="/tools">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3 mb-2">
              <div className="w-10 h-10 gradient-primary rounded-2xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              IT 맞춤법 검사기
            </h1>
            <p className="text-muted-foreground">IT 원고와 기술 문서를 위한 실시간 맞춤법 검사 도구</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearSpellCheckerCache()}
            className="gap-2 hover-lift-editorial"
          >
            <RefreshCw className="w-4 h-4" />
            초기화
          </Button>
        </div>
      </div>

      {/* 진행률 표시 */}
      <div className="mb-8">
        <SimpleProgress 
          currentStep={currentStep}
          totalSteps={3}
          stepLabels={stepLabels}
        />
      </div>

      {/* 오류 메시지 */}
      {error && (
        <Alert className="mb-8 border-destructive bg-destructive/5">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive font-medium">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 메인 작업 영역 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1단계: 텍스트 입력 */}
          <Card className="card-editorial">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">1</span>
                  텍스트 입력 및 설정
                </CardTitle>
                <div className="flex items-center gap-2">
                  {isChecking && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      검사 중...
                    </div>
                  )}
                  {result && (
                    <Badge variant={result.totalErrors > 0 ? "destructive" : "default"} className="font-medium">
                      {result.totalErrors > 0 ? `${result.totalErrors}개 오류 발견` : '✓ 오류 없음'}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="text-input" className="text-sm font-medium text-foreground mb-2 block">
                  검사할 텍스트
                </Label>
                <Textarea
                  id="text-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="IT 원고나 기술 문서의 텍스트를 입력하세요. 실시간으로 맞춤법을 검사합니다.

예시:
- 로그인이 안됩니다 → 로그인이 안 됩니다
- database 연결 → 데이터베이스 연결  
- javascript 코드 → JavaScript 코드
- 그런데 API가 작동안해요 → 그런데 API가 작동 안 해요"
                  className="min-h-[320px] resize-none focus:ring-2 focus:ring-primary/20"
                  maxLength={50000}
                />
                <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                  <span>{text.length.toLocaleString()}자 / 50,000자</span>
                  {result && (
                    <span className="text-primary font-medium">검사 시간: {result.processingTime.toFixed(1)}ms</span>
                  )}
                </div>
              </div>

              {/* 빠른 설정 */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                    className={cn(
                      "gap-2 hover-lift-editorial",
                      showSettings && "bg-primary/10 border-primary/30 text-primary"
                    )}
                  >
                    <Settings className="w-4 h-4" />
                    {showSettings ? '설정 닫기' : '검사 설정'}
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    {Object.values(categorySettings).filter(Boolean).length}개 카테고리 활성화
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2단계: 검사 결과 (텍스트가 있고 결과가 있을 때만 표시) */}
          {result && (
            <Card className="card-editorial">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">2</span>
                  맞춤법 검사 결과
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.totalErrors === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-success/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">완벽합니다!</h3>
                    <p className="text-muted-foreground">맞춤법 오류가 발견되지 않았습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-muted/30 border border-border rounded-xl p-4">
                      <div className="text-sm font-medium text-foreground mb-3">오류가 표시된 텍스트 (마우스 오버 시 수정 제안 확인)</div>
                      <div className="bg-background rounded-lg p-4 text-sm leading-relaxed border border-border">
                        {highlightText(text, result.matches)}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 3단계: 수정된 텍스트 (오류가 있을 때만 표시) */}
          {result && result.totalErrors > 0 && (
            <Card className="card-editorial">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">3</span>
                    수정된 텍스트
                  </CardTitle>
                  <Button
                    onClick={async () => {
                      const corrected = await getCorrectedText()
                      await copyText(corrected)
                    }}
                    disabled={copiedText}
                    className="gap-2 hover-lift-editorial"
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-4 h-4" />
                        복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        텍스트 복사
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-success/5 border border-success/20 rounded-xl p-4">
                  <div className="text-sm font-medium text-success mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    수정된 최종 텍스트
                  </div>
                  <div className="bg-background rounded-lg p-4 text-sm leading-relaxed border border-border">
                    <CorrectedTextDisplay text={text} result={result} getCorrectedText={getCorrectedText} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 검사 설정 패널 */}
          {showSettings && (
            <Card className="card-editorial">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  검사 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-medium">카테고리 관리</Label>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAllCategories(true)}
                        className="h-7 px-3 text-xs hover-lift-editorial"
                      >
                        전체 선택
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAllCategories(false)}
                        className="h-7 px-3 text-xs hover-lift-editorial"
                      >
                        전체 해제
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {Object.entries(SPELL_CATEGORIES).map(([key, info]) => (
                      <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                        <div className="flex-1">
                          <Label htmlFor={key} className="text-sm font-medium cursor-pointer block">
                            {info.name}
                          </Label>
                          <div className="text-xs text-muted-foreground mt-1">
                            {info.description || '기본 검사 항목'}
                          </div>
                        </div>
                        <Switch
                          id={key}
                          checked={categorySettings[key]}
                          onCheckedChange={() => toggleCategory(key as CategoryKey)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 검사 통계 */}
          {result && (
            <Card className="card-editorial">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  검사 통계
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.totalErrors === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-success/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">완벽한 텍스트!</h3>
                    <p className="text-sm text-muted-foreground">맞춤법 오류가 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-destructive" />
                        <span className="font-semibold text-destructive">
                          총 {result.totalErrors}개 오류 발견
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        수정이 필요한 부분을 확인해주세요
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-foreground">카테고리별 오류</div>
                      {Object.entries(result.categoryCounts).map(([category, count]) => {
                        const info = SPELL_CATEGORIES[category as CategoryKey]
                        return (
                          <div key={category} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                            <span className="text-sm text-foreground">{info?.name}</span>
                            <Badge variant="secondary" className="font-medium">
                              {count}개
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 도구 안내 */}
          <Card className="card-editorial">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                사용 가이드
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-foreground text-xs font-bold">1</span>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-foreground mb-1">실시간 검사</div>
                    <div className="text-muted-foreground">텍스트 입력 시 자동으로 맞춤법을 검사합니다</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="w-6 h-6 bg-muted-foreground rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-background text-xs font-bold">2</span>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-foreground mb-1">오류 확인</div>
                    <div className="text-muted-foreground">빨간색 표시 부분에 마우스를 올려 수정안을 확인하세요</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
                  <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-background text-xs font-bold">3</span>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-foreground mb-1">결과 활용</div>
                    <div className="text-muted-foreground">수정된 텍스트를 복사하여 사용하세요</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  IT 전용 기능
                </div>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>IT 용어 자동 인식 및 교정</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>영어-한글 혼용 문장 최적화</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>기술 문서 작성법 적용</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>프로그래밍 용어 표준화</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* PRO 기능 안내 */}
          <Card className="card-editorial bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  PRO 기능
                </span>
                <Badge variant="default" className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                  업그레이드
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <ArrowRight className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium text-foreground">일괄 파일 검사</div>
                    <div className="text-muted-foreground">여러 파일을 한 번에 검사</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ArrowRight className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium text-foreground">사용자 사전 추가</div>
                    <div className="text-muted-foreground">프로젝트별 전용 용어집</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ArrowRight className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium text-foreground">고급 검사 규칙</div>
                    <div className="text-muted-foreground">문맥 기반 정교한 교정</div>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg hover-lift-editorial">
                <Zap className="w-4 h-4 mr-2" />
                PRO로 업그레이드
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolPageLayout>
  )
}

export default function ITSpellCheckerPage() {
  return (
    <AuthRequired 
      requireAuth={true} 
      featureName="IT 맞춤법 검사기"
      freeFeature={true}
    >
      <ITSpellCheckerContent />
    </AuthRequired>
  )
}