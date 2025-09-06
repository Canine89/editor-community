'use client'

import { useAds } from '@/hooks/useAds'
import { TopCarouselAd } from './TopCarouselAd'
import { BottomBannerAd } from './BottomBannerAd'

interface AdManagerProps {
  showTopCarousel?: boolean
  showBottomBanner?: boolean
  topCarouselProps?: {
    className?: string
    autoPlay?: boolean
    interval?: number
  }
  bottomBannerProps?: {
    className?: string
    position?: 'fixed' | 'static'
    dismissible?: boolean
    rotateAds?: boolean
    rotateInterval?: number
  }
}

export function AdManager({
  showTopCarousel,
  showBottomBanner,
  topCarouselProps,
  bottomBannerProps
}: AdManagerProps) {
  const { shouldShowCarousel, shouldShowBanner, loading } = useAds()

  if (loading) {
    return null
  }

  // 전역 설정과 props를 모두 고려
  const displayTopCarousel = showTopCarousel !== false && shouldShowCarousel()
  const displayBottomBanner = showBottomBanner !== false && shouldShowBanner()

  return (
    <>
      {displayTopCarousel && (
        <TopCarouselAd
          className="mb-6"
          {...topCarouselProps}
        />
      )}
      
      {displayBottomBanner && (
        <BottomBannerAd
          {...bottomBannerProps}
        />
      )}
    </>
  )
}

// 개별 광고 컴포넌트 export
export { TopCarouselAd } from './TopCarouselAd'
export { BottomBannerAd } from './BottomBannerAd'