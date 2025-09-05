import { supabase } from './client'

export interface Post {
  id: string
  board_id: string
  author_id: string
  is_anonymous: boolean
  title: string
  body: string
  created_at: string
  updated_at: string
  profiles?: {
    nickname: string
  }
}

// 게시글 목록 조회
export async function getPosts(boardType: 'anonymous' | 'job' = 'anonymous', limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (
        nickname
      )
    `)
    .eq('board_id', boardType === 'anonymous'
      ? '550e8400-e29b-41d4-a716-446655440000' // 익명 게시판 ID
      : '550e8400-e29b-41d4-a716-446655440001' // 구인구직 게시판 ID
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data as Post[]
}

// 게시글 단일 조회
export async function getPost(id: string) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (
        nickname
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Post
}

// 게시글 생성
export async function createPost(post: {
  board_id: string
  title: string
  body: string
  is_anonymous?: boolean
}) {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      ...post,
      author_id: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// 게시글 수정
export async function updatePost(id: string, updates: {
  title?: string
  body?: string
  is_anonymous?: boolean
}) {
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', id)
    .eq('author_id', (await supabase.auth.getUser()).data.user?.id)
    .select()
    .single()

  if (error) throw error
  return data
}

// 게시글 삭제
export async function deletePost(id: string) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)
    .eq('author_id', (await supabase.auth.getUser()).data.user?.id)

  if (error) throw error
}

// 게시판 ID 상수
export const BOARD_IDS = {
  ANONYMOUS: '550e8400-e29b-41d4-a716-446655440000',
  JOB: '550e8400-e29b-41d4-a716-446655440001'
} as const
