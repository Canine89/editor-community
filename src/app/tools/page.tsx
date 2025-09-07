'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WidePageLayout } from '@/components/layout/PageLayout'
import { PremiumToolLink } from '@/components/PremiumToolLink'
import {
  FileText,
  Scissors,
  Download,
  Wrench,
  ArrowRight,
  PenTool,
  FileSearch,
  Edit3,
  Crown,
  Shield
} from 'lucide-react'

const tools = [
  {
    id: 'pdf-watermark',
    title: 'PDF 워터마크',
    description: 'PDF 파일에 텍스트 워터마크를 추가하여 저작권 보호 및 문서 표시',
    icon: PenTool,
    href: '/tools/pdf-watermark',
    gradient: 'gradient-primary',
    available: true,
    isPremium: false
  },
  {
    id: 'pdf-extractor',
    title: 'PDF 페이지 추출기',
    description: 'PDF 파일에서 원하는 페이지 범위를 추출하여 새로운 PDF로 다운로드',
    icon: Scissors,
    href: '/tools/pdf-extractor',
    gradient: 'gradient-accent',
    available: true,
    isPremium: true
  },
  {
    id: 'pdf-editor',
    title: 'PDF 페이지 교체',
    description: 'PDF 페이지를 교체, 순서 변경, 삭제하고 되돌리기 기능 제공',
    icon: Edit3,
    href: '/tools/pdf-editor',
    gradient: 'gradient-primary',
    available: true,
    isPremium: true
  },
  {
    id: 'word-corrector',
    title: '워드 교정 도구',
    description: '워드 문서와 엑셀 교정 데이터를 비교하여 수정 사항을 미리보기로 확인',
    icon: FileText,
    href: '/tools/word-corrector',
    gradient: 'gradient-accent',
    available: true,
    isPremium: true
  },
  {
    id: 'pdf-spell-checker',
    title: 'PDF 맞춤법 검사기',
    description: 'PDF 문서의 여백을 제외한 본문에서 맞춤법을 검사하고 교정 사항 확인',
    icon: FileSearch,
    href: '/tools/pdf-spell-checker',
    gradient: 'gradient-accent',
    available: true,
    isPremium: true
  },
  {
    id: 'it-spell-checker',
    title: 'IT 맞춤법 검사기',
    description: 'IT 전문 용어에 특화된 맞춤법 검사 도구',
    icon: FileSearch,
    href: '/tools/it-spell-checker',
    gradient: 'gradient-primary',
    available: true,
    isPremium: false
  },
  {
    id: 'text-formatter',
    title: '텍스트 포맷터',
    description: '텍스트 정렬, 대소문자 변환, 공백 제거 등 텍스트 편집 도구',
    icon: FileText,
    href: '/tools/text-formatter',
    gradient: 'gradient-warm',
    available: false,
    isPremium: false
  },
  {
    id: 'file-converter',
    title: '파일 변환기',
    description: '다양한 파일 형식을 변환하는 도구 (Word, Excel, PowerPoint)',
    icon: Download,
    href: '/tools/file-converter',
    gradient: 'gradient-warm',
    available: false,
    isPremium: false
  }
]

export default function ToolsPage() {
  return (
    <WidePageLayout>
        {/* 헤더 */}
        <div className="mb-12 text-center animate-fade-in">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-16 h-16 gradient-primary rounded-3xl flex items-center justify-center shadow-editorial animate-float">
              <Wrench className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-editorial mb-4">
            편집자 유틸리티
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            편집 작업을 더 효율적으로 만들어주는 AI 기반 온라인 도구 모음
          </p>
          <div className="w-24 h-1 gradient-primary rounded-full mx-auto mt-6"></div>
        </div>

        {/* 도구 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => {
            const IconComponent = tool.icon
            
            return (
              <Card 
                key={tool.id} 
                className={`card-editorial group hover-lift-editorial animate-scale-in ${
                  tool.available ? 'cursor-pointer' : 'opacity-60'
                }`}
              >
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-14 h-14 ${tool.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300`}>
                      <IconComponent className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {tool.isPremium && (
                        <Badge className="gradient-accent text-accent-foreground text-xs font-semibold">
                          <Crown className="h-3 w-3 mr-1" />
                          PRO
                        </Badge>
                      )}
                      {!tool.available && (
                        <Badge variant="outline" className="text-xs border-muted-foreground/30 bg-muted text-muted-foreground">
                          준비중
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className={`text-xl font-bold mb-3 group-hover:${
                    tool.isPremium ? 'text-accent' : 'text-primary'
                  } transition-all duration-300`}>
                    {tool.title}
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground font-medium leading-relaxed">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {tool.available ? (
                    tool.isPremium ? (
                      <PremiumToolLink href={tool.href} className="w-full">
                        <Button className="w-full btn-accent font-semibold shadow-lg hover:shadow-xl">
                          <div className="flex items-center justify-center gap-2">
                            <Crown className="w-4 h-4" />
                            사용하기
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </Button>
                      </PremiumToolLink>
                    ) : (
                      <Button asChild className="w-full btn-primary font-semibold shadow-lg hover:shadow-xl">
                        <Link href={tool.href} className="flex items-center justify-center gap-2">
                          사용하기
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    )
                  ) : (
                    <Button disabled className="w-full opacity-50">
                      준비중
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 안내사항 */}
        <div className="mt-16 card-editorial p-8 editorial-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">개인정보 보호</h2>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed">
            모든 유틸리티는 브라우저에서 직접 실행되며, 파일이 서버로 전송되지 않습니다.
            <br />
            업로드한 파일은 로컬에서만 처리되고 외부로 유출되지 않으므로 안전하게 사용하실 수 있습니다.
          </p>
        </div>

        {/* 추가 요청 */}
        <div className="mt-12 text-center">
          <p className="text-xl text-muted-foreground font-medium mb-6">
            필요한 유틸리티가 있으신가요?
          </p>
          <Button variant="outline" className="px-8 py-3 rounded-2xl font-semibold hover:bg-brand-warm-50 transition-all duration-200" asChild>
            <Link href="/community/write" className="flex items-center gap-2">
              유틸리티 제안하기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
    </WidePageLayout>
  )
}