'use client'

import { useState, useRef, useCallback, useMemo, memo, useEffect } from 'react'
import { AuthRequired } from '@/components/auth/AuthRequired'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Upload,
  Edit3,
  Download,
  FileText,
  AlertCircle,
  Info,
  GripVertical,
  Trash2,
  RotateCcw,
  Move,
  Eye,
  X,
  Undo
} from 'lucide-react'
import Link from 'next/link'
import { PDFDocument } from 'pdf-lib'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import {
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// PDF.js worker 설정
if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs'
}

interface PDFPageData {
  id: string
  pageNumber: number // 원본 파일에서의 페이지 번호 (1부터 시작)
  displayPageNumber?: number // 편집기에서 보여지는 순서 번호 (1부터 시작)
  canvas?: string // 일반 썸네일 base64 이미지 데이터
  highResCanvas?: string // 고해상도 base64 이미지 데이터 (크게 보기용)
  isLoading?: boolean
  isLoadingHighRes?: boolean
  sourceFile?: string // 페이지의 원본 파일명 (메인 파일 또는 추가된 파일)
}

interface PDFInfo {
  totalPages: number
  fileName: string
  fileSize: string
}

// 페이지 좌우측 삽입 인디케이터
function InsertionIndicator({ position }: { position: 'before' | 'after' }) {
  return (
    <div className={`absolute top-0 bottom-0 w-1 bg-red-500 shadow-lg animate-pulse z-30 ${
      position === 'before' ? '-left-2' : '-right-2'
    }`}></div>
  )
}

// 드래그 가능한 페이지 썸네일 컴포넌트
// 성능 최적화를 위한 메모이제이션 비교 함수
const SortablePage = memo(function SortablePage({ page, onDelete, onViewLarge, isOver, isDragging, isSelected, onToggleSelect, isMultiSelectMode, selectedPages, activeId, mainFileName, currentIndex }: {
  page: PDFPageData
  onDelete: () => void
  onViewLarge: () => void
  isOver?: boolean
  isDragging?: boolean
  isSelected?: boolean
  onToggleSelect?: (event: React.MouseEvent) => void
  isMultiSelectMode?: boolean
  selectedPages?: Set<string>
  activeId?: string | null
  mainFileName?: string
  currentIndex: number
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableIsDragging
  } = useSortable({ id: page.id })

  const actualIsDragging = isDragging || sortableIsDragging
  
  // 다중 선택된 그룹이 드래그되고 있는지 확인
  const isGroupDragging = activeId && selectedPages && selectedPages.size > 0 && 
                         selectedPages.has(activeId) && selectedPages.has(page.id) && !actualIsDragging

  // 추가 파일 여부 확인
  const isAdditionalFile = page.sourceFile && page.sourceFile !== mainFileName
  

  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    // 드래그 중에는 모든 트랜지션 비활성화
    transition: actualIsDragging ? 'none' : 'transform 150ms cubic-bezier(0.2, 0, 0, 1)',
    opacity: actualIsDragging ? 0.3 : isGroupDragging ? 0.7 : 1,
    // GPU 가속을 위한 transform3d 사용
    scale: actualIsDragging ? 1.05 : isGroupDragging ? 1.02 : 1,
    zIndex: actualIsDragging ? 50 : isGroupDragging ? 10 : 1,
    // GPU 레이어 생성을 위한 will-change 속성
    willChange: actualIsDragging || isGroupDragging ? 'transform' : 'auto',
  }), [transform, transition, actualIsDragging, isGroupDragging])

  const containerClasses = useMemo(() => {
    // 추가 파일인 경우 기본 배경을 연한 녹색으로 설정
    let classes = `relative group rounded-lg cursor-move ${
      isAdditionalFile 
        ? 'bg-green-50' 
        : 'bg-white'
    }`
    
    // 드래그 중에는 트랜지션 비활성화, 평상시에는 최적화된 트랜지션 적용
    if (actualIsDragging) {
      classes += ' transition-none'
    } else {
      classes += ' transition-[transform,box-shadow,border-color] duration-150 ease-out'
    }
    
    // GPU 가속을 위한 성능 최적화 속성들 - 인라인 스타일로 적용
    const needsOptimization = actualIsDragging || isGroupDragging || isSelected
    
    if (actualIsDragging) {
      classes += ' border-4 border-blue-400 shadow-2xl ring-4 ring-blue-100 transform scale-105 rotate-1 z-50'
    } else if (isGroupDragging) {
      classes += ' border-4 border-primary bg-primary/10 shadow-xl ring-3 ring-primary/30 transform scale-105 z-40'
    } else if (isSelected) {
      classes += ' border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg ring-2 ring-primary/20 transform scale-[1.03]'
    } else if (isOver) {
      classes += ' border-2 border-blue-300 bg-primary/5 shadow-lg ring-2 ring-blue-200 transform scale-[1.01]'
    } else {
      // 추가 파일인 경우 녹색 테두리, 메인 파일인 경우 회색 테두리
      if (isAdditionalFile) {
        classes += ' border-2 border-green-300 hover:border-green-400 shadow-sm hover:shadow-md hover:scale-[1.01]'
      } else {
        classes += ' border-2 border-border hover:border-primary/60 shadow-sm hover:shadow-md hover:scale-[1.01]'
      }
    }
    
    return { classes, needsOptimization }
  }, [actualIsDragging, isGroupDragging, isSelected, isOver, isAdditionalFile])

  // 원본 정보 툴팁 텍스트 - 모든 페이지에 적용
  const tooltipText = page.sourceFile && page.pageNumber 
    ? `원본: ${page.sourceFile} ${page.pageNumber}페이지`
    : undefined

  // GPU 최적화를 위한 추가 스타일
  const optimizedStyle = useMemo(() => {
    const baseStyle = { ...style } as React.CSSProperties & {
      contain?: string
      backfaceVisibility?: string
    }
    
    if (containerClasses.needsOptimization) {
      baseStyle.willChange = 'transform'
      baseStyle.contain = 'layout style paint'
      baseStyle.backfaceVisibility = 'hidden'
      // transform3d를 사용하여 GPU 레이어 강제 생성
      baseStyle.transform = `${baseStyle.transform || ''} translate3d(0, 0, 0)`
    }
    
    return baseStyle
  }, [style, containerClasses.needsOptimization])

  return (
    <div 
      ref={setNodeRef}
      style={optimizedStyle}
      className={containerClasses.classes}
      title={tooltipText}
    >
      {/* 다중 선택 체크박스 - 개선된 시각적 피드백 */}
      {isMultiSelectMode && onToggleSelect && (
        <div 
          className={cn(
            "absolute top-2 left-2 z-20 p-1.5 rounded-full transition-all duration-200 shadow-sm",
            isSelected 
              ? "bg-primary border-2 border-primary shadow-md" 
              : "bg-white border-2 border-border hover:bg-muted hover:border-primary/60"
          )}
          title="페이지 선택"
        >
          <input
            type="checkbox"
            checked={isSelected || false}
            onChange={(e) => {
              e.stopPropagation()
              onToggleSelect(e as any)
            }}
            className={cn(
              "w-4 h-4 rounded cursor-pointer transition-all duration-200",
              isSelected 
                ? "text-white bg-primary border-primary focus:ring-primary" 
                : "text-primary bg-white border-border focus:ring-primary hover:border-primary"
            )}
          />
        </div>
      )}

      {/* 드래그 핸들 - 개선된 시각적 피드백 */}
      <div 
        {...attributes}
        {...listeners}
        className={cn(
          "absolute top-2 z-10 p-2 rounded-full cursor-grab active:cursor-grabbing transition-all duration-200 shadow-sm",
          isMultiSelectMode ? "left-12" : "left-2",
          actualIsDragging 
            ? "bg-primary/50 border-2 border-blue-600 opacity-100 shadow-md transform scale-110" 
            : "bg-white border-2 border-border opacity-0 group-hover:opacity-100 hover:border-primary/60 hover:shadow-md"
        )}
        title="드래그하여 순서 변경"
      >
        <GripVertical className={cn(
          "w-4 h-4 transition-colors duration-200",
          actualIsDragging ? "text-white" : "text-muted-foreground"
        )} />
      </div>

      {/* 페이지 번호 - 드래그 중에는 숨김, 개선된 스타일 */}
      {!actualIsDragging && (
        <div className="absolute top-2 right-2 bg-muted text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
          {currentIndex + 1}
        </div>
      )}

      {/* 소스 파일 배지 - 모든 페이지에 파일명과 원본 페이지 번호 표시, 개선된 스타일 */}
      {page.sourceFile && (
        <div className={cn(
          "absolute bottom-2 left-2 text-white text-xs px-3 py-1.5 rounded-full max-w-28 truncate z-10 font-medium shadow-sm transition-all duration-200",
          isAdditionalFile ? "bg-green-600 hover:bg-green-700" : "bg-slate-600 hover:bg-muted"
        )}
             title={`소스: ${page.sourceFile} (원본 페이지 ${page.pageNumber})`}>
          {page.sourceFile.replace('.pdf', '').substring(0, 6)}..{page.pageNumber}p
        </div>
      )}

      {/* 페이지 이미지 - 개선된 스타일 */}
      <div className="w-full h-48 flex items-center justify-center p-4 bg-slate-25 rounded-lg">
        {page.isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-muted-foreground">로딩 중...</span>
          </div>
        ) : page.canvas ? (
          <img 
            src={page.canvas} 
            alt={`페이지 ${page.pageNumber}`}
            className="max-w-full max-h-full object-contain rounded border border-border transition-all duration-200 hover:shadow-sm"
          />
        ) : (
          <div className="text-muted-foreground flex flex-col items-center">
            <FileText className="w-8 h-8 mx-auto mb-2" />
            <span className="text-xs">미리보기 없음</span>
          </div>
        )}
      </div>

      {/* 액션 버튼들 - 개선된 스타일과 배치 */}
      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <Button
          size="sm"
          variant="secondary"
          onClick={onViewLarge}
          className="h-8 w-8 p-0 bg-white hover:bg-primary/10 border border-border hover:border-primary shadow-sm transition-colors duration-200"
          title="크게 보기"
        >
          <Eye className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onDelete}
          className="h-8 w-8 p-0 hover:bg-red-600 shadow-sm transition-colors duration-200"
          title="페이지 삭제"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // 성능 최적화를 위한 얕은 비교 함수
  return (
    prevProps.page.id === nextProps.page.id &&
    prevProps.page.canvas === nextProps.page.canvas &&
    prevProps.page.isLoading === nextProps.page.isLoading &&
    prevProps.isOver === nextProps.isOver &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isMultiSelectMode === nextProps.isMultiSelectMode &&
    prevProps.activeId === nextProps.activeId &&
    prevProps.currentIndex === nextProps.currentIndex &&
    prevProps.mainFileName === nextProps.mainFileName
  )
})

function PDFEditorContent() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null)
  const [pages, setPages] = useState<PDFPageData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<{ pageId: string, position: 'before' | 'after' } | null>(null)
  const [viewLargePage, setViewLargePage] = useState<PDFPageData | null>(null)
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([])
  const [isMerging, setIsMerging] = useState(false)
  const [insertPosition, setInsertPosition] = useState<'end' | number>('end')
  const [originalFileCache, setOriginalFileCache] = useState<Map<string, File>>(new Map())
  const [deletedPagesHistory, setDeletedPagesHistory] = useState<Array<{pages: PDFPageData[], timestamp: number}>>([])
  const maxHistorySize = 10

  // 최적화된 센서 설정 - 성능 개선을 위한 임계값 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // 5px 임계값으로 의도하지 않은 드래그 방지
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // displayPageNumber를 순차적으로 할당하는 도우미 함수
  const assignDisplayPageNumbers = useCallback((pagesArray: PDFPageData[]): PDFPageData[] => {
    return pagesArray.map((page, index) => ({
      ...page,
      displayPageNumber: index + 1
    }))
  }, [])

  // 히스토리 저장 유틸리티 함수
  const saveToHistory = useCallback((currentPages: PDFPageData[]) => {
    const historyEntry = {
      pages: currentPages,
      timestamp: Date.now()
    }
    
    setDeletedPagesHistory(prevHistory => {
      // 동일한 상태는 저장하지 않음 (중복 방지)
      if (prevHistory.length > 0 && 
          prevHistory[0].pages.length === currentPages.length &&
          prevHistory[0].pages.every((page, index) => page.id === currentPages[index]?.id)) {
        return prevHistory
      }
      
      const newHistory = [historyEntry, ...prevHistory.slice(0, maxHistorySize - 1)]
      return newHistory
    })
  }, [maxHistorySize])

  // 페이지 ID → 인덱스 맵핑 (성능 최적화)
  const pageIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    pages.forEach((page, index) => {
      map.set(page.id, index)
    })
    return map
  }, [pages])

  // SortableContext용 아이템 ID 배열 (메모이제이션)
  const sortableItems = useMemo(() => pages.map(page => page.id), [pages])

  // 정확한 드롭 위치 계산 함수
  const calculateDropTarget = useCallback((targetPageId: string, position: 'before' | 'after', currentItems: PDFPageData[], selectedPageIds: Set<string>) => {
    // 선택된 페이지들을 제외한 배열에서의 타겟 페이지 위치 찾기
    const itemsWithoutSelected = currentItems.filter(page => !selectedPageIds.has(page.id))
    const targetIndex = itemsWithoutSelected.findIndex(page => page.id === targetPageId)
    
    if (targetIndex === -1) return 0
    
    // before: 타겟 페이지 앞에 삽입, after: 타겟 페이지 뒤에 삽입
    return position === 'before' ? targetIndex : targetIndex + 1
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 페이지 썸네일 생성 (일반 미리보기용)
  const generatePageThumbnail = useCallback(async (pdfDoc: any, pageIndex: number): Promise<string | null> => {
    try {
      const page = await pdfDoc.getPage(pageIndex + 1)
      const viewport = page.getViewport({ scale: 0.5 })
      
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.height = viewport.height
      canvas.width = viewport.width

      if (!context) return null

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }

      await page.render(renderContext).promise
      return canvas.toDataURL('image/jpeg', 0.8)
    } catch (error) {
      console.error('썸네일 생성 오류:', error)
      return null
    }
  }, [])

  // 고해상도 페이지 생성 (크게 보기용)
  const generateHighResPageImage = useCallback(async (sourceFileName: string, originalPageNumber: number): Promise<string | null> => {
    try {
      // 캐시에서 소스 파일 가져오기
      const sourceFile = originalFileCache.get(sourceFileName)
      if (!sourceFile) {
        console.error('소스 파일을 찾을 수 없습니다:', sourceFileName)
        return null
      }

      const arrayBuffer = await sourceFile.arrayBuffer()
      const loadingTask = getDocument({ 
        data: arrayBuffer,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
        cMapPacked: true
      })
      
      const pdf = await loadingTask.promise
      const page = await pdf.getPage(originalPageNumber)
      
      // 고해상도로 렌더링 (scale 2.0)
      const viewport = page.getViewport({ scale: 2.0 })
      
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.height = viewport.height
      canvas.width = viewport.width

      if (!context) return null

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }

      await page.render(renderContext).promise
      return canvas.toDataURL('image/jpeg', 0.9) // 높은 품질
    } catch (error) {
      console.error('고해상도 이미지 생성 오류:', error)
      return null
    }
  }, [originalFileCache])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('PDF 파일만 선택할 수 있습니다.')
      return
    }

    setError('')
    setSelectedFile(file)
    setIsProcessing(true)
    setPages([])

    try {
      // 원본 파일을 캐시에 저장
      setOriginalFileCache(new Map([[file.name, file]]))
      
      const arrayBuffer = await file.arrayBuffer()
      
      // PDF-lib으로 기본 정보 가져오기
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      const totalPages = pdfDoc.getPageCount()
      
      setPdfInfo({
        totalPages,
        fileName: file.name,
        fileSize: formatFileSize(file.size)
      })

      // PDF.js로 썸네일 생성
      const loadingTask = getDocument({ 
        data: arrayBuffer,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
        cMapPacked: true
      })
      
      const pdf = await loadingTask.promise

      // 초기 페이지 데이터 생성 (로딩 상태) - sourceFile 속성 추가
      const initialPages: PDFPageData[] = Array.from({ length: totalPages }, (_, index) => ({
        id: `page-${index + 1}`,
        pageNumber: index + 1,
        displayPageNumber: index + 1, // 메인 파일의 경우 순서대로 할당
        isLoading: true,
        sourceFile: file.name
      }))

      setPages(initialPages)

      // 썸네일을 비동기적으로 생성
      const thumbnailPromises = Array.from({ length: totalPages }, async (_, index) => {
        const canvas = await generatePageThumbnail(pdf, index)
        return { index, canvas }
      })

      // 썸네일이 생성되는대로 업데이트
      thumbnailPromises.forEach(async (promise) => {
        const { index, canvas } = await promise
        setPages(prevPages => 
          prevPages.map(page => 
            page.pageNumber === index + 1 
              ? { ...page, canvas: canvas || undefined, isLoading: false }
              : page
          )
        )
      })

    } catch (error) {
      console.error('PDF 로드 오류:', error)
      setError('PDF 파일을 읽는데 실패했습니다. 파일이 손상되었거나 암호화되어 있을 수 있습니다.')
      setSelectedFile(null)
      setPdfInfo(null)
      setPages([])
    } finally {
      setIsProcessing(false)
    }
  }

  // 드래그 시작 최적화 - 불필요한 상태 초기화 최소화
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const draggedPageId = event.active.id as string
    setActiveId(draggedPageId)
    // 드래그 시작 시에만 overId와 dropPosition 초기화
    setOverId(null)
    setDropPosition(null)
  }, [])

  // 드래그 오버 최적화 - 동일한 상태 업데이트 방지
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over?.id as string
    
    // 이전 overId와 같으면 불필요한 상태 업데이트 방지
    if (overId === (event.over?.id as string)) {
      // overId가 변경된 경우에만 업데이트
      setOverId(prevOverId => prevOverId !== overId ? (overId || null) : prevOverId)
    }
    
    if (overId && activeId && activeId !== overId) {
      const activeIndex = pageIndexMap.get(activeId) ?? -1
      const overIndex = pageIndexMap.get(overId) ?? -1
      
      if (activeIndex !== -1 && overIndex !== -1) {
        const position = activeIndex < overIndex ? 'after' : 'before'
        // 같은 위치면 업데이트하지 않음
        setDropPosition(prev => 
          prev?.pageId === overId && prev?.position === position 
            ? prev 
            : { pageId: overId, position }
        )
      }
    } else {
      setDropPosition(prev => prev ? null : prev)
    }
  }, [activeId, pageIndexMap])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    const draggedPageId = active.id as string

    if (active.id !== over?.id && over?.id) {
      setPages((items) => {
        // 다중 선택된 페이지들이 있고, 드래그한 페이지가 선택된 경우
        if (selectedPages.size > 0 && selectedPages.has(draggedPageId)) {
          // dropPosition이 없으면 기본값 사용
          const position = dropPosition?.position || 'after'
          const targetPageId = over.id as string
          
          // 1단계: 선택된 페이지들을 원본 문서 순서대로 정렬 (순서 보장)
          const selectedPagesList = items
            .filter(page => selectedPages.has(page.id))
            .sort((a, b) => {
              const aIndex = items.findIndex(item => item.id === a.id)
              const bIndex = items.findIndex(item => item.id === b.id)
              return aIndex - bIndex
            })
          
          // 2단계: 선택된 페이지들을 제거한 배열 생성
          const itemsWithoutSelected = items.filter(page => !selectedPages.has(page.id))
          
          // 3단계: 정확한 삽입 위치 계산
          const insertIndex = calculateDropTarget(targetPageId, position, items, selectedPages)
          
          // 4단계: 계산된 위치에 선택된 페이지들을 순서대로 삽입
          const result = [...itemsWithoutSelected]
          result.splice(insertIndex, 0, ...selectedPagesList)
          
          // displayPageNumber 재할당
          return assignDisplayPageNumbers(result)
        } else {
          // 단일 페이지 이동 (기존 로직)
          const oldIndex = pageIndexMap.get(draggedPageId) ?? -1
          const newIndex = pageIndexMap.get(over.id as string) ?? -1
          
          if (oldIndex === -1 || newIndex === -1) return items
          const movedItems = arrayMove(items, oldIndex, newIndex)
          // displayPageNumber 재할당
          return assignDisplayPageNumbers(movedItems)
        }
      })
    }

    setActiveId(null)
    setOverId(null)
    setDropPosition(null)
  }, [selectedPages, dropPosition, calculateDropTarget, pageIndexMap])

  const deletePage = useCallback((pageId: string) => {
    // 1. 먼저 현재 상태를 히스토리에 저장
    saveToHistory(pages)
    
    // 2. 그 다음 페이지 삭제
    const filteredPages = pages.filter(page => page.id !== pageId)
    setPages(assignDisplayPageNumbers(filteredPages))
  }, [pages, saveToHistory, assignDisplayPageNumbers])

  // 다중 선택 관련 함수들
  const togglePageSelection = (pageId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    setSelectedPages(prev => {
      const newSelection = new Set(prev)
      if (newSelection.has(pageId)) {
        newSelection.delete(pageId)
      } else {
        newSelection.add(pageId)
      }
      return newSelection
    })
  }

  const clearSelection = () => {
    setSelectedPages(new Set())
  }

  const selectAllPages = () => {
    setSelectedPages(new Set(pages.map(page => page.id)))
  }

  const deleteSelectedPages = useCallback(() => {
    if (selectedPages.size === 0) return
    
    // 1. 먼저 현재 상태를 히스토리에 저장
    saveToHistory(pages)
    
    // 2. 선택된 페이지들 삭제
    const filteredPages = pages.filter(page => !selectedPages.has(page.id))
    setPages(assignDisplayPageNumbers(filteredPages))
    
    clearSelection()
  }, [selectedPages, pages, saveToHistory, assignDisplayPageNumbers])

  const handleUndo = useCallback(() => {
    if (deletedPagesHistory.length === 0) return
    
    const mostRecentEntry = deletedPagesHistory[0]
    setPages(assignDisplayPageNumbers(mostRecentEntry.pages))
    
    // 히스토리에서 사용된 엔트리 제거
    setDeletedPagesHistory(prevHistory => prevHistory.slice(1))
    
    // 다중 선택 해제
    clearSelection()
  }, [deletedPagesHistory, assignDisplayPageNumbers])

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(prev => {
      if (prev) {
        clearSelection() // 다중 선택 모드 해제 시 선택 초기화
      }
      return !prev
    })
  }

  // PDF 병합 관련 함수들
  const handleAdditionalFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf')
    if (pdfFiles.length === 0) {
      setError('PDF 파일만 선택할 수 있습니다.')
      return
    }

    setAdditionalFiles(pdfFiles)
    setError('')
  }

  const removeAdditionalFile = (index: number) => {
    setAdditionalFiles(files => files.filter((_, i) => i !== index))
  }

  const insertAdditionalPages = async () => {
    if (!selectedFile || additionalFiles.length === 0) return

    setIsMerging(true)
    setError('')

    try {
      // 원본 파일들을 캐시에 저장
      const newCache = new Map(originalFileCache)
      if (!newCache.has(selectedFile.name)) {
        newCache.set(selectedFile.name, selectedFile)
      }
      
      // 추가 파일들을 캐시에 저장하고 페이지 데이터 생성
      const additionalPagesData: PDFPageData[] = []
      
      for (let fileIndex = 0; fileIndex < additionalFiles.length; fileIndex++) {
        const file = additionalFiles[fileIndex]
        newCache.set(file.name, file)
        
        const arrayBuffer = await file.arrayBuffer()
        const loadingTask = getDocument({ 
          data: arrayBuffer,
          cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
          cMapPacked: true
        })
        const pdf = await loadingTask.promise
        const pageCount = pdf.numPages

        // 각 파일의 페이지들을 PDFPageData로 변환 (로딩 상태)
        for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
          additionalPagesData.push({
            id: `additional-${fileIndex}-${pageIndex + 1}`,
            pageNumber: pageIndex + 1,
            isLoading: true,
            sourceFile: file.name
          })
        }

        // 썸네일을 비동기적으로 생성
        for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
          generatePageThumbnail(pdf, pageIndex).then(canvas => {
            const pageId = `additional-${fileIndex}-${pageIndex + 1}`
            setPages(prevPages => 
              prevPages.map(page => 
                page.id === pageId 
                  ? { ...page, canvas: canvas || undefined, isLoading: false }
                  : page
              )
            )
          })
        }
      }

      // 원본 파일 캐시 업데이트
      setOriginalFileCache(newCache)

      // 메인 페이지 배열에 sourceFile 추가 (기존 페이지들)
      const updatedMainPages = pages.map(page => ({
        ...page,
        sourceFile: page.sourceFile || selectedFile.name
      }))

      // 삽입 위치에 따라 페이지 배열 업데이트
      let newPages: PDFPageData[]
      if (insertPosition === 'end') {
        // 맨 끝에 추가
        newPages = [...updatedMainPages, ...additionalPagesData]
      } else {
        // 지정된 위치에 삽입
        const insertAfterIndex = insertPosition as number
        newPages = [
          ...updatedMainPages.slice(0, insertAfterIndex + 1),
          ...additionalPagesData,
          ...updatedMainPages.slice(insertAfterIndex + 1)
        ]
      }

      // displayPageNumber 할당하여 최종 페이지 배열 설정
      const finalPages = assignDisplayPageNumbers(newPages)
      setPages(finalPages)
      
      // 추가 파일 목록 초기화
      setAdditionalFiles([])
      setInsertPosition('end')

    } catch (error) {
      console.error('PDF 페이지 삽입 오류:', error)
      setError('PDF 페이지 삽입 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsMerging(false)
    }
  }

  const viewPageLarge = async (pageId: string) => {
    const page = pages.find(p => p.id === pageId)
    if (page) {
      // 고해상도 이미지가 없으면 생성
      if (!page.highResCanvas) {
        // 로딩 상태로 설정
        const updatedPage = { ...page, isLoadingHighRes: true }
        setViewLargePage(updatedPage)
        
        // 고해상도 이미지 생성
        const sourceFileName = page.sourceFile || selectedFile?.name || ''
        const highResImage = await generateHighResPageImage(sourceFileName, page.pageNumber)
        
        if (highResImage) {
          // pages 상태 업데이트
          setPages(prevPages => 
            prevPages.map(p => 
              p.id === pageId 
                ? { ...p, highResCanvas: highResImage, isLoadingHighRes: false }
                : p
            )
          )
          
          // 모달 페이지 상태도 업데이트
          setViewLargePage({ ...page, highResCanvas: highResImage, isLoadingHighRes: false })
        } else {
          setViewLargePage({ ...page, isLoadingHighRes: false })
        }
      } else {
        setViewLargePage(page)
      }
    }
  }

  const generateEditedPDF = async () => {
    if (!selectedFile || pages.length === 0) return

    setIsGenerating(true)
    setError('')

    try {
      const newPdf = await PDFDocument.create()
      
      // 소스 파일별로 PDF 문서를 로드하여 캐시
      const loadedPdfs = new Map<string, any>()
      
      // 페이지 순서대로 복사
      for (const page of pages) {
        const sourceFileName = page.sourceFile || selectedFile.name
        
        // 해당 소스 파일의 PDF 문서가 아직 로드되지 않았으면 로드
        if (!loadedPdfs.has(sourceFileName)) {
          const sourceFile = originalFileCache.get(sourceFileName)
          if (!sourceFile) {
            throw new Error(`소스 파일을 찾을 수 없습니다: ${sourceFileName}`)
          }
          
          const arrayBuffer = await sourceFile.arrayBuffer()
          const originalPdf = await PDFDocument.load(arrayBuffer)
          loadedPdfs.set(sourceFileName, originalPdf)
        }
        
        const sourcePdf = loadedPdfs.get(sourceFileName)
        
        // 원본 페이지 번호에서 1을 빼서 0-based 인덱스로 변환
        const pageIndex = page.pageNumber - 1
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageIndex])
        newPdf.addPage(copiedPage)
      }

      const pdfBytes = await newPdf.save()
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      // 파일명 생성 (다중 파일이 포함된 경우 merged 표시)
      const hasMultipleSources = new Set(pages.map(page => page.sourceFile || selectedFile.name)).size > 1
      const baseName = selectedFile.name.replace('.pdf', '')
      const editedFileName = hasMultipleSources 
        ? `${baseName}_merged_edited.pdf`
        : `${baseName}_edited.pdf`

      // 다운로드
      const link = document.createElement('a')
      link.href = url
      link.download = editedFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('PDF 생성 오류:', error)
      setError('편집된 PDF 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setPdfInfo(null)
    setPages([])
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Ctrl+Z / Cmd+Z 단축키를 위한 키보드 이벤트 리스너
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Z (Windows) 또는 Cmd+Z (Mac) 감지
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        // 입력 필드에서는 브라우저 기본 동작 유지
        const target = event.target as HTMLElement
        if (target.tagName === 'INPUT' || 
            target.tagName === 'TEXTAREA' || 
            target.isContentEditable) {
          return
        }
        
        // 실행 취소가 가능한 경우에만 처리
        if (deletedPagesHistory.length > 0) {
          event.preventDefault()
          handleUndo()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, deletedPagesHistory.length])

  return (
    <div className="min-h-screen gradient-bg-editorial">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" asChild>
              <Link href="/tools">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Edit3 className="w-6 h-6 text-primary" />
                PDF 페이지 교체
              </h1>
              <p className="text-muted-foreground">PDF 페이지를 교체, 순서 변경, 삭제하고 되돌리기 기능을 제공합니다</p>
            </div>
          </div>

          {/* 안내사항 */}
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-foreground">
              <strong>개인정보 보호:</strong> 파일은 브라우저에서만 처리되며 서버로 전송되지 않습니다.
            </AlertDescription>
          </Alert>

          {/* 파일 업로드 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                1단계: PDF 파일 선택
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                    disabled={isProcessing}
                  />
                </div>
                
                {selectedFile && pdfInfo && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">{pdfInfo.fileName}</p>
                        <p className="text-sm text-green-700">
                          총 {pdfInfo.totalPages}페이지 • {pdfInfo.fileSize}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isProcessing && (
                  <div className="flex items-center gap-2 text-primary">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">PDF 로딩 및 미리보기 생성 중...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 페이지 편집 영역 */}
          {pages.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Move className="w-5 h-5" />
                    2단계: 페이지 편집
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    총 {pages.length}페이지
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-foreground text-sm">
                      <Info className="w-4 h-4" />
                      <span>드래그하여 순서 변경, 버튼으로 복제/삭제가 가능합니다</span>
                    </div>
                  </div>

                  {/* 다중 선택 컨트롤 */}
                  <div className="flex items-center justify-between bg-muted/10 border border-border rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <Button
                        variant={isMultiSelectMode ? "default" : "outline"}
                        size="sm"
                        onClick={toggleMultiSelectMode}
                        className={cn(
                          "flex items-center gap-2 transition-all duration-200",
                          isMultiSelectMode 
                            ? "bg-primary hover:bg-primary/90 border-primary" 
                            : "hover:bg-primary/10 hover:border-primary"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isMultiSelectMode}
                          onChange={() => {}}
                          className="w-4 h-4 pointer-events-none"
                        />
                        다중 선택
                      </Button>
                      
                      {isMultiSelectMode && (
                        <>
                          <span className="text-sm text-muted-foreground">
                            {selectedPages.size}개 선택됨
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={selectAllPages}
                            disabled={selectedPages.size === pages.length}
                          >
                            전체 선택
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearSelection}
                            disabled={selectedPages.size === 0}
                          >
                            선택 해제
                          </Button>
                        </>
                      )}
                      
                      {/* 되돌리기 버튼 */}
                      {deletedPagesHistory.length > 0 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleUndo}
                          className="flex items-center gap-2 bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-800 font-medium"
                          title={`최근 삭제 작업을 되돌립니다 (${deletedPagesHistory.length}개 기록)`}
                        >
                          <Undo className="w-4 h-4" />
                          실행 취소
                          <span className="text-xs bg-orange-200 px-1.5 py-0.5 rounded-full">
                            {deletedPagesHistory.length}
                          </span>
                        </Button>
                      )}
                    </div>
                    
                    {selectedPages.size > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={deleteSelectedPages}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        선택 삭제 ({selectedPages.size})
                      </Button>
                    )}
                  </div>

                  {/* PDF 병합 기능 */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-medium text-green-900">PDF 파일 병합</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-green-800 mb-2">
                          추가할 PDF 파일들 선택
                        </label>
                        <input
                          type="file"
                          accept=".pdf"
                          multiple
                          onChange={handleAdditionalFiles}
                          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
                        />
                      </div>

                      {/* 삽입 위치 선택 */}
                      <div>
                        <label className="block text-sm font-medium text-green-800 mb-2">
                          삽입 위치 선택
                        </label>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="position-end"
                              name="insertPosition"
                              value="end"
                              checked={insertPosition === 'end'}
                              onChange={() => setInsertPosition('end')}
                              className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                            />
                            <label htmlFor="position-end" className="ml-2 text-sm text-green-800">
                              맨 끝에 추가 (기본)
                            </label>
                          </div>
                          
                          {pages.length > 0 && (
                            <>
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  id="position-custom"
                                  name="insertPosition"
                                  value="custom"
                                  checked={typeof insertPosition === 'number'}
                                  onChange={() => setInsertPosition(0)}
                                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                                />
                                <label htmlFor="position-custom" className="ml-2 text-sm text-green-800">
                                  특정 페이지 뒤에 삽입:
                                </label>
                              </div>
                              
                              {typeof insertPosition === 'number' && (
                                <div className="ml-6">
                                  <select
                                    value={insertPosition}
                                    onChange={(e) => setInsertPosition(parseInt(e.target.value))}
                                    className="block w-full px-3 py-2 bg-white border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                  >
                                    {pages.map((page, index) => (
                                      <option key={page.id} value={index}>
                                        {index + 1}페이지 뒤에 삽입
                                      </option>
                                    ))}
                                  </select>
                                  <p className="text-xs text-green-600 mt-1">
                                    현재 {insertPosition + 1}페이지 뒤에 새 파일들이 삽입됩니다
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {additionalFiles.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-green-800">
                            병합할 파일들 ({additionalFiles.length}개):
                          </p>
                          <div className="space-y-1">
                            {additionalFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between bg-white rounded-lg p-2 border border-green-200">
                                <span className="text-sm text-foreground truncate flex-1">
                                  {index + 1}. {file.name}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAdditionalFile(index)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2 h-6 w-6 p-0"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {additionalFiles.length > 0 && (
                        <div className="flex gap-3 pt-2">
                          <Button
                            onClick={insertAdditionalPages}
                            disabled={isMerging}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                          >
                            {isMerging ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                삽입 중...
                              </>
                            ) : (
                              <>
                                <Move className="w-4 h-4" />
                                페이지 삽입하기
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setAdditionalFiles([])}
                            disabled={isMerging}
                          >
                            파일 목록 초기화
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {pages.map((page, index) => (
                          <div key={page.id} className="relative">
                            {/* 삽입 위치 인디케이터 - 페이지 좌우에 표시 */}
                            {dropPosition && dropPosition.pageId === page.id && (
                              <InsertionIndicator position={dropPosition.position} />
                            )}
                            <SortablePage
                              page={page}
                              onDelete={() => deletePage(page.id)}
                              onViewLarge={() => viewPageLarge(page.id)}
                              isOver={overId === page.id}
                              isDragging={activeId === page.id}
                              isSelected={selectedPages.has(page.id)}
                              onToggleSelect={(event) => togglePageSelection(page.id, event)}
                              isMultiSelectMode={isMultiSelectMode}
                              selectedPages={selectedPages}
                              activeId={activeId}
                              mainFileName={selectedFile?.name}
                              currentIndex={index}
                            />
                          </div>
                        ))}
                      </div>
                    </SortableContext>
                    
                    {/* 드래그 오버레이 - 다중 선택 정보 표시 */}
                    <DragOverlay>
                      {activeId ? (() => {
                        const draggedPage = pages.find(p => p.id === activeId)
                        if (!draggedPage) return null
                        
                        return (
                          <div 
                            className="relative pointer-events-none"
                            style={{
                              // GPU 가속을 위한 최적화
                              willChange: 'transform',
                              contain: 'layout style paint',
                              backfaceVisibility: 'hidden',
                              transform: 'translate3d(0, 0, 0)'
                            }}
                          >
                            {/* 단순화된 드래그 카드 */}
                            <div className="bg-white border-2 border-blue-400 rounded-lg shadow-xl opacity-90 w-40 h-48 p-2 transition-none">
                              {/* 이미지만 표시 - 다른 요소들 제거 */}
                              {draggedPage.canvas ? (
                                <img 
                                  src={draggedPage.canvas} 
                                  alt={`페이지 ${draggedPage.pageNumber}`}
                                  className="w-full h-full object-contain rounded"
                                  draggable={false}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/10 rounded">
                                  <FileText className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            
                            {/* 다중 선택 카운터만 유지 (성능 중요) */}
                            {selectedPages.size > 1 && selectedPages.has(activeId) && (
                              <div className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                                {selectedPages.size}
                              </div>
                            )}
                          </div>
                        )
                      })() : null}
                    </DragOverlay>
                  </DndContext>
                </div>
              </CardContent>
            </Card>
          )}


          {/* 오류 메시지 */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* PDF 생성 및 다운로드 */}
          {pages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  3단계: 편집된 PDF 다운로드
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted/10 border border-border rounded-lg p-4">
                    <p className="text-sm text-foreground">
                      <strong>편집 결과:</strong> {pages.length}페이지로 구성된 새로운 PDF가 생성됩니다.
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={generateEditedPDF}
                      disabled={pages.length === 0 || isGenerating}
                      className="flex-1"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          생성 중...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          편집된 PDF 다운로드
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetForm}
                      disabled={isGenerating}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      초기화
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 사용법 안내 */}
          <div className="mt-8 bg-muted rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-3">💡 사용법</h3>
            <ul className="space-y-2 text-sm text-foreground">
              <li>• PDF 파일을 업로드하면 모든 페이지의 미리보기가 생성됩니다</li>
              <li>• 페이지를 드래그하여 순서를 자유롭게 변경할 수 있습니다</li>
              <li>• <strong>다중 선택 모드:</strong> 여러 페이지를 선택한 후 그 중 하나를 드래그하면 선택된 모든 페이지가 함께 이동됩니다</li>
              <li>• 눈 버튼으로 페이지를 크게 보거나 삭제 버튼으로 제거할 수 있습니다</li>
              <li>• <strong>되돌리기 기능:</strong> 실수로 페이지를 삭제했을 때 '실행 취소' 버튼이나 Ctrl+Z (Windows) / Cmd+Z (Mac) 단축키로 최근 10개 삭제 작업을 되돌릴 수 있습니다</li>
              <li>• <strong>PDF 병합:</strong> 여러 PDF 파일의 페이지를 메인 편집기에 삽입하여 하나의 통합된 환경에서 편집할 수 있습니다</li>
              <li>• 편집이 완료되면 새로운 PDF 파일로 다운로드됩니다</li>
              <li>• 모든 처리는 브라우저에서 진행되어 안전합니다</li>
            </ul>
          </div>

          {/* 크게 보기 모달 */}
          {viewLargePage && (
            <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-2">
              <div className="bg-white rounded-lg max-w-[95vw] max-h-[90vh] md:max-w-[85vw] md:max-h-[90vh] lg:max-w-[80vw] lg:max-h-[90vh] w-full flex flex-col shadow-2xl">
                {/* 모달 헤더 */}
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold">
                    페이지 {viewLargePage.pageNumber} 미리보기
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewLargePage(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                {/* 모달 내용 */}
                <div className="flex-1 p-6 overflow-auto flex items-center justify-center bg-muted/10">
                  {viewLargePage.isLoadingHighRes ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-foreground text-lg font-medium">고해상도 이미지 생성 중...</span>
                      <span className="text-muted-foreground text-sm">잠시만 기다려주세요</span>
                    </div>
                  ) : viewLargePage.highResCanvas ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <img 
                        src={viewLargePage.highResCanvas} 
                        alt={`페이지 ${viewLargePage.pageNumber} 고해상도`}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-border"
                        style={{ maxWidth: '58%', maxHeight: '58%' }}
                      />
                    </div>
                  ) : viewLargePage.canvas ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <img 
                        src={viewLargePage.canvas} 
                        alt={`페이지 ${viewLargePage.pageNumber}`}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-border"
                        style={{ maxWidth: '58%', maxHeight: '58%' }}
                      />
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <FileText className="w-20 h-20 mx-auto mb-4" />
                      <p className="text-lg font-medium">미리보기를 사용할 수 없습니다</p>
                    </div>
                  )}
                </div>
                
                {/* 모달 푸터 */}
                <div className="p-4 border-t bg-muted/10 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setViewLargePage(null)}
                  >
                    닫기
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PDFEditorPage() {
  return (
    <AuthRequired 
      requireAuth={true} 
      featureName="PDF 페이지 교체"
      freeFeature={false}
    >
      <PDFEditorContent />
    </AuthRequired>
  )
}