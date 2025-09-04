import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 브라우저에서 사용할 클라이언트
export function createClient() {
  const client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  return client
}

// 테이블 존재 여부 확인 함수
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const client = createClient()
    const { error } = await client
      .from(tableName)
      .select('id')
      .limit(1)

    return !error
  } catch (error) {
    console.error(`테이블 ${tableName} 확인 중 오류:`, error)
    return false
  }
}
