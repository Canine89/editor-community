'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  MessageSquare,
  Heart,
  Share,
  MoreVertical,
  User,
  Clock,
  Eye,
  Send,
  Edit3,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

interface Post {
  id: string
  title: string
  content: string
  category: string
  author_id: string
  is_anonymous: boolean
  view_count: number
  like_count: number
  created_at: string
  profiles?: {
    full_name: string
    avatar_url: string
  }
}

interface Comment {
  id: string
  content: string
  author_id: string
  post_id: string
  created_at: string
  is_anonymous: boolean
  profiles?: {
    full_name: string
    avatar_url: string
  }
}

const categories = [
  { value: 'general', label: '일반', color: 'bg-gray-500' },
  { value: 'question', label: '질문', color: 'bg-blue-500' },
  { value: 'share', label: '정보공유', color: 'bg-green-500' },
  { value: 'discussion', label: '토론', color: 'bg-purple-500' },
]

export default function PostDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentContent, setCommentContent] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likingPost, setLikingPost] = useState(false)
  const [isAnonymousComment, setIsAnonymousComment] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingPost, setDeletingPost] = useState(false)

  useEffect(() => {
    if (id) {
      loadPost()
      loadComments()
      checkIfLiked()
    }
  }, [id, user])

  // 페이지 포커스 시 데이터 새로고침 (수정 후 돌아왔을 때)
  useEffect(() => {
    const handleFocus = () => {
      if (id && document.visibilityState === 'visible') {
        loadPost()
        loadComments()
      }
    }

    document.addEventListener('visibilitychange', handleFocus)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleFocus)
      window.removeEventListener('focus', handleFocus)
    }
  }, [id])

  // 조회수 증가는 별도 useEffect로 분리 (세션 기반 중복 방지)
  useEffect(() => {
    if (id) {
      incrementViewCountOnce()
    }
  }, [id]) // user 의존성 제거

  const loadPost = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (
            full_name,
            avatar_url
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('게시글 로드 오류:', error)
        return
      }

      setPost(data)
    } catch (error) {
      console.error('게시글 로드 중 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:author_id (
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('댓글 로드 오류:', error)
        return
      }

      setComments(data || [])
    } catch (error) {
      console.error('댓글 로드 중 오류:', error)
    }
  }

  const incrementViewCountOnce = async () => {
    try {
      const postId = Array.isArray(id) ? id[0] : id
      const viewedPostsKey = 'viewed_posts_session'
      
      // 세션 스토리지에서 조회한 게시글 목록 가져오기
      const viewedPosts = JSON.parse(sessionStorage.getItem(viewedPostsKey) || '[]')
      
      // 이미 조회한 게시글인지 확인
      if (viewedPosts.includes(postId)) {
        return // 이미 조회했으면 조회수 증가 안 함
      }
      
      const supabase = createClient()
      
      // 조회수 증가 함수 호출
      const { error } = await (supabase.rpc as any)('increment_post_views', {
        post_uuid: postId
      })

      if (error) {
        console.error('조회수 업데이트 오류:', error)
        return
      }
      
      // 조회한 게시글 목록에 추가
      viewedPosts.push(postId)
      sessionStorage.setItem(viewedPostsKey, JSON.stringify(viewedPosts))
      
      // 조회수만 UI에서 즉시 업데이트 (전체 재로드 없이)
      setPost(prevPost => 
        prevPost ? { ...prevPost, view_count: prevPost.view_count + 1 } : null
      )
    } catch (error) {
      console.error('조회수 업데이트 중 오류:', error)
    }
  }

  const checkIfLiked = async () => {
    if (!user) return

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', id)
        .single()

      if (!error && data) {
        setIsLiked(true)
      }
    } catch (error) {
      // 좋아요 없으면 에러가 나므로 무시
    }
  }

  const handleLike = async () => {
    if (!user || likingPost) return

    setLikingPost(true)

    try {
      const supabase = createClient()

      if (isLiked) {
        // 좋아요 취소
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', id)

        if (error) {
          console.error('좋아요 취소 오류:', error)
          return
        }

        setIsLiked(false)
      } else {
        // 좋아요 추가
        const { error } = await (supabase
          .from('likes') as any)
          .insert({
            user_id: user.id,
            post_id: Array.isArray(id) ? id[0] : id
          })

        if (error) {
          console.error('좋아요 추가 오류:', error)
          return
        }

        setIsLiked(true)
      }

      // 좋아요 수 업데이트
      await (supabase.rpc as any)('update_post_like_count', {
        post_uuid: Array.isArray(id) ? id[0] : id
      })

      // 게시글 새로고침
      await loadPost()
    } catch (error) {
      console.error('좋아요 처리 중 오류:', error)
    } finally {
      setLikingPost(false)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !commentContent.trim()) return

    setSubmittingComment(true)

    try {
      const supabase = createClient()

      const { data, error } = await (supabase
        .from('comments') as any)
        .insert([
          {
            content: commentContent.trim(),
            author_id: user.id,
            post_id: Array.isArray(id) ? id[0] : id,
            is_anonymous: isAnonymousComment
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('댓글 작성 오류:', error)
        return
      }

      // 댓글 목록 새로고침
      await loadComments()
      setCommentContent('')
      setIsAnonymousComment(false)
    } catch (error) {
      console.error('댓글 작성 중 오류:', error)
    } finally {
      setSubmittingComment(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-8 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded"></div>
                    <div className="h-4 bg-slate-200 rounded"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // 게시글 소유권 확인
  const isPostOwner = () => {
    return user && post && user.id === post.author_id
  }

  // 게시글 삭제
  const handleDeletePost = async () => {
    if (!user || !post || !isPostOwner()) return

    setDeletingPost(true)

    try {
      const supabase = createClient()

      // 댓글 삭제 (외래키 제약으로 인해 먼저 삭제)
      await (supabase.from('comments') as any).delete().eq('post_id', post.id)
      
      // 좋아요 삭제  
      await (supabase.from('likes') as any).delete().eq('post_id', post.id)

      // 게시글 삭제
      const { error } = await (supabase.from('posts') as any).delete().eq('id', post.id)

      if (error) {
        console.error('게시글 삭제 오류:', error)
        alert('게시글 삭제 중 오류가 발생했습니다.')
        return
      }

      alert('게시글이 삭제되었습니다.')
      router.push('/community')
    } catch (error) {
      console.error('게시글 삭제 중 오류:', error)
      alert('게시글 삭제 중 오류가 발생했습니다.')
    } finally {
      setDeletingPost(false)
      setShowDeleteDialog(false)
    }
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">게시글을 찾을 수 없습니다</h1>
          <p className="text-slate-600 mb-6">요청하신 게시글이 존재하지 않거나 삭제되었을 수 있습니다.</p>
          <Button asChild>
            <Link href="/community">커뮤니티로 돌아가기</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" asChild>
                <Link href="/community">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <h1 className="text-2xl font-bold text-slate-900">게시글 상세</h1>
            </div>

            {/* 작성자 전용 버튼 */}
            {isPostOwner() && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/community/${post.id}/edit`}>
                    <Edit3 className="w-4 h-4 mr-1" />
                    수정
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={deletingPost}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  삭제
                </Button>
              </div>
            )}
          </div>

          {/* 게시글 본문 */}
          <Card className="mb-8">
            <CardContent className="p-6">
              {/* 카테고리 및 메타 정보 */}
              <div className="flex items-center gap-2 mb-4">
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    categories.find(c => c.value === post.category)?.color || 'bg-gray-500'
                  } text-white`}
                >
                  {categories.find(c => c.value === post.category)?.label || post.category}
                </Badge>
                {post.is_anonymous && (
                  <Badge variant="outline" className="text-xs">
                    익명
                  </Badge>
                )}
              </div>

              {/* 제목 */}
              <h1 className="text-3xl font-bold text-slate-900 mb-4">
                {post.title}
              </h1>

              {/* 작성자 정보 */}
              <div className="flex items-center space-x-3 mb-6">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={post.profiles?.avatar_url} />
                  <AvatarFallback>
                    {post.is_anonymous ? (
                      <User className="w-4 h-4" />
                    ) : (
                      post.profiles?.full_name?.charAt(0)?.toUpperCase() || '익'
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-slate-900">
                    {post.is_anonymous ? '익명' : (post.profiles?.full_name || '사용자')}
                  </div>
                  <div className="text-sm text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(post.created_at)}
                  </div>
                </div>
              </div>

              {/* 내용 */}
              <div className="prose prose-slate max-w-none mb-6">
                <div 
                  className="rich-text-content text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </div>

              {/* 액션 버튼들 */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-4">
                  {user && (
                    <Button 
                      variant={isLiked ? "default" : "outline"} 
                      size="sm"
                      onClick={handleLike}
                      disabled={likingPost}
                      className={isLiked ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                    >
                      {likingPost ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1"></div>
                      ) : (
                        <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                      )}
                      좋아요 {post.like_count}
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Share className="w-4 h-4 mr-1" />
                    공유
                  </Button>
                </div>

                <div className="flex items-center space-x-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    조회 {post.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    좋아요 {post.like_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    댓글 {comments.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 댓글 섹션 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                댓글 {comments.length}개
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* 댓글 작성 폼 */}
              {user && (
                <form onSubmit={handleCommentSubmit} className="space-y-4">
                  <Textarea
                    placeholder="댓글을 입력하세요..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="anonymous-comment"
                        checked={isAnonymousComment}
                        onCheckedChange={(checked) => setIsAnonymousComment(!!checked)}
                      />
                      <Label 
                        htmlFor="anonymous-comment" 
                        className="text-sm text-slate-600 cursor-pointer"
                      >
                        익명으로 댓글 작성
                      </Label>
                    </div>
                    <Button type="submit" disabled={submittingComment || !commentContent.trim()}>
                      {submittingComment ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          작성 중...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          댓글 작성
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {!user && (
                <div className="text-center py-6 bg-slate-50 rounded-lg">
                  <p className="text-slate-600 mb-4">댓글을 작성하려면 로그인이 필요합니다</p>
                  <Button asChild>
                    <Link href="/auth">로그인하기</Link>
                  </Button>
                </div>
              )}

              {/* 댓글 목록 */}
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">아직 댓글이 없습니다</p>
                  <p className="text-sm text-slate-500">첫 번째 댓글을 남겨보세요!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment, index) => (
                    <div key={comment.id}>
                      {index > 0 && <Separator className="my-4" />}
                      <div className="flex space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comment.is_anonymous ? undefined : comment.profiles?.avatar_url} />
                          <AvatarFallback>
                            {comment.is_anonymous ? (
                              <User className="w-3 h-3" />
                            ) : (
                              comment.profiles?.full_name?.charAt(0)?.toUpperCase() || '익'
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-slate-900">
                              {comment.is_anonymous ? '익명' : (comment.profiles?.full_name || '사용자')}
                            </span>
                            {comment.is_anonymous && (
                              <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                                익명
                              </Badge>
                            )}
                            <span className="text-xs text-slate-500">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-slate-700 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-slate-900">
                게시글 삭제 확인
              </h3>
            </div>
            <p className="text-slate-600 mb-6">
              정말로 이 게시글을 삭제하시겠습니까? 
              <br />
              삭제된 게시글은 복구할 수 없습니다.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deletingPost}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePost}
                disabled={deletingPost}
              >
                {deletingPost ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    삭제 중...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    삭제하기
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
