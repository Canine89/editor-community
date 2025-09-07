'use client'

import { useState, useEffect } from 'react'
import { getActiveAdvertisements, getAdSettings, incrementAdClick, incrementAdView, type Advertisement, type AdSettings as DBAdSettings } from '@/lib/advertisements'

export interface Ad {
  id: string
  type: 'carousel' | 'banner'
  title: string
  description?: string
  imageUrl: string
  linkUrl: string
  isActive: boolean
  displayOrder: number
  startDate?: string
  endDate?: string
}

export interface AdSettings {
  showTopCarousel: boolean
  showBottomBanner: boolean
  carouselAutoPlay: boolean
  carouselInterval: number
  bannerPosition: 'fixed' | 'static'
}

const mockCarouselAds: Ad[] = [
  {
    id: 'carousel-1',
    type: 'carousel',
    title: '편집자를 위한 필수 도구',
    description: 'PDF 편집, 워터마크, 맞춤법 검사까지 한 번에',
    imageUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=300&fit=crop',
    linkUrl: '/tools',
    isActive: true,
    displayOrder: 1
  },
  {
    id: 'carousel-2',
    type: 'carousel',
    title: '편집자 커뮤니티 가입하기',
    description: '동료들과 정보를 공유하고 함께 성장해보세요',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=300&fit=crop',
    linkUrl: '/community',
    isActive: true,
    displayOrder: 2
  },
  {
    id: 'carousel-3',
    type: 'carousel',
    title: '새로운 기회를 찾아보세요',
    description: '편집자 채용 정보를 확인하고 꿈의 직장을 찾아보세요',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=300&fit=crop',
    linkUrl: '/jobs',
    isActive: true,
    displayOrder: 3
  }
]

const mockBannerAds: Ad[] = [
  {
    id: 'banner-1',
    type: 'banner',
    title: '편집자 전용 도구 모음',
    description: '작업 효율성을 높여주는 필수 도구들',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=200&fit=crop',
    linkUrl: '/tools',
    isActive: true,
    displayOrder: 1
  },
  {
    id: 'banner-2',
    type: 'banner',
    title: '편집자 채용 정보',
    description: '최신 채용 공고를 놓치지 마세요',
    imageUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=200&fit=crop',
    linkUrl: '/jobs',
    isActive: true,
    displayOrder: 2
  }
]

const defaultSettings: AdSettings = {
  showTopCarousel: true,
  showBottomBanner: true,
  carouselAutoPlay: true,
  carouselInterval: 5000,
  bannerPosition: 'static'
}

export function useAds() {
  const [carouselAds, setCarouselAds] = useState<Ad[]>([])
  const [bannerAds, setBannerAds] = useState<Ad[]>([])
  const [settings, setSettings] = useState<AdSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAds()
  }, [])

  // Advertisement를 Ad 인터페이스로 변환하는 함수
  const convertAdvertisementToAd = (ad: Advertisement): Ad => ({
    id: ad.id,
    type: ad.type,
    title: ad.title,
    description: ad.description,
    imageUrl: ad.image_url,
    linkUrl: ad.link_url,
    isActive: ad.is_active,
    displayOrder: ad.display_order,
    startDate: ad.start_date,
    endDate: ad.end_date
  })

  // AdSettings를 DB 형식에서 Hook 형식으로 변환
  const convertDBSettingsToHookSettings = (dbSettings: DBAdSettings): AdSettings => ({
    showTopCarousel: dbSettings.show_top_carousel,
    showBottomBanner: dbSettings.show_bottom_banner,
    carouselAutoPlay: dbSettings.carousel_auto_play,
    carouselInterval: dbSettings.carousel_interval,
    bannerPosition: dbSettings.banner_position
  })

  const loadAds = async () => {
    try {
      setLoading(true)
      
      const isDevMode = process.env.NEXT_PUBLIC_IS_DEV_MODE === 'true'
      
      console.log('🔍 useAds: Loading advertisements...', {
        isDevMode,
        env: process.env.NEXT_PUBLIC_IS_DEV_MODE,
        nodeEnv: process.env.NODE_ENV
      })
      
      if (isDevMode) {
        // 개발 모드에서는 목 데이터 사용
        console.log('📋 useAds: Using mock data (development mode)')
        
        const activeCarouselAds = mockCarouselAds
          .filter(ad => ad.isActive && ad.type === 'carousel')
          .sort((a, b) => a.displayOrder - b.displayOrder)
        
        const activeBannerAds = mockBannerAds
          .filter(ad => ad.isActive && ad.type === 'banner')
          .sort((a, b) => a.displayOrder - b.displayOrder)
        
        setCarouselAds(activeCarouselAds)
        setBannerAds(activeBannerAds)
      } else {
        // 프로덕션에서는 실제 데이터베이스에서 광고 데이터 로드
        console.log('💾 useAds: Loading from database (production mode)')
        
        const [allAds, dbSettings] = await Promise.all([
          getActiveAdvertisements(),
          getAdSettings()
        ])

        console.log('📊 useAds: Database results', {
          totalAds: allAds?.length || 0,
          hasSettings: !!dbSettings
        })

        // 캐러셀 광고와 배너 광고 분리
        const carouselAdvertisements = allAds
          .filter(ad => ad.type === 'carousel')
          .sort((a, b) => a.display_order - b.display_order)
          .map(convertAdvertisementToAd)

        const bannerAdvertisements = allAds
          .filter(ad => ad.type === 'banner')
          .sort((a, b) => a.display_order - b.display_order)
          .map(convertAdvertisementToAd)

        console.log('🎠 useAds: Processed ads', {
          carouselAds: carouselAdvertisements.length,
          bannerAds: bannerAdvertisements.length
        })

        setCarouselAds(carouselAdvertisements)
        setBannerAds(bannerAdvertisements)

        // 광고 설정 업데이트
        if (dbSettings) {
          setSettings(convertDBSettingsToHookSettings(dbSettings))
        }
      }
    } catch (error) {
      console.error('광고 데이터 로드 실패:', error)
      setCarouselAds([])
      setBannerAds([])
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = (newSettings: Partial<AdSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }))
  }

  const trackAdClick = async (adId: string) => {
    try {
      if (typeof window !== 'undefined') {
        console.log(`광고 클릭 추적: ${adId}`)
        
        const isDevMode = process.env.NEXT_PUBLIC_IS_DEV_MODE === 'true'
        
        if (!isDevMode) {
          // 프로덕션에서는 실제 데이터베이스에 클릭 수 증가
          await incrementAdClick(adId)
        }
      }
    } catch (error) {
      console.error('광고 클릭 추적 실패:', error)
    }
  }

  const trackAdView = async (adId: string) => {
    try {
      if (typeof window !== 'undefined') {
        console.log(`광고 노출 추적: ${adId}`)
        
        const isDevMode = process.env.NEXT_PUBLIC_IS_DEV_MODE === 'true'
        
        if (!isDevMode) {
          // 프로덕션에서는 실제 데이터베이스에 노출 수 증가
          await incrementAdView(adId)
        }
      }
    } catch (error) {
      console.error('광고 노출 추적 실패:', error)
    }
  }

  const getRandomBannerAd = (): Ad | null => {
    if (bannerAds.length === 0) return null
    
    const randomIndex = Math.floor(Math.random() * bannerAds.length)
    return bannerAds[randomIndex]
  }

  const shouldShowCarousel = () => {
    return settings.showTopCarousel && carouselAds.length > 0
  }

  const shouldShowBanner = () => {
    return settings.showBottomBanner && bannerAds.length > 0
  }

  return {
    carouselAds,
    bannerAds,
    settings,
    loading,
    updateSettings,
    trackAdClick,
    trackAdView,
    getRandomBannerAd,
    shouldShowCarousel,
    shouldShowBanner,
    refreshAds: loadAds
  }
}