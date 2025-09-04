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

// 개발 모드용 가짜 차트 데이터 생성 함수
const generateDummyChartDataForBooks = (
  bookTitles: string[],
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

    bookTitles.forEach((title, index) => {
      // 제목이 유효한지 확인
      if (!title || typeof title !== 'string' || title.trim() === '') {
        console.warn(`⚠️ Invalid book title: ${title}, skipping...`)
        return
      }

      const cleanTitle = title.trim()
      const baseValue = 500 + (index * 100) // 각 도서별 기본 판매지수
      const variation = Math.random() * 200 - 100 // -100 ~ +100 범위의 변동
      const salesPoint = Math.max(50, Math.round(baseValue + variation))

      entry[cleanTitle] = salesPoint
      entry[`${cleanTitle}_rank`] = Math.floor(Math.random() * 100) + 1 // 1~100위 랜덤

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

// Memory cache for loaded files (session-based)
const fileCache = new Map<string, BookSalesData>()
const CACHE_SIZE_LIMIT = 100 // Limit memory usage

// LocalStorage persistent cache with compression
const STORAGE_KEY_PREFIX = 'book_sales_cache_'
const STORAGE_VERSION = 'v1'
const MAX_STORAGE_AGE = 24 * 60 * 60 * 1000 // 24 hours

interface CacheEntry {
  data: BookSalesData
  timestamp: number
  version: string
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
    const keys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_KEY_PREFIX))
    const now = Date.now()
    
    keys.forEach(key => {
      try {
        const stored = localStorage.getItem(key)
        if (stored) {
          const entry: CacheEntry = JSON.parse(stored)
          if (now - entry.timestamp > MAX_STORAGE_AGE) {
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

// Smart sampling algorithm for large date ranges
const getOptimalSampling = (totalFiles: number, daysBefore: number) => {
  // For periods > 90 days, use smart sampling to reduce load time
  if (daysBefore <= 60) return { sampleEvery: 1, maxPoints: totalFiles }
  if (daysBefore <= 120) return { sampleEvery: 2, maxPoints: 60 } 
  if (daysBefore <= 180) return { sampleEvery: 3, maxPoints: 60 }
  return { sampleEvery: 4, maxPoints: 45 } // Very long periods
}

// Enhanced book title matching with pre-compiled regex
const createBookMatcher = (bookTitles: string[]) => {
  const matchers = bookTitles.map(title => ({
    exact: title,
    shortTitle: title.length > 20 ? title.substring(0, 20) + '...' : title,
    // Pre-compile regex for faster matching
    regex: new RegExp(title.split('').map(char => 
      /[.*+?^${}()|[\]\\]/.test(char) ? '\\' + char : char
    ).join('.*'), 'i')
  }))
  
  return (bookTitle: string) => {
    for (const matcher of matchers) {
      if (bookTitle === matcher.exact || 
          bookTitle.includes(matcher.exact) || 
          matcher.exact.includes(bookTitle) ||
          matcher.regex.test(bookTitle)) {
        return matcher.shortTitle
      }
    }
    return null
  }
}

// Progress callback interface
interface ProgressCallback {
  (progress: number, status: string): void
}

// Optimized chart data loading with advanced performance techniques
export const loadChartDataForBooks = async (
  bookTitles: string[],
  daysBefore: number,
  availableFiles: BookSalesFileInfo[],
  progressCallback?: ProgressCallback
): Promise<any[]> => {
  try {
    // 개발 모드에서는 항상 가짜 데이터를 우선적으로 사용
    if (isDummyMode()) {
      console.log('🔧 Development mode: Using dummy chart data')
      progressCallback?.(5, '개발 모드: 가짜 데이터 생성 중...')

      // 약간의 지연을 주어 실제 API 호출처럼 느껴지게 함
      await new Promise(resolve => setTimeout(resolve, 500))

      const dummyData = generateDummyChartDataForBooks(bookTitles, daysBefore, progressCallback)
      console.log(`✅ Generated ${dummyData.length} dummy data points for ${bookTitles.length} books`)

      // 더미 데이터가 비어있으면 최소한의 데이터라도 생성
      if (dummyData.length === 0 && bookTitles.length > 0) {
        console.warn('⚠️ 더미 데이터 생성 실패, 기본 데이터 생성')
        const fallbackData = [{
          date: new Date().toISOString().split('T')[0],
          ...bookTitles.reduce((acc, title, index) => {
            if (title && typeof title === 'string' && title.trim()) {
              acc[title.trim()] = 100 + (index * 50)
              acc[`${title.trim()}_rank`] = index + 1
            }
            return acc
          }, {} as any)
        }]
        return fallbackData
      }

      return dummyData
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
    const bookMatcher = createBookMatcher(bookTitles)

    // Enhanced parallel processing with larger batches
    const batchSize = Math.min(20, Math.max(5, Math.ceil(relevantFiles.length / 6))) // Dynamic batch sizing
    console.log(`🔄 Processing in batches of ${batchSize}`)
    progressCallback?.(20, `배치 처리 시작 (배치 크기: ${batchSize})`)

    for (let i = 0; i < relevantFiles.length; i += batchSize) {
      const batch = relevantFiles.slice(i, i + batchSize)
      
      // Load batch with 3-tier caching system
      const batchPromises = batch.map(async file => {
        try {
          // Tier 1: Memory cache (fastest)
          let data = fileCache.get(file.filename)
          let cacheHit = 'memory'
          
          if (!data) {
            // Tier 2: LocalStorage cache (fast)
            data = getFromStorage(file.filename)
            cacheHit = 'storage'
            
            if (!data) {
              // Tier 3: Network request (slowest)
              data = await loadBookSalesData(file.filename)
              cacheHit = 'network'
              
              // Save to both caches
              saveToStorage(file.filename, data)
            }
            
            // Always add to memory cache
            if (fileCache.size >= CACHE_SIZE_LIMIT) {
              const firstKey = fileCache.keys().next().value
              if (firstKey) {
                fileCache.delete(firstKey) // LRU eviction
              }
            }
            fileCache.set(file.filename, data)
          }

          const chartEntry: any = { date: file.date }

          // Optimized book searching with pre-compiled matchers
          let matchedCount = 0
          Object.values(data).forEach((book: any) => {
            const matchedTitle = bookMatcher(book.title)
            if (matchedTitle) {
              chartEntry[matchedTitle] = book.sales_point
              chartEntry[`${matchedTitle}_rank`] = book.rank // 순위 데이터도 추가
              matchedCount++
            }
          })

          // 디버깅: 실제 데이터에서 책 매칭 결과
          if (isProductionMode() && matchedCount === 0 && Object.keys(data).length > 0) {
            console.log('🔍 책 매칭 디버깅:', {
              date: file.date,
              selectedTitles: bookTitles,
              totalBooksInData: Object.keys(data).length,
              sampleBookTitles: Object.values(data).slice(0, 3).map((b: any) => b.title)
            })
          }

          // 디버깅: 실제 데이터에서 책 찾기 실패 시 로그
          if (isProductionMode() && Object.keys(chartEntry).length === 1) { // date만 있고 다른 데이터가 없는 경우
            console.log('⚠️ 실제 데이터에서 책을 찾지 못함:', {
              date: file.date,
              selectedTitles: bookTitles,
              dataBooksCount: Object.keys(data).length,
              firstBookTitle: Object.values(data)[0]?.title
            })
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

      // Progress feedback with callback
      const baseProgress = 20
      const batchProgress = Math.round(((i + batchSize) / relevantFiles.length) * 70) // 70% for loading
      const totalProgress = baseProgress + batchProgress
      
      const memoryHits = Array.from(fileCache.keys()).filter(key => 
        batch.some(b => b.filename === key)).length
      const status = `${i + batchSize}/${relevantFiles.length} 파일 처리 완료 (캐시 적중: ${memoryHits}/${batch.length})`
      
      progressCallback?.(totalProgress, status)
      
      if (relevantFiles.length > 20) {
        console.log(`📈 Progress: ${totalProgress}% - ${status}`)
      }
    }

    // Convert to sorted array
    progressCallback?.(95, '차트 데이터 정렬 및 최적화 중...')
    const sortedChartData = Object.values(chartDataMap).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    console.log(`✅ Chart data loaded successfully: ${sortedChartData.length} data points, cache size: ${fileCache.size}`)
    progressCallback?.(100, `완료! ${sortedChartData.length}개 데이터 포인트 로딩`)
    return sortedChartData

  } catch (error) {
    console.error('❌ Error loading chart data:', error)
    return []
  }
}