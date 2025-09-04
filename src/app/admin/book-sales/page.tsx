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
import {
  BookOpen,
  TrendingUp,
  Users,
  Calendar,
  Search,
  Filter,
  Download,
  BarChart3
} from 'lucide-react'
import {
  LineChart,
  Line,
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
  getTopBooksBySales
} from '@/lib/book-sales'
import { BookSalesData, BookSalesFileInfo, DailySalesOverview } from '@/types/book-sales'

export default function BookSalesPage() {
  const { isEmployee, isMaster, isAdmin, logActivity } = useAdmin()
  const [selectedDate, setSelectedDate] = useState('')
  const [bookData, setBookData] = useState<BookSalesData>({})
  const [overview, setOverview] = useState<DailySalesOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredBooks, setFilteredBooks] = useState<any[]>([])
  const [availableFiles, setAvailableFiles] = useState<BookSalesFileInfo[]>([])
  const [selectedPublisher, setSelectedPublisher] = useState('all')
  const [publishers, setPublishers] = useState<string[]>([])
  const [selectedBooks, setSelectedBooks] = useState<string[]>([])
  const [showChart, setShowChart] = useState(false)
  const [chartData, setChartData] = useState<any[]>([])
  const [loadingChart, setLoadingChart] = useState(false)

  useEffect(() => {
    // 임시로 모든 관리자가 접근 가능하도록 설정
    if (isAdmin) {
      logActivity('view_book_sales_data')
      const files = getBookSalesFiles()
      setAvailableFiles(files)
      if (files.length > 0) {
        // 가장 최근 날짜를 기본으로 선택
        const latestFile = files[files.length - 1]
        setSelectedDate(latestFile.filename)
        loadDataForDate(latestFile.filename)
      }
    }
  }, [isAdmin])

  const loadDataForDate = async (filename: string) => {
    setLoading(true)
    try {
      const data = await loadBookSalesData(filename)
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
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    updateFilteredBooks(bookData, term, selectedPublisher)
  }

  const handlePublisherFilter = (publisher: string) => {
    setSelectedPublisher(publisher)
    updateFilteredBooks(bookData, searchTerm, publisher)
  }

  const handleDateChange = (filename: string) => {
    setSelectedDate(filename)
    loadDataForDate(filename)
    // 날짜 변경 시 그래프 숨기기
    setShowChart(false)
    setSelectedBooks([])
  }

  const handleBookSelection = (bookId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedBooks(prev => [...prev, bookId])
    } else {
      setSelectedBooks(prev => prev.filter(id => id !== bookId))
    }
  }

  const generateChart = async () => {
    if (selectedBooks.length === 0) {
      alert('그래프를 보려면 최소 1개의 도서를 선택해주세요.')
      return
    }

    setLoadingChart(true)
    try {
      // 오늘 날짜 기준 30일 전까지의 날짜 범위 계산
      const today = new Date()
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)

      // 모든 파일의 데이터를 로드
      const allFilenames = availableFiles.map(f => f.filename)
      const multiData = await loadMultipleBookSalesData(allFilenames)
      
      // 차트용 데이터 생성 - 날짜별로 모든 선택된 도서의 판매지수를 포함
      const dateMap: { [date: string]: any } = {}
      const selectedBookTitles: string[] = []
      
      // 선택된 도서 정보 수집
      for (const bookId of selectedBooks) {
        const currentBook = filteredBooks.find(b => b.bookId === bookId)
        if (!currentBook) continue
        selectedBookTitles.push(currentBook.title)
      }
      
      // 모든 날짜에 대해 선택된 도서들의 데이터 수집
      for (const [dateKey, data] of Object.entries(multiData)) {
        try {
          // yes24_2025_MMDD.json → 2025-MM-DD 형식으로 변환
          const dateStr = dateKey.replace('yes24_', '').replace('.json', '')
          const parts = dateStr.split('_') // ['2025', 'MMDD']
          
          if (parts.length !== 2) continue // 잘못된 형식 스킵
          
          const year = parts[0]
          const monthDay = parts[1]
          
          if (!monthDay || monthDay.length !== 4) continue // MMDD 형식이 아니면 스킵
          
          const month = monthDay.substring(0, 2)
          const day = monthDay.substring(2, 4)
          const formatDate = `${year}-${month}-${day}`
          
          // 날짜가 30일 범위 내에 있는지 확인
          const currentDate = new Date(formatDate)
          if (currentDate < thirtyDaysAgo || currentDate > today) continue
          
          const chartEntry: any = { date: formatDate }
          
          for (const bookId of selectedBooks) {
            const currentBook = filteredBooks.find(b => b.bookId === bookId)
            if (!currentBook) continue
            
            const bookInDate = Object.values(data).find((book: any) => 
              book.title === currentBook.title && book.publisher === currentBook.publisher
            )
            
            if (bookInDate) {
              // 도서 제목을 키로 사용 (최대 20자로 제한)
              const shortTitle = currentBook.title.length > 20 
                ? currentBook.title.substring(0, 20) + '...'
                : currentBook.title
              chartEntry[shortTitle] = (bookInDate as any).sales_point
            }
          }
          
          dateMap[formatDate] = chartEntry
        } catch (parseError) {
          console.warn(`날짜 파싱 실패: ${dateKey}`, parseError)
          continue // 파싱 실패한 파일은 스킵
        }
      }
      
      // 날짜순으로 정렬 (2025-08-01, 2025-08-04 형식)
      const sortedChartData = Object.values(dateMap).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      
      if (sortedChartData.length === 0) {
        alert('최근 30일 내 데이터가 없습니다.')
        return
      }
      
      setChartData(sortedChartData)
      setShowChart(true)
    } catch (error) {
      console.error('Failed to generate chart:', error)
      alert('그래프 생성 중 오류가 발생했습니다.')
    } finally {
      setLoadingChart(false)
    }
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR') + '원'
  }

  const formatSalesPoint = (point: number) => {
    return point.toLocaleString('ko-KR')
  }

  const columns = [
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
        <div>
          <p className="font-medium text-slate-900 line-clamp-2">{value}</p>
          <p className="text-xs text-slate-500 mt-1">{row.author.join(', ')}</p>
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
      label: '판매점수',
      sortable: true,
      render: (value: number) => (
        <div className="text-right">
          <span className="font-mono font-medium">{formatSalesPoint(value)}</span>
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
    }
  ]

  // 임시로 관리자 권한만 확인 (나중에 세부 권한 적용 예정)
  if (!isAdmin) {
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
                    이 페이지는 관리자만 접근할 수 있습니다.
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
        {/* 날짜 선택 및 통계 개요 */}
        <div className="flex flex-col lg:flex-row gap-4">
          <Card className="lg:w-1/3">
            <CardHeader>
              <CardTitle className="text-sm font-medium">데이터 기간 선택</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedDate} onValueChange={handleDateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="날짜를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {availableFiles.map((file) => (
                    <SelectItem key={file.filename} value={file.filename}>
                      {file.displayDate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {overview && (
            <Card className="lg:flex-1">
              <CardHeader>
                <CardTitle className="text-sm font-medium">데이터 개요</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{overview.totalBooks}</div>
                    <div className="text-xs text-slate-600">총 도서 수</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{overview.publisherCount}</div>
                    <div className="text-xs text-slate-600">출판사 수</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{formatSalesPoint(overview.totalSalesPoints)}</div>
                    <div className="text-xs text-slate-600">총 판매점수</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{overview.averageRank}</div>
                    <div className="text-xs text-slate-600">평균 순위</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 검색 및 필터 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">검색 및 필터</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
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
              <div className="w-48">
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

        {/* 그래프 보기 섹션 */}
        {selectedBooks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                선택된 도서 ({selectedBooks.length}권)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  {selectedBooks.length}권의 도서가 선택되었습니다. 판매지수 추이를 확인해보세요.
                </div>
                <Button 
                  onClick={generateChart}
                  disabled={loadingChart}
                  className="flex items-center gap-2"
                >
                  {loadingChart ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      처리중...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4" />
                      그래프 보기
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 차트 표시 섹션 */}
        {showChart && chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                판매지수 추이 비교
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
                      const currentBook = filteredBooks.find(b => b.bookId === bookId)
                      if (!currentBook) return null
                      
                      const shortTitle = currentBook.title.length > 20 
                        ? currentBook.title.substring(0, 20) + '...'
                        : currentBook.title
                      
                      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
                      
                      return (
                        <Line
                          key={bookId}
                          type="monotone"
                          dataKey={shortTitle}
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
              <div className="mt-4 pt-4 border-t flex justify-end">
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
            </CardContent>
          </Card>
        )}

        {/* 도서 목록 테이블 */}
        <DataTable
          title="도서 판매 현황"
          data={filteredBooks}
          columns={columns}
          loading={loading}
          searchPlaceholder="도서명, 저자, 출판사 검색..."
          emptyMessage="검색 결과가 없습니다"
        />
          </div>
        </div>
      </div>
    </div>
  )
}