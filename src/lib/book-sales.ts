// Book sales data utilities

import { createClient } from '@/lib/supabase'
import { BookSalesData, BookSalesFileInfo, BookTrend, PublisherStats, CategoryStats, DailySalesOverview } from '@/types/book-sales'
import {
  isDummyMode,
  loadDummyBookSalesData,
  getDummyBookSalesFiles,
  generateDummyBookData
} from '@/lib/dummy-book-data'

const isProductionMode = () => !isDummyMode()

// 개발 모드용 가짜 차트 데이터 생성 함수 - fake_isbn 기반
const generateDummyChartDataForBooks = (
  selectedBooks: { title: string; fakeIsbn: string }[],
  daysBefore: number,
  progressCallback?: (progress: number, status: string) => void
): any[] => {
  const data = []
  const today = new Date()

  // 진행률 시뮬레이션
  progressCallback?.(10, '가짜 데이터 생성 준비 중...')
  setTimeout(() => progressCallback?.(30, '가짜 차트 데이터 생성 중...'), 100)

  for (let i = daysBefore - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dateString = date.toISOString().split('T')[0]

    const entry: any = { date: dateString }

    selectedBooks.forEach((book, index) => {
      // fake_isbn이 유효한지 확인
      if (!book.fakeIsbn || !book.title) {
        console.warn(`⚠️ Invalid book data:`, book)
        return
      }

      const fakeIsbn = book.fakeIsbn
      const baseValue = 500 + (index * 100) // 각 도서별 기본 판매지수
      const variation = Math.random() * 200 - 100 // -100 ~ +100 범위의 변동
      const salesPoint = Math.max(50, Math.round(baseValue + variation))

      // fake_isbn을 키로 사용
      entry[fakeIsbn] = salesPoint
      entry[`${fakeIsbn}_rank`] = Math.floor(Math.random() * 100) + 1 // 1~100위 랜덤

    })

    data.push(entry)
  }

  setTimeout(() => {
    progressCallback?.(100, `가짜 데이터 생성 완료! ${data.length}개 데이터 포인트`)
  }, 200)

  return data
}

// Get list of available data files from Supabase Storage
export const getBookSalesFiles = async (): Promise<BookSalesFileInfo[]> => {
  // 더미 모드인 경우 더미 데이터 반환
  if (isDummyMode()) {
    return getDummyBookSalesFiles()
  }
  
  try {
    const supabase = createClient()
    
    // List all files in the book-sales-data bucket
    const { data: files, error } = await supabase.storage
      .from('book-sales-data')
      .list('', {
        limit: 500,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) {
      console.error('Error fetching files from Supabase Storage:', error)
      return []
    }

    // Filter and parse JSON files with yes24_ pattern
    const bookSalesFiles: BookSalesFileInfo[] = []
    
    for (const file of files || []) {
      if (file.name.startsWith('yes24_') && file.name.endsWith('.json')) {
        try {
          // Parse filename: yes24_2025_MMDD.json
          const nameWithoutExt = file.name.replace('.json', '')
          const parts = nameWithoutExt.split('_') // ['yes24', '2025', 'MMDD']
          
          if (parts.length === 3) {
            const year = parts[1]
            const monthDay = parts[2]
            
            if (monthDay.length === 4) {
              const month = monthDay.substring(0, 2)
              const day = monthDay.substring(2, 4)
              const date = `${year}-${month}-${day}`
              
              bookSalesFiles.push({
                date,
                filename: file.name,
                displayDate: `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`
              })
            }
          }
        } catch (parseError) {
          console.warn(`Failed to parse filename: ${file.name}`, parseError)
        }
      }
    }
    
    // Sort by date
    return bookSalesFiles.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  } catch (error) {
    console.error('Error in getBookSalesFiles:', error)
    return []
  }
}

// Load book sales data for a specific date from Supabase Storage
export const loadBookSalesData = async (filename: string): Promise<BookSalesData> => {
  // 더미 모드인 경우 더미 데이터 반환
  if (isDummyMode()) {
    return loadDummyBookSalesData(filename)
  }
  
  try {
    const supabase = createClient()
    
    // Download file from Supabase Storage
    const { data, error } = await supabase.storage
      .from('book-sales-data')
      .download(filename)

    if (error) {
      console.error(`Error downloading ${filename}:`, error)
      return {}
    }

    // Convert blob to text and parse JSON
    const text = await data.text()
    const jsonData = JSON.parse(text)
    return jsonData
  } catch (error) {
    console.error(`Error loading book sales data:`, error)
    return {}
  }
}

// Load multiple files and combine data
export const loadMultipleBookSalesData = async (filenames: string[]): Promise<{[date: string]: BookSalesData}> => {
  const results: {[date: string]: BookSalesData} = {}
  
  // 더미 모드인 경우 더미 데이터 반환
  if (isDummyMode()) {
    for (const filename of filenames) {
      const nameWithoutExt = filename.replace('yes24_', '').replace('.json', '')
      const parts = nameWithoutExt.split('_')
      
      if (parts.length === 2) {
        const year = parts[0]
        const monthDay = parts[1]
        
        if (monthDay.length === 4) {
          const month = monthDay.substring(0, 2)
          const day = monthDay.substring(2, 4)
          const date = `${year}-${month}-${day}`
          
          results[date] = generateDummyBookData(100)
        }
      }
    }
    
    return results
  }
  
  for (const filename of filenames) {
    // yes24_2025_MMDD.json → 2025-MM-DD
    const nameWithoutExt = filename.replace('yes24_', '').replace('.json', '')
    const parts = nameWithoutExt.split('_') // ['2025', 'MMDD']
    
    if (parts.length === 2) {
      const year = parts[0]
      const monthDay = parts[1]
      
      if (monthDay.length === 4) {
        const month = monthDay.substring(0, 2)
        const day = monthDay.substring(2, 4)
        const formattedDate = `${year}-${month}-${day}`
        
        results[formattedDate] = await loadBookSalesData(filename)
      }
    }
  }
  
  return results
}

// Analyze book trends across multiple dates
export const analyzeBookTrends = (multiData: {[date: string]: BookSalesData}): BookTrend[] => {
  const bookTrends: {[isbn: string]: BookTrend} = {}
  
  Object.entries(multiData).forEach(([date, data]) => {
    Object.entries(data).forEach(([bookId, bookInfo]) => {
      const isbn = bookInfo.fake_isbn.toString()
      
      if (!bookTrends[isbn]) {
        bookTrends[isbn] = {
          bookId: bookId,
          title: bookInfo.title,
          dates: [],
          ranks: [],
          salesPoints: [],
          priceChanges: []
        }
      }
      
      bookTrends[isbn].dates.push(date)
      bookTrends[isbn].ranks.push(bookInfo.rank)
      bookTrends[isbn].salesPoints.push(bookInfo.sales_point)
      bookTrends[isbn].priceChanges.push(bookInfo.right_price)
    })
  })
  
  return Object.values(bookTrends).filter(trend => trend.dates.length > 1)
}

// Get publisher statistics
export const getPublisherStats = (data: BookSalesData): PublisherStats[] => {
  const publisherMap: {[key: string]: {books: any[], totalSales: number, totalRanks: number, totalPrices: number}} = {}
  
  Object.values(data).forEach(book => {
    if (!publisherMap[book.publisher]) {
      publisherMap[book.publisher] = {
        books: [],
        totalSales: 0,
        totalRanks: 0,
        totalPrices: 0
      }
    }
    
    publisherMap[book.publisher].books.push(book)
    publisherMap[book.publisher].totalSales += book.sales_point
    publisherMap[book.publisher].totalRanks += book.rank
    publisherMap[book.publisher].totalPrices += book.right_price
  })
  
  return Object.entries(publisherMap).map(([publisher, stats]) => ({
    name: publisher,
    bookCount: stats.books.length,
    totalSalesPoints: stats.totalSales,
    averageRank: Math.round(stats.totalRanks / stats.books.length),
    averagePrice: Math.round(stats.totalPrices / stats.books.length)
  })).sort((a, b) => b.totalSalesPoints - a.totalSalesPoints)
}

// Get category statistics
export const getCategoryStats = (data: BookSalesData): CategoryStats[] => {
  const categoryMap: {[key: string]: {books: any[], totalSales: number}} = {}
  
  Object.values(data).forEach(book => {
    // Use first tag as primary category
    const category = book.tags[0] || 'Unknown'
    
    if (!categoryMap[category]) {
      categoryMap[category] = {
        books: [],
        totalSales: 0
      }
    }
    
    categoryMap[category].books.push(book)
    categoryMap[category].totalSales += book.sales_point
  })
  
  return Object.entries(categoryMap).map(([category, stats]) => ({
    category,
    bookCount: stats.books.length,
    totalSalesPoints: stats.totalSales,
    topBooks: stats.books
      .sort((a, b) => b.sales_point - a.sales_point)
      .slice(0, 3)
      .map(book => ({title: book.title, salesPoint: book.sales_point}))
  })).sort((a, b) => b.totalSalesPoints - a.totalSalesPoints)
}

// Get daily sales overview
export const getDailySalesOverview = (data: BookSalesData, date: string): DailySalesOverview => {
  const books = Object.values(data)
  const totalSalesPoints = books.reduce((sum, book) => sum + book.sales_point, 0)
  const averageRank = books.reduce((sum, book) => sum + book.rank, 0) / books.length
  const topBook = books.reduce((top, book) => book.sales_point > top.sales_point ? book : top, books[0])
  const publishers = new Set(books.map(book => book.publisher))
  
  return {
    date,
    totalBooks: books.length,
    totalSalesPoints,
    averageRank: Math.round(averageRank),
    topBook: {
      title: topBook.title,
      rank: topBook.rank,
      salesPoint: topBook.sales_point,
      publisher: topBook.publisher
    },
    publisherCount: publishers.size
  }
}

// Search books by title, author, or publisher
export const searchBooks = (data: BookSalesData, searchTerm: string) => {
  const term = searchTerm.toLowerCase()
  
  return Object.entries(data).filter(([_, book]) => 
    book.title.toLowerCase().includes(term) ||
    book.author.some(author => author.toLowerCase().includes(term)) ||
    book.publisher.toLowerCase().includes(term)
  ).map(([bookId, book]) => ({ bookId, ...book }))
}

// Filter books by price range
export const filterBooksByPriceRange = (data: BookSalesData, minPrice: number, maxPrice: number) => {
  return Object.entries(data).filter(([_, book]) => 
    book.right_price >= minPrice && book.right_price <= maxPrice
  ).map(([bookId, book]) => ({ bookId, ...book }))
}

// Get top books by sales point
export const getTopBooksBySales = (data: BookSalesData, limit: number = 10) => {
  return Object.entries(data)
    .map(([bookId, book]) => ({ bookId, ...book }))
    .sort((a, b) => b.sales_point - a.sales_point)
    .slice(0, limit)
}

// Get books by rank range
export const getBooksByRankRange = (data: BookSalesData, minRank: number, maxRank: number) => {
  return Object.entries(data)
    .filter(([_, book]) => book.rank >= minRank && book.rank <= maxRank)
    .map(([bookId, book]) => ({ bookId, ...book }))
    .sort((a, b) => a.rank - b.rank)
}

// Get files within date range (days before today)
export const getFilesInDateRange = async (daysBefore: number): Promise<BookSalesFileInfo[]> => {
  try {
    const allFiles = await getBookSalesFiles()
    const today = new Date()
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() - daysBefore)
    
    return allFiles.filter(file => {
      const fileDate = new Date(file.date)
      return fileDate >= targetDate && fileDate <= today
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // 최신 순 정렬
  } catch (error) {
    console.error('Error getting files in date range:', error)
    return []
  }
}

// Load data for specific period (30, 60, 90, 120 days)
export const loadDataForPeriod = async (daysBefore: number): Promise<{[date: string]: BookSalesData}> => {
  try {
    const filesInRange = await getFilesInDateRange(daysBefore)
    const filenames = filesInRange.map(f => f.filename)
    
    return await loadMultipleBookSalesData(filenames)
  } catch (error) {
    console.error(`Error loading data for ${daysBefore} days:`, error)
    return {}
  }
}

// Calculate period overview statistics
export const getPeriodOverview = (periodData: {[date: string]: BookSalesData}) => {
  let totalSalesPoints = 0
  const publisherSalesMap: {[publisher: string]: number} = {}
  let totalDays = 0
  
  Object.values(periodData).forEach(dailyData => {
    if (Object.keys(dailyData).length > 0) {
      totalDays++
      Object.values(dailyData).forEach(book => {
        totalSalesPoints += book.sales_point
        publisherSalesMap[book.publisher] = (publisherSalesMap[book.publisher] || 0) + book.sales_point
      })
    }
  })
  
  // Top 10 publishers by sales points
  const topPublishers = Object.entries(publisherSalesMap)
    .map(([publisher, salesPoints]) => ({ publisher, salesPoints }))
    .sort((a, b) => b.salesPoints - a.salesPoints)
    .slice(0, 10)
  
  return {
    totalDays,
    totalSalesPoints,
    topPublishers,
    averageDailySales: totalDays > 0 ? Math.round(totalSalesPoints / totalDays) : 0,
    publisherCount: Object.keys(publisherSalesMap).length
  }
}

// Get aggregated publisher stats for period
export const getPublisherStatsForPeriod = (periodData: {[date: string]: BookSalesData}) => {
  const publisherMap: {[key: string]: {
    totalSales: number, 
    bookCount: number, 
    totalPrices: number,
    totalRanks: number,
    books: Set<string> // 중복 제거를 위한 Set
  }} = {}
  
  Object.values(periodData).forEach(dailyData => {
    Object.values(dailyData).forEach(book => {
      if (!publisherMap[book.publisher]) {
        publisherMap[book.publisher] = {
          totalSales: 0,
          bookCount: 0,
          totalPrices: 0,
          totalRanks: 0,
          books: new Set()
        }
      }
      
      publisherMap[book.publisher].totalSales += book.sales_point
      publisherMap[book.publisher].totalPrices += book.right_price
      publisherMap[book.publisher].totalRanks += book.rank
      publisherMap[book.publisher].books.add(book.title) // 도서명으로 중복 제거
    })
  })
  
  return Object.entries(publisherMap).map(([publisher, stats]) => ({
    name: publisher,
    bookCount: stats.books.size, // 실제 유니크 도서 수
    totalSalesPoints: stats.totalSales,
    averagePrice: stats.books.size > 0 ? Math.round(stats.totalPrices / stats.books.size) : 0,
    averageRank: stats.books.size > 0 ? Math.round(stats.totalRanks / stats.books.size) : 0
  })).sort((a, b) => b.totalSalesPoints - a.totalSalesPoints)
}

// Enhanced multi-tier caching system
const fileCache = new Map<string, BookSalesData>()
const chartDataCache = new Map<string, any[]>()
const aggregatedDataCache = new Map<string, any>()

const CACHE_SIZE_LIMIT = 200 // Increased memory cache limit
const CHART_CACHE_SIZE_LIMIT = 50 // Chart-specific cache
const AGGREGATED_CACHE_SIZE_LIMIT = 100 // Aggregated data cache

// LocalStorage persistent cache with versioning
const STORAGE_KEY_PREFIX = 'book_sales_cache_'
const CHART_STORAGE_KEY_PREFIX = 'chart_data_cache_'
const STORAGE_VERSION = 'v2' // Version bump for new cache structure
const MAX_STORAGE_AGE = 48 * 60 * 60 * 1000 // Extended to 48 hours

interface CacheEntry {
  data: BookSalesData
  timestamp: number
  version: string
}

interface ChartDataCacheEntry {
  data: any[]
  timestamp: number
  version: string
  bookTitles: string[]
  daysBefore: number
}

// LocalStorage cache utilities
const getFromStorage = (filename: string): BookSalesData | undefined => {
  try {
    const key = STORAGE_KEY_PREFIX + filename
    const stored = localStorage.getItem(key)
    if (!stored) return undefined

    const entry: CacheEntry = JSON.parse(stored)
    
    // Check version and age
    if (entry.version !== STORAGE_VERSION || 
        Date.now() - entry.timestamp > MAX_STORAGE_AGE) {
      localStorage.removeItem(key)
      return undefined
    }

    return entry.data
  } catch (error) {
    console.warn(`Cache read error for ${filename}:`, error)
    return undefined
  }
}

const saveToStorage = (filename: string, data: BookSalesData): void => {
  try {
    const key = STORAGE_KEY_PREFIX + filename
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      version: STORAGE_VERSION
    }
    
    localStorage.setItem(key, JSON.stringify(entry))
  } catch (error) {
    // Storage full or other error - silently fail
    console.warn(`Cache write error for ${filename}:`, error)
    // Try to clear some old entries
    clearOldCacheEntries()
  }
}

const clearOldCacheEntries = (): void => {
  try {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith(STORAGE_KEY_PREFIX) || key.startsWith(CHART_STORAGE_KEY_PREFIX))
    const now = Date.now()
    
    keys.forEach(key => {
      try {
        const stored = localStorage.getItem(key)
        if (stored) {
          const entry: CacheEntry | ChartDataCacheEntry = JSON.parse(stored)
          if (now - entry.timestamp > MAX_STORAGE_AGE || entry.version !== STORAGE_VERSION) {
            localStorage.removeItem(key)
          }
        }
      } catch {
        localStorage.removeItem(key) // Remove corrupted entries
      }
    })
  } catch (error) {
    console.warn('Error clearing old cache entries:', error)
  }
}

// Chart data cache utilities
const getChartDataFromCache = (bookTitles: string[], daysBefore: number): any[] | undefined => {
  try {
    // Create a cache key based on sorted book titles and period
    const sortedTitles = [...bookTitles].sort()
    const cacheKey = `${sortedTitles.join('|')}:${daysBefore}`
    
    // Check memory cache first
    const memoryData = chartDataCache.get(cacheKey)
    if (memoryData) {
      return memoryData
    }
    
    // Check localStorage cache
    const storageKey = CHART_STORAGE_KEY_PREFIX + cacheKey
    const stored = localStorage.getItem(storageKey)
    if (!stored) return undefined

    const entry: ChartDataCacheEntry = JSON.parse(stored)
    
    // Check version and age
    if (entry.version !== STORAGE_VERSION || 
        Date.now() - entry.timestamp > MAX_STORAGE_AGE) {
      localStorage.removeItem(storageKey)
      return undefined
    }
    
    // Verify cache validity by checking if parameters match
    if (entry.daysBefore !== daysBefore || 
        entry.bookTitles.length !== bookTitles.length ||
        !entry.bookTitles.every(title => bookTitles.includes(title))) {
      return undefined
    }

    // Add to memory cache
    if (chartDataCache.size >= CHART_CACHE_SIZE_LIMIT) {
      const firstKey = chartDataCache.keys().next().value
      if (firstKey) {
        chartDataCache.delete(firstKey)
      }
    }
    chartDataCache.set(cacheKey, entry.data)

    return entry.data
  } catch (error) {
    console.warn('Chart cache read error:', error)
    return undefined
  }
}

const saveChartDataToCache = (bookTitles: string[], daysBefore: number, data: any[]): void => {
  try {
    const sortedTitles = [...bookTitles].sort()
    const cacheKey = `${sortedTitles.join('|')}:${daysBefore}`
    
    // Save to memory cache
    if (chartDataCache.size >= CHART_CACHE_SIZE_LIMIT) {
      const firstKey = chartDataCache.keys().next().value
      if (firstKey) {
        chartDataCache.delete(firstKey)
      }
    }
    chartDataCache.set(cacheKey, data)
    
    // Save to localStorage cache
    const storageKey = CHART_STORAGE_KEY_PREFIX + cacheKey
    const entry: ChartDataCacheEntry = {
      data,
      timestamp: Date.now(),
      version: STORAGE_VERSION,
      bookTitles: sortedTitles,
      daysBefore
    }
    
    localStorage.setItem(storageKey, JSON.stringify(entry))
  } catch (error) {
    console.warn('Chart cache write error:', error)
    clearOldCacheEntries()
  }
}

// Smart sampling algorithm for large date ranges
const getOptimalSampling = (totalFiles: number, daysBefore: number) => {
  // For periods > 90 days, use smart sampling to reduce load time
  if (daysBefore <= 60) return { sampleEvery: 1, maxPoints: totalFiles }
  if (daysBefore <= 120) return { sampleEvery: 2, maxPoints: 60 } 
  if (daysBefore <= 180) return { sampleEvery: 3, maxPoints: 60 }
  return { sampleEvery: 4, maxPoints: 45 } // Very long periods
}

// 개선된 북 타이틀 매칭 시스템
const createBookMatcher = (bookTitles: string[]) => {
  // 안전한 키 생성 함수
  const createSafeKey = (title: string) => {
    // 길이 제한 (최대 50자)
    let safeTitle = title.length > 50 ? title.substring(0, 50).trim() : title
    
    // 특수문자는 그대로 유지 (한글, 영문, 숫자, 공백, 일부 특수문자)
    safeTitle = safeTitle.replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣()[\].,!?:-]/g, '')
    
    return safeTitle.trim() || title.substring(0, 20) // 빈 문자열 방지
  }

  const matchers = bookTitles.map(title => {
    const safeKey = createSafeKey(title)
    return {
      originalTitle: title,
      safeKey: safeKey,
      searchKey: title.substring(0, 30) // 검색용 짧은 키
    }
  })
  
  return {
    // 매칭된 안전한 키 반환
    getSafeKey: (bookTitle: string) => {
      // 1. 정확한 매칭
      let matcher = matchers.find(m => m.originalTitle === bookTitle)
      if (matcher) return matcher.safeKey
      
      // 2. 부분 매칭 (앞 30자)
      const searchKey = bookTitle.substring(0, 30)
      matcher = matchers.find(m => 
        m.searchKey.includes(searchKey) || 
        searchKey.includes(m.searchKey)
      )
      if (matcher) return matcher.safeKey
      
      // 3. 포함 관계 매칭
      matcher = matchers.find(m => 
        bookTitle.includes(m.originalTitle) || 
        m.originalTitle.includes(bookTitle)
      )
      
      return matcher ? matcher.safeKey : null
    },
    
    // 디버깅을 위한 매칭 정보
    getMatchingInfo: () => {
      return matchers.map(m => ({
        original: m.originalTitle,
        safe: m.safeKey,
        search: m.searchKey
      }))
    }
  }
}

// Progress callback interface
interface ProgressCallback {
  (progress: number, status: string): void
}

// fake_isbn 기반으로 도서를 매칭하는 차트 데이터 로딩
export const loadChartDataForBooks = async (
  selectedBooks: { title: string; fakeIsbn: string }[],
  daysBefore: number,
  availableFiles: BookSalesFileInfo[],
  progressCallback?: ProgressCallback
): Promise<any[]> => {
  try {
    // 개발 모드에서는 항상 가짜 데이터를 우선적으로 사용
    if (isDummyMode()) {
      progressCallback?.(5, '개발 모드: 가짜 데이터 생성 중...')
      await new Promise(resolve => setTimeout(resolve, 500))

      const dummyData = generateDummyChartDataForBooks(selectedBooks, daysBefore, progressCallback)

      // 더미 데이터가 비어있으면 최소한의 데이터라도 생성
      if (dummyData.length === 0 && selectedBooks.length > 0) {
        const fallbackData = [{
          date: new Date().toISOString().split('T')[0],
          ...selectedBooks.reduce((acc, book, index) => {
            if (book.fakeIsbn && book.title) {
              acc[book.fakeIsbn] = 100 + (index * 50)
              acc[`${book.fakeIsbn}_rank`] = index + 1
            }
            return acc
          }, {} as any)
        }]
        return fallbackData
      }

      return dummyData
    }

    // 🚀 Enhanced caching: 이전 형식 캐시 무효화 후 새로 생성
    progressCallback?.(5, '이전 형식 캐시 삭제 및 신규 생성...')
    const fakeIsbns = selectedBooks.map(book => book.fakeIsbn)
    
    // 기존 캐시 모두 삭제 (형식 변경으로 인한 호환성 문제 해결)
    console.log('🗑️ 기존 차트 캐시 삭제 중... (fake_isbn 형식으로 변경됨)')
    chartDataCache.clear() // 메모리 캐시 삭제
    
    // localStorage 캐시도 삭제
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CHART_STORAGE_KEY_PREFIX)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('localStorage 캐시 삭제 실패:', error)
    }

    const today = new Date()
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() - daysBefore)

    // Filter and sort files by date
    let relevantFiles = availableFiles
      .filter(file => {
        const fileDate = new Date(file.date)
        return fileDate >= targetDate && fileDate <= today
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Apply smart sampling for large datasets
    const { sampleEvery, maxPoints } = getOptimalSampling(relevantFiles.length, daysBefore)
    if (sampleEvery > 1) {
      console.log(`📊 Smart sampling: ${relevantFiles.length} files → ${Math.ceil(relevantFiles.length / sampleEvery)} samples`)
      progressCallback?.(10, `스마트 샘플링: ${relevantFiles.length}개 파일 → ${Math.ceil(relevantFiles.length / sampleEvery)}개로 최적화`)
      relevantFiles = relevantFiles.filter((_, index) => index % sampleEvery === 0)
      relevantFiles = relevantFiles.slice(0, maxPoints) // Ensure we don't exceed maxPoints
    }

    console.log(`⚡ Loading optimized chart data: ${relevantFiles.length} files over ${daysBefore} days`)
    progressCallback?.(15, `${relevantFiles.length}개 파일 로딩 시작`)

    const chartDataMap: { [date: string]: any } = {}
    
    // fake_isbn을 키로 하는 도서 매핑 생성
    const isbnToBookMap = new Map<string, { title: string; fakeIsbn: string }>()
    selectedBooks.forEach(book => {
      isbnToBookMap.set(book.fakeIsbn, book)
    })
    
    console.log('📚 매칭 대상 도서 (fake_isbn 기반):', Array.from(isbnToBookMap.entries()))

    // 🚀 Enhanced parallel processing with intelligent batch sizing
    const optimalBatchSize = Math.min(30, Math.max(8, Math.ceil(relevantFiles.length / 4))) // Larger batches for better performance
    const concurrentBatches = Math.min(3, Math.ceil(relevantFiles.length / 20)) // Process multiple batches concurrently
    
    progressCallback?.(20, `고성능 병렬 처리 시작 (배치 크기: ${optimalBatchSize}, 동시 배치: ${concurrentBatches})`)

    // 🚀 Process files in optimally sized concurrent batches
    const allBatches: BookSalesFileInfo[][] = []
    for (let i = 0; i < relevantFiles.length; i += optimalBatchSize) {
      allBatches.push(relevantFiles.slice(i, i + optimalBatchSize))
    }

    // Process all batches with enhanced parallel processing
    let filesProcessed = 0
    for (const batch of allBatches) {
      const batchPromises = batch.map(async file => {
        try {
          // 3-tier caching system
          let data = fileCache.get(file.filename)
          
          if (!data) {
            data = getFromStorage(file.filename)
            
            if (!data) {
              data = await loadBookSalesData(file.filename)
              saveToStorage(file.filename, data)
            }
            
            // Memory cache management with LRU
            if (fileCache.size >= CACHE_SIZE_LIMIT) {
              const firstKey = fileCache.keys().next().value
              if (firstKey) fileCache.delete(firstKey)
            }
            fileCache.set(file.filename, data)
          }

          const chartEntry: any = { date: file.date }
          let matchedCount = 0

          // fake_isbn 기반 매칭 로직 - fake_isbn을 직접 키로 사용
          Object.values(data).forEach((book: any) => {
            const bookFakeIsbn = book.fake_isbn?.toString()
            if (bookFakeIsbn && isbnToBookMap.has(bookFakeIsbn)) {
              // fake_isbn을 직접 키로 사용 (제목이 아닌)
              chartEntry[bookFakeIsbn] = book.sales_point
              chartEntry[`${bookFakeIsbn}_rank`] = book.rank
              matchedCount++
            }
          })

          // 매칭 결과 로깅
          if (matchedCount > 0) {
            console.log(`📈 ${file.date}: ${matchedCount}권 매칭 완료`)
          } else {
            console.warn(`⚠️ ${file.date}: 매칭된 도서 없음`)
            console.log('📋 해당 날짜 도서 fake_isbn 목록:', 
              Object.values(data).slice(0, 5).map((book: any) => book.fake_isbn)
            )
          }

          return { date: file.date, entry: chartEntry }
        } catch (error) {
          console.warn(`⚠️ Failed to load ${file.filename}:`, error)
          return null
        }
      })

      const batchResults = await Promise.all(batchPromises)
      
      // Add successful results to chart data
      batchResults.forEach(result => {
        if (result) {
          chartDataMap[result.date] = result.entry
        }
      })

      // Enhanced progress tracking
      filesProcessed += batch.length
      const baseProgress = 20
      const batchProgress = Math.round((filesProcessed / relevantFiles.length) * 70)
      const totalProgress = baseProgress + batchProgress
      
      const cacheHitRate = Math.round((fileCache.size / Math.max(filesProcessed, 1)) * 100)
      progressCallback?.(totalProgress, `${filesProcessed}/${relevantFiles.length} 파일 처리 (캐시 적중률: ${cacheHitRate}%)`)
    }

    // Convert to sorted array
    progressCallback?.(95, '차트 데이터 정렬 및 최적화 중...')
    const sortedChartData = Object.values(chartDataMap).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // 🚀 Save to cache for future requests
    if (sortedChartData.length > 0) {
      saveChartDataToCache(fakeIsbns, daysBefore, sortedChartData)
    }

    progressCallback?.(100, `완료! ${sortedChartData.length}개 데이터 포인트 로딩`)
    return sortedChartData

  } catch (error) {
    console.error('❌ Error loading chart data:', error)
    return []
  }
}