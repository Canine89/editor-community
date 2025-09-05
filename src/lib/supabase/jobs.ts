import { supabase } from './client'

export interface JobPosting {
  id: string
  author_id: string
  role: string
  employment_type: 'full-time' | 'part-time' | 'freelance' | 'contract'
  pay_range: string
  skills: string[]
  location: string
  is_remote: boolean
  description: string
  requirements: string
  benefits: string
  due_date: string | null
  status: 'active' | 'paused' | 'closed'
  created_at: string
  updated_at: string
  profiles?: {
    nickname: string
  }
}

// 구인구직 공고 목록 조회
export async function getJobPostings(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('job_postings')
    .select(`
      *,
      profiles:user_id (
        nickname
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data as JobPosting[]
}

// 구인구직 공고 단일 조회
export async function getJobPosting(id: string) {
  const { data, error } = await supabase
    .from('job_postings')
    .select(`
      *,
      profiles:user_id (
        nickname
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as JobPosting
}

// 구인구직 공고 생성
export async function createJobPosting(jobPosting: {
  role: string
  employment_type: 'full-time' | 'part-time' | 'freelance' | 'contract'
  pay_range?: string
  skills?: string[]
  location?: string
  is_remote?: boolean
  description: string
  requirements?: string
  benefits?: string
  due_date?: string
}) {
  const { data, error } = await supabase
    .from('job_postings')
    .insert({
      ...jobPosting,
      author_id: (await supabase.auth.getUser()).data.user?.id,
      skills: jobPosting.skills || [],
      is_remote: jobPosting.is_remote || false
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// 구인구직 공고 수정
export async function updateJobPosting(id: string, updates: Partial<{
  role: string
  employment_type: 'full-time' | 'part-time' | 'freelance' | 'contract'
  pay_range: string
  skills: string[]
  location: string
  is_remote: boolean
  description: string
  requirements: string
  benefits: string
  due_date: string
  status: 'active' | 'paused' | 'closed'
}>) {
  const { data, error } = await supabase
    .from('job_postings')
    .update(updates)
    .eq('id', id)
    .eq('author_id', (await supabase.auth.getUser()).data.user?.id)
    .select()
    .single()

  if (error) throw error
  return data
}

// 구인구직 공고 삭제
export async function deleteJobPosting(id: string) {
  const { error } = await supabase
    .from('job_postings')
    .delete()
    .eq('id', id)
    .eq('author_id', (await supabase.auth.getUser()).data.user?.id)

  if (error) throw error
}

// 구인구직 공고 검색/필터링
export async function searchJobPostings(filters: {
  role?: string
  employment_type?: string
  location?: string
  is_remote?: boolean
  skills?: string[]
}, limit = 20, offset = 0) {
  let query = supabase
    .from('job_postings')
    .select(`
      *,
      profiles:user_id (
        nickname
      )
    `)
    .eq('status', 'active')

  if (filters.role) {
    query = query.ilike('role', `%${filters.role}%`)
  }

  if (filters.employment_type) {
    query = query.eq('employment_type', filters.employment_type)
  }

  if (filters.location) {
    query = query.ilike('location', `%${filters.location}%`)
  }

  if (filters.is_remote !== undefined) {
    query = query.eq('is_remote', filters.is_remote)
  }

  if (filters.skills && filters.skills.length > 0) {
    query = query.contains('skills', filters.skills)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data as JobPosting[]
}
