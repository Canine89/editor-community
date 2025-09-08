import { nanoid } from 'nanoid'

export interface ManagedLink {
  id: string
  user_id: string
  link_name: string
  short_code: string
  current_url: string
  original_url: string
  bitly_link?: string
  click_count: number
  created_at: string
  updated_at: string
}

export interface LinkHistory {
  id: string
  link_id: string
  old_url: string
  new_url: string
  changed_at: string
}

export interface UserQuota {
  id: string
  user_id: string
  links_created_this_month: number
  total_links: number
  quota_reset_date: string
  created_at: string
  updated_at: string
}

export interface CreateLinkData {
  link_name: string
  url: string
  bitly_link?: string
}

export interface LinkStats {
  total_links: number
  links_this_month: number
  total_clicks: number
  quota_used: number
  quota_limit: number
}

// MCP를 통한 데이터베이스 작업을 위한 인터페이스
export interface SupabaseMCPClient {
  execute_sql: (query: string) => Promise<any>
}

export class SmartLinksManager {
  private projectId: string
  private mcpClient: any

  constructor(projectId: string, mcpClient: any) {
    this.projectId = projectId
    this.mcpClient = mcpClient
  }

  // 사용자 할당량 확인
  async checkUserQuota(userId: string): Promise<{ canCreate: boolean; quota: UserQuota | null }> {
    const query = `
      SELECT * FROM user_quotas 
      WHERE user_id = '${userId}';
    `
    
    const result = await this.mcpClient.execute_sql({
      project_id: this.projectId,
      query
    })

    if (!result || result.length === 0) {
      // 새 사용자 - 할당량 레코드 생성
      const createQuotaQuery = `
        INSERT INTO user_quotas (user_id, links_created_this_month, total_links)
        VALUES ('${userId}', 0, 0)
        RETURNING *;
      `
      
      const newQuotaResult = await this.mcpClient.execute_sql({
        project_id: this.projectId,
        query: createQuotaQuery
      })
      
      return { 
        canCreate: true, 
        quota: newQuotaResult[0] 
      }
    }

    const quota = result[0] as UserQuota
    const canCreate = quota.links_created_this_month < 50 // 월 50개 제한
    
    return { canCreate, quota }
  }

  // 관리형 링크 생성
  async createManagedLink(
    userId: string, 
    data: CreateLinkData
  ): Promise<{ success: boolean; link?: ManagedLink; error?: string }> {
    try {
      // 할당량 확인
      const quotaCheck = await this.checkUserQuota(userId)
      if (!quotaCheck.canCreate) {
        return { 
          success: false, 
          error: '월 할당량(50개)을 초과했습니다.' 
        }
      }

      // 고유 단축 코드 생성
      const shortCode = `ec-${nanoid(8)}`
      
      // 링크 생성
      const createLinkQuery = `
        INSERT INTO managed_links (
          user_id, link_name, short_code, current_url, original_url, bitly_link
        ) VALUES (
          '${userId}',
          '${data.link_name.replace(/'/g, "''")}',
          '${shortCode}',
          '${data.url.replace(/'/g, "''")}',
          '${data.url.replace(/'/g, "''")}',
          ${data.bitly_link ? `'${data.bitly_link}'` : 'NULL'}
        )
        RETURNING *;
      `

      const linkResult = await this.mcpClient.execute_sql({
        project_id: this.projectId,
        query: createLinkQuery
      })

      if (!linkResult || linkResult.length === 0) {
        return { success: false, error: '링크 생성에 실패했습니다.' }
      }

      // 할당량 업데이트
      const updateQuotaQuery = `
        UPDATE user_quotas 
        SET 
          links_created_this_month = links_created_this_month + 1,
          total_links = total_links + 1,
          updated_at = NOW()
        WHERE user_id = '${userId}';
      `

      await this.mcpClient.execute_sql({
        project_id: this.projectId,
        query: updateQuotaQuery
      })

      return { success: true, link: linkResult[0] }

    } catch (error) {
      console.error('링크 생성 오류:', error)
      return { 
        success: false, 
        error: '링크 생성 중 오류가 발생했습니다.' 
      }
    }
  }

  // 사용자의 관리형 링크 목록 조회
  async getUserLinks(userId: string, limit: number = 50): Promise<ManagedLink[]> {
    const query = `
      SELECT * FROM managed_links 
      WHERE user_id = '${userId}'
      ORDER BY created_at DESC
      LIMIT ${limit};
    `

    try {
      const result = await this.mcpClient.execute_sql({
        project_id: this.projectId,
        query
      })

      return result || []
    } catch (error) {
      console.error('링크 목록 조회 오류:', error)
      return []
    }
  }

  // 링크 URL 수정
  async updateLinkUrl(
    userId: string, 
    linkId: string, 
    newUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 기존 URL 조회
      const getCurrentQuery = `
        SELECT current_url FROM managed_links 
        WHERE id = '${linkId}' AND user_id = '${userId}';
      `

      const currentResult = await this.mcpClient.execute_sql({
        project_id: this.projectId,
        query: getCurrentQuery
      })

      if (!currentResult || currentResult.length === 0) {
        return { success: false, error: '링크를 찾을 수 없습니다.' }
      }

      const oldUrl = currentResult[0].current_url

      // 링크 업데이트
      const updateQuery = `
        UPDATE managed_links 
        SET current_url = '${newUrl.replace(/'/g, "''")}', updated_at = NOW()
        WHERE id = '${linkId}' AND user_id = '${userId}';
      `

      await this.mcpClient.execute_sql({
        project_id: this.projectId,
        query: updateQuery
      })

      // 히스토리 기록
      const historyQuery = `
        INSERT INTO link_history (link_id, old_url, new_url)
        VALUES (
          '${linkId}',
          '${oldUrl.replace(/'/g, "''")}',
          '${newUrl.replace(/'/g, "''")}'
        );
      `

      await this.mcpClient.execute_sql({
        project_id: this.projectId,
        query: historyQuery
      })

      return { success: true }

    } catch (error) {
      console.error('링크 업데이트 오류:', error)
      return { 
        success: false, 
        error: '링크 업데이트 중 오류가 발생했습니다.' 
      }
    }
  }

  // 링크 삭제
  async deleteLink(
    userId: string, 
    linkId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const deleteQuery = `
        DELETE FROM managed_links 
        WHERE id = '${linkId}' AND user_id = '${userId}';
      `

      await this.mcpClient.execute_sql({
        project_id: this.projectId,
        query: deleteQuery
      })

      // 할당량에서 차감
      const updateQuotaQuery = `
        UPDATE user_quotas 
        SET total_links = total_links - 1, updated_at = NOW()
        WHERE user_id = '${userId}';
      `

      await this.mcpClient.execute_sql({
        project_id: this.projectId,
        query: updateQuotaQuery
      })

      return { success: true }

    } catch (error) {
      console.error('링크 삭제 오류:', error)
      return { 
        success: false, 
        error: '링크 삭제 중 오류가 발생했습니다.' 
      }
    }
  }

  // 단축 코드로 링크 조회 (리다이렉트용)
  async getLinkByCode(shortCode: string): Promise<ManagedLink | null> {
    const query = `
      SELECT * FROM managed_links 
      WHERE short_code = '${shortCode}';
    `

    try {
      const result = await this.mcpClient.execute_sql({
        project_id: this.projectId,
        query
      })

      return result && result.length > 0 ? result[0] : null
    } catch (error) {
      console.error('링크 조회 오류:', error)
      return null
    }
  }

  // 클릭 수 증가
  async incrementClick(shortCode: string): Promise<number> {
    const query = `SELECT increment_link_clicks('${shortCode}');`

    try {
      const result = await this.mcpClient.execute_sql({
        project_id: this.projectId,
        query
      })

      return result && result.length > 0 ? result[0].increment_link_clicks : 0
    } catch (error) {
      console.error('클릭 수 증가 오류:', error)
      return 0
    }
  }

  // 사용자 통계 조회
  async getUserStats(userId: string): Promise<LinkStats> {
    const query = `
      SELECT 
        COUNT(*) as total_links,
        SUM(click_count) as total_clicks,
        uq.links_created_this_month,
        uq.total_links as quota_total
      FROM managed_links ml
      LEFT JOIN user_quotas uq ON ml.user_id = uq.user_id
      WHERE ml.user_id = '${userId}'
      GROUP BY uq.links_created_this_month, uq.total_links;
    `

    try {
      const result = await this.mcpClient.execute_sql({
        project_id: this.projectId,
        query
      })

      if (!result || result.length === 0) {
        return {
          total_links: 0,
          links_this_month: 0,
          total_clicks: 0,
          quota_used: 0,
          quota_limit: 50
        }
      }

      const stats = result[0]
      return {
        total_links: parseInt(stats.total_links) || 0,
        links_this_month: parseInt(stats.links_created_this_month) || 0,
        total_clicks: parseInt(stats.total_clicks) || 0,
        quota_used: parseInt(stats.links_created_this_month) || 0,
        quota_limit: 50
      }

    } catch (error) {
      console.error('통계 조회 오류:', error)
      return {
        total_links: 0,
        links_this_month: 0,
        total_clicks: 0,
        quota_used: 0,
        quota_limit: 50
      }
    }
  }

  // 링크 히스토리 조회
  async getLinkHistory(userId: string, linkId: string): Promise<LinkHistory[]> {
    const query = `
      SELECT lh.* FROM link_history lh
      JOIN managed_links ml ON lh.link_id = ml.id
      WHERE ml.user_id = '${userId}' AND lh.link_id = '${linkId}'
      ORDER BY lh.changed_at DESC;
    `

    try {
      const result = await this.mcpClient.execute_sql({
        project_id: this.projectId,
        query
      })

      return result || []
    } catch (error) {
      console.error('히스토리 조회 오류:', error)
      return []
    }
  }
}