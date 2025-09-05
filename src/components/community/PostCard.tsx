import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Post } from '@/lib/supabase/posts'
import { MessageSquare, User, Calendar } from 'lucide-react'
import Link from 'next/link'

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const displayName = post.is_anonymous
    ? '익명'
    : (post.profiles?.nickname || '사용자')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg hover:text-blue-600 transition-colors">
            <Link href={`/community/${post.id}`}>
              {post.title}
            </Link>
          </CardTitle>
          {post.is_anonymous && (
            <Badge variant="secondary" className="ml-2">
              익명
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
          {post.body}
        </p>
        <div className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <User className="w-4 h-4" />
              <span>{displayName}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(post.created_at)}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/community/${post.id}`}>
              <MessageSquare className="w-4 h-4 mr-1" />
              자세히 보기
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
