import { createClient } from '@/lib/supabase'

export interface Advertisement {
  id: string
  title: string
  description?: string
  type: 'carousel' | 'banner'
  image_url: string
  link_url: string
  display_order: number
  start_date: string
  end_date: string
  is_active: boolean
  click_count: number
  view_count: number
  advertiser_name: string
  advertiser_email?: string
  advertiser_phone?: string
  created_at: string
  updated_at: string
}

export interface AdSettings {
  id: string
  show_top_carousel: boolean
  show_bottom_banner: boolean
  carousel_auto_play: boolean
  carousel_interval: number
  banner_position: 'fixed' | 'static'
  updated_at: string
}

export interface CreateAdvertisementData {
  title: string
  description?: string
  type: 'carousel' | 'banner'
  image_url: string
  link_url: string
  display_order: number
  start_date: string
  end_date: string
  advertiser_name: string
  advertiser_email?: string
  advertiser_phone?: string
  is_active?: boolean
}

export interface UpdateAdvertisementData extends Partial<CreateAdvertisementData> {
  id: string
}

export interface AdStatistics {
  total_ads: number
  active_ads: number
  expired_ads: number
  total_clicks: number
  total_views: number
  carousel_ads: number
  banner_ads: number
}

// 광고 CRUD 함수들
export async function getAllAdvertisements(): Promise<Advertisement[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('advertisements')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch advertisements: ${error.message}`)
  }

  return data || []
}

export async function getActiveAdvertisements(type?: 'carousel' | 'banner'): Promise<Advertisement[]> {
  const supabase = createClient()
  const now = new Date().toISOString()
  
  let query = supabase
    .from('advertisements')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', now)
    .gte('end_date', now)
    .order('display_order', { ascending: true })

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch active advertisements: ${error.message}`)
  }

  return data || []
}

export async function getAdvertisementById(id: string): Promise<Advertisement | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('advertisements')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    throw new Error(`Failed to fetch advertisement: ${error.message}`)
  }

  return data
}

export async function createAdvertisement(adData: CreateAdvertisementData): Promise<Advertisement> {
  const supabase = createClient()
  
  const insertData = {
    ...adData,
    is_active: adData.is_active ?? true
  }
  
  // @ts-ignore - Supabase type inference issue
  const { data, error } = await supabase
    .from('advertisements')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create advertisement: ${error.message}`)
  }

  return data as Advertisement
}

export async function updateAdvertisement(adData: UpdateAdvertisementData): Promise<Advertisement> {
  const supabase = createClient()
  const { id, ...updateData } = adData
  
  const updatePayload = {
    ...updateData,
    updated_at: new Date().toISOString()
  }
  
  // @ts-ignore - Supabase type inference issue
  const { data, error } = await supabase
    .from('advertisements')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update advertisement: ${error.message}`)
  }

  return data as Advertisement
}

export async function deleteAdvertisement(id: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('advertisements')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete advertisement: ${error.message}`)
  }
}

export async function toggleAdvertisementStatus(id: string, isActive: boolean): Promise<Advertisement> {
  const supabase = createClient()
  
  const updateData = { 
    is_active: isActive,
    updated_at: new Date().toISOString()
  }
  
  // @ts-ignore - Supabase type inference issue
  const { data, error } = await supabase
    .from('advertisements')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to toggle advertisement status: ${error.message}`)
  }

  return data as Advertisement
}

// 광고 설정 함수들
export async function getAdSettings(): Promise<AdSettings | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ad_settings')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // No settings found
    }
    throw new Error(`Failed to fetch ad settings: ${error.message}`)
  }

  return data
}

export async function updateAdSettings(settings: Partial<Omit<AdSettings, 'id' | 'updated_at'>>): Promise<AdSettings> {
  const supabase = createClient()
  
  // 먼저 기존 설정이 있는지 확인
  const existingSettings = await getAdSettings()
  
  if (existingSettings) {
    // 기존 설정 업데이트
    const updateData = {
      ...settings,
      updated_at: new Date().toISOString()
    }
    
    // @ts-ignore - Supabase type inference issue
    const { data, error } = await supabase
      .from('ad_settings')
      .update(updateData)
      .eq('id', existingSettings.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update ad settings: ${error.message}`)
    }

    return data as AdSettings
  } else {
    // 새로운 설정 생성
    const insertData = {
      ...settings,
      updated_at: new Date().toISOString()
    }
    
    // @ts-ignore - Supabase type inference issue
    const { data, error } = await supabase
      .from('ad_settings')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create ad settings: ${error.message}`)
    }

    return data as AdSettings
  }
}

// 통계 및 추적 함수들
export async function incrementAdClick(id: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase.rpc('increment_ad_clicks', {
    ad_uuid: id
  })

  if (error) {
    throw new Error(`Failed to increment ad clicks: ${error.message}`)
  }
}

export async function incrementAdView(id: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase.rpc('increment_ad_views', {
    ad_uuid: id
  })

  if (error) {
    throw new Error(`Failed to increment ad views: ${error.message}`)
  }
}

export async function getAdStatistics(): Promise<AdStatistics> {
  const supabase = createClient()
  const now = new Date().toISOString()
  
  const { data: allAds, error } = await supabase
    .from('advertisements')
    .select('*')

  if (error) {
    throw new Error(`Failed to fetch advertisement statistics: ${error.message}`)
  }

  const ads = allAds || []
  const activeAds = ads.filter(ad => 
    ad.is_active && 
    ad.start_date <= now && 
    ad.end_date >= now
  )
  const expiredAds = ads.filter(ad => ad.end_date < now)

  return {
    total_ads: ads.length,
    active_ads: activeAds.length,
    expired_ads: expiredAds.length,
    total_clicks: ads.reduce((sum, ad) => sum + ad.click_count, 0),
    total_views: ads.reduce((sum, ad) => sum + ad.view_count, 0),
    carousel_ads: ads.filter(ad => ad.type === 'carousel').length,
    banner_ads: ads.filter(ad => ad.type === 'banner').length
  }
}

// 만료 예정 광고 조회
export async function getExpiringAdvertisements(days: number = 7): Promise<Advertisement[]> {
  const supabase = createClient()
  const now = new Date()
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  
  const { data, error } = await supabase
    .from('advertisements')
    .select('*')
    .eq('is_active', true)
    .gte('end_date', now.toISOString())
    .lte('end_date', futureDate.toISOString())
    .order('end_date', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch expiring advertisements: ${error.message}`)
  }

  return data || []
}

// 기간별 광고 성과 데이터
export async function getAdPerformanceData(startDate: string, endDate: string): Promise<Advertisement[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('advertisements')
    .select('*')
    .gte('start_date', startDate)
    .lte('end_date', endDate)
    .order('click_count', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch advertisement performance data: ${error.message}`)
  }

  return data || []
}

// 이미지 업로드 (Supabase Storage)
export async function uploadAdImage(file: File, fileName: string): Promise<string> {
  const supabase = createClient()
  
  const { data, error } = await supabase.storage
    .from('advertisement-images')
    .upload(fileName, file, {
      upsert: true
    })

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  // Public URL 생성
  const { data: publicUrl } = supabase.storage
    .from('advertisement-images')
    .getPublicUrl(data.path)

  return publicUrl.publicUrl
}

// 이미지 삭제 (Supabase Storage)
export async function deleteAdImage(filePath: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase.storage
    .from('advertisement-images')
    .remove([filePath])

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`)
  }
}