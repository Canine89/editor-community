import { UserRole } from '@/hooks/useRole'

export interface MockUser {
  id: string
  email: string
  full_name: string
  avatar_url: string
  created_at: string
  user_role: UserRole
}

// 15명의 현실적인 사용자 데이터
export const mockUsers: MockUser[] = [
  // 마스터 관리자 (2명)
  {
    id: 'master-1',
    email: 'admin@goldenrabbit.co.kr',
    full_name: '김태현',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    created_at: '2024-01-15T09:30:00Z',
    user_role: 'master'
  },
  {
    id: 'master-2', 
    email: 'ceo@goldenrabbit.co.kr',
    full_name: '박지영',
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b2e92ca4?w=400&h=400&fit=crop&crop=face',
    created_at: '2024-01-10T14:20:00Z',
    user_role: 'master'
  },

  // 골든래빗 임직원 (2명)
  {
    id: 'employee-1',
    email: 'editor1@goldenrabbit.co.kr', 
    full_name: '이수진',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
    created_at: '2024-02-01T11:15:00Z',
    user_role: 'employee'
  },
  {
    id: 'employee-2',
    email: 'design@goldenrabbit.co.kr',
    full_name: '정민호',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    created_at: '2024-02-10T16:45:00Z',
    user_role: 'employee'
  },

  // 프리미엄 사용자 (3명)
  {
    id: 'premium-1',
    email: 'freelance.editor@gmail.com',
    full_name: '최영미',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
    created_at: '2024-03-05T08:30:00Z',
    user_role: 'premium'
  },
  {
    id: 'premium-2',
    email: 'bookdesigner@naver.com',
    full_name: '한지민',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
    created_at: '2024-03-12T13:20:00Z',
    user_role: 'premium'
  },
  {
    id: 'premium-3',
    email: 'pro.proofreader@daum.net',
    full_name: '오준석',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
    created_at: '2024-03-18T10:45:00Z',
    user_role: 'premium'
  },

  // 일반 사용자 (8명)
  {
    id: 'user-1',
    email: 'newbie.editor@gmail.com',
    full_name: '김지혜',
    avatar_url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&fit=crop&crop=face',
    created_at: '2024-04-01T09:15:00Z',
    user_role: 'user'
  },
  {
    id: 'user-2',
    email: 'student.writer@naver.com',
    full_name: '이동훈',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
    created_at: '2024-04-05T14:30:00Z',
    user_role: 'user'
  },
  {
    id: 'user-3',
    email: 'hobby.editor@outlook.com',
    full_name: '박서연',
    avatar_url: 'https://images.unsplash.com/photo-1557053910-d9eadeed1b7e?w=400&h=400&fit=crop&crop=face',
    created_at: '2024-04-10T16:20:00Z',
    user_role: 'user'
  },
  {
    id: 'user-4',
    email: 'junior.corrector@gmail.com',
    full_name: '김민수',
    avatar_url: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=400&h=400&fit=crop&crop=face',
    created_at: '2024-04-15T11:40:00Z',
    user_role: 'user'
  },
  {
    id: 'user-5',
    email: 'aspiring.publisher@daum.net',
    full_name: '유소희',
    avatar_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face',
    created_at: '2024-04-20T15:10:00Z',
    user_role: 'user'
  },
  {
    id: 'user-6',
    email: 'book.lover@naver.com',
    full_name: '장성민',
    avatar_url: 'https://images.unsplash.com/photo-1558222218-b7b54eede3f3?w=400&h=400&fit=crop&crop=face',
    created_at: '2024-05-01T12:25:00Z',
    user_role: 'user'
  },
  {
    id: 'user-7',
    email: 'creative.writer@gmail.com',
    full_name: '신예린',
    avatar_url: 'https://images.unsplash.com/photo-1601455763557-db1bea8a9a5a?w=400&h=400&fit=crop&crop=face',
    created_at: '2024-05-08T09:50:00Z',
    user_role: 'user'
  },
  {
    id: 'user-8',
    email: 'reading.enthusiast@outlook.com',
    full_name: '노태완',
    avatar_url: 'https://images.unsplash.com/photo-1522556189639-b150ed9c4330?w=400&h=400&fit=crop&crop=face',
    created_at: '2024-05-12T17:35:00Z',
    user_role: 'user'
  }
]

// 사용자 ID별 빠른 조회를 위한 Map
export const mockUsersMap = new Map(mockUsers.map(user => [user.id, user]))

// 역할별 사용자 필터링 함수
export const getUsersByRole = (role: UserRole): MockUser[] => {
  return mockUsers.filter(user => user.user_role === role)
}

// 검색 함수
export const searchMockUsers = (searchTerm: string): MockUser[] => {
  const term = searchTerm.toLowerCase()
  return mockUsers.filter(user => 
    user.full_name.toLowerCase().includes(term) ||
    user.email.toLowerCase().includes(term)
  )
}