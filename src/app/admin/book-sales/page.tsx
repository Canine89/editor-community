'use client'

import { useState, useEffect } from 'react'
import { useAdmin } from '@/hooks/useAdmin'
import AdminLayout from '@/components/admin/AdminLayout'
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
  const { isEmployee, logActivity } = useAdmin()
  const [selectedDate, setSelectedDate] = useState('')
  const [bookData, setBookData] = useState<BookSalesData>({})
  const [overview, setOverview] = useState<DailySalesOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredBooks, setFilteredBooks] = useState<any[]>([])
  const [availableFiles, setAvailableFiles] = useState<BookSalesFileInfo[]>([])
  const [selectedPublisher, setSelectedPublisher] = useState('all')
  const [publishers, setPublishers] = useState<string[]>([])

  useEffect(() => {
    if (isEmployee) {
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
  }, [isEmployee])

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
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR') + '원'
  }

  const formatSalesPoint = (point: number) => {
    return point.toLocaleString('ko-KR')
  }

  const columns = [
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

  if (!isEmployee) {
    return (
      <AdminLayout title="접근 거부" description="이 페이지에 접근할 권한이 없습니다">
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
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="도서 판매 데이터" description="골든래빗 출간 도서 판매 통계 및 분석">
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

        {/* 베스트셀러 현황 */}
        {overview?.topBook && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                이 날의 베스트셀러
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-slate-900">{overview.topBook.title}</h3>
                  <p className="text-sm text-slate-600">순위: {overview.topBook.rank}위</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">
                    {formatSalesPoint(overview.topBook.salesPoint)}
                  </div>
                  <div className="text-xs text-slate-600">판매점수</div>
                </div>
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
    </AdminLayout>
  )
}