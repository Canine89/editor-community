'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showPageNumbers?: number
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  showPageNumbers = 5 
}: PaginationProps) {
  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    if (totalPages <= showPageNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const half = Math.floor(showPageNumbers / 2)
    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, start + showPageNumbers - 1)

    if (end - start + 1 < showPageNumbers) {
      start = Math.max(1, end - showPageNumbers + 1)
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const visiblePages = getVisiblePages()
  const showLeftEllipsis = visiblePages[0] > 2
  const showRightEllipsis = visiblePages[visiblePages.length - 1] < totalPages - 1

  return (
    <div className="flex items-center justify-center space-x-2">
      {/* Previous button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 hover-lift-editorial"
      >
        <ChevronLeft className="h-4 w-4" />
        이전
      </Button>

      {/* First page */}
      {visiblePages[0] > 1 && (
        <>
          <Button
            variant={currentPage === 1 ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(1)}
            className={currentPage === 1 ? "shadow-lg" : "hover-lift-editorial"}
          >
            1
          </Button>
          {showLeftEllipsis && (
            <div className="flex items-center">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground/60" />
            </div>
          )}
        </>
      )}

      {/* Visible page numbers */}
      {visiblePages.map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(page)}
          className={currentPage === page ? "shadow-lg" : "hover-lift-editorial"}
        >
          {page}
        </Button>
      ))}

      {/* Last page */}
      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {showRightEllipsis && (
            <div className="flex items-center">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground/60" />
            </div>
          )}
          <Button
            variant={currentPage === totalPages ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(totalPages)}
            className={currentPage === totalPages ? "shadow-lg" : "hover-lift-editorial"}
          >
            {totalPages}
          </Button>
        </>
      )}

      {/* Next button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 hover-lift-editorial"
      >
        다음
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface PaginationInfoProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

export function PaginationInfo({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage 
}: PaginationInfoProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="text-sm text-muted-foreground">
      전체 {totalItems.toLocaleString()}건 중 {startItem.toLocaleString()}-{endItem.toLocaleString()}건 표시 
      (페이지 {currentPage}/{totalPages})
    </div>
  )
}