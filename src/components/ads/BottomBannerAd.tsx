'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAds, type Ad } from '@/hooks/useAds'
import { cn } from '@/lib/utils'

interface BottomBannerAdProps {
  className?: string
  position?: 'fixed' | 'static'
  dismissible?: boolean
  rotateAds?: boolean
  rotateInterval?: number
}

export function BottomBannerAd({ 
  className,
  position: propPosition,
  dismissible = false,
  rotateAds = false,
  rotateInterval = 30000
}: BottomBannerAdProps) {
  const { bannerAds, settings, trackAdClick, trackAdView, getRandomBannerAd } = useAds()
  const [currentAd, setCurrentAd] = useState<Ad | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  const position = propPosition ?? settings.bannerPosition

  // 광고 설정 및 로테이션
  useEffect(() => {
    if (bannerAds.length > 0) {
      if (rotateAds && bannerAds.length > 1) {
        // 로테이션 모드: 랜덤 광고 선택
        setCurrentAd(getRandomBannerAd())
        
        const timer = setInterval(() => {
          setCurrentAd(getRandomBannerAd())
        }, rotateInterval)
        
        return () => clearInterval(timer)
      } else {
        // 일반 모드: 첫 번째 광고 사용
        setCurrentAd(bannerAds[0])
      }
    }
  }, [bannerAds, rotateAds, rotateInterval, getRandomBannerAd])

  // 광고 노출 추적
  useEffect(() => {
    if (currentAd && isVisible && !isDismissed) {
      trackAdView(currentAd.id)
    }
  }, [currentAd, isVisible, isDismissed, trackAdView])

  // 스크롤 기반 가시성 제어
  useEffect(() => {
    if (position === 'fixed') {
      const handleScroll = () => {
        const scrollY = window.scrollY
        const windowHeight = window.innerHeight
        const documentHeight = document.documentElement.scrollHeight
        
        // 페이지 하단 근처에서만 표시
        const showThreshold = documentHeight - windowHeight - 200
        setIsVisible(scrollY > showThreshold)
      }

      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [position])

  if (!currentAd || isDismissed || (position === 'fixed' && !isVisible)) {
    return null
  }

  const handleAdClick = () => {
    trackAdClick(currentAd.id)
  }

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  return (
    <div 
      className={cn(
        "w-full bg-white border-t shadow-lg z-40",
        position === 'fixed' && "fixed bottom-0 left-0 right-0",
        position === 'static' && "relative",
        className
      )}
    >
      <div className="max-w-6xl mx-auto relative">
        <Link
          href={currentAd.linkUrl}
          onClick={handleAdClick}
          className="block group"
        >
          <div className="flex flex-col sm:flex-row items-center p-3 sm:p-4 space-y-3 sm:space-y-0 sm:space-x-4 md:space-x-6">
            {/* 이미지 */}
            <div className="relative w-full sm:w-48 md:w-64 h-20 sm:h-16 md:h-20 flex-shrink-0 rounded-lg overflow-hidden">
              <Image
                src={currentAd.imageUrl}
                alt={currentAd.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 192px, 256px"
              />
            </div>
            
            {/* 텍스트 컨텐츠 */}
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                {currentAd.title}
              </h3>
              {currentAd.description && (
                <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {currentAd.description}
                </p>
              )}
            </div>
            
            {/* CTA */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className="text-xs sm:text-sm text-blue-600 font-medium group-hover:underline">
                자세히 보기
              </span>
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
        
        {/* 광고 라벨 */}
        <div className="absolute top-2 left-2">
          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded">
            광고
          </span>
        </div>
        
        {/* 닫기 버튼 */}
        {dismissible && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 sm:top-2 right-1 sm:right-2 h-6 w-6 sm:h-8 sm:w-8 text-slate-400 hover:text-slate-600"
            onClick={handleDismiss}
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}