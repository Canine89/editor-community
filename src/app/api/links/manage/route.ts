import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// 링크 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 사용자의 관리형 링크 목록 조회
    const { data: links, error: linksError } = await supabase
      .from('managed_links')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (linksError) {
      return NextResponse.json({ 
        error: '링크 목록 조회에 실패했습니다: ' + linksError.message 
      }, { status: 500 })
    }

    // 링크 URL 형태로 변환
    const transformedLinks = links.map(link => ({
      ...link,
      short_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://editor-community.com'}/l/${link.short_code}`,
      can_edit: true,
      managed: true
    }))

    return NextResponse.json({ 
      success: true, 
      links: transformedLinks 
    })

  } catch (error) {
    console.error('링크 목록 조회 오류:', error)
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}

// 링크 수정/삭제
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { id, action, new_url, new_name } = body

    if (!id || !action) {
      return NextResponse.json({ 
        error: '링크 ID와 작업 타입이 필요합니다.' 
      }, { status: 400 })
    }

    if (action === 'update') {
      if (!new_url) {
        return NextResponse.json({ 
          error: '새로운 URL이 필요합니다.' 
        }, { status: 400 })
      }

      // URL 유효성 검증
      try {
        const testUrl = new_url.startsWith('http') ? new_url : `https://${new_url}`
        new URL(testUrl)

        // 기존 URL 조회 (히스토리 기록용)
        const { data: currentLink } = await supabase
          .from('managed_links')
          .select('current_url')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        if (!currentLink) {
          return NextResponse.json({ 
            error: '링크를 찾을 수 없습니다.' 
          }, { status: 404 })
        }

        // 링크 업데이트
        const updateData: any = {
          current_url: testUrl,
          updated_at: new Date().toISOString()
        }

        if (new_name) {
          updateData.link_name = new_name.trim()
        }

        const { error: updateError } = await supabase
          .from('managed_links')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', user.id)

        if (updateError) {
          return NextResponse.json({ 
            error: '링크 업데이트에 실패했습니다: ' + updateError.message 
          }, { status: 500 })
        }

        // 히스토리 기록
        await supabase
          .from('link_history')
          .insert({
            link_id: id,
            old_url: currentLink.current_url,
            new_url: testUrl
          })

        return NextResponse.json({ 
          success: true, 
          message: '링크가 성공적으로 업데이트되었습니다.' 
        })

      } catch (error) {
        return NextResponse.json({ 
          error: '올바른 URL 형식이 아닙니다.' 
        }, { status: 400 })
      }

    } else if (action === 'delete') {
      // 링크 삭제
      const { error: deleteError } = await supabase
        .from('managed_links')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) {
        return NextResponse.json({ 
          error: '링크 삭제에 실패했습니다: ' + deleteError.message 
        }, { status: 500 })
      }

      // 할당량에서 차감
      await supabase
        .from('user_quotas')
        .update({ 
          total_links: supabase.raw('COALESCE(total_links, 0) - 1'),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      return NextResponse.json({ 
        success: true, 
        message: '링크가 성공적으로 삭제되었습니다.' 
      })

    } else {
      return NextResponse.json({ 
        error: '지원하지 않는 작업입니다.' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('링크 관리 오류:', error)
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}