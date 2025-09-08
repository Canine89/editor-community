import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { createBitlyShortLink } from '@/lib/bitly'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 })
    }

    // URL 유효성 검증
    try {
      const testUrl = url.startsWith('http') ? url : `https://${url}`
      new URL(testUrl)
    } catch {
      return NextResponse.json({ error: '올바른 URL 형식이 아닙니다.' }, { status: 400 })
    }

    const accessToken = process.env.BITLY_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Bitly 서비스가 현재 이용할 수 없습니다.' 
      }, { status: 503 })
    }

    // Bitly API 호출
    const result = await createBitlyShortLink(url, accessToken)

    if (!result.success) {
      return NextResponse.json({ 
        error: result.message || 'URL 단축에 실패했습니다.',
        details: result.error 
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        short_url: result.data?.link,
        long_url: result.data?.long_url,
        id: result.data?.id,
        created_at: result.data?.created_at
      }
    })

  } catch (error) {
    console.error('Bitly API 오류:', error)
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}