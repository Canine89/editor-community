import { mockUsers, mockUsersMap } from './users'

export interface MockActivity {
  id: string
  action: string
  target_type?: string
  target_id?: string
  details?: any
  created_at: string
  admin: {
    full_name: string
    email: string
  }
}

// 관리자 활동 로그 데이터 (50개) - 최근 3개월
export const mockActivities: MockActivity[] = [
  // 최근 활동 (9월)
  {
    id: 'activity-1',
    action: 'access_admin_dashboard',
    created_at: '2024-09-18T08:30:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-2',
    action: 'view_admin_users',
    created_at: '2024-09-18T08:32:15Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-3',
    action: 'change_user_role',
    target_type: 'user',
    target_id: 'user-1',
    details: { from_role: 'user', to_role: 'premium' },
    created_at: '2024-09-17T15:20:00Z',
    admin: {
      full_name: '박지영',
      email: 'ceo@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-4',
    action: 'delete_post',
    target_type: 'post',
    target_id: 'post-spam-1',
    details: { reason: '스팸성 게시물' },
    created_at: '2024-09-17T12:45:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-5',
    action: 'deactivate_job',
    target_type: 'job',
    target_id: 'job-20',
    details: { reason: '모집 완료' },
    created_at: '2024-09-16T14:10:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-6',
    action: 'activate_job',
    target_type: 'job',
    target_id: 'job-19',
    details: { reason: '재공고' },
    created_at: '2024-09-16T11:30:00Z',
    admin: {
      full_name: '박지영',
      email: 'ceo@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-7',
    action: 'view_admin_posts',
    created_at: '2024-09-15T16:45:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-8',
    action: 'grant_permission',
    target_type: 'user',
    target_id: 'user-7',
    details: { permission_type: 'premium' },
    created_at: '2024-09-15T10:20:00Z',
    admin: {
      full_name: '박지영',
      email: 'ceo@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-9',
    action: 'view_admin_jobs',
    created_at: '2024-09-14T13:15:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-10',
    action: 'access_admin_dashboard',
    created_at: '2024-09-14T09:00:00Z',
    admin: {
      full_name: '박지영',
      email: 'ceo@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-11',
    action: 'delete_post',
    target_type: 'post',
    target_id: 'post-violation-2',
    details: { reason: '커뮤니티 가이드 위반' },
    created_at: '2024-09-13T17:30:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-12',
    action: 'change_user_role',
    target_type: 'user',
    target_id: 'user-5',
    details: { from_role: 'user', to_role: 'employee' },
    created_at: '2024-09-12T11:45:00Z',
    admin: {
      full_name: '박지영',
      email: 'ceo@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-13',
    action: 'access_admin_dashboard',
    created_at: '2024-09-12T08:20:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-14',
    action: 'view_admin_users',
    created_at: '2024-09-11T15:10:00Z',
    admin: {
      full_name: '박지영',
      email: 'ceo@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-15',
    action: 'activate_job',
    target_type: 'job',
    target_id: 'job-18',
    created_at: '2024-09-10T12:30:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },

  // 8월 활동
  {
    id: 'activity-16',
    action: 'revoke_permission',
    target_type: 'user',
    target_id: 'user-suspended-1',
    details: { permission_type: 'premium', reason: '약관 위반' },
    created_at: '2024-08-30T16:20:00Z',
    admin: {
      full_name: '박지영',
      email: 'ceo@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-17',
    action: 'delete_post',
    target_type: 'post',
    target_id: 'post-spam-3',
    details: { reason: '중복 게시물' },
    created_at: '2024-08-29T14:45:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-18',
    action: 'view_admin_posts',
    created_at: '2024-08-28T10:15:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-19',
    action: 'deactivate_job',
    target_type: 'job',
    target_id: 'job-expired-1',
    details: { reason: '마감일 초과' },
    created_at: '2024-08-27T17:00:00Z',
    admin: {
      full_name: '박지영',
      email: 'ceo@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-20',
    action: 'access_admin_dashboard',
    created_at: '2024-08-26T09:30:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-21',
    action: 'grant_permission',
    target_type: 'user',
    target_id: 'user-3',
    details: { permission_type: 'premium' },
    created_at: '2024-08-25T13:40:00Z',
    admin: {
      full_name: '박지영',
      email: 'ceo@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-22',
    action: 'view_admin_jobs',
    created_at: '2024-08-24T11:25:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-23',
    action: 'change_user_role',
    target_type: 'user',
    target_id: 'user-8',
    details: { from_role: 'user', to_role: 'premium' },
    created_at: '2024-08-23T15:20:00Z',
    admin: {
      full_name: '박지영',
      email: 'ceo@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-24',
    action: 'activate_job',
    target_type: 'job',
    target_id: 'job-17',
    created_at: '2024-08-22T12:10:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-25',
    action: 'delete_post',
    target_type: 'post',
    target_id: 'post-inappropriate-1',
    details: { reason: '부적절한 내용' },
    created_at: '2024-08-21T16:50:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-26',
    action: 'view_admin_users',
    created_at: '2024-08-20T14:30:00Z',
    admin: {
      full_name: '박지영',
      email: 'ceo@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-27',
    action: 'access_admin_dashboard',
    created_at: '2024-08-19T08:45:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-28',
    action: 'grant_permission',
    target_type: 'user',
    target_id: 'user-6',
    details: { permission_type: 'premium' },
    created_at: '2024-08-18T11:15:00Z',
    admin: {
      full_name: '박지영',
      email: 'ceo@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-29',
    action: 'deactivate_job',
    target_type: 'job',
    target_id: 'job-duplicate-1',
    details: { reason: '중복 공고' },
    created_at: '2024-08-17T15:25:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-30',
    action: 'view_admin_posts',
    created_at: '2024-08-16T13:40:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },

  // 7월 활동
  {
    id: 'activity-31',
    action: 'change_user_role',
    target_type: 'user',
    target_id: 'user-4',
    details: { from_role: 'user', to_role: 'premium' },
    created_at: '2024-07-31T10:20:00Z',
    admin: {
      full_name: '박지영',
      email: 'ceo@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-32',
    action: 'activate_job',
    target_type: 'job',
    target_id: 'job-16',
    created_at: '2024-07-30T12:50:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-33',
    action: 'access_admin_dashboard',
    created_at: '2024-07-29T09:15:00Z',
    admin: {
      full_name: '박지영',
      email: 'ceo@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-34',
    action: 'delete_post',
    target_type: 'post',
    target_id: 'post-spam-4',
    details: { reason: '광고성 게시물' },
    created_at: '2024-07-28T16:30:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-35',
    action: 'view_admin_jobs',
    created_at: '2024-07-27T11:45:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-36',
    action: 'grant_permission',
    target_type: 'user',
    target_id: 'user-2',
    details: { permission_type: 'premium' },
    created_at: '2024-07-26T14:20:00Z',
    admin: {
      full_name: '박지영',
      email: 'ceo@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-37',
    action: 'deactivate_job',
    target_type: 'job',
    target_id: 'job-closed-1',
    details: { reason: '모집 마감' },
    created_at: '2024-07-25T17:10:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-38',
    action: 'view_admin_users',
    created_at: '2024-07-24T13:25:00Z',
    admin: {
      full_name: '박지영',
      email: 'ceo@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-39',
    action: 'access_admin_dashboard',
    created_at: '2024-07-23T08:40:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-40',
    action: 'delete_post',
    target_type: 'post',
    target_id: 'post-violation-3',
    details: { reason: '욕설 포함' },
    created_at: '2024-07-22T15:55:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-41',
    action: 'activate_job',
    target_type: 'job',
    target_id: 'job-15',
    created_at: '2024-07-21T12:30:00Z',
    admin: {
      full_name: '박지영',
      email: 'ceo@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-42',
    action: 'view_admin_posts',
    created_at: '2024-07-20T10:15:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-43',
    action: 'revoke_permission',
    target_type: 'user',
    target_id: 'user-suspended-2',
    details: { permission_type: 'premium', reason: '결제 문제' },
    created_at: '2024-07-19T16:40:00Z',
    admin: {
      full_name: '박지영',
      email: 'ceo@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-44',
    action: 'change_user_role',
    target_type: 'user',
    target_id: 'employee-2',
    details: { from_role: 'user', to_role: 'employee' },
    created_at: '2024-07-18T11:20:00Z',
    admin: {
      full_name: '박지영',
      email: 'ceo@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-45',
    action: 'access_admin_dashboard',
    created_at: '2024-07-17T09:50:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-46',
    action: 'deactivate_job',
    target_type: 'job',
    target_id: 'job-old-1',
    details: { reason: '공고 기간 만료' },
    created_at: '2024-07-16T14:25:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-47',
    action: 'view_admin_jobs',
    created_at: '2024-07-15T12:40:00Z',
    admin: {
      full_name: '박지영',
      email: 'ceo@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-48',
    action: 'grant_permission',
    target_type: 'user',
    target_id: 'premium-1',
    details: { permission_type: 'premium' },
    created_at: '2024-07-14T15:30:00Z',
    admin: {
      full_name: '박지영',
      email: 'ceo@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-49',
    action: 'delete_post',
    target_type: 'post',
    target_id: 'post-spam-5',
    details: { reason: '스팸성 내용' },
    created_at: '2024-07-13T13:15:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  },
  {
    id: 'activity-50',
    action: 'access_admin_dashboard',
    created_at: '2024-07-12T08:30:00Z',
    admin: {
      full_name: '김태현',
      email: 'admin@goldenrabbit.co.kr'
    }
  }
]

// 최근 활동 조회 (limit 적용)
export const getRecentMockActivities = (limit: number = 10): MockActivity[] => {
  return mockActivities
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)
}

// 특정 관리자의 활동 조회
export const getActivitiesByAdmin = (adminEmail: string): MockActivity[] => {
  return mockActivities.filter(activity => activity.admin.email === adminEmail)
}

// 특정 액션 타입 필터링
export const getActivitiesByAction = (action: string): MockActivity[] => {
  return mockActivities.filter(activity => activity.action === action)
}

// 기간별 활동 조회
export const getActivitiesByDateRange = (startDate: string, endDate: string): MockActivity[] => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  return mockActivities.filter(activity => {
    const activityDate = new Date(activity.created_at)
    return activityDate >= start && activityDate <= end
  })
}