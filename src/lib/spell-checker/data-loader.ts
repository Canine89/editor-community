import { createClient } from '@/lib/supabase'
import { SpellDatabase } from './types'

export class SpellDataLoader {
  private static instance: SpellDataLoader
  private database: SpellDatabase | null = null
  private loading: boolean = false
  private supabase = createClient()

  static getInstance(): SpellDataLoader {
    if (!SpellDataLoader.instance) {
      SpellDataLoader.instance = new SpellDataLoader()
    }
    return SpellDataLoader.instance
  }

  async loadDatabase(): Promise<SpellDatabase> {
    if (this.database) {
      return this.database
    }

    if (this.loading) {
      // 이미 로딩 중인 경우 대기
      return new Promise((resolve, reject) => {
        const checkLoading = () => {
          if (!this.loading) {
            if (this.database) {
              resolve(this.database)
            } else {
              reject(new Error('데이터베이스 로드 실패'))
            }
          } else {
            setTimeout(checkLoading, 100)
          }
        }
        checkLoading()
      })
    }

    this.loading = true

    try {
      
      // 1. Supabase Storage에서 시도
      const supabaseData = await this.loadFromSupabase()
      if (supabaseData) {
        this.database = supabaseData
        this.loading = false
        return this.database
      }
    } catch (error) {
      console.warn('Supabase 로드 실패, 로컬 파일 사용:', error)
    }

    try {
      // 2. 로컬 파일에서 로드
      const localData = await this.loadFromLocal()
      this.database = localData
      this.loading = false
      return this.database
    } catch (error) {
      this.loading = false
      console.error('모든 데이터 소스에서 로드 실패:', error)
      throw new Error('맞춤법 데이터를 로드할 수 없습니다. 네트워크 연결을 확인해주세요.')
    }
  }

  private async loadFromSupabase(): Promise<SpellDatabase | null> {
    try {
      
      const { data, error } = await this.supabase.storage
        .from('spell-checker-data')
        .download('it-spell-rules.json')
      
      if (error) {
        console.warn('Supabase Storage 오류:', error)
        return null
      }
      
      if (!data) {
        console.warn('Supabase에서 데이터를 받지 못함')
        return null
      }
      
      const text = await data.text()
      const parsed = JSON.parse(text) as SpellDatabase
      
      return parsed
    } catch (error) {
      console.warn('Supabase 로드 중 오류:', error)
      return null
    }
  }

  private async loadFromLocal(): Promise<SpellDatabase> {
    try {
      
      const response = await fetch('/data/it-spell-rules.json', {
        cache: 'no-cache', // 개발 중 캐시 방지
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`로컬 파일 로드 실패: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json() as SpellDatabase
      
      return data
    } catch (error) {
      console.error('로컬 파일 로드 오류:', error)
      throw error
    }
  }

  // 캐시 무효화 (개발/테스트용)
  clearCache() {
    this.database = null
    this.loading = false
  }

  // 데이터베이스 상태 확인
  getStatus() {
    return {
      loaded: !!this.database,
      loading: this.loading,
      version: this.database?.version || null,
      totalRules: this.database?.totalRules || 0,
      lastUpdated: this.database?.lastUpdated || null
    }
  }

  // Supabase에 데이터 업로드 (관리자용)
  async uploadToSupabase(data: SpellDatabase): Promise<boolean> {
    try {
      
      const jsonData = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonData], { type: 'application/json' })
      
      const { error } = await this.supabase.storage
        .from('spell-checker-data')
        .upload('it-spell-rules.json', blob, {
          upsert: true,
          contentType: 'application/json'
        })
      
      if (error) {
        console.error('Supabase 업로드 오류:', error)
        return false
      }
      
      // 캐시 업데이트
      this.database = data
      return true
    } catch (error) {
      console.error('업로드 중 오류:', error)
      return false
    }
  }

  // 개발모드에서 로컬 파일 우선 사용
  async loadDatabaseForDev(): Promise<SpellDatabase> {
    if (process.env.NODE_ENV === 'development') {
      try {
        const localData = await this.loadFromLocal()
        this.database = localData
        return localData
      } catch (error) {
        console.warn('로컬 파일 로드 실패, Supabase 시도:', error)
        return await this.loadDatabase()
      }
    }
    
    return await this.loadDatabase()
  }
}

// 싱글톤 인스턴스 내보내기
export const spellDataLoader = SpellDataLoader.getInstance()