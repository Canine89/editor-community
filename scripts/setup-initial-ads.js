// Script to set up initial advertisements and settings in production database
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://obmtqjrmyfiicfjjrwfz.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibXRxanJteWZpaWNmampyd2Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkyNzI5NCwiZXhwIjoyMDcyNTAzMjk0fQ.9YYBMXlF_hDA8ttYhXm91mZGi2y2-rVvabNCcjqnn_c'

const supabase = createClient(supabaseUrl, supabaseKey)

const initialCarouselAds = [
  {
    title: '편집자를 위한 필수 도구',
    description: 'PDF 편집, 워터마크, 맞춤법 검사까지 한 번에',
    type: 'carousel',
    image_url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&h=400&fit=crop',
    link_url: '/tools',
    display_order: 1,
    is_active: true,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
  },
  {
    title: '편집자 커뮤니티 가입하기',
    description: '동료들과 정보를 공유하고 함께 성장해보세요',
    type: 'carousel',
    image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=400&fit=crop',
    link_url: '/community',
    display_order: 2,
    is_active: true,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: '새로운 기회를 찾아보세요',
    description: '편집자 채용 정보를 확인하고 꿈의 직장을 찾아보세요',
    type: 'carousel',
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=400&fit=crop',
    link_url: '/jobs',
    display_order: 3,
    is_active: true,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  }
]

const initialBannerAd = {
  title: '편집자 전용 도구 모음',
  description: '작업 효율성을 높여주는 필수 도구들',
  type: 'banner',
  image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=200&fit=crop',
  link_url: '/tools',
  display_order: 1,
  is_active: true,
  start_date: new Date().toISOString(),
  end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
}

const defaultAdSettings = {
  show_top_carousel: true,
  show_bottom_banner: true,
  carousel_auto_play: true,
  carousel_interval: 5000,
  banner_position: 'static'
}

async function setupInitialAds() {
  console.log('🚀 Setting up initial advertisements...')
  
  try {
    // Check if advertisements already exist
    const { data: existingAds, error: checkError } = await supabase
      .from('advertisements')
      .select('id')
      .limit(1)
    
    if (checkError) {
      console.error('❌ Error checking existing ads:', checkError.message)
      return
    }
    
    if (existingAds && existingAds.length > 0) {
      console.log('ℹ️ Advertisements already exist, skipping initial setup')
    } else {
      // Insert carousel ads
      console.log('📦 Inserting carousel advertisements...')
      const { error: carouselError } = await supabase
        .from('advertisements')
        .insert(initialCarouselAds)
      
      if (carouselError) {
        console.error('❌ Error inserting carousel ads:', carouselError.message)
        return
      }
      
      // Insert banner ad
      console.log('📦 Inserting banner advertisement...')
      const { error: bannerError } = await supabase
        .from('advertisements')
        .insert([initialBannerAd])
      
      if (bannerError) {
        console.error('❌ Error inserting banner ad:', bannerError.message)
        return
      }
      
      console.log('✅ Initial advertisements created successfully!')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

async function setupAdSettings() {
  console.log('⚙️ Setting up advertisement settings...')
  
  try {
    // Check if settings already exist
    const { data: existingSettings, error: checkError } = await supabase
      .from('ad_settings')
      .select('id')
      .single()
    
    if (existingSettings) {
      console.log('ℹ️ Ad settings already exist, skipping setup')
      return
    }
    
    // Insert default settings
    const { error: settingsError } = await supabase
      .from('ad_settings')
      .insert([defaultAdSettings])
    
    if (settingsError) {
      console.error('❌ Error inserting ad settings:', settingsError.message)
      return
    }
    
    console.log('✅ Advertisement settings created successfully!')
    
  } catch (error) {
    if (error.message.includes('No rows returned')) {
      // Settings don't exist, create them
      const { error: insertError } = await supabase
        .from('ad_settings')
        .insert([defaultAdSettings])
      
      if (insertError) {
        console.error('❌ Error creating ad settings:', insertError.message)
      } else {
        console.log('✅ Advertisement settings created successfully!')
      }
    } else {
      console.error('❌ Unexpected error:', error.message)
    }
  }
}

async function verifySetup() {
  console.log('🔍 Verifying setup...')
  
  try {
    const { data: ads, error: adsError } = await supabase
      .from('advertisements')
      .select('*')
    
    if (adsError) {
      console.error('❌ Error verifying ads:', adsError.message)
      return
    }
    
    const { data: settings, error: settingsError } = await supabase
      .from('ad_settings')
      .select('*')
      .single()
    
    if (settingsError) {
      console.error('❌ Error verifying settings:', settingsError.message)
      return
    }
    
    console.log(`📊 Total advertisements: ${ads?.length || 0}`)
    console.log(`✅ Active carousel ads: ${ads?.filter(ad => ad.type === 'carousel' && ad.is_active).length || 0}`)
    console.log(`✅ Active banner ads: ${ads?.filter(ad => ad.type === 'banner' && ad.is_active).length || 0}`)
    console.log(`⚙️ Carousel enabled: ${settings?.show_top_carousel}`)
    console.log(`⚙️ Banner enabled: ${settings?.show_bottom_banner}`)
    
  } catch (error) {
    console.error('❌ Verification error:', error.message)
  }
}

async function main() {
  console.log('🎯 Starting advertisement system setup...\n')
  
  await setupInitialAds()
  console.log()
  await setupAdSettings()
  console.log()
  await verifySetup()
  
  console.log('\n✅ Setup complete!')
  console.log('\n📝 Next steps:')
  console.log('1. Ensure NEXT_PUBLIC_IS_DEV_MODE is NOT set to "true" in production')
  console.log('2. Deploy the application')
  console.log('3. Visit /jobs or /community to see advertisements')
  console.log('4. Access /admin/advertisements to manage advertisements')
}

main().catch(console.error)