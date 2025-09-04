'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAdmin } from '@/hooks/useAdmin'
import AdminLayout from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Upload,
  File,
  CheckCircle,
  XCircle,
  Trash2,
  Download,
  AlertTriangle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getBookSalesFiles } from '@/lib/book-sales'

interface UploadFile {
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

export default function FileManagementPage() {
  const { isAdmin, logActivity } = useAdmin()
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [existingFiles, setExistingFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  // Validate filename pattern
  const validateFileName = (filename: string): boolean => {
    const pattern = /^yes24_\d{4}_\d{4}\.json$/
    return pattern.test(filename)
  }

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newUploadFiles = acceptedFiles.map(file => ({
      file,
      status: 'pending' as const,
      progress: 0,
      error: validateFileName(file.name) ? undefined : '파일명이 올바르지 않습니다 (예: yes24_2025_0904.json)'
    }))

    setUploadFiles(prev => [...prev, ...newUploadFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    multiple: true
  })

  // Upload files to Supabase Storage
  const uploadToStorage = async () => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending' && !f.error)
    
    for (const uploadFile of pendingFiles) {
      try {
        // Update status to uploading
        setUploadFiles(prev => 
          prev.map(f => 
            f.file === uploadFile.file 
              ? { ...f, status: 'uploading' as const, progress: 0 }
              : f
          )
        )

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('book-sales-data')
          .upload(uploadFile.file.name, uploadFile.file, {
            cacheControl: '3600',
            upsert: true // Replace if exists
          })

        if (error) {
          throw error
        }

        // Update status to success
        setUploadFiles(prev => 
          prev.map(f => 
            f.file === uploadFile.file 
              ? { ...f, status: 'success' as const, progress: 100 }
              : f
          )
        )

        logActivity('upload_book_sales_file', { filename: uploadFile.file.name })
      } catch (error) {
        console.error('Upload error:', error)
        setUploadFiles(prev => 
          prev.map(f => 
            f.file === uploadFile.file 
              ? { 
                  ...f, 
                  status: 'error' as const, 
                  error: error instanceof Error ? error.message : '업로드 실패'
                }
              : f
          )
        )
      }
    }

    // Refresh existing files
    loadExistingFiles()
  }

  // Load existing files from Storage
  const loadExistingFiles = async () => {
    try {
      setLoading(true)
      const files = await getBookSalesFiles()
      setExistingFiles(files)
    } catch (error) {
      console.error('Failed to load existing files:', error)
    } finally {
      setLoading(false)
    }
  }

  // Delete file from Storage
  const deleteFile = async (filename: string) => {
    try {
      const { error } = await supabase.storage
        .from('book-sales-data')
        .remove([filename])

      if (error) {
        throw error
      }

      logActivity('delete_book_sales_file', { filename })
      loadExistingFiles()
    } catch (error) {
      console.error('Delete error:', error)
      alert('파일 삭제 중 오류가 발생했습니다.')
    }
  }

  // Download file from Storage
  const downloadFile = async (filename: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('book-sales-data')
        .download(filename)

      if (error) {
        throw error
      }

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      alert('파일 다운로드 중 오류가 발생했습니다.')
    }
  }

  // Clear upload list
  const clearUploads = () => {
    setUploadFiles([])
  }

  // Load existing files on component mount
  React.useEffect(() => {
    if (isAdmin) {
      loadExistingFiles()
    }
  }, [isAdmin])

  const canUpload = uploadFiles.some(f => f.status === 'pending' && !f.error)

  return (
    <AdminLayout 
      title="파일 관리" 
      description="도서 판매 데이터 JSON 파일 업로드 및 관리"
    >
      <div className="space-y-6">
        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              파일 업로드
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drag & Drop Zone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-blue-600">파일을 여기에 놓아주세요</p>
              ) : (
                <div>
                  <p className="text-slate-600 mb-2">
                    JSON 파일을 드래그하거나 클릭하여 업로드
                  </p>
                  <p className="text-xs text-slate-500">
                    파일명 형식: yes24_YYYY_MMDD.json
                  </p>
                </div>
              )}
            </div>

            {/* Upload Files List */}
            {uploadFiles.length > 0 && (
              <div className="space-y-2">
                {uploadFiles.map((uploadFile, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <File className="w-4 h-4 text-slate-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{uploadFile.file.name}</p>
                      <p className="text-xs text-slate-500">
                        {Math.round(uploadFile.file.size / 1024)} KB
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {uploadFile.status === 'uploading' && (
                        <Progress value={uploadFile.progress} className="w-20" />
                      )}
                      {uploadFile.status === 'success' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {(uploadFile.status === 'error' || uploadFile.error) && (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex gap-2 pt-2">
                  <Button onClick={uploadToStorage} disabled={!canUpload}>
                    업로드 시작
                  </Button>
                  <Button variant="outline" onClick={clearUploads}>
                    목록 지우기
                  </Button>
                </div>
              </div>
            )}

            {/* Upload Errors */}
            {uploadFiles.some(f => f.error) && (
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  일부 파일에 오류가 있습니다. 파일명이 올바른지 확인해주세요.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Existing Files Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="w-5 h-5" />
              기존 파일 목록
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600">파일 목록 로딩 중...</p>
              </div>
            ) : existingFiles.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                업로드된 파일이 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {existingFiles.map((file) => (
                  <div key={file.filename} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <File className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-sm font-medium">{file.filename}</p>
                        <p className="text-xs text-slate-500">{file.displayDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => downloadFile(file.filename)}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          if (confirm(`${file.filename} 파일을 삭제하시겠습니까?`)) {
                            deleteFile(file.filename)
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}