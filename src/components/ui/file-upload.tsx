'use client'

import { useRef, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  Upload,
  File,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  FileSpreadsheet
} from 'lucide-react'

interface FileUploadProps {
  accept: string
  maxSize?: number // bytes
  onFileSelect: (file: File) => void
  onFileRemove?: () => void
  multiple?: boolean
  className?: string
  disabled?: boolean
  title: string
  description: string
  selectedFile?: File | null
  error?: string
  loading?: boolean
  progress?: number
}

interface FileWithPreview extends File {
  preview?: string
}

export function FileUpload({
  accept,
  maxSize = 50 * 1024 * 1024, // 50MB default
  onFileSelect,
  onFileRemove,
  multiple = false,
  className,
  disabled = false,
  title,
  description,
  selectedFile,
  error,
  loading = false,
  progress
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [dragError, setDragError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (['pdf'].includes(ext || '')) return FileText
    if (['docx', 'doc'].includes(ext || '')) return FileText
    if (['xlsx', 'xls'].includes(ext || '')) return FileSpreadsheet
    return File
  }

  const validateFile = (file: File): string | null => {
    // 파일 크기 검증
    if (file.size > maxSize) {
      return `파일 크기가 ${formatFileSize(maxSize)}를 초과합니다.`
    }

    // 파일 형식 검증
    const acceptedTypes = accept.split(',').map(type => type.trim())
    const isAccepted = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase())
      } else {
        return file.type === type
      }
    })

    if (!isAccepted) {
      return `지원하지 않는 파일 형식입니다. (${accept})`
    }

    return null
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragActive(true)
    }
  }, [disabled])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    setDragError('')
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    setDragError('')

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    const file = files[0]

    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      setDragError(validationError)
      return
    }

    onFileSelect(file)
  }, [disabled, onFileSelect, accept, maxSize])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      setDragError(validationError)
      return
    }

    onFileSelect(file)
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleRemoveFile = () => {
    if (onFileRemove) {
      onFileRemove()
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setDragError('')
  }

  const FileIcon = selectedFile ? getFileIcon(selectedFile) : File

  return (
    <div className={cn('w-full', className)}>
      {/* 파일 업로드 영역 */}
      {!selectedFile ? (
        <Card
          className={cn(
            'card-editorial border-2 border-dashed transition-all duration-300 cursor-pointer',
            isDragActive && !disabled && 'border-primary bg-primary/5 shadow-lg scale-105',
            disabled && 'opacity-60 cursor-not-allowed',
            (error || dragError) && 'border-destructive bg-destructive/5',
            !isDragActive && !error && !dragError && 'border-border hover:border-primary/50 hover:bg-muted/20 hover-lift-editorial'
          )}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <CardContent className="flex flex-col items-center justify-center py-12 px-6">
            <div className={cn(
              'w-16 h-16 rounded-3xl flex items-center justify-center mb-6 transition-all duration-300',
              isDragActive && !disabled ? 'gradient-primary animate-pulse' : 'bg-muted',
              (error || dragError) && 'bg-destructive/20'
            )}>
              <Upload className={cn(
                'w-8 h-8 transition-colors',
                isDragActive && !disabled && 'text-primary-foreground',
                (error || dragError) && 'text-destructive',
                !isDragActive && !error && !dragError && 'text-muted-foreground'
              )} />
            </div>

            <h3 className="text-xl font-bold text-foreground mb-2">
              {title}
            </h3>
            <p className="text-muted-foreground text-center mb-6 leading-relaxed">
              {description}
            </p>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <span>지원 형식: {accept}</span>
              <span>•</span>
              <span>최대 크기: {formatFileSize(maxSize)}</span>
            </div>

            <Button
              variant="outline"
              className="hover-lift-editorial"
              disabled={disabled}
            >
              {isDragActive ? '파일을 놓으세요' : '파일 선택하기'}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileInput}
              className="hidden"
              disabled={disabled}
              multiple={multiple}
            />
          </CardContent>
        </Card>
      ) : (
        /* 선택된 파일 표시 */
        <Card className="card-editorial">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center flex-shrink-0">
                <FileIcon className="w-7 h-7 text-primary-foreground" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground truncate">
                    {selectedFile.name}
                  </h4>
                  {!loading && (
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </div>
                
                {/* 진행률 표시 */}
                {loading && typeof progress === 'number' && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">처리 중...</span>
                      <span className="text-xs text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveFile}
                disabled={loading}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 오류 메시지 */}
      {(error || dragError) && (
        <Alert className="mt-4 border-destructive bg-destructive/5">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            {error || dragError}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default FileUpload