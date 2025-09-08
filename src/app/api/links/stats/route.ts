import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 사용자 통계 조회
    const stats = await getUserStats(user.id)

    return NextResponse.json(stats)

  } catch (error) {
    console.error('통계 조회 오류:', error)
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}

async function getUserStats(userId: string) {
  const supabase = createServerSupabaseClient()

  // 관리형 링크 통계
  const { data: linkStats } = await supabase
    .from('managed_links')
    .select('click_count')
    .eq('user_id', userId)

  // 사용자 할당량 정보
  const { data: quota } = await supabase
    .from('user_quotas')
    .select('links_created_this_month, total_links')
    .eq('user_id', userId)
    .single()

  const totalLinks = linkStats?.length || 0
  const totalClicks = linkStats?.reduce((sum, link) => sum + (link.click_count || 0), 0) || 0
  const linksThisMonth = quota?.links_created_this_month || 0
  const quotaUsed = linksThisMonth
  const quotaLimit = 50

  return {
    total_links: totalLinks,
    links_this_month: linksThisMonth,
    total_clicks: totalClicks,
    quota_used: quotaUsed,
    quota_limit: quotaLimit
  }
}