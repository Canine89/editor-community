'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAds, type Ad } from '@/hooks/useAds'
import { cn } from '@/lib/utils'

interface TopCarouselAdProps {
  className?: string
  autoPlay?: boolean
  interval?: number
}

export function TopCarouselAd({ 
  className,
  autoPlay: propAutoPlay,
  interval: propInterval
}: TopCarouselAdProps) {
  const { carouselAds, settings, trackAdClick, trackAdView } = useAds()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(propAutoPlay ?? settings.carouselAutoPlay)
  const [isHovered, setIsHovered] = useState(false)

  const autoPlayInterval = propInterval ?? settings.carouselInterval

  const nextSlide = useCallback(() => {
    if (carouselAds.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % carouselAds.length)
    }
  }, [carouselAds.length])

  const prevSlide = useCallback(() => {
    if (carouselAds.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + carouselAds.length) % carouselAds.length)
    }
  }, [carouselAds.length])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  // Auto-play 기능
  useEffect(() => {
    if (isPlaying && !isHovered && carouselAds.length > 1) {
      const timer = setInterval(nextSlide, autoPlayInterval)
      return () => clearInterval(timer)
    }
  }, [isPlaying, isHovered, nextSlide, autoPlayInterval, carouselAds.length])

  // 광고 노출 추적
  useEffect(() => {
    if (carouselAds[currentIndex]) {
      trackAdView(carouselAds[currentIndex].id)
    }
  }, [currentIndex, carouselAds, trackAdView])

  if (carouselAds.length === 0) {
    return (
      <div 
        className={cn(
          "relative w-full bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg overflow-hidden shadow-sm",
          className
        )}
      >
        <div className="h-[200px] md:h-[250px] lg:h-[300px] flex items-center justify-center">
          <div className="text-center px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-700 mb-2 leading-tight">
                광고 문의
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 mb-4 leading-relaxed">
                편집자 커뮤니티에 광고를 게재하고 싶으시다면 연락해 주세요
              </p>
              <div className="text-sm sm:text-base text-slate-500">
                <p>📧 이메일: hgpark@goldenrabbit.co.kr</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 광고 문의 라벨 */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
          <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded">
            광고 문의
          </span>
        </div>
      </div>
    )
  }

  const currentAd = carouselAds[currentIndex]

  const handleAdClick = () => {
    trackAdClick(currentAd.id)
  }

  return (
    <div 
      className={cn(
        "relative w-full bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg overflow-hidden shadow-sm",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 메인 광고 컨텐츠 */}
      <Link 
        href={currentAd.linkUrl}
        onClick={handleAdClick}
        className="block relative h-[200px] md:h-[250px] lg:h-[300px]"
      >
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-full relative">
            <Image
              src={currentAd.imageUrl}
              alt={currentAd.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
              priority={currentIndex === 0}
            />
            {/* 오버레이 */}
            <div className="absolute inset-0 bg-black/30" />
          </div>
          
          {/* 텍스트 컨텐츠 */}
          <div className="absolute inset-0 flex items-center justify-center text-center px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 drop-shadow-lg leading-tight">
                {currentAd.title}
              </h2>
              {currentAd.description && (
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 drop-shadow-md leading-relaxed">
                  {currentAd.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* 네비게이션 화살표 */}
      {carouselAds.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm h-8 w-8 sm:h-10 sm:w-10"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm h-8 w-8 sm:h-10 sm:w-10"
            onClick={nextSlide}
          >
            <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
          </Button>
        </>
      )}

      {/* 인디케이터 */}
      {carouselAds.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2">
          {carouselAds.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === currentIndex
                  ? "bg-white scale-125"
                  : "bg-white/50 hover:bg-white/70"
              )}
            />
          ))}
        </div>
      )}

      {/* 재생/정지 버튼 */}
      {carouselAds.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm h-8 w-8 sm:h-10 sm:w-10"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? (
            <Pause className="h-3 w-3 sm:h-4 sm:w-4" />
          ) : (
            <Play className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
        </Button>
      )}

      {/* 광고 라벨 */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
        <span className="bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          광고
        </span>
      </div>
    </div>
  )
}