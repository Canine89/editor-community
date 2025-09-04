'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Scissors,
  Download,
  Wrench,
  ArrowRight
} from 'lucide-react'

const tools = [
  {
    id: 'pdf-extractor',
    title: 'PDF 페이지 추출기',
    description: 'PDF 파일에서 원하는 페이지 범위를 추출하여 새로운 PDF로 다운로드',
    icon: Scissors,
    href: '/tools/pdf-extractor',
    color: 'bg-red-500',
    available: true
  },
  {
    id: 'word-corrector',
    title: '워드 교정 도구',
    description: '워드 문서와 엑셀 교정 데이터를 비교하여 수정 사항을 미리보기로 확인',
    icon: FileText,
    href: '/tools/word-corrector',
    color: 'bg-blue-500',
    available: true
  },
  {
    id: 'text-formatter',
    title: '텍스트 포맷터',
    description: '텍스트 정렬, 대소문자 변환, 공백 제거 등 텍스트 편집 도구',
    icon: FileText,
    href: '/tools/text-formatter',
    color: 'bg-purple-500',
    available: false
  },
  {
    id: 'file-converter',
    title: '파일 변환기',
    description: '다양한 파일 형식을 변환하는 도구 (Word, Excel, PowerPoint)',
    icon: Download,
    href: '/tools/file-converter',
    color: 'bg-green-500',
    available: false
  }
]

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Wrench className="w-8 h-8 text-blue-600" />
            편집자 유틸리티
          </h1>
          <p className="text-slate-600 mt-2">
            편집 작업을 더 효율적으로 만들어주는 온라인 도구 모음
          </p>
        </div>

        {/* 도구 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools.map((tool) => {
            const IconComponent = tool.icon
            
            return (
              <Card 
                key={tool.id} 
                className={`hover:shadow-md transition-shadow ${
                  tool.available ? 'cursor-pointer' : 'opacity-60'
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    {!tool.available && (
                      <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                        준비중
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg">{tool.title}</CardTitle>
                  <CardDescription className="text-sm text-slate-600">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {tool.available ? (
                    <Button asChild className="w-full">
                      <Link href={tool.href} className="flex items-center justify-center gap-2">
                        사용하기
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled className="w-full">
                      준비중
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 안내사항 */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">🔒 개인정보 보호</h2>
          <p className="text-blue-800 text-sm leading-relaxed">
            모든 유틸리티는 브라우저에서 직접 실행되며, 파일이 서버로 전송되지 않습니다.
            <br />
            업로드한 파일은 로컬에서만 처리되고 외부로 유출되지 않으므로 안전하게 사용하실 수 있습니다.
          </p>
        </div>

        {/* 추가 요청 */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 mb-4">
            필요한 유틸리티가 있으신가요?
          </p>
          <Button variant="outline" asChild>
            <Link href="/community/write">
              유틸리티 제안하기
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}