import { mockUsers } from './users'
import { mockPosts } from './posts'
import { mockJobs } from './jobs'

export interface MockStats {
  totalUsers: number
  totalPosts: number
  totalJobs: number
}

// 실제 Mock 데이터 기반 통계
export const mockStats: MockStats = {
  totalUsers: mockUsers.length,    // 15
  totalPosts: mockPosts.length,    // 30
  totalJobs: mockJobs.length       // 20
}

// 추가 통계 정보
export const getDetailedStats = () => {
  return {
    ...mockStats,
    
    // 사용자 통계
    usersByRole: {
      master: mockUsers.filter(u => u.user_role === 'master').length,      // 2
      employee: mockUsers.filter(u => u.user_role === 'employee').length,  // 2
      premium: mockUsers.filter(u => u.user_role === 'premium').length,    // 3
      user: mockUsers.filter(u => u.user_role === 'user').length           // 8
    },
    
    // 게시물 통계
    postsByCategory: {
      question: mockPosts.filter(p => p.category === 'question').length,     // 10
      share: mockPosts.filter(p => p.category === 'share').length,           // 7
      general: mockPosts.filter(p => p.category === 'general').length,       // 8
      discussion: mockPosts.filter(p => p.category === 'discussion').length  // 5
    },
    
    // 채용공고 통계
    jobsByType: {
      'full-time': mockJobs.filter(j => j.type === 'full-time').length,   // 8
      'part-time': mockJobs.filter(j => j.type === 'part-time').length,   // 5
      freelance: mockJobs.filter(j => j.type === 'freelance').length,     // 4
      contract: mockJobs.filter(j => j.type === 'contract').length        // 3
    },
    
    // 활성 상태 통계
    activeJobs: mockJobs.filter(j => j.is_active).length,
    inactiveJobs: mockJobs.filter(j => !j.is_active).length,
    
    // 참여도 통계
    averagePostViews: Math.round(mockPosts.reduce((sum, p) => sum + p.view_count, 0) / mockPosts.length),
    averagePostLikes: Math.round(mockPosts.reduce((sum, p) => sum + p.like_count, 0) / mockPosts.length),
    averagePostComments: Math.round(mockPosts.reduce((sum, p) => sum + p.comment_count, 0) / mockPosts.length),
    
    // 최고 인기 게시물
    mostViewedPost: mockPosts.reduce((max, p) => p.view_count > max.view_count ? p : max),
    mostLikedPost: mockPosts.reduce((max, p) => p.like_count > max.like_count ? p : max),
    
    // 최근 활동 통계 (지난 7일)
    recentActivity: {
      newUsers: 0,  // Mock 데이터에서는 모든 사용자가 과거 등록
      newPosts: mockPosts.filter(p => {
        const postDate = new Date(p.created_at)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return postDate > weekAgo
      }).length,
      newJobs: mockJobs.filter(j => {
        const jobDate = new Date(j.created_at)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return jobDate > weekAgo
      }).length
    }
  }
}

// 월별 가입자 수 (차트용 데이터)
export const getMonthlyUserStats = () => {
  const monthlyStats: { [key: string]: number } = {}
  
  mockUsers.forEach(user => {
    const date = new Date(user.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + 1
  })
  
  return Object.entries(monthlyStats)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

// 카테고리별 게시물 비율 (파이차트용 데이터)
export const getPostCategoryDistribution = () => {
  const stats = getDetailedStats()
  return [
    { category: '질문', count: stats.postsByCategory.question, percentage: Math.round((stats.postsByCategory.question / mockPosts.length) * 100) },
    { category: '정보공유', count: stats.postsByCategory.share, percentage: Math.round((stats.postsByCategory.share / mockPosts.length) * 100) },
    { category: '일반', count: stats.postsByCategory.general, percentage: Math.round((stats.postsByCategory.general / mockPosts.length) * 100) },
    { category: '토론', count: stats.postsByCategory.discussion, percentage: Math.round((stats.postsByCategory.discussion / mockPosts.length) * 100) }
  ]
}

// 채용공고 타입별 분포 (바차트용 데이터)
export const getJobTypeDistribution = () => {
  const stats = getDetailedStats()
  return [
    { type: '정규직', count: stats.jobsByType['full-time'], percentage: Math.round((stats.jobsByType['full-time'] / mockJobs.length) * 100) },
    { type: '계약직', count: stats.jobsByType['part-time'], percentage: Math.round((stats.jobsByType['part-time'] / mockJobs.length) * 100) },
    { type: '프리랜서', count: stats.jobsByType.freelance, percentage: Math.round((stats.jobsByType.freelance / mockJobs.length) * 100) },
    { type: '외주', count: stats.jobsByType.contract, percentage: Math.round((stats.jobsByType.contract / mockJobs.length) * 100) }
  ]
}

// 시간별 활동 패턴 (히트맵용 데이터)
export const getActivityHeatmapData = () => {
  const hourlyActivity: number[] = new Array(24).fill(0)
  
  // 게시물 작성 시간 분석
  mockPosts.forEach(post => {
    const hour = new Date(post.created_at).getHours()
    hourlyActivity[hour]++
  })
  
  // 채용공고 등록 시간 분석
  mockJobs.forEach(job => {
    const hour = new Date(job.created_at).getHours()
    hourlyActivity[hour]++
  })
  
  return hourlyActivity.map((count, hour) => ({
    hour,
    activity: count,
    label: `${hour}시`
  }))
}