'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface Column {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
}

interface ActionButton {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: (row: any) => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  className?: string
}

interface DataTableProps {
  title: string
  data: any[]
  columns: Column[]
  actions?: ActionButton[]
  searchPlaceholder?: string
  loading?: boolean
  emptyMessage?: string
  itemsPerPage?: number
}

export default function DataTable({
  title,
  data,
  columns,
  actions = [],
  searchPlaceholder = '검색...',
  loading = false,
  emptyMessage = '데이터가 없습니다',
  itemsPerPage = 10
}: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Filter data based on search query
  const filteredData = data.filter(row =>
    Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0
    
    const aVal = a[sortColumn]
    const bVal = b[sortColumn]
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Paginate data
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage)
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'boolean') return value ? '예' : '아니오'
    if (value instanceof Date) return value.toLocaleDateString('ko-KR')
    if (typeof value === 'string' && value.includes('T')) {
      // ISO date string
      return new Date(value).toLocaleDateString('ko-KR')
    }
    return String(value)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10"
              />
            </div>
          </div>
        </div>
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
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-8 text-slate-600">
            {emptyMessage}
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className={`text-left py-3 px-4 font-medium text-slate-600 ${
                          column.sortable ? 'cursor-pointer hover:bg-slate-50' : ''
                        }`}
                        onClick={() => column.sortable && handleSort(column.key)}
                      >
                        <div className="flex items-center gap-1">
                          {column.label}
                          {column.sortable && sortColumn === column.key && (
                            <span className="text-xs">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                    {actions.length > 0 && (
                      <th className="text-left py-3 px-4 font-medium text-slate-600">
                        작업
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-slate-50">
                      {columns.map((column) => (
                        <td key={column.key} className="py-3 px-4">
                          {column.render
                            ? column.render(row[column.key], row)
                            : formatValue(row[column.key])
                          }
                        </td>
                      ))}
                      {actions.length > 0 && (
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            {actions.map((action, actionIndex) => (
                              <Button
                                key={actionIndex}
                                size="sm"
                                variant={action.variant || 'ghost'}
                                onClick={() => action.onClick(row)}
                                className={action.className}
                              >
                                {action.icon && <action.icon className="w-3 h-3" />}
                                <span className="sr-only">{action.label}</span>
                              </Button>
                            ))}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-slate-600">
                  {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-slate-600">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}