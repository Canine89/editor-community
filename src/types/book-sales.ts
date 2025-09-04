// Book sales data types

export interface BookInfo {
  title: string
  url: string
  rank: number
  publisher: string
  publish_date: string
  right_price: number
  fake_isbn: number
  page: number
  sales_point: number
  author: string[]
  tags: string[]
}

export interface BookSalesData {
  [key: string]: BookInfo
}

export interface BookSalesFileInfo {
  date: string
  filename: string
  displayDate: string
}

export interface BookTrend {
  bookId: string
  title: string
  dates: string[]
  ranks: number[]
  salesPoints: number[]
  priceChanges: number[]
}

export interface PublisherStats {
  name: string
  bookCount: number
  totalSalesPoints: number
  averageRank: number
  averagePrice: number
}

export interface CategoryStats {
  category: string
  bookCount: number
  totalSalesPoints: number
  topBooks: {title: string, salesPoint: number}[]
}

export interface DailySalesOverview {
  date: string
  totalBooks: number
  totalSalesPoints: number
  averageRank: number
  topBook: {title: string, rank: number, salesPoint: number, publisher: string}
  publisherCount: number
}

export interface PeriodOverview {
  totalDays: number
  totalSalesPoints: number
  topPublishers: {publisher: string, salesPoints: number}[]
  averageDailySales: number
  publisherCount: number
}

export type PeriodType = 30 | 60 | 90 | 120