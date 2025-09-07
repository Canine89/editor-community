// Script to set up initial advertisements and settings in production database
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:')
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

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

async function createTables() {
  console.log('🏗️ Creating advertisement tables...')
  
  try {
    // 테이블이 이미 존재하는지 확인
    const { data: existingAds, error: checkError } = await supabase
      .from('advertisements')
      .select('id')
      .limit(1)
    
    if (!checkError) {
      console.log('✅ Advertisement tables already exist!')
      return
    }
    
    console.log('📋 Tables not found, creating them now...')
    
    // 전체 스키마 실행
    const schemaSQL = `
    -- 광고 테이블
    CREATE TABLE IF NOT EXISTS advertisements (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      title text NOT NULL,
      description text,
      type text NOT NULL CHECK (type IN ('carousel', 'banner')),
      image_url text NOT NULL,
      link_url text NOT NULL,
      display_order integer NOT NULL DEFAULT 1,
      start_date timestamp with time zone NOT NULL,
      end_date timestamp with time zone NOT NULL,
      is_active boolean DEFAULT true,
      click_count integer DEFAULT 0 NOT NULL,
      view_count integer DEFAULT 0 NOT NULL,
      advertiser_name text NOT NULL,
      advertiser_email text,
      advertiser_phone text,
      created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
    );
    
    -- 광고 설정 테이블
    CREATE TABLE IF NOT EXISTS ad_settings (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      show_top_carousel boolean DEFAULT true,
      show_bottom_banner boolean DEFAULT true,
      carousel_auto_play boolean DEFAULT true,
      carousel_interval integer DEFAULT 5000,
      banner_position text DEFAULT 'static' CHECK (banner_position IN ('fixed', 'static')),
      updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
    );
    
    -- RLS 설정
    ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
    ALTER TABLE ad_settings ENABLE ROW LEVEL SECURITY;
    
    -- 광고 정책
    CREATE POLICY "Advertisements are viewable by everyone" ON advertisements
      FOR SELECT USING (true);
    CREATE POLICY "Only authenticated users can manage advertisements" ON advertisements
      FOR ALL USING (auth.uid() IS NOT NULL);
    
    -- 광고 설정 정책
    CREATE POLICY "Ad settings are viewable by everyone" ON ad_settings
      FOR SELECT USING (true);
    CREATE POLICY "Only authenticated users can manage ad settings" ON ad_settings
      FOR ALL USING (auth.uid() IS NOT NULL);
    
    -- 광고 클릭/조회수 업데이트 함수
    CREATE OR REPLACE FUNCTION increment_ad_clicks(ad_uuid uuid)
    RETURNS void AS $$
    BEGIN
      UPDATE advertisements SET click_count = click_count + 1 WHERE id = ad_uuid;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    CREATE OR REPLACE FUNCTION increment_ad_views(ad_uuid uuid)
    RETURNS void AS $$
    BEGIN
      UPDATE advertisements SET view_count = view_count + 1 WHERE id = ad_uuid;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
    
    const { error: schemaError } = await supabase.rpc('exec', { sql: schemaSQL })
    
    if (schemaError) {
      console.error('❌ Schema creation failed:', schemaError.message)
      console.log('⚠️ Please run supabase-schema.sql manually in Supabase SQL Editor')
      return false
    }
    
    console.log('✅ Advertisement tables created successfully!')
    return true
    
  } catch (error) {
    console.error('❌ Table creation error:', error.message)
    console.log('⚠️ Please run supabase-schema.sql manually in Supabase SQL Editor')
    return false
  }
}

async function main() {
  console.log('🎯 Starting advertisement system setup...\n')
  
  await createTables()
  console.log()
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