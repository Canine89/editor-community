// Book sales data utilities

import { createClient } from '@/lib/supabase'
import { BookSalesData, BookSalesFileInfo, BookTrend, PublisherStats, CategoryStats, DailySalesOverview } from '@/types/book-sales'

// Get list of available data files from Supabase Storage
export const getBookSalesFiles = async (): Promise<BookSalesFileInfo[]> => {
  try {
    const supabase = createClient()
    
    // List all files in the book-sales-data bucket
    const { data: files, error } = await supabase.storage
      .from('book-sales-data')
      .list('', {
        limit: 100,
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
  
  for (const filename of filenames) {
    const date = filename.replace('yes24_', '').replace('.json', '').replace('_', '-')
    const formattedDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
    results[formattedDate] = await loadBookSalesData(filename)
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
      salesPoint: topBook.sales_point
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