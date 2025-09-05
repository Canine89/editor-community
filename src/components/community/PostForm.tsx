'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { createPost, BOARD_IDS } from '@/lib/supabase/posts'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface PostFormProps {
  boardType?: 'anonymous' | 'job'
  onSuccess?: () => void
}

export function PostForm({ boardType = 'anonymous', onSuccess }: PostFormProps) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !body.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }

    setIsLoading(true)

    try {
      const boardId = boardType === 'anonymous' ? BOARD_IDS.ANONYMOUS : BOARD_IDS.JOB

      await createPost({
        board_id: boardId,
        title: title.trim(),
        body: body.trim(),
        is_anonymous: isAnonymous
      })

      // 성공 시
      setTitle('')
      setBody('')
      onSuccess?.()
      router.refresh()

      alert('게시글이 성공적으로 작성되었습니다!')
    } catch (error) {
      console.error('게시글 작성 실패:', error)
      alert('게시글 작성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>새 글 작성</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="게시글 제목을 입력하세요"
              maxLength={100}
              required
            />
            <div className="text-sm text-slate-500">
              {title.length}/100
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">내용</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="게시글 내용을 입력하세요"
              rows={8}
              maxLength={2000}
              required
            />
            <div className="text-sm text-slate-500">
              {body.length}/2000
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
            />
            <Label htmlFor="anonymous" className="text-sm">
              익명으로 작성 (작성자 정보가 표시되지 않습니다)
            </Label>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  작성 중...
                </>
              ) : (
                '게시글 작성'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTitle('')
                setBody('')
              }}
            >
              초기화
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
