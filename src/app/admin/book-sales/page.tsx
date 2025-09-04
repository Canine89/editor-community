'use client'

import { useState, useEffect } from 'react'
import { useAdmin } from '@/hooks/useAdmin'
import DataTable from '@/components/admin/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Pagination, PaginationInfo } from '@/components/ui/pagination'
import {
  BookOpen,
  Calendar,
  Search,
  BarChart3,
  Copy,
  Check
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  getBookSalesFiles,
  loadBookSalesData,
  loadMultipleBookSalesData,
  getPublisherStats,
  getDailySalesOverview,
  searchBooks,
  getTopBooksBySales,
  loadDataForPeriod,
  getPeriodOverview,
  getPublisherStatsForPeriod,
  loadChartDataForBooks
} from '@/lib/book-sales'
import { isDummyMode } from '@/lib/dummy-book-data'
import { BookSalesData, BookSalesFileInfo, DailySalesOverview, PeriodOverview, PeriodType } from '@/types/book-sales'

export default function BookSalesPage() {
  const { canViewBookSales, canViewBookSalesValue, logActivity, loading: adminLoading } = useAdmin()
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedFilename, setSelectedFilename] = useState('')
  const [bookData, setBookData] = useState<BookSalesData>({})
  const [overview, setOverview] = useState<DailySalesOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredBooks, setFilteredBooks] = useState<any[]>([])
  const [availableFiles, setAvailableFiles] = useState<BookSalesFileInfo[]>([])
  const [availableDates, setAvailableDates] = useState<Date[]>([])
  const [selectedPublisher, setSelectedPublisher] = useState('all')
  const [publishers, setPublishers] = useState<string[]>([])
  const [selectedBooks, setSelectedBooks] = useState<string[]>([])
  const [showChart, setShowChart] = useState(false)
  const [chartData, setChartData] = useState<any[]>([])
  const [loadingChart, setLoadingChart] = useState(false)
  const [chartPeriod, setChartPeriod] = useState<30 | 60 | 120 | 180>(30)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingStatus, setLoadingStatus] = useState('')
  
  // 출판사 순위 그래프 관련 state
  const [showPublisherRanking, setShowPublisherRanking] = useState(false)
  const [publisherRankingData, setPublisherRankingData] = useState<any[]>([])
  const [loadingPublisherRanking, setLoadingPublisherRanking] = useState(false)
  const [publisherRankingPeriod, setPublisherRankingPeriod] = useState<30 | 60 | 90 | 120>(30)
  
  // 기간별 조회 관련 state
  const [viewMode, setViewMode] = useState<'daily' | 'date-specific'>('daily')
  const [loadingPeriod, setLoadingPeriod] = useState(false)
  
  // 특정 날짜 통계 관련 state
  const [selectedDateForStats, setSelectedDateForStats] = useState<Date>()
  const [dateStatsData, setDateStatsData] = useState<{overview: any, publishers: any[]}>({overview: null, publishers: []})

  // 페이지네이션 관련 state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10) // 페이지당 아이템 수

  // 복사 기능 관련 state
  const [copiedBookId, setCopiedBookId] = useState<string | null>(null)

  useEffect(() => {
    if (!adminLoading && canViewBookSalesValue) {
      logActivity('view_book_sales_data')
      loadAvailableFiles()
    }
  }, [canViewBookSalesValue, adminLoading])

  const loadAvailableFiles = async () => {
    try {
      const files = await getBookSalesFiles()
      setAvailableFiles(files)
      
      // 사용 가능한 날짜들을 Date 객체 배열로 변환
      const dates = files.map(file => new Date(file.date))
      setAvailableDates(dates)
      
      if (files.length > 0) {
        // 가장 최근 날짜를 기본으로 선택
        const latestFile = files[files.length - 1]
        const latestDate = new Date(latestFile.date)
        setSelectedDate(latestDate)
        setSelectedFilename(latestFile.filename)
        loadDataForDate(latestFile.filename)
      }
    } catch (error) {
      console.error('Failed to load available files:', error)
    }
  }

  const loadDataForDate = async (filename: string) => {
    setLoading(true)
    try {
      const data = await loadBookSalesData(filename)
      console.log('📚 로드된 bookData:', data)
      console.log('📊 bookData 키 개수:', Object.keys(data).length)
      console.log('📋 bookData 샘플:', Object.values(data).slice(0, 3))
      setBookData(data)
      
      // 개요 데이터 생성
      const dateString = filename.replace('yes24_', '').replace('.json', '').replace('_', '-')
      const formattedDate = `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`
      const overviewData = getDailySalesOverview(data, formattedDate)
      setOverview(overviewData)
      
      // 출판사 목록 추출
      const publisherSet = new Set(Object.values(data).map(book => book.publisher))
      setPublishers(Array.from(publisherSet).sort())
      
      // 초기 필터링된 책 목록 설정
      updateFilteredBooks(data, '', 'all')

      // 디버깅: bookData 로드 완료 후 상태 확인
      console.log('✅ bookData 로드 완료!')
      console.log('📊 최종 bookData 상태:', {
        totalBooks: Object.keys(data).length,
        firstBook: Object.values(data)[0],
        bookIds: Object.keys(data).slice(0, 5)
      })
    } catch (error) {
      console.error('Failed to load book data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateFilteredBooks = (data: BookSalesData, search: string, publisher: string) => {
    let books = Object.entries(data).map(([bookId, book]) => ({ bookId, ...book }))
    
    // 검색 필터
    if (search.trim()) {
      const searchResults = searchBooks(data, search)
      books = searchResults
    }
    
    // 출판사 필터
    if (publisher !== 'all') {
      books = books.filter(book => book.publisher === publisher)
    }
    
    // 순위순 정렬
    books.sort((a, b) => a.rank - b.rank)
    setFilteredBooks(books)
    
    // 필터 변경 시 첫 페이지로 이동
    setCurrentPage(1)
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    updateFilteredBooks(bookData, term, selectedPublisher)
  }

  const handlePublisherFilter = (publisher: string) => {
    setSelectedPublisher(publisher)
    updateFilteredBooks(bookData, searchTerm, publisher)
  }

  const handleClearAllSelections = () => {
    setSelectedBooks([])
  }

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return
    
    // 선택된 날짜에 해당하는 파일 찾기
    const targetFile = availableFiles.find(file => {
      const fileDate = new Date(file.date)
      return fileDate.getTime() === date.getTime()
    })
    
    if (targetFile) {
              setSelectedDate(date)
        setSelectedFilename(targetFile.filename)
        loadDataForDate(targetFile.filename)
        // 날짜 변경 시 그래프 숨기기 (선택된 도서는 유지)
        setShowChart(false)
        setShowPublisherRanking(false)
    }
  }

  const handleBookSelection = (bookId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedBooks(prev => [...prev, bookId])
    } else {
      setSelectedBooks(prev => prev.filter(id => id !== bookId))
    }
  }


  const loadDateSpecificStats = async (date: Date) => {
    setLoadingPeriod(true)
    try {
      // 선택된 날짜에 해당하는 파일 찾기
      const dateString = date.toISOString().split('T')[0] // YYYY-MM-DD 형식
      const targetFile = availableFiles.find(file => file.date === dateString)
      
      if (targetFile) {
        const data = await loadBookSalesData(targetFile.filename)
        const overview = getDailySalesOverview(data, dateString)
        const publisherStats = getPublisherStats(data)
        
        setDateStatsData({
          overview,
          publishers: publisherStats
        })
        
        // 특정 날짜 조회 시에는 책 목록을 숨김
        setFilteredBooks([])
        setPublishers([])
      } else {
        alert('선택한 날짜의 데이터가 없습니다.')
        setDateStatsData({overview: null, publishers: []})
      }
    } catch (error) {
      console.error('Failed to load date specific stats:', error)
      alert('날짜별 통계 로드 중 오류가 발생했습니다.')
    } finally {
      setLoadingPeriod(false)
    }
  }

  const handleViewModeChange = (mode: 'daily' | 'date-specific') => {
    setViewMode(mode)
    // 뷰 모드 변경 시 그래프 숨기기 (선택된 도서는 유지)
    setShowChart(false)
    setShowPublisherRanking(false)
    setChartData([])

    if (mode === 'date-specific') {
      // 날짜별 통계 모드: 최신 날짜로 초기 설정
      if (availableFiles.length > 0 && !selectedDateForStats) {
        const latestDate = new Date(availableFiles[availableFiles.length - 1].date)
        setSelectedDateForStats(latestDate)
        loadDateSpecificStats(latestDate)
      } else if (selectedDateForStats) {
        loadDateSpecificStats(selectedDateForStats)
      }
    } else {
      // 일별 조회 모드로 돌아갈 때는 기존 날짜 데이터 다시 로드
      if (selectedFilename) {
        loadDataForDate(selectedFilename)
      }
    }
  }

  const handleDateForStatsChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDateForStats(date)
      if (viewMode === 'date-specific') {
        loadDateSpecificStats(date)
      }
    }
  }


  const generateChart = async () => {
    if (!isDummyMode() && selectedBooks.length === 0) {
      alert('그래프를 보려면 최소 1개의 도서를 선택해주세요.')
      return
    }

    setLoadingChart(true)
    setLoadingProgress(0)
    setLoadingStatus('준비 중...')
    
    try {
      let selectedBookTitles: string[] = []

      // 더미 모드에서는 선택된 책들의 제목을 직접 사용하거나 임의 선택
      if (isDummyMode()) {
        if (selectedBooks.length === 0) {
          // 선택된 책이 없으면 임의로 책들 선택
          const allBooks = Object.values(bookData)
          const numBooks = Math.min(5, allBooks.length)
          const randomBooks = allBooks
            .sort(() => Math.random() - 0.5)
            .slice(0, numBooks)
          selectedBookTitles = randomBooks.map(book => book.title)
          console.log(`🔧 더미 모드: ${selectedBookTitles.length}개 임의 도서 선택`)
        } else {
          // 선택된 책이 있으면 제목들을 수집 (필터링된 데이터나 전체 데이터에서)
          for (const bookId of selectedBooks) {
            // 먼저 필터링된 데이터에서 찾기
            let currentBook = filteredBooks.find(b => b.bookId === bookId)
            if (!currentBook) {
              // 필터링된 데이터에 없으면 전체 데이터에서 찾기
              currentBook = Object.values(bookData).find(b => b.bookId === bookId)
            }
            if (currentBook) {
              selectedBookTitles.push(currentBook.title)
            } else {
              // 책을 찾지 못했으면 bookId를 제목으로 사용 (더미 데이터용)
              console.warn(`⚠️ 도서를 찾지 못함: ${bookId}, 더미 제목으로 사용`)
              selectedBookTitles.push(`도서 ${bookId}`)
            }
          }
        }
      } else {
        // 일반 모드: 선택된 도서 제목 수집 (전체 데이터에서 찾기)
        for (const bookId of selectedBooks) {
          const currentBook = Object.values(bookData).find(b => b.bookId === bookId)
          if (currentBook) {
            selectedBookTitles.push(currentBook.title)
          }
        }
      }

      setLoadingProgress(5)
      setLoadingStatus(`${selectedBookTitles.length}개 도서 선택 완료`)

      // 진행률 콜백 함수
      const progressCallback = (progress: number, status: string) => {
        setLoadingProgress(progress)
        setLoadingStatus(status)
      }

      console.log(`🔍 선택된 도서들:`, selectedBooks)
      console.log(`📚 수집된 제목들:`, selectedBookTitles)
      console.log(`🎯 더미 모드:`, isDummyMode())
      console.log(`📈 bookData 상태:`, {
        isEmpty: Object.keys(bookData).length === 0,
        totalBooks: Object.keys(bookData).length,
        sampleBook: Object.values(bookData)[0]
      })

      // 선택된 도서들의 상세 정보 확인
      console.log('🔍 선택된 도서 상세 정보:')
      console.log('📋 bookData 구조 확인:', {
        keys: Object.keys(bookData).slice(0, 5),
        firstBook: Object.values(bookData)[0]
      })

      selectedBooks.forEach((bookId, index) => {
        const book = Object.values(bookData).find(b => b.bookId === bookId)
        const directAccess = bookData[bookId] // 직접 접근도 시도
        console.log(`${index + 1}. ID: ${bookId}`)
        console.log(`   - find() 결과: ${!!book}, 제목: ${book?.title || 'N/A'}`)
        console.log(`   - 직접 접근: ${!!directAccess}, 제목: ${directAccess?.title || 'N/A'}`)
        console.log(`   - bookId 속성: ${book?.bookId || directAccess?.bookId || 'N/A'}`)
      })

      // 최적화된 차트 데이터 로딩 사용
      const chartData = await loadChartDataForBooks(
        selectedBookTitles,
        chartPeriod,
        availableFiles,
        progressCallback
      )

      if (chartData.length === 0) {
        alert('선택된 기간에 해당하는 도서 데이터가 없습니다.')
        return
      }
      
      setChartData(chartData)
      setShowChart(true)
    } catch (error) {
      console.error('Failed to generate chart:', error)
      alert('그래프 생성 중 오류가 발생했습니다.')
    } finally {
      setLoadingChart(false)
      setLoadingProgress(0)
      setLoadingStatus('')
    }
  }

  // 출판사 순위 그래프 생성
  const generatePublisherRanking = async () => {
    setLoadingPublisherRanking(true)
    setLoadingProgress(0)
    setLoadingStatus('출판사 데이터 수집 중...')
    
    try {
      // 선택된 기간에 해당하는 파일들 찾기
      const endDate = selectedDate || new Date()
      const startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - publisherRankingPeriod)
      
      const periodFiles = availableFiles.filter(file => {
        const fileDate = new Date(file.date)
        return fileDate >= startDate && fileDate <= endDate
      })
      
      if (periodFiles.length === 0) {
        alert('선택된 기간에 해당하는 데이터가 없습니다.')
        return
      }
      
      setLoadingProgress(10)
      setLoadingStatus(`${periodFiles.length}개 파일 로딩 중...`)
      
      // 기간별 출판사 데이터 수집
      const publisherDataByDate: { [date: string]: { [publisher: string]: { totalSalesPoints: number, bookCount: number } } } = {}
      
      for (let i = 0; i < periodFiles.length; i++) {
        const file = periodFiles[i]
        const progress = 10 + (i / periodFiles.length) * 70
        setLoadingProgress(progress)
        setLoadingStatus(`${file.date} 데이터 처리 중...`)
        
        try {
          const data = await loadBookSalesData(file.filename)
          const publisherStats = getPublisherStats(data)
          
          publisherDataByDate[file.date] = {}
          publisherStats.forEach(pub => {
            publisherDataByDate[file.date][pub.name] = {
              totalSalesPoints: pub.totalSalesPoints,
              bookCount: pub.bookCount
            }
          })
        } catch (error) {
          console.error(`Failed to load data for ${file.filename}:`, error)
        }
      }
      
      setLoadingProgress(80)
      setLoadingStatus('차트 데이터 준비 중...')
      
      // 모든 출판사 목록 수집
      const allPublishers = new Set<string>()
      Object.values(publisherDataByDate).forEach(dateData => {
        Object.keys(dateData).forEach(publisher => allPublishers.add(publisher))
      })
      
      // 상위 8개 출판사만 선택 (총 판매지수 기준)
      const publisherTotals = Array.from(allPublishers).map(publisher => {
        const total = Object.values(publisherDataByDate).reduce((sum, dateData) => {
          return sum + (dateData[publisher]?.totalSalesPoints || 0)
        }, 0)
        return { name: publisher, total }
      })
      
      const topPublishers = publisherTotals
        .sort((a, b) => b.total - a.total)
        .slice(0, 8)
        .map(p => p.name)
      
      // 차트 데이터 생성
      const chartData = Object.entries(publisherDataByDate)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([date, publishers]) => {
          const dataPoint: any = { date }
          topPublishers.forEach(publisher => {
            dataPoint[publisher] = publishers[publisher]?.totalSalesPoints || 0
          })
          return dataPoint
        })
      
      setPublisherRankingData(chartData)
      setShowPublisherRanking(true)
      setLoadingProgress(100)
      setLoadingStatus('완료!')
      
    } catch (error) {
      console.error('Failed to generate publisher ranking:', error)
      alert('출판사 순위 차트 생성 중 오류가 발생했습니다.')
    } finally {
      setLoadingPublisherRanking(false)
      setLoadingProgress(0)
      setLoadingStatus('')
    }
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR') + '원'
  }

  const formatSalesPoint = (point: number) => {
    return point.toLocaleString('ko-KR')
  }

  // 핫키워드 추출 함수
  const extractHotKeywords = (bookData: BookSalesData, limit: number = 10): string[] => {
    const wordCount: { [key: string]: number } = {}
    const stopWords = ['완벽', '가이드', '실전', '프로젝트', '개발', '프론트엔드', '백엔드', '데이터', '분석', '기초', '입문', '마스터', '활용', '실무', '심화', '대비', '준비', '시작', '기본', '이해', '학습', '스터디', '스터디', '코딩', '프로그래밍', '웹', '모바일', '서버', '클라이언트', '풀스택', '데브옵스', '클라우드', '인공지능', '머신러닝', '딥러닝']

    // 모든 도서명에서 단어 추출
    Object.values(bookData).forEach(book => {
      const title = book.title.toLowerCase()

      // 특수문자 제거 및 공백으로 분리
      const words = title
        .replace(/[^\w\s가-힣]/g, ' ') // 특수문자 제거 (한글 포함)
        .split(/\s+/)
        .filter(word => word.length >= 2) // 2글자 이상만
        .filter(word => !stopWords.includes(word)) // 불용어 제외
        .filter(word => !/^\d+$/.test(word)) // 숫자만 있는 단어 제외

      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1
      })
    })

    // 빈도수 기준으로 정렬하여 상위 키워드 반환
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([word]) => word)
  }

  // 페이지네이션 헬퍼 함수들
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPageBooks = filteredBooks.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // 페이지 변경 시 스크롤을 맨 위로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value)
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // 행 개수 변경 시 첫 페이지로 이동
  }

  // 도서 정보 복사 함수
  const copyBookInfo = async (book: any) => {
    const bookInfo = `저자: ${book.author.join(', ')}
출판사: ${book.publisher}
출간일: ${book.publish_date}
판매지수: ${formatSalesPoint(book.sales_point)}
가격: ${formatPrice(book.right_price)}
쪽: ${book.page || 'N/A'}쪽`

    try {
      await navigator.clipboard.writeText(bookInfo)
      setCopiedBookId(book.bookId)
      
      // 2초 후 복사 상태 초기화
      setTimeout(() => {
        setCopiedBookId(null)
      }, 2000)
    } catch (err) {
      console.error('복사 실패:', err)
      // fallback: 텍스트 선택 방식
      const textArea = document.createElement('textarea')
      textArea.value = bookInfo
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopiedBookId(book.bookId)
        setTimeout(() => {
          setCopiedBookId(null)
        }, 2000)
      } catch (fallbackErr) {
        console.error('Fallback 복사도 실패:', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }

  const columns: any[] = [
    {
      key: 'select',
      label: '선택',
      sortable: false,
      render: (value: any, row: any) => (
        <input
          type="checkbox"
          checked={selectedBooks.includes(row.bookId)}
          onChange={(e) => handleBookSelection(row.bookId, e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      ),
      headerRender: () => (
        <div className="flex items-center gap-2">
          <span>선택</span>
          {selectedBooks.length > 0 && (
            <button
              onClick={handleClearAllSelections}
              className="text-xs text-red-600 hover:text-red-800 hover:underline font-medium"
              title="전체 선택 해제"
            >
              해제
            </button>
          )}
        </div>
      )
    },
    {
      key: 'rank',
      label: '순위',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center">
          <Badge 
            variant={value <= 10 ? 'default' : value <= 50 ? 'secondary' : 'outline'}
            className="w-12 h-6 justify-center"
          >
            {value}
          </Badge>
        </div>
      )
    },
    {
      key: 'title',
      label: '도서명',
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            <a
              href={row.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-900 line-clamp-2 hover:text-blue-600 hover:underline cursor-pointer transition-colors"
              onClick={(e) => {
                if (!row.url) {
                  e.preventDefault()
                }
              }}
            >
              {value}
            </a>
            <p className="text-xs text-slate-500 mt-1 truncate">{row.author.join(', ')}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyBookInfo(row)}
            className="h-6 w-6 p-0 hover:bg-slate-100 flex-shrink-0"
            disabled={copiedBookId === row.bookId}
          >
            {copiedBookId === row.bookId ? (
              <Check className="w-3 h-3 text-green-600" />
            ) : (
              <Copy className="w-3 h-3 text-slate-400" />
            )}
          </Button>
        </div>
      )
    },
    {
      key: 'publisher',
      label: '출판사',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-slate-700">{value}</span>
      )
    },
    {
      key: 'sales_point',
      label: '판매지수',
      sortable: true,
      render: (value: number) => (
        <div className="text-right">
          <span className="text-sm">{formatSalesPoint(value)}</span>
        </div>
      )
    },
    {
      key: 'right_price',
      label: '정가',
      sortable: true,
      render: (value: number) => (
        <div className="text-right">
          <span className="text-sm">{formatPrice(value)}</span>
        </div>
      )
    },
    {
      key: 'publish_date',
      label: '출간일',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-slate-600">{value}</span>
      )
    },
  ]

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">권한 확인 중...</p>
        </div>
      </div>
    )
  }

  if (!canViewBookSalesValue) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">접근 권한이 필요합니다</h3>
                  <p className="text-slate-600">
                    이 페이지는 골든래빗 임직원만 접근할 수 있습니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* 페이지 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">도서 판매 데이터</h1>
            <p className="text-gray-600">골든래빗 출간 도서 판매 통계 및 분석</p>
          </div>
          
          <div className="space-y-6">
        {/* 조회 모드 선택 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">조회 모드</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 mb-4 flex-wrap">
              <Button 
                variant={viewMode === 'daily' ? 'default' : 'outline'}
                onClick={() => handleViewModeChange('daily')}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                일별 조회
              </Button>
              <Button 
                variant={viewMode === 'date-specific' ? 'default' : 'outline'}
                onClick={() => handleViewModeChange('date-specific')}
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                출판사 분석
              </Button>
            </div>

            {/* 일별 조회 모드 */}
            {viewMode === 'daily' && (
              <DatePicker
                date={selectedDate}
                onDateChange={handleDateChange}
                availableDates={availableDates}
                placeholder="날짜를 선택하세요"
              />
            )}


            {/* 출판사 분석 모드 */}
            {viewMode === 'date-specific' && (
              <DatePicker
                date={selectedDateForStats}
                onDateChange={handleDateForStatsChange}
                availableDates={availableDates}
                placeholder="분석할 날짜를 선택하세요"
              />
            )}
          </CardContent>
        </Card>

        {/* 일별 데이터 개요와 검색 및 필터 - 2열 배치 */}
        {viewMode === 'daily' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 일별 데이터 개요 */}
            {overview && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">일별 데이터 개요</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* 기존 메트릭스 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{overview.totalBooks}</div>
                        <div className="text-xs text-slate-600">총 도서 수</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{formatSalesPoint(overview.totalSalesPoints)}</div>
                        <div className="text-xs text-slate-600">총 판매지수</div>
                      </div>
                    </div>

                    {/* 핫키워드 섹션 */}
                    <div className="border-t pt-4">
                      <div className="text-sm font-medium text-slate-700 mb-2">🔥 핫 키워드 TOP 10</div>
                      <div className="flex flex-wrap gap-1">
                        {extractHotKeywords(bookData, 10).map((keyword, index) => (
                          <span
                            key={keyword}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-full border border-blue-200"
                          >
                            {index + 1}. {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 검색 및 필터 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">검색 및 필터</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        placeholder="도서명, 저자명, 출판사 검색..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Select value={selectedPublisher} onValueChange={handlePublisherFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="출판사 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">모든 출판사</SelectItem>
                        {publishers.map((publisher) => (
                          <SelectItem key={publisher} value={publisher}>
                            {publisher}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}


        {/* 도서 목록 테이블 - 일별 조회 모드에서만 표시 */}
        {viewMode === 'daily' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>도서 판매 현황</CardTitle>
                <div className="flex items-center gap-3">
                  {/* 선택된 도서 수 표시 */}
                  <div className="text-sm text-slate-600">
                    선택된 도서: <span className="font-medium text-blue-600">{selectedBooks.length}권</span>
                  </div>
                  
                  {/* 차트 컨트롤 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">차트 기간:</span>
                    <Select 
                      value={chartPeriod.toString()} 
                      onValueChange={(value) => setChartPeriod(parseInt(value) as 30 | 60 | 120 | 180)}
                      disabled={loadingChart || (!isDummyMode() && selectedBooks.length === 0)}
                    >
                      <SelectTrigger className="w-[80px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30일</SelectItem>
                        <SelectItem value="60">60일</SelectItem>
                        <SelectItem value="120">120일</SelectItem>
                        <SelectItem value="180">180일</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={generateChart}
                    disabled={loadingChart || (!isDummyMode() && selectedBooks.length === 0)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {loadingChart ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        처리중...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-3 h-3" />
                        그래프 보기
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {/* 프로그레스 바 (로딩 중일 때만 표시) */}
              {loadingChart && (
                <div className="w-full space-y-2 animate-fadeIn mt-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{loadingStatus}</span>
                    <span className="font-medium">{loadingProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex space-x-4">
                        {columns.map((_, j) => (
                          <div key={j} className="h-4 bg-slate-200 rounded flex-1"></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredBooks.length === 0 ? (
                <div className="text-center py-8 text-slate-600">
                  검색 결과가 없습니다
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 페이지네이션 정보 */}
                  <div className="flex justify-between items-center">
                    <PaginationInfo
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredBooks.length}
                      itemsPerPage={itemsPerPage}
                    />
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-slate-500">
                        페이지당 {itemsPerPage}건
                      </div>
                      <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                        <SelectTrigger className="w-[80px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10개</SelectItem>
                          <SelectItem value="20">20개</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 테이블 */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          {columns.map((column) => (
                            <th
                              key={column.key}
                              className="text-left py-2 px-4 font-medium text-slate-600"
                            >
                              {column.headerRender ? column.headerRender() : column.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {currentPageBooks.map((row, index) => (
                          <tr key={index} className="border-b hover:bg-slate-50">
                            {columns.map((column) => (
                              <td key={column.key} className="py-1 px-4">
                                {column.render
                                  ? column.render(row[column.key] as any, row as any)
                                  : String(row[column.key])
                                }
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 페이지네이션 */}
                  <div className="flex justify-center mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}


        {/* 차트 표시 섹션 - 판매지수와 순위 그래프 모두 표시 */}
        <div 
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            showChart && chartData.length > 0 
              ? 'max-h-[4000px] opacity-100 transform translate-y-0' 
              : 'max-h-0 opacity-0 transform -translate-y-4'
          }`}
        >
          {showChart && chartData.length > 0 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              {/* 판매지수 그래프 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      판매지수 추이 비교 ({chartPeriod}일간)
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {chartData.length}개 데이터 포인트
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-[400px] mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          fontSize={12}
                          tickFormatter={(value) => {
                            const date = new Date(value)
                            return `${date.getMonth() + 1}/${date.getDate()}`
                          }}
                        />
                        <YAxis 
                          tickFormatter={(value) => formatSalesPoint(value)}
                          fontSize={12}
                        />
                        <Tooltip 
                          formatter={(value, name) => [formatSalesPoint(Number(value)), name]}
                          labelFormatter={(label) => {
                            const date = new Date(label)
                            return `날짜: ${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
                          }}
                        />
                        <Legend />
                        {selectedBooks.map((bookId, index) => {
                          // 선택된 모든 책을 전체 데이터에서 찾기 (필터링과 무관하게)
                          // console.log(`🔎 차트 렌더링 - bookId: ${bookId}, bookData 크기: ${Object.keys(bookData).length}`)
                          const currentBook = Object.values(bookData).find(b => b.bookId === bookId)
                          if (!currentBook) {
                            console.warn(`⚠️ 선택된 책을 찾을 수 없음: ${bookId}`)
                            console.warn(`📋 bookData 샘플:`, Object.values(bookData).slice(0, 2))
                            return null
                          }

                          const shortTitle = currentBook.title.length > 20
                            ? currentBook.title.substring(0, 20) + '...'
                            : currentBook.title

                          const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

                          return (
                            <Line
                              key={bookId}
                              type="monotone"
                              dataKey={currentBook.title} // 원래 제목을 dataKey로 사용
                              stroke={colors[index % colors.length]}
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          )
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* 순위 그래프 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      순위 추이 비교 ({chartPeriod}일간)
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {chartData.length}개 데이터 포인트
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-[400px] mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          fontSize={12}
                          tickFormatter={(value) => {
                            const date = new Date(value)
                            return `${date.getMonth() + 1}/${date.getDate()}`
                          }}
                        />
                        <YAxis 
                          reversed={true}
                          tickFormatter={(value) => `${value}위`}
                          fontSize={12}
                          domain={['dataMin - 5', 'dataMax + 5']}
                        />
                        <Tooltip 
                          formatter={(value, name) => [`${value}위`, String(name).replace('_rank', '')]}
                          labelFormatter={(label) => {
                            const date = new Date(label)
                            return `날짜: ${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
                          }}
                        />
                        <Legend />
                        {selectedBooks.map((bookId, index) => {
                          // 선택된 모든 책을 전체 데이터에서 찾기 (필터링과 무관하게)
                          // console.log(`🔎 차트 렌더링 - bookId: ${bookId}, bookData 크기: ${Object.keys(bookData).length}`)
                          const currentBook = Object.values(bookData).find(b => b.bookId === bookId)
                          if (!currentBook) {
                            console.warn(`⚠️ 선택된 책을 찾을 수 없음: ${bookId}`)
                            console.warn(`📋 bookData 샘플:`, Object.values(bookData).slice(0, 2))
                            return null
                          }

                          const shortTitle = currentBook.title.length > 20
                            ? currentBook.title.substring(0, 20) + '...'
                            : currentBook.title

                          const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

                          return (
                            <Line
                              key={bookId + '_rank'}
                              type="monotone"
                              dataKey={`${currentBook.title}_rank`} // 원래 제목을 dataKey로 사용
                              stroke={colors[index % colors.length]}
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          )
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowChart(false)
                    setSelectedBooks([])
                    setChartData([])
                  }}
                >
                  닫기
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 출판사 순위 차트 표시 섹션 */}
        <div 
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            showPublisherRanking && publisherRankingData.length > 0 
              ? 'max-h-[2000px] opacity-100 transform translate-y-0' 
              : 'max-h-0 opacity-0 transform -translate-y-4'
          }`}
        >
          {showPublisherRanking && publisherRankingData.length > 0 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      출판사별 판매지수 추이 ({publisherRankingPeriod}일간)
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {publisherRankingData.length}개 데이터 포인트
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-[500px] mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={publisherRankingData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          fontSize={12}
                          tickFormatter={(value) => {
                            const date = new Date(value)
                            return `${date.getMonth() + 1}/${date.getDate()}`
                          }}
                        />
                        <YAxis 
                          tickFormatter={(value) => formatSalesPoint(value)}
                          fontSize={12}
                        />
                        <Tooltip 
                          formatter={(value, name) => [formatSalesPoint(Number(value)), String(name)]}
                          labelFormatter={(label) => {
                            const date = new Date(label)
                            return `날짜: ${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
                          }}
                        />
                        <Legend />
                        {publisherRankingData.length > 0 && Object.keys(publisherRankingData[0])
                          .filter(key => key !== 'date')
                          .map((publisher, index) => {
                            const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
                            return (
                              <Bar
                                key={publisher}
                                dataKey={publisher}
                                fill={colors[index % colors.length]}
                                name={publisher.length > 15 ? publisher.substring(0, 15) + '...' : publisher}
                              />
                            )
                          })}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowPublisherRanking(false)
                    setPublisherRankingData([])
                  }}
                >
                  닫기
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 출판사 분석 개요 */}
        {viewMode === 'date-specific' && selectedDateForStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 날짜 개요 */}
            {dateStatsData.overview && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    일별 개요 ({selectedDateForStats.toLocaleDateString('ko-KR')})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingPeriod ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{dateStatsData.overview.totalBooks}</div>
                        <div className="text-xs text-slate-600">총 도서 수</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{dateStatsData.overview.publisherCount}</div>
                        <div className="text-xs text-slate-600">출판사 수</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{formatSalesPoint(dateStatsData.overview.totalSalesPoints)}</div>
                        <div className="text-xs text-slate-600">총 판매지수</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{dateStatsData.overview.averageRank}</div>
                        <div className="text-xs text-slate-600">평균 순위</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 최고 판매 도서 */}
            {dateStatsData.overview && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">최고 판매지수 도서</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingPeriod ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <div className="font-medium text-slate-800 mb-2">{dateStatsData.overview.topBook.title}</div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-slate-600">순위: {dateStatsData.overview.topBook.rank}위</div>
                          <div className="text-lg font-bold text-blue-600">
                            {formatSalesPoint(dateStatsData.overview.topBook.salesPoint)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 출판사별 상세 통계 테이블 */}
        {viewMode === 'date-specific' && dateStatsData.publishers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                출판사별 상세 통계 ({selectedDateForStats?.toLocaleDateString('ko-KR')})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPeriod ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-2 font-medium">순위</th>
                        <th className="text-left py-3 px-2 font-medium">출판사</th>
                        <th className="text-right py-3 px-2 font-medium">총 판매지수</th>
                        <th className="text-right py-3 px-2 font-medium">도서 수</th>
                        <th className="text-right py-3 px-2 font-medium">평균 가격</th>
                        <th className="text-right py-3 px-2 font-medium">평균 순위</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dateStatsData.publishers.slice(0, 20).map((publisher, index) => (
                        <tr key={publisher.name} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 px-2">
                            <Badge 
                              variant={index < 3 ? 'default' : index < 10 ? 'secondary' : 'outline'}
                              className="w-8 h-6 justify-center text-xs"
                            >
                              {index + 1}
                            </Badge>
                          </td>
                          <td className="py-2 px-2 font-medium">{publisher.name}</td>
                          <td className="py-2 px-2 text-right text-sm font-mono text-blue-600">
                            {formatSalesPoint(publisher.totalSalesPoints)}
                          </td>
                          <td className="py-2 px-2 text-right">{publisher.bookCount}권</td>
                          <td className="py-2 px-2 text-right text-sm font-mono">{formatPrice(publisher.averagePrice)}</td>
                          <td className="py-2 px-2 text-right">{publisher.averageRank}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
          </div>
        </div>
      </div>
    </div>
  )
}