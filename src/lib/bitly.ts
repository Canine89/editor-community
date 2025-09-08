export interface BitlyResponse {
  id: string
  link: string
  long_url: string
  archived: boolean
  created_at: string
  custom_bitlinks: string[]
  tags: string[]
  deeplinks: {
    app_id: string
    app_uri_path: string
    install_url: string
    install_type: string
  }[]
  references: {
    group: string
    clicks: string
  }
}

export interface BitlyError {
  message: string
  resource: string
  field: string
  code: string
}

export interface BitlyApiResponse {
  success: boolean
  data?: BitlyResponse
  error?: BitlyError
  message?: string
}

export interface BitlyCreateRequest {
  long_url: string
  domain?: string
  group_guid?: string
  title?: string
  tags?: string[]
}

export class BitlyAPI {
  private accessToken: string
  private baseUrl = 'https://api-ssl.bitly.com/v4'

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  // 단축 링크 생성
  async createShortLink(
    longUrl: string,
    options: Partial<BitlyCreateRequest> = {}
  ): Promise<BitlyApiResponse> {
    try {
      // URL 유효성 검증
      if (!this.isValidUrl(longUrl)) {
        return {
          success: false,
          error: {
            message: 'Invalid URL format',
            resource: 'bitlinks',
            field: 'long_url',
            code: 'INVALID_URL'
          }
        }
      }

      const requestBody: BitlyCreateRequest = {
        long_url: longUrl,
        domain: options.domain || 'bit.ly',
        ...options
      }

      const response = await fetch(`${this.baseUrl}/shorten`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const responseData = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: responseData,
          message: `Bitly API Error: ${response.status}`
        }
      }

      return {
        success: true,
        data: responseData as BitlyResponse
      }

    } catch (error) {
      console.error('Bitly API 오류:', error)
      return {
        success: false,
        message: '네트워크 오류 또는 API 호출 실패'
      }
    }
  }

  // 링크 정보 조회
  async getLinkInfo(bitlink: string): Promise<BitlyApiResponse> {
    try {
      // bit.ly/ 부분 제거하고 ID만 추출
      const linkId = bitlink.replace('https://', '').replace('http://', '')

      const response = await fetch(`${this.baseUrl}/bitlinks/${encodeURIComponent(linkId)}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      const responseData = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: responseData,
          message: `Bitly API Error: ${response.status}`
        }
      }

      return {
        success: true,
        data: responseData as BitlyResponse
      }

    } catch (error) {
      console.error('Bitly 링크 조회 오류:', error)
      return {
        success: false,
        message: '네트워크 오류 또는 API 호출 실패'
      }
    }
  }

  // 링크 클릭 통계 조회
  async getLinkClicks(bitlink: string, period: string = 'day'): Promise<{
    success: boolean
    clicks?: number
    data?: any
    error?: string
  }> {
    try {
      const linkId = bitlink.replace('https://', '').replace('http://', '')

      const response = await fetch(
        `${this.baseUrl}/bitlinks/${encodeURIComponent(linkId)}/clicks?unit=${period}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      )

      const responseData = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: `API Error: ${response.status}`
        }
      }

      // 총 클릭 수 계산
      const totalClicks = responseData.link_clicks?.reduce(
        (sum: number, item: any) => sum + (item.clicks || 0), 
        0
      ) || 0

      return {
        success: true,
        clicks: totalClicks,
        data: responseData
      }

    } catch (error) {
      console.error('Bitly 통계 조회 오류:', error)
      return {
        success: false,
        error: '네트워크 오류 또는 API 호출 실패'
      }
    }
  }

  // 벌크 링크 생성 (여러 개 한번에)
  async createBulkLinks(
    urls: string[],
    options: Partial<BitlyCreateRequest> = {}
  ): Promise<{
    success: boolean
    results: Array<{
      url: string
      result: BitlyApiResponse
    }>
  }> {
    const results: Array<{
      url: string
      result: BitlyApiResponse
    }> = []

    // 순차적으로 처리 (API 제한을 피하기 위해)
    for (const url of urls) {
      const result = await this.createShortLink(url, options)
      results.push({ url, result })

      // API 제한을 피하기 위한 지연
      if (results.length < urls.length) {
        await this.delay(250) // 250ms 지연
      }
    }

    const successCount = results.filter(r => r.result.success).length
    
    return {
      success: successCount > 0,
      results
    }
  }

  // 사용자 정보 조회
  async getUserInfo(): Promise<{
    success: boolean
    data?: any
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      const responseData = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: `API Error: ${response.status}`
        }
      }

      return {
        success: true,
        data: responseData
      }

    } catch (error) {
      console.error('Bitly 사용자 정보 조회 오류:', error)
      return {
        success: false,
        error: '네트워크 오류 또는 API 호출 실패'
      }
    }
  }

  // 그룹 목록 조회 (조직별 그룹)
  async getGroups(): Promise<{
    success: boolean
    groups?: Array<{
      guid: string
      name: string
      organization_guid: string
    }>
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/groups`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      const responseData = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: `API Error: ${response.status}`
        }
      }

      return {
        success: true,
        groups: responseData.groups || []
      }

    } catch (error) {
      console.error('Bitly 그룹 조회 오류:', error)
      return {
        success: false,
        error: '네트워크 오류 또는 API 호출 실패'
      }
    }
  }

  // 유틸리티 메서드들
  private isValidUrl(url: string): boolean {
    try {
      const testUrl = url.startsWith('http') ? url : `https://${url}`
      new URL(testUrl)
      return true
    } catch {
      return false
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 링크 단축 상태 확인
  static isBitlyLink(url: string): boolean {
    return /^https?:\/\/(bit\.ly|bitly\.com|j\.mp|tinyurl\.com)\//.test(url)
  }

  // Bitly 링크에서 ID 추출
  static extractLinkId(bitlyUrl: string): string {
    return bitlyUrl.replace(/^https?:\/\/(bit\.ly|bitly\.com|j\.mp)\//, '')
  }
}

// 싱글톤 인스턴스 (서버사이드에서 사용)
let bitlyInstance: BitlyAPI | null = null

export function getBitlyInstance(accessToken?: string): BitlyAPI {
  if (!bitlyInstance && accessToken) {
    bitlyInstance = new BitlyAPI(accessToken)
  }
  
  if (!bitlyInstance) {
    throw new Error('Bitly access token이 설정되지 않았습니다.')
  }
  
  return bitlyInstance
}

// API 라우트에서 사용할 헬퍼 함수
export async function createBitlyShortLink(
  longUrl: string,
  accessToken: string
): Promise<BitlyApiResponse> {
  const bitly = new BitlyAPI(accessToken)
  return await bitly.createShortLink(longUrl)
}