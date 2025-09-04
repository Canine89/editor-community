import { BookSalesData, BookSalesFileInfo, DailySalesOverview } from '@/types/book-sales'

// 더미 출판사 목록
const publishers = [
  '골든래빗',
  '한빛미디어',
  '위키북스',
  '에이콘출판',
  '인사이트',
  '제이펍',
  '길벗',
  '영진닷컴',
  '비제이퍼블릭',
  '프리렉',
  '한빛아카데미',
  '이지스퍼블리싱',
  '자유지성사',
  '생능출판',
  '신편컴퓨터'
]

// 더미 도서 제목 템플릿
const bookTitles = [
  'React 완벽 가이드',
  'Node.js 마스터하기',
  'TypeScript 실전 프로젝트',
  'Vue.js 3 개발의 모든 것',
  'Next.js로 배우는 풀스택 개발',
  '자바스크립트 딥 다이브',
  'Python 데이터 분석',
  '머신러닝 기초부터 응용까지',
  'AWS 클라우드 완벽 가이드',
  'Docker와 쿠버네티스',
  'GraphQL 실무 가이드',
  'MongoDB 완벽 가이드',
  'Redis 캐싱 전략',
  'Git으로 배우는 버전 관리',
  'Clean Code 실천법',
  'TDD 테스트 주도 개발',
  'RESTful API 설계',
  '마이크로서비스 아키텍처',
  'DevOps 실무 가이드',
  'Agile 프로젝트 관리',
  'UI/UX 디자인 패턴',
  '프론트엔드 성능 최적화',
  '백엔드 아키텍처 패턴',
  '데이터베이스 설계',
  '알고리즘과 자료구조',
  '컴퓨터 네트워크 기초',
  '운영체제의 이해',
  '소프트웨어 공학',
  '블록체인 개발',
  'AI와 딥러닝',
  '웹 보안 완벽 가이드',
  '모바일 앱 개발',
  '게임 개발 입문',
  'IoT 개발 실무',
  '빅데이터 처리'
]

const authors = [
  ['김철수'],
  ['이영희', '박민수'],
  ['최재훈'],
  ['정다은', '김영수', '이민정'],
  ['홍길동'],
  ['장미란', '김태현'],
  ['오준호'],
  ['신미영', '박성호'],
  ['윤서준'],
  ['임소희', '강민석'],
  ['노태완'],
  ['유진아', '서동민'],
  ['조현우'],
  ['배수지', '김동화'],
  ['한지민']
]

// 더미 데이터 생성 함수
export function generateDummyBookData(count: number = 100): BookSalesData {
  const data: BookSalesData = {}
  
  for (let i = 0; i < count; i++) {
    const bookId = `book_${i + 1}`
    const rank = i + 1
    const basePrice = 15000 + Math.floor(Math.random() * 35000) // 15,000 ~ 50,000원
    const salesPoint = Math.max(1, Math.floor(Math.random() * 1000) + (100 - rank) * 10)
    const publishDate = new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
    
    data[bookId] = {
      title: bookTitles[Math.floor(Math.random() * bookTitles.length)] + (i > 34 ? ` (${Math.floor(i/35) + 1}판)` : ''),
      author: authors[Math.floor(Math.random() * authors.length)],
      publisher: publishers[Math.floor(Math.random() * publishers.length)],
      rank,
      right_price: basePrice,
      sales_point: salesPoint,
      publish_date: publishDate.toISOString().split('T')[0],
      url: `https://www.yes24.com/Product/Goods/${100000000 + i}`,
      fake_isbn: 9780000000000 + i,
      page: 200 + Math.floor(Math.random() * 400), // 200-600 페이지
      tags: ['프로그래밍', '개발', 'IT'].slice(0, Math.floor(Math.random() * 3) + 1)
    }
  }
  
  return data
}

// 더미 파일 정보 생성 함수
export function generateDummyFileInfos(): BookSalesFileInfo[] {
  const files: BookSalesFileInfo[] = []
  const startDate = new Date('2025-01-01')
  
  for (let i = 0; i < 90; i++) { // 90일치 파일 정보
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    
    const dateString = currentDate.toISOString().split('T')[0]
    const filename = `yes24_${dateString.replace(/-/g, '_')}.json`
    
    const month = parseInt(dateString.substring(5, 7))
    const day = parseInt(dateString.substring(8, 10))
    const year = parseInt(dateString.substring(0, 4))
    
    files.push({
      filename,
      date: dateString,
      displayDate: `${year}년 ${month}월 ${day}일`
    })
  }
  
  return files
}

// 더미 개요 데이터 생성 함수
export function generateDummyOverview(data: BookSalesData, date: string): DailySalesOverview {
  const books = Object.values(data)
  const publishers = [...new Set(books.map(book => book.publisher))]
  
  const topBook = books.reduce((prev, current) => {
    return (prev.sales_point > current.sales_point) ? prev : current
  })
  
  return {
    date,
    totalBooks: books.length,
    publisherCount: publishers.length,
    totalSalesPoints: books.reduce((sum, book) => sum + book.sales_point, 0),
    averageRank: Math.round(books.reduce((sum, book) => sum + book.rank, 0) / books.length),
    topBook: {
      title: topBook.title,
      rank: topBook.rank,
      salesPoint: topBook.sales_point,
      publisher: topBook.publisher
    }
  }
}

// 환경에 따른 데이터 로딩 함수들
export const isDummyMode = () => {
  // 로컬 개발 환경이거나 NEXT_PUBLIC_USE_DUMMY_DATA가 true인 경우
  return process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true'
}

// 더미 모드용 데이터 로딩 시뮬레이션
export async function loadDummyBookSalesData(filename: string): Promise<BookSalesData> {
  // 실제 API 호출을 시뮬레이션하기 위한 딜레이
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200))
  
  return generateDummyBookData(100)
}

export async function getDummyBookSalesFiles(): Promise<BookSalesFileInfo[]> {
  // 실제 API 호출을 시뮬레이션하기 위한 딜레이
  await new Promise(resolve => setTimeout(resolve, 200))
  
  return generateDummyFileInfos()
}