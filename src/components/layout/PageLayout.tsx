import { ReactNode } from 'react'
import { TopCarouselAd, BottomBannerAd } from '@/components/ads'

interface PageLayoutProps {
  children: ReactNode
  showTopCarousel?: boolean
  showBottomBanner?: boolean
  className?: string
}

export function PageLayout({ 
  children, 
  showTopCarousel = true,
  showBottomBanner = true,
  className = "min-h-screen bg-slate-50" 
}: PageLayoutProps) {
  return (
    <div className={className}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 상단 캐러셀 광고 */}
        {showTopCarousel && <TopCarouselAd className="mb-8" />}
        
        {/* 메인 콘텐츠 영역 */}
        <div className="w-full">
          {children}
        </div>
        
        {/* 하단 배너 광고 */}
        {showBottomBanner && (
          <div className="mt-12">
            <BottomBannerAd position="static" />
          </div>
        )}
      </div>
    </div>
  )
}

// 관리자 페이지용 전폭 레이아웃
export function AdminPageLayout({ children, className = "min-h-screen bg-slate-50" }: { children: ReactNode, className?: string }) {
  return (
    <div className={className}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  )
}

// 콘텐츠가 매우 넓어야 하는 페이지용 (도구 등)
export function WidePageLayout({ children, className = "min-h-screen bg-slate-50" }: { children: ReactNode, className?: string }) {
  return (
    <div className={className}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  )
}