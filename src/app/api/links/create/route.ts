import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createBitlyShortLink } from '@/lib/bitly'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('인증 오류:', authError)
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { url, name, bulk_data } = body

    // 개별 링크 생성 vs 벌크 생성 분기
    if (bulk_data && Array.isArray(bulk_data)) {
      return handleBulkCreation(user.id, bulk_data)
    } else {
      return handleSingleCreation(user.id, url, name)
    }

  } catch (error) {
    console.error('링크 생성 오류:', error)
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}

// 개별 링크 생성
async function handleSingleCreation(userId: string, url: string, name?: string) {
  const supabase = createServerSupabaseClient()

  if (!url) {
    return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 })
  }

  // URL 유효성 검증
  let testUrl: string
  try {
    testUrl = url.startsWith('http') ? url : `https://${url}`
    new URL(testUrl)
  } catch (urlError) {
    console.error('URL 형식 오류:', urlError)
    return NextResponse.json({
      error: '올바른 URL 형식이 아닙니다.'
    }, { status: 400 })
  }

  try {
    let result: any = { url, success: false }

    if (name && name.trim()) {
      // 이름이 있는 경우 - 관리형 링크 생성
      
      // 프리미엄 권한 확인
      let profile: any
      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('user_role, membership_tier')
          .eq('id', userId)
          .single()
          
        if (profileError) {
          console.error('프로필 조회 오류:', profileError)
          return NextResponse.json({ 
            error: '사용자 정보를 확인할 수 없습니다.' 
          }, { status: 500 })
        }
        
        profile = data
      } catch (profileFetchError) {
        console.error('프로필 조회 실패:', profileFetchError)
        return NextResponse.json({ 
          error: '사용자 정보 조회에 실패했습니다.' 
        }, { status: 500 })
      }

      const isPremium = profile?.membership_tier === 'premium' || 
                       ['employee', 'master'].includes(profile?.user_role || '')

      if (!isPremium) {
        return NextResponse.json({ 
          error: '프리미엄 기능입니다. 업그레이드가 필요합니다.' 
        }, { status: 403 })
      }

      // 할당량 확인
      const quotaCheck = await checkUserQuota(userId)
      if (!quotaCheck.canCreate) {
        return NextResponse.json({ 
          error: '월 할당량(50개)을 초과했습니다.' 
        }, { status: 400 })
      }

      // 고유 단축 코드 생성
      const shortCode = `ec-${nanoid(8)}`
      
      // Bitly 링크 생성 (선택사항)
      let bitlyLink = ''
      const accessToken = process.env.BITLY_ACCESS_TOKEN
      if (accessToken) {
        const bitlyResult = await createBitlyShortLink(testUrl, accessToken)
        if (bitlyResult.success) {
          bitlyLink = bitlyResult.data?.link || ''
        }
      }

      // 관리형 링크 생성
      const { data: linkData, error: linkError } = await supabase
        .from('managed_links')
        .insert({
          user_id: userId,
          link_name: name.trim(),
          short_code: shortCode,
          current_url: testUrl,
          original_url: testUrl,
          bitly_link: bitlyLink || null
        })
        .select()
        .single()

      if (linkError) {
        return NextResponse.json({ 
          error: '링크 생성에 실패했습니다: ' + linkError.message 
        }, { status: 500 })
      }

      // 할당량 업데이트
      await updateUserQuota(userId)

      result = {
        url,
        name: name.trim(),
        success: true,
        managed: true,
        short_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://editor-community.com'}/l/${shortCode}`,
        bitly_url: bitlyLink,
        short_code: shortCode,
        can_edit: true,
        click_count: 0,
        id: linkData.id
      }

    } else {
      // 이름이 없는 경우 - Bitly 직접 생성 (할당량 미소모)
      const accessToken = process.env.BITLY_ACCESS_TOKEN
      if (!accessToken) {
        return NextResponse.json({ 
          error: 'Bitly 서비스가 현재 이용할 수 없습니다.' 
        }, { status: 503 })
      }

      const bitlyResult = await createBitlyShortLink(testUrl, accessToken)
      if (bitlyResult.success) {
        result = {
          url,
          success: true,
          managed: false,
          short_url: bitlyResult.data?.link,
          can_edit: false,
          created_at: bitlyResult.data?.created_at
        }
      } else {
        result.error = bitlyResult.message || 'URL 단축에 실패했습니다.'
      }
    }

    return NextResponse.json({ success: result.success, result })

  } catch (error) {
    console.error('링크 생성 중 예상치 못한 오류:', error)
    return NextResponse.json({
      error: '링크 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    }, { status: 500 })
  }
}

// 벌크 링크 생성 (기존 방식 유지)
async function handleBulkCreation(userId: string, bulkData: any[]) {
  const supabase = createServerSupabaseClient()
  const results = []
  const accessToken = process.env.BITLY_ACCESS_TOKEN

  if (!accessToken) {
    return NextResponse.json({ 
      error: 'Bitly 서비스가 현재 이용할 수 없습니다.' 
    }, { status: 503 })
  }

  // 프리미엄 권한 확인
  let profile: any
  try {
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('user_role, membership_tier')
      .eq('id', userId)
      .single()
      
    if (profileError) {
      console.error('벌크 생성 - 프로필 조회 오류:', profileError)
      return NextResponse.json({ 
        error: '사용자 정보를 확인할 수 없습니다.' 
      }, { status: 500 })
    }
    
    profile = data
  } catch (profileFetchError) {
    console.error('벌크 생성 - 프로필 조회 실패:', profileFetchError)
    return NextResponse.json({ 
      error: '사용자 정보 조회에 실패했습니다.' 
    }, { status: 500 })
  }

  const isPremium = profile?.membership_tier === 'premium' || 
                   ['employee', 'master'].includes(profile?.user_role || '')

  if (!isPremium) {
    return NextResponse.json({ 
      error: '프리미엄 기능입니다. 업그레이드가 필요합니다.' 
    }, { status: 403 })
  }

  for (const urlData of bulkData) {
    const { url, name } = urlData

    // URL 유효성 검증
    let testUrl: string
    try {
      testUrl = url.startsWith('http') ? url : `https://${url}`
      new URL(testUrl)
    } catch (urlError) {
      results.push({
        url,
        success: false,
        error: '올바른 URL 형식이 아닙니다.'
      })
      continue
    }

    try {
      let result: any = { url, success: false }

      if (name && name.trim()) {
        // 관리형 링크 생성
        const quotaCheck = await checkUserQuota(userId)
        if (!quotaCheck.canCreate) {
          result.error = '월 할당량(50개)을 초과했습니다.'
        } else {
          // Bitly 링크 생성 (선택사항)
          let bitlyLink = ''
          const bitlyResult = await createBitlyShortLink(testUrl, accessToken)
          if (bitlyResult.success) {
            bitlyLink = bitlyResult.data?.link || ''
          }

          // 고유 단축 코드 생성
          const shortCode = `ec-${nanoid(8)}`

          // 관리형 링크 생성
          const { data: linkData, error: linkError } = await supabase
            .from('managed_links')
            .insert({
              user_id: userId,
              link_name: name.trim(),
              short_code: shortCode,
              current_url: testUrl,
              original_url: testUrl,
              bitly_link: bitlyLink || null
            })
            .select()
            .single()

          if (!linkError && linkData) {
            await updateUserQuota(userId)
            
            result = {
              url,
              name: name.trim(),
              success: true,
              managed: true,
              short_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://editor-community.com'}/l/${shortCode}`,
              bitly_url: bitlyLink,
              short_code: shortCode,
              can_edit: true,
              click_count: 0,
              id: linkData.id
            }
          } else {
            result.error = linkError?.message || '링크 생성에 실패했습니다.'
          }
        }
      } else {
        // 이름이 없는 경우 - Bitly 직접 생성 (할당량 미소모)
        const bitlyResult = await createBitlyShortLink(testUrl, accessToken)
        if (bitlyResult.success) {
          result = {
            url,
            success: true,
            managed: false,
            short_url: bitlyResult.data?.link,
            can_edit: false,
            created_at: bitlyResult.data?.created_at
          }
        } else {
          result.error = bitlyResult.message || 'URL 단축에 실패했습니다.'
        }
      }

      results.push(result)

    } catch (error) {
      console.error('벌크 생성 중 오류:', error)
      results.push({
        url,
        success: false,
        error: '링크 생성 중 오류가 발생했습니다.'
      })
    }

    // API 제한을 위한 지연
    if (results.length < bulkData.length) {
      await new Promise(resolve => setTimeout(resolve, 250))
    }
  }

  const successCount = results.filter(r => r.success).length

  return NextResponse.json({
    success: successCount > 0,
    total: bulkData.length,
    success_count: successCount,
    results
  })
}

// 사용자 할당량 확인
async function checkUserQuota(userId: string): Promise<{ canCreate: boolean }> {
  const supabase = createServerSupabaseClient()
  
  const { data: quota } = await supabase
    .from('user_quotas')
    .select('links_created_this_month')
    .eq('user_id', userId)
    .single()

  if (!quota) {
    // 새 사용자 - 할당량 레코드 생성
    await supabase
      .from('user_quotas')
      .insert({
        user_id: userId,
        links_created_this_month: 0,
        total_links: 0
      })
    
    return { canCreate: true }
  }

  const canCreate = (quota.links_created_this_month || 0) < 50 // 월 50개 제한
  return { canCreate }
}

// 사용자 할당량 업데이트
async function updateUserQuota(userId: string) {
  const supabase = createServerSupabaseClient()
  
  await supabase
    .from('user_quotas')
    .upsert({
      user_id: userId,
      links_created_this_month: supabase.raw('COALESCE(links_created_this_month, 0) + 1'),
      total_links: supabase.raw('COALESCE(total_links, 0) + 1'),
      updated_at: new Date().toISOString()
    })
}