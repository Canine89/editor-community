import { mockUsers, mockUsersMap } from './users'

export interface MockPost {
  id: string
  title: string
  content: string
  category: 'general' | 'question' | 'share' | 'discussion'
  author_id: string
  author_name: string
  author_email: string
  is_anonymous: boolean
  view_count: number
  like_count: number
  comment_count: number
  created_at: string
}

// 편집자/출판 관련 현실적인 게시물 데이터 (30개)
export const mockPosts: MockPost[] = [
  // 질문 카테고리 (10개)
  {
    id: 'post-1',
    title: '원고 마감일 관리 어떻게 하시나요?',
    content: '프리랜서 교정자로 일하고 있는데, 여러 출판사와 동시에 작업하다 보니 마감일 관리가 어려워요. 효율적인 스케줄 관리 방법이 있을까요?',
    category: 'question',
    author_id: 'user-3',
    author_name: '박서연',
    author_email: 'hobby.editor@outlook.com',
    is_anonymous: false,
    view_count: 145,
    like_count: 8,
    comment_count: 12,
    created_at: '2024-08-15T14:30:00Z'
  },
  {
    id: 'post-2',
    title: '한글 맞춤법 검사기 추천해주세요',
    content: '교정 업무에서 사용할 한글 맞춤법 검사 도구를 찾고 있어요. 무료/유료 상관없이 정확도가 높은 프로그램 추천 부탁드립니다.',
    category: 'question',
    author_id: 'user-1',
    author_name: '김지혜',
    author_email: 'newbie.editor@gmail.com',
    is_anonymous: false,
    view_count: 203,
    like_count: 15,
    comment_count: 18,
    created_at: '2024-08-20T09:15:00Z'
  },
  {
    id: 'post-3',
    title: '표지 디자인 시 폰트 선택 기준이 궁금합니다',
    content: '도서 표지 디자인을 담당하고 있는데, 장르별로 어떤 폰트를 선택해야 할지 고민됩니다. 경험 많으신 분들의 조언을 구합니다.',
    category: 'question',
    author_id: 'premium-2',
    author_name: '한지민',
    author_email: 'bookdesigner@naver.com',
    is_anonymous: false,
    view_count: 167,
    like_count: 11,
    comment_count: 9,
    created_at: '2024-08-25T16:20:00Z'
  },
  {
    id: 'post-4',
    title: '전자책 편집 시 주의사항이 있나요?',
    content: '종이책 편집만 해오다가 처음으로 전자책 편집을 맡게 되었습니다. 종이책과 다른 점이나 특별히 주의해야 할 사항들을 알려주세요.',
    category: 'question',
    author_id: 'user-4',
    author_name: '김민수',
    author_email: 'junior.corrector@gmail.com',
    is_anonymous: false,
    view_count: 128,
    like_count: 6,
    comment_count: 14,
    created_at: '2024-09-01T11:45:00Z'
  },
  {
    id: 'post-5',
    title: '번역서 편집 시 유의점',
    content: '번역서 편집을 처음 담당하게 되었는데, 원서와 번역본을 대조하며 확인해야 할 포인트들이 궁금합니다.',
    category: 'question',
    author_id: 'user-6',
    author_name: '장성민',
    author_email: 'book.lover@naver.com',
    is_anonymous: true,
    view_count: 89,
    like_count: 4,
    comment_count: 7,
    created_at: '2024-09-03T13:20:00Z'
  },
  {
    id: 'post-6',
    title: '어린이책 편집 특이사항이 있을까요?',
    content: '성인 도서만 편집해오다가 어린이책을 맡게 되었습니다. 연령대별로 고려해야 할 편집 가이드라인이 있는지 궁금해요.',
    category: 'question',
    author_id: 'user-7',
    author_name: '신예린',
    author_email: 'creative.writer@gmail.com',
    is_anonymous: false,
    view_count: 156,
    like_count: 9,
    comment_count: 11,
    created_at: '2024-09-05T15:10:00Z'
  },
  {
    id: 'post-7',
    title: '인용문 표기 방식 질문',
    content: '학술서적 편집 중인데, 인용문 표기 방식이 출판사마다 다른 것 같아요. 일반적으로 통용되는 표준이 있는지 알고 싶습니다.',
    category: 'question',
    author_id: 'premium-3',
    author_name: '오준석',
    author_email: 'pro.proofreader@daum.net',
    is_anonymous: false,
    view_count: 74,
    like_count: 3,
    comment_count: 5,
    created_at: '2024-09-08T10:30:00Z'
  },
  {
    id: 'post-8',
    title: '편집증명서 발급 어떻게 하나요?',
    content: '프리랜서로 일하면서 포트폴리오용으로 편집증명서가 필요한데, 출판사에 어떻게 요청해야 할까요?',
    category: 'question',
    author_id: 'user-5',
    author_name: '유소희',
    author_email: 'aspiring.publisher@daum.net',
    is_anonymous: true,
    view_count: 92,
    like_count: 5,
    comment_count: 8,
    created_at: '2024-09-10T14:15:00Z'
  },
  {
    id: 'post-9',
    title: '색상 교정 작업 시 모니터 캘리브레이션',
    content: '컬러 도서 편집을 맡게 되었는데, 정확한 색상 작업을 위한 모니터 설정 방법이 궁금합니다.',
    category: 'question',
    author_id: 'employee-2',
    author_name: '정민호',
    author_email: 'design@goldenrabbit.co.kr',
    is_anonymous: false,
    view_count: 134,
    like_count: 7,
    comment_count: 6,
    created_at: '2024-09-12T16:45:00Z'
  },
  {
    id: 'post-10',
    title: '편집자 자격증이나 교육과정 추천',
    content: '편집 분야로 커리어를 바꾸고 싶은데, 도움이 될 만한 자격증이나 교육과정이 있을까요?',
    category: 'question',
    author_id: 'user-8',
    author_name: '노태완',
    author_email: 'reading.enthusiast@outlook.com',
    is_anonymous: false,
    view_count: 198,
    like_count: 12,
    comment_count: 16,
    created_at: '2024-09-15T12:20:00Z'
  },

  // 정보공유 카테고리 (7개)
  {
    id: 'post-11',
    title: '[유용한 도구] InDesign 편집 작업 단축키 모음',
    content: '10년차 편집자가 정리한 InDesign 필수 단축키들입니다. 작업 효율성을 크게 높일 수 있어요.\n\n1. 텍스트 선택: Ctrl+A\n2. 페이지 이동: Page Up/Down\n3. 확대/축소: Ctrl + / Ctrl -\n...(상세 내용 생략)',
    category: 'share',
    author_id: 'premium-1',
    author_name: '최영미',
    author_email: 'freelance.editor@gmail.com',
    is_anonymous: false,
    view_count: 512,
    like_count: 45,
    comment_count: 23,
    created_at: '2024-08-10T08:30:00Z'
  },
  {
    id: 'post-12',
    title: '2024년 출판 트렌드 분석 자료 공유',
    content: '출판업계 컨퍼런스에서 발표된 올해 출판 트렌드 자료를 정리해서 공유합니다. 특히 전자책과 오디오북 시장의 성장이 눈에 띄네요.',
    category: 'share',
    author_id: 'employee-1',
    author_name: '이수진',
    author_email: 'editor1@goldenrabbit.co.kr',
    is_anonymous: false,
    view_count: 387,
    like_count: 32,
    comment_count: 19,
    created_at: '2024-08-18T13:45:00Z'
  },
  {
    id: 'post-13',
    title: '교정부호 표준안 정리본',
    content: '국립국어원 교정부호 표준안을 편집자가 보기 쉽게 정리했습니다. PDF 파일로 첨부해드려요.',
    category: 'share',
    author_id: 'master-1',
    author_name: '김태현',
    author_email: 'admin@goldenrabbit.co.kr',
    is_anonymous: false,
    view_count: 634,
    like_count: 58,
    comment_count: 31,
    created_at: '2024-08-22T10:15:00Z'
  },
  {
    id: 'post-14',
    title: '무료 폰트 추천 리스트 (상업적 이용 가능)',
    content: '도서 편집에 사용할 수 있는 무료 한글 폰트들을 정리했습니다. 모두 상업적 이용이 가능한 폰트들이에요.',
    category: 'share',
    author_id: 'premium-2',
    author_name: '한지민',
    author_email: 'bookdesigner@naver.com',
    is_anonymous: false,
    view_count: 423,
    like_count: 37,
    comment_count: 15,
    created_at: '2024-08-28T15:30:00Z'
  },
  {
    id: 'post-15',
    title: '편집자를 위한 온라인 참고자료 모음',
    content: '편집 작업 시 유용한 온라인 사전, 참고자료 사이트들을 모아봤습니다.\n- 국립국어원 표준국어대사전\n- 한국학술정보원\n- 각종 전문용어 사전 등',
    category: 'share',
    author_id: 'premium-3',
    author_name: '오준석',
    author_email: 'pro.proofreader@daum.net',
    is_anonymous: false,
    view_count: 298,
    like_count: 26,
    comment_count: 12,
    created_at: '2024-09-02T09:20:00Z'
  },
  {
    id: 'post-16',
    title: 'ISBN 신청 절차 안내',
    content: '개인 출판이나 소규모 출판사에서 ISBN을 신청하는 과정을 단계별로 설명드립니다. 필요한 서류와 비용도 함께 정리했어요.',
    category: 'share',
    author_id: 'user-5',
    author_name: '유소희',
    author_email: 'aspiring.publisher@daum.net',
    is_anonymous: false,
    view_count: 267,
    like_count: 19,
    comment_count: 8,
    created_at: '2024-09-07T14:40:00Z'
  },
  {
    id: 'post-17',
    title: '편집자 커뮤니티 도서 추천 목록',
    content: '편집자라면 꼭 읽어봐야 할 도서들을 카테고리별로 정리했습니다. 편집 실무서부터 디자인, 타이포그래피까지 다양하게 선별했어요.',
    category: 'share',
    author_id: 'master-2',
    author_name: '박지영',
    author_email: 'ceo@goldenrabbit.co.kr',
    is_anonymous: false,
    view_count: 445,
    like_count: 41,
    comment_count: 22,
    created_at: '2024-09-11T11:30:00Z'
  },

  // 일반 카테고리 (8개)
  {
    id: 'post-18',
    title: '편집자 모임 후기 - 8월 정기모임',
    content: '지난 주말에 있었던 편집자 정기모임 후기입니다. 이번엔 AI 도구 활용에 대한 발표가 특히 인상깊었어요.',
    category: 'general',
    author_id: 'premium-1',
    author_name: '최영미',
    author_email: 'freelance.editor@gmail.com',
    is_anonymous: false,
    view_count: 156,
    like_count: 12,
    comment_count: 9,
    created_at: '2024-08-26T17:20:00Z'
  },
  {
    id: 'post-19',
    title: '신입 편집자의 첫 프로젝트 소감',
    content: '편집자로 첫 발을 내딛은 지 한 달이 지났네요. 아직 서툴지만 매일 배우는 재미가 쏠쏠합니다.',
    category: 'general',
    author_id: 'user-1',
    author_name: '김지혜',
    author_email: 'newbie.editor@gmail.com',
    is_anonymous: false,
    view_count: 89,
    like_count: 8,
    comment_count: 14,
    created_at: '2024-08-30T12:10:00Z'
  },
  {
    id: 'post-20',
    title: '올해 교정한 도서 100권 달성!',
    content: '드디어 올해 목표였던 100권 교정 완료했습니다! 다양한 장르의 책들을 접하면서 많이 배웠어요.',
    category: 'general',
    author_id: 'premium-3',
    author_name: '오준석',
    author_email: 'pro.proofreader@daum.net',
    is_anonymous: false,
    view_count: 134,
    like_count: 15,
    comment_count: 18,
    created_at: '2024-09-04T16:50:00Z'
  },
  {
    id: 'post-21',
    title: '출판사 인턴십 경험담',
    content: '여름 방학 동안 골든래빗에서 인턴으로 일했던 경험을 공유합니다. 실무를 직접 배울 수 있어서 정말 좋았어요.',
    category: 'general',
    author_id: 'user-2',
    author_name: '이동훈',
    author_email: 'student.writer@naver.com',
    is_anonymous: false,
    view_count: 203,
    like_count: 18,
    comment_count: 12,
    created_at: '2024-09-06T13:25:00Z'
  },
  {
    id: 'post-22',
    title: '편집자의 하루 일과',
    content: '편집자가 되고 싶어하는 분들을 위해 제 하루 일과를 간단히 소개해드릴게요. 생각보다 다양한 업무를 한답니다.',
    category: 'general',
    author_id: 'employee-1',
    author_name: '이수진',
    author_email: 'editor1@goldenrabbit.co.kr',
    is_anonymous: false,
    view_count: 278,
    like_count: 22,
    comment_count: 16,
    created_at: '2024-09-09T14:15:00Z'
  },
  {
    id: 'post-23',
    title: '재택근무 편집자의 작업환경 소개',
    content: '코로나 이후 재택근무로 전환한 편집자입니다. 집에서 효율적으로 작업할 수 있는 환경을 만들기까지의 경험을 공유해요.',
    category: 'general',
    author_id: 'user-3',
    author_name: '박서연',
    author_email: 'hobby.editor@outlook.com',
    is_anonymous: false,
    view_count: 167,
    like_count: 13,
    comment_count: 11,
    created_at: '2024-09-13T10:45:00Z'
  },
  {
    id: 'post-24',
    title: '편집자 번아웃 극복기',
    content: '작년에 심한 번아웃을 겪었던 경험과 이를 극복한 과정을 솔직하게 이야기해보려고 합니다.',
    category: 'general',
    author_id: 'premium-1',
    author_name: '최영미',
    author_email: 'freelance.editor@gmail.com',
    is_anonymous: true,
    view_count: 245,
    like_count: 28,
    comment_count: 24,
    created_at: '2024-09-16T15:30:00Z'
  },
  {
    id: 'post-25',
    title: '첫 단행본 출간 기념!',
    content: '3년 전부터 준비해온 편집 실무서가 드디어 출간되었습니다. 많은 분들이 도움을 주셔서 가능했어요. 감사합니다!',
    category: 'general',
    author_id: 'master-1',
    author_name: '김태현',
    author_email: 'admin@goldenrabbit.co.kr',
    is_anonymous: false,
    view_count: 189,
    like_count: 35,
    comment_count: 27,
    created_at: '2024-09-18T09:20:00Z'
  },

  // 토론 카테고리 (5개)
  {
    id: 'post-26',
    title: 'AI 도구가 편집업계에 미치는 영향에 대한 논의',
    content: 'ChatGPT, Claude 등 AI 도구들이 편집 업무에 도입되고 있는데, 이것이 편집자의 역할에 어떤 변화를 가져올지 여러분의 의견이 궁금합니다.',
    category: 'discussion',
    author_id: 'master-2',
    author_name: '박지영',
    author_email: 'ceo@goldenrabbit.co.kr',
    is_anonymous: false,
    view_count: 456,
    like_count: 32,
    comment_count: 47,
    created_at: '2024-08-12T11:30:00Z'
  },
  {
    id: 'post-27',
    title: '전자책 vs 종이책, 편집자 관점에서의 차이점',
    content: '전자책과 종이책 편집의 차이점에 대해 토론해보면 좋을 것 같아요. 각각의 장단점과 편집 시 고려사항들을 공유해주세요.',
    category: 'discussion',
    author_id: 'employee-2',
    author_name: '정민호',
    author_email: 'design@goldenrabbit.co.kr',
    is_anonymous: false,
    view_count: 234,
    like_count: 19,
    comment_count: 28,
    created_at: '2024-08-24T14:45:00Z'
  },
  {
    id: 'post-28',
    title: '편집자 처우 개선에 대한 의견',
    content: '최근 편집자들의 근무환경과 처우에 대한 이야기가 많이 나오고 있습니다. 업계 전반적인 개선방안에 대해 건설적인 논의를 해보면 어떨까요?',
    category: 'discussion',
    author_id: 'premium-1',
    author_name: '최영미',
    author_email: 'freelance.editor@gmail.com',
    is_anonymous: true,
    view_count: 378,
    like_count: 41,
    comment_count: 52,
    created_at: '2024-09-01T16:20:00Z'
  },
  {
    id: 'post-29',
    title: '독립 출판과 기존 출판사의 편집 방식 비교',
    content: '독립출판이 늘어나면서 편집 방식도 다양해지고 있는 것 같아요. 기존 출판사와 독립출판의 편집 프로세스 차이에 대해 논의해봅시다.',
    category: 'discussion',
    author_id: 'user-5',
    author_name: '유소희',
    author_email: 'aspiring.publisher@daum.net',
    is_anonymous: false,
    view_count: 198,
    like_count: 15,
    comment_count: 23,
    created_at: '2024-09-08T13:10:00Z'
  },
  {
    id: 'post-30',
    title: '편집자 교육과정의 현실적 개선방안',
    content: '현재 편집자 양성 교육과정이 실무와 괴리가 있다는 의견이 많습니다. 보다 실용적인 교육과정을 만들기 위한 방안을 함께 고민해보면 좋겠어요.',
    category: 'discussion',
    author_id: 'employee-1',
    author_name: '이수진',
    author_email: 'editor1@goldenrabbit.co.kr',
    is_anonymous: false,
    view_count: 289,
    like_count: 24,
    comment_count: 31,
    created_at: '2024-09-14T12:40:00Z'
  }
]

// 카테고리별 게시물 필터링
export const getPostsByCategory = (category: string): MockPost[] => {
  if (category === 'all') return mockPosts
  return mockPosts.filter(post => post.category === category)
}

// 게시물 검색
export const searchMockPosts = (searchTerm: string): MockPost[] => {
  const term = searchTerm.toLowerCase()
  return mockPosts.filter(post => 
    post.title.toLowerCase().includes(term) ||
    post.content.toLowerCase().includes(term) ||
    post.author_name.toLowerCase().includes(term)
  )
}

// ID로 게시물 조회
export const getMockPostById = (id: string): MockPost | undefined => {
  return mockPosts.find(post => post.id === id)
}