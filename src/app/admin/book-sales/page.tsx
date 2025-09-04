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
  getTopBooksBySales,
  loadDataForPeriod,
  getPeriodOverview,
  getPublisherStatsForPeriod,
  loadChartDataForBooks
} from '@/lib/book-sales'
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
  
  // 기간별 조회 관련 state
  const [viewMode, setViewMode] = useState<'daily' | 'period'>('daily')
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>(30)
  const [periodOverview, setPeriodOverview] = useState<PeriodOverview | null>(null)
  const [periodPublishers, setPeriodPublishers] = useState<any[]>([])
  const [loadingPeriod, setLoadingPeriod] = useState(false)

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
      // 날짜 변경 시 그래프 숨기기
      setShowChart(false)
      setSelectedBooks([])
    }
  }

  const handleBookSelection = (bookId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedBooks(prev => [...prev, bookId])
    } else {
      setSelectedBooks(prev => prev.filter(id => id !== bookId))
    }
  }

  const loadPeriodData = async (period: PeriodType) => {
    setLoadingPeriod(true)
    try {
      const periodData = await loadDataForPeriod(period)
      const overview = getPeriodOverview(periodData)
      const publisherStats = getPublisherStatsForPeriod(periodData)
      
      setPeriodOverview(overview)
      setPeriodPublishers(publisherStats)
      
      // 기간별 조회 시에는 책 목록을 숨김
      setFilteredBooks([])
      setPublishers([])
    } catch (error) {
      console.error('Failed to load period data:', error)
    } finally {
      setLoadingPeriod(false)
    }
  }

  const handleViewModeChange = (mode: 'daily' | 'period') => {
    setViewMode(mode)
    setShowChart(false)
    setSelectedBooks([])
    
    if (mode === 'period') {
      loadPeriodData(selectedPeriod)
    } else {
      // 일별 조회 모드로 돌아갈 때는 기존 날짜 데이터 다시 로드
      if (selectedFilename) {
        loadDataForDate(selectedFilename)
      }
    }
  }

  const handlePeriodChange = (period: PeriodType) => {
    setSelectedPeriod(period)
    if (viewMode === 'period') {
      loadPeriodData(period)
    }
  }

  const generateChart = async () => {
    if (selectedBooks.length === 0) {
      alert('그래프를 보려면 최소 1개의 도서를 선택해주세요.')
      return
    }

    setLoadingChart(true)
    try {
      // 선택된 도서 제목 수집
      const selectedBookTitles: string[] = []
      for (const bookId of selectedBooks) {
        const currentBook = filteredBooks.find(b => b.bookId === bookId)
        if (currentBook) {
          selectedBookTitles.push(currentBook.title)
        }
      }
      
      // 최적화된 차트 데이터 로딩 사용
      const chartData = await loadChartDataForBooks(
        selectedBookTitles,
        chartPeriod,
        availableFiles
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
            <div className="flex gap-4 mb-4">
              <Button 
                variant={viewMode === 'daily' ? 'default' : 'outline'}
                onClick={() => handleViewModeChange('daily')}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                일별 조회
              </Button>
              <Button 
                variant={viewMode === 'period' ? 'default' : 'outline'}
                onClick={() => handleViewModeChange('period')}
                className="flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                기간별 통계
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

            {/* 기간별 조회 모드 */}
            {viewMode === 'period' && (
              <Select value={selectedPeriod.toString()} onValueChange={(value) => handlePeriodChange(Number(value) as PeriodType)}>
                <SelectTrigger>
                  <SelectValue placeholder="기간을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">최근 30일</SelectItem>
                  <SelectItem value="60">최근 60일</SelectItem>
                  <SelectItem value="90">최근 90일</SelectItem>
                  <SelectItem value="120">최근 120일</SelectItem>
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* 일별 데이터 개요 */}
        {viewMode === 'daily' && overview && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">일별 데이터 개요</CardTitle>
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

        {/* 기간별 데이터 개요 */}
        {viewMode === 'period' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 기간 개요 */}
            {periodOverview && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">기간 개요 (최근 {selectedPeriod}일)</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingPeriod ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{periodOverview.totalDays}</div>
                        <div className="text-xs text-slate-600">데이터 보유일</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{periodOverview.publisherCount}</div>
                        <div className="text-xs text-slate-600">총 출판사 수</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{formatSalesPoint(periodOverview.totalSalesPoints)}</div>
                        <div className="text-xs text-slate-600">총 판매점수</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{formatSalesPoint(periodOverview.averageDailySales)}</div>
                        <div className="text-xs text-slate-600">일평균 판매점수</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 상위 출판사 */}
            {periodOverview && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">판매점수 상위 10개 출판사</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingPeriod ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {periodOverview.topPublishers.map((publisher, index) => (
                        <div key={publisher.publisher} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant={index < 3 ? 'default' : 'secondary'} className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                              {index + 1}
                            </Badge>
                            <span className="font-medium text-sm">{publisher.publisher}</span>
                          </div>
                          <span className="font-mono text-sm text-blue-600">{formatSalesPoint(publisher.salesPoints)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 검색 및 필터 - 일별 조회 모드에서만 표시 */}
        {viewMode === 'daily' && (
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
        )}

        {/* 그래프 보기 섹션 - 일별 조회 모드에서만 표시 */}
        {viewMode === 'daily' && selectedBooks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                선택된 도서 ({selectedBooks.length}권)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-slate-600">
                  {selectedBooks.length}권의 도서가 선택되었습니다. 판매지수 추이를 확인해보세요.
                </div>
                
                {/* 차트 기간 선택 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">차트 기간:</span>
                  <Select value={chartPeriod.toString()} onValueChange={(value) => setChartPeriod(parseInt(value) as 30 | 60 | 120 | 180)}>
                    <SelectTrigger className="w-[120px]">
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
                
                <div className="flex justify-end">
                  <Button 
                    onClick={generateChart}
                    disabled={loadingChart || selectedBooks.length === 0}
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
                        그래프 보기 ({chartPeriod}일)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 차트 표시 섹션 */}
        {showChart && chartData.length > 0 && (
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

        {/* 도서 목록 테이블 - 일별 조회 모드에서만 표시 */}
        {viewMode === 'daily' && (
          <DataTable
            title="도서 판매 현황"
            data={filteredBooks}
            columns={columns}
            loading={loading}
            searchPlaceholder="도서명, 저자, 출판사 검색..."
            emptyMessage="검색 결과가 없습니다"
          />
        )}

        {/* 기간별 출판사 통계 테이블 */}
        {viewMode === 'period' && periodPublishers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">출판사별 상세 통계 (최근 {selectedPeriod}일)</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPeriod ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium">순위</th>
                        <th className="text-left py-3 px-2 font-medium">출판사</th>
                        <th className="text-right py-3 px-2 font-medium">총 판매점수</th>
                        <th className="text-right py-3 px-2 font-medium">도서 수</th>
                        <th className="text-right py-3 px-2 font-medium">평균 가격</th>
                        <th className="text-right py-3 px-2 font-medium">평균 순위</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periodPublishers.slice(0, 20).map((publisher, index) => (
                        <tr key={publisher.name} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-2">
                            <Badge 
                              variant={index < 3 ? 'default' : index < 10 ? 'secondary' : 'outline'}
                              className="w-8 h-6 justify-center text-xs"
                            >
                              {index + 1}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 font-medium">{publisher.name}</td>
                          <td className="py-3 px-2 text-right font-mono text-blue-600">
                            {formatSalesPoint(publisher.totalSalesPoints)}
                          </td>
                          <td className="py-3 px-2 text-right">{publisher.bookCount}권</td>
                          <td className="py-3 px-2 text-right">{formatPrice(publisher.averagePrice)}</td>
                          <td className="py-3 px-2 text-right">{publisher.averageRank}</td>
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