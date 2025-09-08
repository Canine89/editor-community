import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const shortCode = params.code

    if (!shortCode) {
      return NextResponse.json({ error: '링크 코드가 필요합니다.' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // 링크 조회
    const { data: link, error } = await supabase
      .from('managed_links')
      .select('*')
      .eq('short_code', shortCode)
      .single()

    if (error || !link) {
      // 404 페이지로 리다이렉트 또는 오류 메시지
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>링크를 찾을 수 없습니다</title>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              text-align: center;
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              max-width: 400px;
            }
            .error-code { font-size: 3rem; color: #666; margin-bottom: 1rem; }
            h1 { color: #333; margin-bottom: 1rem; }
            p { color: #666; margin-bottom: 2rem; }
            a { 
              display: inline-block;
              padding: 0.75rem 1.5rem;
              background: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              transition: background 0.2s;
            }
            a:hover { background: #0056b3; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-code">🔗</div>
            <h1>링크를 찾을 수 없습니다</h1>
            <p>요청하신 링크가 존재하지 않거나 삭제되었습니다.</p>
            <a href="/">홈으로 돌아가기</a>
          </div>
        </body>
        </html>`,
        {
          status: 404,
          headers: {
            'Content-Type': 'text/html; charset=utf-8'
          }
        }
      )
    }

    // 클릭 수 증가 (비동기, 실패해도 리다이렉트는 진행)
    supabase.rpc('increment_link_clicks', { 
      link_code: shortCode 
    }).catch(err => {
      console.error('클릭 수 증가 실패:', err)
    })

    // 목적지 URL로 리다이렉트
    const targetUrl = link.current_url.startsWith('http') 
      ? link.current_url 
      : `https://${link.current_url}`

    return NextResponse.redirect(targetUrl, 302)

  } catch (error) {
    console.error('리다이렉트 오류:', error)
    
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>서버 오류</title>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #f5f5f5;
          }
          .container {
            text-align: center;
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 400px;
          }
          .error-code { font-size: 3rem; color: #dc3545; margin-bottom: 1rem; }
          h1 { color: #333; margin-bottom: 1rem; }
          p { color: #666; margin-bottom: 2rem; }
          a { 
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            transition: background 0.2s;
          }
          a:hover { background: #0056b3; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error-code">⚠️</div>
          <h1>일시적인 오류가 발생했습니다</h1>
          <p>잠시 후 다시 시도해주세요.</p>
          <a href="/">홈으로 돌아가기</a>
        </div>
      </body>
      </html>`,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/html; charset=utf-8'
        }
      }
    )
  }
}