'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AuthRequired } from '@/components/auth/AuthRequired'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToolPageLayout } from '@/components/layout/PageLayout'
import {
  ArrowLeft,
  Link as LinkIcon,
  QrCode,
  Download,
  Copy,
  Settings,
  BarChart3,
  Crown,
  Zap,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Edit,
  Trash2,
  Plus,
  Upload,
  FileDown,
  List
} from 'lucide-react'
import { generateQRCode, downloadQRCode } from '@/lib/qr-generator'
import { cn } from '@/lib/utils'
import JSZip from 'jszip'

interface LinkResult {
  url: string
  name?: string
  success: boolean
  managed: boolean
  short_url?: string
  bitly_url?: string
  short_code?: string
  can_edit: boolean
  click_count?: number
  error?: string
  qr_code?: string
}

interface LinkStats {
  total_links: number
  links_this_month: number
  total_clicks: number
  quota_used: number
  quota_limit: number
}

interface ManagedLink {
  id: string
  link_name: string
  short_code: string
  current_url: string
  original_url: string
  click_count: number
  created_at: string
  updated_at: string
  short_url: string
  can_edit: boolean
  managed: boolean
  bitly_link?: string
}

export default function SmartLinkGeneratorPage() {
  // 개별 입력 상태
  const [singleUrl, setSingleUrl] = useState('')
  const [singleName, setSingleName] = useState('')
  const [singleGenerating, setSingleGenerating] = useState(false)
  const [singleResult, setSingleResult] = useState<LinkResult | null>(null)

  // 벌크 입력 상태  
  const [urlInput, setUrlInput] = useState('')
  const [hasNames, setHasNames] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<LinkResult[]>([])

  // 링크 관리 상태
  const [managedLinks, setManagedLinks] = useState<ManagedLink[]>([])
  const [loadingLinks, setLoadingLinks] = useState(false)
  const [editingLink, setEditingLink] = useState<string | null>(null)
  const [editUrl, setEditUrl] = useState('')
  const [editName, setEditName] = useState('')

  // 공통 상태
  const [stats, setStats] = useState<LinkStats | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('single')
  
  // 개별 링크 생성
  const handleSingleGenerate = async () => {
    if (!singleUrl.trim()) {
      setError('URL을 입력해주세요.')
      return
    }

    setError('')
    setSingleGenerating(true)
    setSingleResult(null)

    try {
      const response = await fetch('/api/links/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: singleUrl.trim(),
          name: singleName.trim() || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '링크 생성에 실패했습니다.')
      }

      const data = await response.json()
      let result = data.result

      // QR 코드 생성
      if (result.success && result.short_url) {
        try {
          const qrCode = await generateQRCode(
            { type: 'url', value: result.short_url },
            { width: 200 }
          )
          result.qr_code = qrCode
        } catch (qrError) {
          console.error('QR 코드 생성 실패:', qrError)
        }
      }

      setSingleResult(result)
      
      // 통계 새로고침
      await loadStats()

    } catch (error) {
      console.error('링크 생성 오류:', error)
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setSingleGenerating(false)
    }
  }

  // URL과 이름 파싱 (벌크용)
  const parseUrls = (input: string) => {
    const lines = input.split('\\n').filter(line => line.trim())
    return lines.map(line => {
      if (hasNames && line.includes('|')) {
        const [url, name] = line.split('|').map(s => s.trim())
        return { url: url || '', name: name || '' }
      }
      return { url: line.trim(), name: '' }
    })
  }

  const handleGenerate = async () => {
    if (!urlInput.trim()) {
      setError('URL을 입력해주세요.')
      return
    }

    setError('')
    setIsGenerating(true)
    setProgress(0)
    setResults([])

    try {
      const urlData = parseUrls(urlInput)
      const totalUrls = urlData.length

      if (totalUrls === 0) {
        setError('유효한 URL을 입력해주세요.')
        return
      }

      // API 호출 (벌크용)
      const response = await fetch('/api/links/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulk_data: urlData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '링크 생성에 실패했습니다.')
      }

      const data = await response.json()
      const linkResults: LinkResult[] = data.results || []

      // QR 코드 생성
      const resultsWithQR: LinkResult[] = []
      for (let i = 0; i < linkResults.length; i++) {
        const result = linkResults[i]
        let resultWithQR = { ...result }

        if (result.success && result.short_url) {
          try {
            const qrCode = await generateQRCode(
              { type: 'url', value: result.short_url },
              { width: 200 }
            )
            resultWithQR.qr_code = qrCode
          } catch (qrError) {
            console.error('QR 코드 생성 실패:', qrError)
          }
        }

        resultsWithQR.push(resultWithQR)
        setProgress(((i + 1) / linkResults.length) * 100)

        // 실시간 업데이트
        setResults([...resultsWithQR])

        // 마지막이 아니면 짧은 딜레이
        if (i < linkResults.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }

      // 통계 새로고침
      await loadStats()

    } catch (error) {
      console.error('링크 생성 오류:', error)
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
      setProgress(100)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/links/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('통계 로드 실패:', error)
    }
  }

  const loadManagedLinks = async () => {
    setLoadingLinks(true)
    try {
      const response = await fetch('/api/links/manage')
      if (response.ok) {
        const data = await response.json()
        setManagedLinks(data.links || [])
      } else {
        setError('링크 목록을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('링크 목록 로드 실패:', error)
      setError('링크 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoadingLinks(false)
    }
  }

  const startEdit = (link: ManagedLink) => {
    setEditingLink(link.id)
    setEditUrl(link.current_url)
    setEditName(link.link_name)
  }

  const cancelEdit = () => {
    setEditingLink(null)
    setEditUrl('')
    setEditName('')
  }

  const saveEdit = async (linkId: string) => {
    if (!editUrl.trim()) {
      setError('URL을 입력해주세요.')
      return
    }

    try {
      const response = await fetch('/api/links/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: linkId,
          action: 'update',
          new_url: editUrl.trim(),
          new_name: editName.trim() || undefined
        })
      })

      if (response.ok) {
        await loadManagedLinks()
        await loadStats()
        cancelEdit()
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || '링크 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('링크 수정 오류:', error)
      setError('링크 수정에 실패했습니다.')
    }
  }

  const deleteLink = async (linkId: string) => {
    if (!confirm('정말로 이 링크를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch('/api/links/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: linkId,
          action: 'delete'
        })
      })

      if (response.ok) {
        await loadManagedLinks()
        await loadStats()
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || '링크 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('링크 삭제 오류:', error)
      setError('링크 삭제에 실패했습니다.')
    }
  }

  const downloadQRCode = (result: LinkResult) => {
    if (result.qr_code) {
      const link = document.createElement('a')
      link.download = `qr-${result.short_code || Date.now()}.png`
      link.href = result.qr_code
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const downloadAllQRCodes = async () => {
    const zip = new JSZip()
    const validResults = results.filter(r => r.success && r.qr_code)

    if (validResults.length === 0) {
      setError('다운로드할 QR 코드가 없습니다.')
      return
    }

    try {
      for (const result of validResults) {
        if (result.qr_code) {
          // Base64 데이터에서 실제 이미지 데이터 추출
          const base64Data = result.qr_code.split(',')[1]
          zip.file(`qr-${result.short_code || result.name || Date.now()}.png`, base64Data, {base64: true})
        }
      }

      const content = await zip.generateAsync({type: 'blob'})
      const url = URL.createObjectURL(content)
      
      const link = document.createElement('a')
      link.download = `qr-codes-${Date.now()}.zip`
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('ZIP 다운로드 실패:', error)
      setError('QR 코드 다운로드에 실패했습니다.')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // 성공 피드백 (토스트 등)
    }).catch(() => {
      setError('클립보드 복사에 실패했습니다.')
    })
  }

  const exportToCSV = () => {
    const successResults = results.filter(r => r.success)
    if (successResults.length === 0) {
      setError('내보낼 데이터가 없습니다.')
      return
    }

    const headers = ['원본 URL', '이름', '단축 링크', '관리 가능', '클릭 수']
    const csvData = [
      headers.join(','),
      ...successResults.map(r => [
        `"${r.url}"`,
        `"${r.name || ''}"`,
        `"${r.short_url || ''}"`,
        r.managed ? '예' : '아니오',
        r.click_count || 0
      ].join(','))
    ].join('\\n')

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.download = `smart-links-${Date.now()}.csv`
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'manage') {
      loadManagedLinks()
    }
  }, [activeTab])

  return (
    <AuthRequired>
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
            <Badge className="gradient-accent text-accent-foreground">
              <Crown className="h-3 w-3 mr-1" />
              PRO
            </Badge>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 gradient-accent rounded-3xl flex items-center justify-center shadow-editorial mx-auto mb-4">
              <LinkIcon className="w-8 h-8 text-accent-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-gradient-editorial mb-2">
              스마트 링크 도구
            </h1>
            <p className="text-lg text-muted-foreground">
              벌크 단축링크 생성, QR 코드 자동 생성, 링크 관리 및 분석
            </p>
          </div>
        </div>

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card className="card-editorial">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.total_links}</div>
                <div className="text-sm text-muted-foreground">총 링크</div>
              </CardContent>
            </Card>
            <Card className="card-editorial">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-accent">{stats.links_this_month}</div>
                <div className="text-sm text-muted-foreground">이번 달</div>
              </CardContent>
            </Card>
            <Card className="card-editorial">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.total_clicks}</div>
                <div className="text-sm text-muted-foreground">총 클릭</div>
              </CardContent>
            </Card>
            <Card className="card-editorial lg:col-span-2">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">할당량 사용률</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.quota_used}/{stats.quota_limit}
                  </span>
                </div>
                <Progress 
                  value={(stats.quota_used / stats.quota_limit) * 100} 
                  className="h-2"
                />
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 메인 입력 패널 */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="single" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  개별 생성
                </TabsTrigger>
                <TabsTrigger value="bulk" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  벌크 생성
                </TabsTrigger>
                <TabsTrigger value="manage" className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  링크 관리
                </TabsTrigger>
              </TabsList>
              
              {/* 개별 생성 탭 */}
              <TabsContent value="single" className="space-y-6">
                <Card className="card-editorial">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      개별 링크 생성
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="single-url">URL</Label>
                        <Input
                          id="single-url"
                          placeholder="https://example.com"
                          value={singleUrl}
                          onChange={(e) => setSingleUrl(e.target.value)}
                          className="font-mono"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="single-name">별명 (선택사항)</Label>
                        <Input
                          id="single-name"
                          placeholder="내 사이트"
                          value={singleName}
                          onChange={(e) => setSingleName(e.target.value)}
                        />
                        <div className="text-xs text-muted-foreground">
                          💡 별명을 입력하면 <strong>관리형 링크</strong>로 생성되어 나중에 URL을 수정할 수 있습니다. (할당량 소모)
                        </div>
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button 
                      onClick={handleSingleGenerate}
                      disabled={singleGenerating || !singleUrl.trim()}
                      className="w-full"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      {singleGenerating ? '생성 중...' : '링크 생성'}
                    </Button>

                    {/* 개별 결과 표시 */}
                    {singleResult && (
                      <Card className={cn(
                        "mt-4",
                        singleResult.success
                          ? "border-green-200 bg-green-50"
                          : "border-red-200 bg-red-50"
                      )}>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {singleResult.success ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                )}
                                <span className="font-medium text-sm">
                                  {singleResult.name || '생성된 링크'}
                                </span>
                                {singleResult.managed && (
                                  <Badge variant="secondary" className="text-xs">
                                    관리됨
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {singleResult.url}
                              </p>
                              {singleResult.error && (
                                <p className="text-xs text-red-600">{singleResult.error}</p>
                              )}
                            </div>

                            {singleResult.success && singleResult.short_url && (
                              <>
                                <div className="space-y-1">
                                  <p className="text-sm font-mono">{singleResult.short_url}</p>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => navigator.clipboard.writeText(singleResult.short_url!)}
                                      className="h-6 px-2 text-xs"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(singleResult.short_url, '_blank')}
                                      className="h-6 px-2 text-xs"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex justify-center">
                                  {singleResult.qr_code ? (
                                    <div className="text-center">
                                      <img
                                        src={singleResult.qr_code}
                                        alt="QR Code"
                                        className="w-16 h-16 mx-auto"
                                      />
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => downloadQRCode(singleResult)}
                                        className="mt-1 h-6 px-2 text-xs"
                                      >
                                        <Download className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                                      <QrCode className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* 벌크 생성 탭 */}
              <TabsContent value="bulk" className="space-y-6">
                <Card className="card-editorial">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      벌크 링크 생성
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="url-list">URL 목록</Label>
                        <div className="flex items-center gap-2 text-sm">
                          <Switch
                            checked={hasNames}
                            onCheckedChange={setHasNames}
                            id="has-names"
                          />
                          <Label htmlFor="has-names">이름 포함 (관리 가능)</Label>
                        </div>
                      </div>
                      
                      <Textarea
                        id="url-list"
                        placeholder={
                          hasNames 
                            ? "URL과 이름을 | 로 구분하여 입력하세요:\nhttps://example1.com | 예제 사이트 1\nhttps://example2.com | 예제 사이트 2"
                            : "한 줄에 하나씩 URL을 입력하세요:\nhttps://example1.com\nhttps://example2.com\nhttps://example3.com"
                        }
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        rows={8}
                        className="font-mono text-sm"
                      />
                      
                      <div className="text-xs text-muted-foreground">
                        {hasNames ? (
                          <>
                            💡 <strong>관리형 링크:</strong> 이름을 지정하면 나중에 URL을 수정할 수 있습니다. 
                            할당량이 소모됩니다.
                          </>
                        ) : (
                          <>
                            ⚡ <strong>일회성 링크:</strong> Bitly로 바로 생성되며 할당량을 소모하지 않습니다.
                          </>
                        )}
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleGenerate}
                        disabled={isGenerating || !urlInput.trim()}
                        className="flex-1"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        {isGenerating ? '생성 중...' : '링크 생성'}
                      </Button>
                      
                      {results.length > 0 && (
                        <>
                          <Button 
                            onClick={downloadAllQRCodes}
                            variant="outline"
                            disabled={!results.some(r => r.success && r.qr_code)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            QR 모두 다운로드
                          </Button>
                          <Button 
                            onClick={exportToCSV}
                            variant="outline"
                            disabled={!results.some(r => r.success)}
                          >
                            <FileDown className="w-4 h-4 mr-2" />
                            CSV 내보내기
                          </Button>
                        </>
                      )}
                    </div>

                    {isGenerating && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>생성 진행률</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} />
                      </div>
                    )}
                  </CardContent>
                </Card>

            {/* 결과 테이블 */}
            {results.length > 0 && (
              <Card className="card-editorial">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    생성 결과 ({results.filter(r => r.success).length}/{results.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-4 rounded-lg border",
                          result.success
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                        )}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {result.success ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              )}
                              <span className="font-medium text-sm">
                                {result.name || `링크 ${index + 1}`}
                              </span>
                              {result.managed && (
                                <Badge variant="secondary" className="text-xs">
                                  관리됨
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {result.url}
                            </p>
                            {result.error && (
                              <p className="text-xs text-red-600">{result.error}</p>
                            )}
                          </div>

                          {result.success && result.short_url && (
                            <>
                              <div className="space-y-1">
                                <p className="text-sm font-mono">{result.short_url}</p>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(result.short_url!)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(result.short_url, '_blank')}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                  {result.can_edit && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 px-2 text-xs"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <div className="flex justify-center">
                                {result.qr_code ? (
                                  <div className="text-center">
                                    <img
                                      src={result.qr_code}
                                      alt="QR Code"
                                      className="w-16 h-16 mx-auto"
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => downloadQRCode(result)}
                                      className="mt-1 h-6 px-2 text-xs"
                                    >
                                      <Download className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                                    <QrCode className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
              </TabsContent>

              {/* 링크 관리 탭 */}
              <TabsContent value="manage" className="space-y-6">
                <Card className="card-editorial">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <List className="w-5 h-5" />
                      관리형 링크 목록
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={loadManagedLinks}
                        disabled={loadingLinks}
                      >
                        {loadingLinks ? '로딩 중...' : '새로고침'}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingLinks ? (
                      <div className="text-center py-8">
                        <div className="text-muted-foreground">링크 목록을 불러오는 중...</div>
                      </div>
                    ) : managedLinks.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-muted-foreground">관리할 링크가 없습니다.</div>
                        <p className="text-sm text-muted-foreground mt-2">
                          개별 생성 또는 벌크 생성에서 '이름'을 지정하면 관리 가능한 링크가 생성됩니다.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {managedLinks.map((link) => (
                          <div
                            key={link.id}
                            className="p-4 rounded-lg border bg-card"
                          >
                            {editingLink === link.id ? (
                              // 편집 모드
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>링크 이름</Label>
                                    <Input
                                      value={editName}
                                      onChange={(e) => setEditName(e.target.value)}
                                      placeholder="링크 이름"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>목적지 URL</Label>
                                    <Input
                                      value={editUrl}
                                      onChange={(e) => setEditUrl(e.target.value)}
                                      placeholder="https://example.com"
                                      className="font-mono"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => saveEdit(link.id)}
                                    disabled={!editUrl.trim()}
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    저장
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEdit}
                                  >
                                    취소
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              // 보기 모드
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{link.link_name}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      관리됨
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {link.current_url}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    클릭 수: {link.click_count} • 생성: {new Date(link.created_at).toLocaleDateString()}
                                  </p>
                                </div>

                                <div className="space-y-1">
                                  <p className="text-sm font-mono">{link.short_url}</p>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => copyToClipboard(link.short_url)}
                                      className="h-6 px-2 text-xs"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(link.short_url, '_blank')}
                                      className="h-6 px-2 text-xs"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </Button>
                                    {link.bitly_link && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyToClipboard(link.bitly_link!)}
                                        className="h-6 px-2 text-xs"
                                        title="Bitly 링크 복사"
                                      >
                                        <LinkIcon className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                <div className="flex justify-center items-center">
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => startEdit(link)}
                                      className="h-8 px-3 text-xs"
                                    >
                                      <Edit className="w-3 h-3 mr-1" />
                                      편집
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => deleteLink(link.id)}
                                      className="h-8 px-3 text-xs text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-3 h-3 mr-1" />
                                      삭제
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* 사이드 패널 */}
          <div className="space-y-6">
            {/* 사용법 안내 */}
            <Card className="card-editorial border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-blue-800 text-sm">사용법</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-700 space-y-2">
                <p><strong>1. URL 입력:</strong> 한 줄에 하나씩 URL 입력</p>
                <p><strong>2. 이름 설정:</strong> 관리하고 싶은 링크는 이름 포함</p>
                <p><strong>3. 벌크 생성:</strong> 여러 개를 한번에 생성</p>
                <p><strong>4. QR 코드:</strong> 자동으로 QR 코드도 생성</p>
                <p><strong>5. 관리 기능:</strong> 이름 있는 링크는 나중에 수정 가능</p>
              </CardContent>
            </Card>

            {/* 프리미엄 기능 */}
            <Card className="card-editorial border-accent/20 bg-accent/5">
              <CardHeader>
                <CardTitle className="text-accent flex items-center gap-2 text-sm">
                  <Crown className="w-4 h-4" />
                  프리미엄 기능
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>벌크 링크 생성 (무제한)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>QR 코드 자동 생성</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>링크 관리 및 수정</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>클릭 분석 (월 50개)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>CSV/ZIP 내보내기</span>
                </div>
              </CardContent>
            </Card>

            {/* 할당량 정보 */}
            {stats && (
              <Card className="card-editorial">
                <CardHeader>
                  <CardTitle className="text-sm">할당량 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>이번 달 사용량</span>
                      <span>{stats.quota_used}/{stats.quota_limit}</span>
                    </div>
                    <Progress 
                      value={(stats.quota_used / stats.quota_limit) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <p>• 관리형 링크만 할당량 소모</p>
                    <p>• 일회성 링크는 할당량 미소모</p>
                    <p>• 매월 1일에 자동 초기화</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </ToolPageLayout>
    </AuthRequired>
  )
}