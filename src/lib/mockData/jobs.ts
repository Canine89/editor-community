import { mockUsers, mockUsersMap } from './users'

export interface MockJob {
  id: string
  title: string
  description: string
  company: string
  location: string
  type: 'full-time' | 'part-time' | 'freelance' | 'contract'
  salary_range: string
  requirements: string[]
  poster_id: string
  poster_name: string
  poster_email: string
  is_active: boolean
  created_at: string
}

// 편집자/출판업계 맞춤 구인구직 데이터 (20개)
export const mockJobs: MockJob[] = [
  // 정규직 (8개)
  {
    id: 'job-1',
    title: '도서 편집자 (경력 3년 이상)',
    description: '출판 기획부터 편집, 교정까지 전반적인 도서 제작 과정을 담당할 편집자를 모집합니다.\n\n주요 업무:\n- 원고 검토 및 편집\n- 저자와의 소통 및 조율\n- 교정·교열 업무\n- 출간 일정 관리\n- 마케팅 협업\n\n우대사항:\n- 편집 관련 학과 전공자\n- InDesign, Photoshop 활용 가능자\n- 다양한 장르의 편집 경험자',
    company: '민음사',
    location: '서울 강남구',
    type: 'full-time',
    salary_range: '3,200만원 ~ 4,000만원',
    requirements: ['편집 경력 3년 이상', 'InDesign 사용 가능', '4년제 대졸 이상'],
    poster_id: 'employee-1',
    poster_name: '이수진',
    poster_email: 'editor1@goldenrabbit.co.kr',
    is_active: true,
    created_at: '2024-09-01T09:00:00Z'
  },
  {
    id: 'job-2',
    title: '기술서적 전문 편집자',
    description: 'IT/프로그래밍 도서 전문 출판사에서 기술서적 편집자를 채용합니다.\n\n담당업무:\n- 기술서적 편집 및 교정\n- 기술 용어 검수\n- 코드 및 예제 검증\n- 저자 및 번역자와의 기술적 소통\n- 표지 및 내지 디자인 검수\n\n필수조건:\n- 프로그래밍 기초 지식\n- 기술서적 편집 경험 2년 이상\n- 영어 원서 번역서 편집 경험',
    company: '한빛미디어',
    location: '서울 마포구',
    type: 'full-time',
    salary_range: '3,500만원 ~ 4,500만원',
    requirements: ['기술서적 편집 경력 2년+', '프로그래밍 기초지식', '영어 독해 능력'],
    poster_id: 'master-1',
    poster_name: '김태현',
    poster_email: 'admin@goldenrabbit.co.kr',
    is_active: true,
    created_at: '2024-09-02T10:30:00Z'
  },
  {
    id: 'job-3',
    title: '아동도서 편집자 신입/경력',
    description: '유아 및 어린이 도서 전문 출판사에서 편집자를 모집합니다.\n\n업무내용:\n- 유아/어린이 도서 편집\n- 연령별 콘텐츠 적합성 검토\n- 삽화 및 디자인 요소 조율\n- 교육적 가치 검증\n- 시리즈 기획 참여\n\n우대사항:\n- 아동학, 유아교육 전공자\n- 어린이 도서 편집 경험\n- 교사 자격증 보유자',
    company: '보림출판사',
    location: '서울 종로구',
    type: 'full-time',
    salary_range: '2,800만원 ~ 3,600만원',
    requirements: ['신입 또는 경력 무관', '아동도서에 대한 이해', '꼼꼼한 성격'],
    poster_id: 'user-5',
    poster_name: '유소희',
    poster_email: 'aspiring.publisher@daum.net',
    is_active: true,
    created_at: '2024-09-03T14:20:00Z'
  },
  {
    id: 'job-4',
    title: '웹툰/만화 편집자',
    description: '웹툰 및 만화 콘텐츠 전문 편집자를 모집합니다.\n\n주요업무:\n- 웹툰 스토리 검토 및 편집\n- 작가와의 소통 및 피드백\n- 에피소드별 품질 관리\n- 플랫폼 연재 스케줄 관리\n- 독자 반응 분석 및 개선안 도출\n\n자격요건:\n- 만화/웹툰 업계 경험자 우대\n- 스토리텔링에 대한 이해\n- 트렌드 파악 능력',
    company: '레진코믹스',
    location: '서울 강남구',
    type: 'full-time',
    salary_range: '3,000만원 ~ 4,200만원',
    requirements: ['콘텐츠 기획/편집 경력', '웹툰 트렌드 이해', '창의적 사고력'],
    poster_id: 'premium-2',
    poster_name: '한지민',
    poster_email: 'bookdesigner@naver.com',
    is_active: true,
    created_at: '2024-09-05T11:15:00Z'
  },
  {
    id: 'job-5',
    title: '학술지 편집위원',
    description: '국제학술지 편집위원을 모집합니다.\n\n담당업무:\n- 학술논문 편집 및 교정\n- 영문 초록 검수\n- 참고문헌 체계 점검\n- 저자와의 수정요청 소통\n- 학회 편집규정 준수 관리\n\n자격요건:\n- 해당 분야 석사 이상\n- 학술지 편집 경험 필수\n- 영어 능통자',
    company: '한국학술정보원',
    location: '대전 유성구',
    type: 'full-time',
    salary_range: '3,400만원 ~ 4,100만원',
    requirements: ['석사 이상', '학술지 편집 경력', '영어 능통'],
    poster_id: 'premium-3',
    poster_name: '오준석',
    poster_email: 'pro.proofreader@daum.net',
    is_active: true,
    created_at: '2024-09-07T15:45:00Z'
  },
  {
    id: 'job-6',
    title: '전자책 편집 전문가',
    description: '전자책 제작 및 편집 전담 인력을 채용합니다.\n\n업무내용:\n- 전자책 포맷 변환 및 편집\n- EPUB, PDF 등 다양한 포맷 대응\n- 인터랙티브 요소 기획 및 구현\n- 전자책 플랫폼별 최적화\n- 멀티미디어 콘텐츠 통합\n\n필수역량:\n- 전자책 제작 도구 활용 능력\n- HTML, CSS 기초 지식\n- 디지털 퍼블리싱 이해',
    company: '교보문고',
    location: '서울 종로구',
    type: 'full-time',
    salary_range: '3,100만원 ~ 3,900만원',
    requirements: ['전자책 제작 경력', 'HTML/CSS 기초', '디지털 출판 이해'],
    poster_id: 'user-6',
    poster_name: '장성민',
    poster_email: 'book.lover@naver.com',
    is_active: true,
    created_at: '2024-09-09T12:30:00Z'
  },
  {
    id: 'job-7',
    title: '출판기획 및 편집자 (경영서 전문)',
    description: '경영/자기계발서 전문 출판사의 기획편집자를 모집합니다.\n\n주요업무:\n- 경영서/자기계발서 기획\n- 베스트셀러 트렌드 분석\n- 저자 발굴 및 계약\n- 편집 및 마케팅 기획\n- 해외 도서 판권 협상\n\n우대사항:\n- 경영학 전공자\n- 베스트셀러 기획 경험\n- 영어 협상 가능자',
    company: '김앤김북스',
    location: '서울 서초구',
    type: 'full-time',
    salary_range: '3,600만원 ~ 4,800만원',
    requirements: ['출판기획 경력 3년+', '경영서 분야 이해', '마케팅 감각'],
    poster_id: 'master-2',
    poster_name: '박지영',
    poster_email: 'ceo@goldenrabbit.co.kr',
    is_active: true,
    created_at: '2024-09-11T13:50:00Z'
  },
  {
    id: 'job-8',
    title: '시니어 편집자 (팀장급)',
    description: '편집팀을 이끌어갈 시니어 편집자를 모집합니다.\n\n담당업무:\n- 편집팀 관리 및 업무 분배\n- 주니어 편집자 멘토링\n- 출판 전략 수립\n- 품질 관리 및 표준화\n- 출판사 대표와의 업무 조율\n\n자격요건:\n- 편집 경력 7년 이상\n- 팀 관리 경험\n- 다양한 장르 편집 경험',
    company: '문학동네',
    location: '서울 마포구',
    type: 'full-time',
    salary_range: '4,500만원 ~ 5,500만원',
    requirements: ['편집 경력 7년+', '팀 관리 경험', '리더십'],
    poster_id: 'employee-1',
    poster_name: '이수진',
    poster_email: 'editor1@goldenrabbit.co.kr',
    is_active: true,
    created_at: '2024-09-13T10:20:00Z'
  },

  // 계약직 (5개)
  {
    id: 'job-9',
    title: '번역서 편집 계약직 (6개월)',
    description: '해외 베스트셀러 번역서 편집을 담당할 계약직 편집자를 모집합니다.\n\n프로젝트:\n- 총 5권의 번역서 편집\n- 계약기간: 6개월 (연장 가능)\n- 원서 대조 편집 필수\n- 번역자와의 긴밀한 소통\n\n지원자격:\n- 번역서 편집 경험자\n- 영어 원서 독해 능력\n- 문학 번역서 편집 경험 우대',
    company: '열린책들',
    location: '서울 서대문구',
    type: 'part-time',
    salary_range: '월 250만원',
    requirements: ['번역서 편집 경험', '영어 독해 능력', '문학 전공 우대'],
    poster_id: 'user-7',
    poster_name: '신예린',
    poster_email: 'creative.writer@gmail.com',
    is_active: true,
    created_at: '2024-09-04T16:30:00Z'
  },
  {
    id: 'job-10',
    title: '교재 편집자 (파트타임)',
    description: '중고등학교 교재 편집 업무를 담당할 파트타임 편집자를 모집합니다.\n\n근무조건:\n- 주 3일 근무 (화, 목, 금)\n- 오전 9시 ~ 오후 6시\n- 교육과정 개정에 따른 교재 개편 프로젝트\n\n업무내용:\n- 교과서 및 참고서 편집\n- 교육과정 분석\n- 문제 및 해설 검수',
    company: '대교',
    location: '서울 용산구',
    type: 'part-time',
    salary_range: '월 180만원',
    requirements: ['교육학 전공 우대', '교재 편집 경험', '교육과정 이해'],
    poster_id: 'user-4',
    poster_name: '김민수',
    poster_email: 'junior.corrector@gmail.com',
    is_active: true,
    created_at: '2024-09-06T14:10:00Z'
  },
  {
    id: 'job-11',
    title: '잡지 편집자 (3개월 계약)',
    description: '월간 문화잡지 특별호 제작을 위한 단기 편집자를 모집합니다.\n\n프로젝트:\n- 창간 30주년 특별호 제작\n- 과거 아카이브 정리 및 편집\n- 인터뷰 기사 편집\n- 화보 및 레이아웃 협업\n\n계약조건:\n- 3개월 계약 (성과에 따라 정규직 전환 가능)\n- 주 5일 근무',
    company: '월간 문학사상',
    location: '서울 종로구',
    type: 'part-time',
    salary_range: '월 220만원',
    requirements: ['잡지 편집 경험', '문화예술 관심', '아카이브 작업 경험'],
    poster_id: 'premium-1',
    poster_name: '최영미',
    poster_email: 'freelance.editor@gmail.com',
    is_active: true,
    created_at: '2024-09-08T11:40:00Z'
  },
  {
    id: 'job-12',
    title: '대학교재 편집 (학기별 계약)',
    description: '대학 전공서적 편집을 담당할 계약직을 모집합니다.\n\n담당업무:\n- 대학 전공교재 편집\n- 교수진과의 원고 조율\n- 참고문헌 및 인용 체계 정리\n- 도표 및 그래프 편집\n\n계약조건:\n- 학기별 계약 (2학기 연속)\n- 재택근무 병행 가능',
    company: '학지사',
    location: '서울 관악구',
    type: 'part-time',
    salary_range: '월 200만원',
    requirements: ['학술서 편집 경험', '해당 분야 이해', '꼼꼼한 성격'],
    poster_id: 'user-8',
    poster_name: '노태완',
    poster_email: 'reading.enthusiast@outlook.com',
    is_active: true,
    created_at: '2024-09-10T15:20:00Z'
  },
  {
    id: 'job-13',
    title: '온라인 콘텐츠 편집자 (시간제)',
    description: '온라인 플랫폼 콘텐츠 편집을 담당할 시간제 근무자를 모집합니다.\n\n업무내용:\n- 웹 연재소설 편집\n- SNS 콘텐츠 기획 및 편집\n- 독자 댓글 모니터링\n- 작가와의 온라인 소통\n\n근무조건:\n- 주 20시간 근무\n- 재택근무 가능\n- 유연근무제',
    company: '카카오페이지',
    location: '경기 성남시 (재택 가능)',
    type: 'part-time',
    salary_range: '시급 1만5천원',
    requirements: ['디지털 콘텐츠 이해', 'SNS 활용 능력', '온라인 소통 능력'],
    poster_id: 'user-3',
    poster_name: '박서연',
    poster_email: 'hobby.editor@outlook.com',
    is_active: true,
    created_at: '2024-09-12T09:30:00Z'
  },

  // 프리랜서 (4개)
  {
    id: 'job-14',
    title: '[프리랜서] 기술서 교정·교열',
    description: '프로그래밍 기술서 교정·교열을 담당할 프리랜서를 모집합니다.\n\n작업내용:\n- 기술용어 정확성 검수\n- 코드 예제 검증\n- 맞춤법 및 문법 교정\n- 번역서의 경우 원서 대조\n\n작업조건:\n- 건당 계약\n- 재택근무\n- 급여: 페이지당 1,500원\n- 월 평균 200~300페이지 작업량',
    company: '에이콘출판사',
    location: '재택근무',
    type: 'freelance',
    salary_range: '페이지당 1,500원',
    requirements: ['IT 기초지식', '교정 경력 2년+', '꼼꼼함'],
    poster_id: 'premium-3',
    poster_name: '오준석',
    poster_email: 'pro.proofreader@daum.net',
    is_active: true,
    created_at: '2024-09-02T13:45:00Z'
  },
  {
    id: 'job-15',
    title: '[프리랜서] 아동도서 일러스트 편집',
    description: '아동도서 일러스트 편집 및 레이아웃 작업을 담당할 프리랜서를 모집합니다.\n\n작업내용:\n- 일러스트와 텍스트 레이아웃\n- 연령대별 가독성 최적화\n- 색상 및 디자인 요소 조율\n- 제작사양서에 따른 편집\n\n자격요건:\n- InDesign 전문가 수준\n- 아동도서 편집 경험\n- 일러스트 감각',
    company: '창비',
    location: '재택근무',
    type: 'freelance',
    salary_range: '건당 80만원 ~ 120만원',
    requirements: ['InDesign 전문가', '아동도서 편집 경험', '디자인 감각'],
    poster_id: 'employee-2',
    poster_name: '정민호',
    poster_email: 'design@goldenrabbit.co.kr',
    is_active: true,
    created_at: '2024-09-05T17:15:00Z'
  },
  {
    id: 'job-16',
    title: '[프리랜서] 학술논문 영문 교정',
    description: '국제학술지 투고용 영문 논문 교정 서비스를 제공할 프리랜서를 모집합니다.\n\n작업범위:\n- 영문 문법 및 표현 교정\n- 학술 용어 정확성 검수\n- 논문 형식 및 체계 점검\n- 저자와의 수정사항 소통\n\n자격요건:\n- 영어 원어민 수준\n- 학술논문 교정 경험\n- 해당 분야 전문지식 (의학, 공학, 인문학 등)',
    company: '네이처리서치',
    location: '재택근무',
    type: 'freelance',
    salary_range: '논문당 15만원 ~ 30만원',
    requirements: ['영어 원어민 수준', '학술논문 이해', '전문분야 지식'],
    poster_id: 'master-1',
    poster_name: '김태현',
    poster_email: 'admin@goldenrabbit.co.kr',
    is_active: true,
    created_at: '2024-09-07T10:50:00Z'
  },
  {
    id: 'job-17',
    title: '[프리랜서] 여행가이드북 편집',
    description: '여행 가이드북 시리즈 편집을 담당할 프리랜서를 모집합니다.\n\n프로젝트:\n- 아시아 10개국 가이드북 시리즈\n- 지역별 정보 업데이트\n- 사진 및 지도 편집\n- 실용정보 검증\n\n작업기간:\n- 국가별 2개월\n- 총 프로젝트 기간 20개월\n\n우대사항:\n- 여행업계 경험\n- 해당 지역 거주/여행 경험',
    company: '론리플래닛 코리아',
    location: '재택근무 (현지 답사 포함)',
    type: 'freelance',
    salary_range: '국가별 150만원',
    requirements: ['여행가이드북 편집 경험', '언어 능력', '여행 경험'],
    poster_id: 'user-1',
    poster_name: '김지혜',
    poster_email: 'newbie.editor@gmail.com',
    is_active: true,
    created_at: '2024-09-09T14:25:00Z'
  },

  // 외주 (3개)
  {
    id: 'job-18',
    title: '[외주] 기업 브로슈어 편집 디자인',
    description: '대기업 홍보 브로슈어 편집 및 디자인 외주 프로젝트입니다.\n\n프로젝트:\n- 회사소개 브로슈어 (한/영 2개 언어)\n- 총 32페이지 분량\n- 고급 인쇄 품질\n- 3주 작업 기간\n\n요구사항:\n- 기업 브로슈어 제작 경험\n- 포트폴리오 필수 제출\n- Adobe 프로그램 전문가',
    company: '삼성SDI',
    location: '용인 (미팅시 출장)',
    type: 'contract',
    salary_range: '프로젝트당 300만원',
    requirements: ['기업 브로슈어 경험', '포트폴리오 필수', 'Adobe 전문가'],
    poster_id: 'premium-2',
    poster_name: '한지민',
    poster_email: 'bookdesigner@naver.com',
    is_active: true,
    created_at: '2024-09-03T12:10:00Z'
  },
  {
    id: 'job-19',
    title: '[외주] 정부간행물 편집',
    description: '정부부처 발간 정책자료집 편집 외주 프로젝트입니다.\n\n프로젝트 개요:\n- 2025년 정책백서 편집\n- 500페이지 분량\n- 정부간행물 표준 준수\n- 6개월 프로젝트\n\n자격조건:\n- 정부간행물 편집 경험 필수\n- 공공기관 사업 참여 이력\n- 보안서약서 작성 동의',
    company: '기획재정부',
    location: '세종시 (부분 출장)',
    type: 'contract',
    salary_range: '프로젝트당 800만원',
    requirements: ['정부간행물 경험', '보안서약 동의', '공공사업 이력'],
    poster_id: 'master-2',
    poster_name: '박지영',
    poster_email: 'ceo@goldenrabbit.co.kr',
    is_active: true,
    created_at: '2024-09-06T09:45:00Z'
  },
  {
    id: 'job-20',
    title: '[외주] 의료진 교육자료 편집',
    description: '의료진 대상 교육자료 편집 및 제작 외주입니다.\n\n작업내용:\n- 의학 교육 자료집 편집\n- 의료 용어 정확성 검수\n- 도표 및 차트 편집\n- 인쇄 및 디지털 버전 제작\n\n프로젝트 기간:\n- 3개월\n- 중간 검수 2회\n- 최종 납품 후 수정 1회 포함',
    company: '서울대학교병원',
    location: '서울 종로구 (미팅시 방문)',
    type: 'contract',
    salary_range: '프로젝트당 450만원',
    requirements: ['의료 분야 편집 경험', '전문용어 이해', '정확성과 신뢰성'],
    poster_id: 'employee-1',
    poster_name: '이수진',
    poster_email: 'editor1@goldenrabbit.co.kr',
    is_active: false,
    created_at: '2024-09-01T16:30:00Z'
  }
]

// 채용공고 필터링 및 검색 함수들
export const getJobsByType = (type: string): MockJob[] => {
  if (type === 'all') return mockJobs
  return mockJobs.filter(job => job.type === type)
}

export const getActiveJobs = (): MockJob[] => {
  return mockJobs.filter(job => job.is_active)
}

export const searchMockJobs = (searchTerm: string): MockJob[] => {
  const term = searchTerm.toLowerCase()
  return mockJobs.filter(job => 
    job.title.toLowerCase().includes(term) ||
    job.description.toLowerCase().includes(term) ||
    job.company.toLowerCase().includes(term) ||
    job.location.toLowerCase().includes(term)
  )
}

export const getMockJobById = (id: string): MockJob | undefined => {
  return mockJobs.find(job => job.id === id)
}

// 지역별 필터링
export const getJobsByLocation = (location: string): MockJob[] => {
  if (location === 'all') return mockJobs
  return mockJobs.filter(job => job.location.includes(location))
}