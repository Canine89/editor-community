'use client'

import { useState, useRef, useCallback, useMemo, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  X
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
  
  // 추가 파일 여부 확인을 위한 디버깅 (개발 모드에서만)
  if (process.env.NODE_ENV === 'development' && isAdditionalFile) {
    console.log(`Additional file page ${page.id}: sourceFile="${page.sourceFile}", mainFileName="${mainFileName}"`)
  }

  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition: actualIsDragging ? 'none' : transition,
    opacity: actualIsDragging ? 0.3 : isGroupDragging ? 0.7 : 1,
    scale: actualIsDragging ? 1.05 : isGroupDragging ? 1.02 : 1,
    zIndex: actualIsDragging ? 50 : isGroupDragging ? 10 : 1,
  }), [transform, transition, actualIsDragging, isGroupDragging])

  const containerClasses = useMemo(() => {
    // 추가 파일인 경우 기본 배경을 연한 녹색으로 설정
    let classes = `relative group rounded-lg transition-all duration-200 ${
      isAdditionalFile 
        ? 'bg-green-50' 
        : 'bg-white'
    }`
    
    if (actualIsDragging) {
      classes += ' border-2 border-blue-400 shadow-2xl ring-4 ring-blue-100'
    } else if (isGroupDragging) {
      classes += ' border-2 border-purple-500 bg-purple-100 shadow-xl ring-3 ring-purple-300 animate-pulse'
    } else if (isSelected) {
      classes += ' border-2 border-purple-400 bg-purple-50 shadow-lg ring-2 ring-purple-200'
    } else if (isOver) {
      classes += ' border-2 border-blue-300 bg-blue-50 shadow-lg ring-2 ring-blue-200'
    } else {
      // 추가 파일인 경우 녹색 테두리, 메인 파일인 경우 회색 테두리
      if (isAdditionalFile) {
        classes += ' border-2 border-green-300 hover:border-green-400 shadow-sm hover:shadow-md'
      } else {
        classes += ' border-2 border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
      }
    }
    
    return classes
  }, [actualIsDragging, isGroupDragging, isSelected, isOver, isAdditionalFile])

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={containerClasses}
    >
      {/* 다중 선택 체크박스 */}
      {isMultiSelectMode && onToggleSelect && (
        <div 
          className="absolute top-2 left-2 z-20 p-1 bg-white border border-slate-300 rounded cursor-pointer hover:bg-slate-50"
          onClick={onToggleSelect}
          title="페이지 선택"
        >
          <input
            type="checkbox"
            checked={isSelected || false}
            onChange={() => {}}
            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
          />
        </div>
      )}

      {/* 드래그 핸들 */}
      <div 
        {...attributes}
        {...listeners}
        className={`
          absolute top-2 z-10 p-1 rounded border cursor-grab active:cursor-grabbing 
          transition-all duration-200
          ${isMultiSelectMode ? 'left-10' : 'left-2'}
          ${actualIsDragging ? 
            'bg-blue-500 border-blue-600 opacity-100' : 
            'bg-white border-slate-300 opacity-0 group-hover:opacity-100'
          }
        `}
        title="드래그하여 순서 변경"
      >
        <GripVertical className={`w-4 h-4 ${actualIsDragging ? 'text-white' : 'text-slate-600'}`} />
      </div>

      {/* 페이지 번호 */}
      <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
        {actualIsDragging ? (page.displayPageNumber || page.pageNumber) : (currentIndex + 1)}
      </div>

      {/* 추가 파일 소스 배지 */}
      {isAdditionalFile && page.sourceFile && (
        <div className="absolute top-10 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full max-w-20 truncate"
             title={`소스: ${page.sourceFile} (원본 페이지 ${page.pageNumber})`}>
          {page.sourceFile.replace('.pdf', '').substring(0, 8)}...
        </div>
      )}

      {/* 페이지 이미지 */}
      <div className="w-full h-48 flex items-center justify-center p-4">
        {page.isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-500">로딩 중...</span>
          </div>
        ) : page.canvas ? (
          <img 
            src={page.canvas} 
            alt={`페이지 ${page.pageNumber}`}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="text-slate-400">
            <FileText className="w-8 h-8 mx-auto mb-2" />
            <span className="text-xs">미리보기 없음</span>
          </div>
        )}
      </div>

      {/* 액션 버튼들 */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="secondary"
          onClick={onViewLarge}
          className="h-8 w-8 p-0"
          title="크게 보기"
        >
          <Eye className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onDelete}
          className="h-8 w-8 p-0"
          title="페이지 삭제"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
})

export default function PDFEditorPage() {
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // displayPageNumber를 순차적으로 할당하는 도우미 함수
  const assignDisplayPageNumbers = useCallback((pagesArray: PDFPageData[]): PDFPageData[] => {
    const result = pagesArray.map((page, index) => ({
      ...page,
      displayPageNumber: index + 1
    }))
    // 개발 모드에서만 할당 결과 로그
    if (process.env.NODE_ENV === 'development') {
      console.log('displayPageNumber 할당 결과:', result.map(p => ({ 
        id: p.id, 
        pageNumber: p.pageNumber, 
        displayPageNumber: p.displayPageNumber, 
        sourceFile: p.sourceFile?.substring(0, 20) + '...' 
      })))
    }
    return result
  }, [])

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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const draggedPageId = event.active.id as string
    setActiveId(draggedPageId)
    setOverId(null)
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over?.id as string
    setOverId(overId || null)
    
    if (overId && activeId && activeId !== overId) {
      const activeIndex = pageIndexMap.get(activeId) ?? -1
      const overIndex = pageIndexMap.get(overId) ?? -1
      
      if (activeIndex !== -1 && overIndex !== -1) {
        // 드래그하는 페이지가 target 페이지보다 앞에 있으면 오른쪽에, 뒤에 있으면 왼쪽에 표시
        const position = activeIndex < overIndex ? 'after' : 'before'
        setDropPosition({ pageId: overId, position })
      }
    } else {
      setDropPosition(null)
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

  const deletePage = (pageId: string) => {
    setPages(pages => {
      const filteredPages = pages.filter(page => page.id !== pageId)
      return assignDisplayPageNumbers(filteredPages)
    })
  }

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

  const deleteSelectedPages = () => {
    setPages(pages => pages.filter(page => !selectedPages.has(page.id)))
    clearSelection()
  }

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

  return (
    <div className="min-h-screen bg-slate-50">
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
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-6 h-6 text-purple-600" />
                PDF 페이지 편집기
              </h1>
              <p className="text-slate-600">드래그앤드롭으로 PDF 페이지 순서를 변경하고 편집하세요</p>
            </div>
          </div>

          {/* 안내사항 */}
          <Alert className="mb-6 border-purple-200 bg-purple-50">
            <Info className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-800">
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
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
                  <div className="text-sm text-slate-600">
                    총 {pages.length}페이지
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-blue-800 text-sm">
                      <Info className="w-4 h-4" />
                      <span>드래그하여 순서 변경, 버튼으로 복제/삭제가 가능합니다</span>
                    </div>
                  </div>

                  {/* 다중 선택 컨트롤 */}
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <Button
                        variant={isMultiSelectMode ? "default" : "outline"}
                        size="sm"
                        onClick={toggleMultiSelectMode}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={isMultiSelectMode}
                          onChange={() => {}}
                          className="w-4 h-4"
                        />
                        다중 선택
                      </Button>
                      
                      {isMultiSelectMode && (
                        <>
                          <span className="text-sm text-slate-600">
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
                          className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
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
                                <span className="text-sm text-slate-700 truncate flex-1">
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
                      {activeId ? (
                        <div className="relative">
                          {/* 메인 드래그 카드 */}
                          <div className="bg-white border-2 border-blue-400 rounded-lg shadow-2xl ring-4 ring-blue-100 opacity-90">
                            {(() => {
                              const draggedPage = pages.find(p => p.id === activeId)
                              return draggedPage ? (
                                <div className="w-40 h-48 p-4">
                                  {draggedPage.canvas ? (
                                    <img 
                                      src={draggedPage.canvas} 
                                      alt={`페이지 ${draggedPage.pageNumber}`}
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                      <FileText className="w-8 h-8" />
                                    </div>
                                  )}
                                  <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                                    {draggedPage.pageNumber}
                                  </div>
                                </div>
                              ) : null
                            })()}
                          </div>
                          
                          {/* 다중 선택 카운터 */}
                          {selectedPages.size > 0 && selectedPages.has(activeId) && (
                            <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                              {selectedPages.size}
                            </div>
                          )}
                        </div>
                      ) : null}
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
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-sm text-slate-700">
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
          <div className="mt-8 bg-slate-100 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 mb-3">💡 사용법</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• PDF 파일을 업로드하면 모든 페이지의 미리보기가 생성됩니다</li>
              <li>• 페이지를 드래그하여 순서를 자유롭게 변경할 수 있습니다</li>
              <li>• <strong>다중 선택 모드:</strong> 여러 페이지를 선택한 후 그 중 하나를 드래그하면 선택된 모든 페이지가 함께 이동됩니다</li>
              <li>• 눈 버튼으로 페이지를 크게 보거나 삭제 버튼으로 제거할 수 있습니다</li>
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
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                {/* 모달 내용 */}
                <div className="flex-1 p-6 overflow-auto flex items-center justify-center bg-slate-50">
                  {viewLargePage.isLoadingHighRes ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-slate-700 text-lg font-medium">고해상도 이미지 생성 중...</span>
                      <span className="text-slate-500 text-sm">잠시만 기다려주세요</span>
                    </div>
                  ) : viewLargePage.highResCanvas ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <img 
                        src={viewLargePage.highResCanvas} 
                        alt={`페이지 ${viewLargePage.pageNumber} 고해상도`}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-slate-200"
                        style={{ maxWidth: '58%', maxHeight: '58%' }}
                      />
                    </div>
                  ) : viewLargePage.canvas ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <img 
                        src={viewLargePage.canvas} 
                        alt={`페이지 ${viewLargePage.pageNumber}`}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-slate-200"
                        style={{ maxWidth: '58%', maxHeight: '58%' }}
                      />
                    </div>
                  ) : (
                    <div className="text-center text-slate-400">
                      <FileText className="w-20 h-20 mx-auto mb-4" />
                      <p className="text-lg font-medium">미리보기를 사용할 수 없습니다</p>
                    </div>
                  )}
                </div>
                
                {/* 모달 푸터 */}
                <div className="p-4 border-t bg-slate-50 flex justify-center">
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