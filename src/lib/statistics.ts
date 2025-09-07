import { createClient } from './supabase'

export interface Statistics {
  activeUsers: number
  totalPosts: number
  totalJobs: number
}

export async function getStatistics(): Promise<Statistics> {
  const supabase = createClient()

  try {
    // 활성 사용자 수 (profiles 테이블의 전체 레코드 수)
    const { count: activeUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // 총 게시글 수
    const { count: totalPosts, error: postsError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })

    // 총 채용공고 수 (활성 상태인 것만)
    const { count: totalJobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // 에러가 발생하면 기본값을 반환하되, 실제 데이터베이스 연결 문제인지 확인
    if (usersError || postsError || jobsError) {
      console.warn('데이터베이스 조회 경고:', { usersError, postsError, jobsError })

      // 테이블이 존재하지 않는 경우 (RLS나 권한 문제)
      if (usersError?.message?.includes('relation') ||
          postsError?.message?.includes('relation') ||
          jobsError?.message?.includes('relation')) {
        return {
          activeUsers: 0,
          totalPosts: 0,
          totalJobs: 0
        }
      }
    }

    return {
      activeUsers: activeUsers || 0,
      totalPosts: totalPosts || 0,
      totalJobs: totalJobs || 0
    }

  } catch (error) {
    console.error('통계 데이터 조회 중 오류:', error)

    // 개발 환경에서는 샘플 데이터를 반환
    if (process.env.NODE_ENV === 'development') {
      return {
        activeUsers: 42,
        totalPosts: 156,
        totalJobs: 23
      }
    }

    return {
      activeUsers: 0,
      totalPosts: 0,
      totalJobs: 0
    }
  }
}

// 숫자를 보기 좋게 포맷팅하는 함수
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

