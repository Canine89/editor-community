// 메인 진입점 파일
export { SpellCheckEngine } from './engine'
export { SpellDataLoader, spellDataLoader } from './data-loader'
export * from './types'

// 편의 함수들
import { spellDataLoader } from './data-loader'
import { SpellCheckEngine } from './engine'
import { SpellCheckOptions } from './types'

let cachedEngine: SpellCheckEngine | null = null

/**
 * 맞춤법 검사 엔진을 초기화하고 반환합니다.
 * 첫 호출시에만 데이터를 로드하고, 이후에는 캐시된 인스턴스를 반환합니다.
 */
export async function getSpellChecker(): Promise<SpellCheckEngine> {
  if (cachedEngine) {
    return cachedEngine
  }

  try {
    console.log('맞춤법 검사 엔진 초기화 중...')
    const database = await spellDataLoader.loadDatabaseForDev()
    cachedEngine = new SpellCheckEngine(database)
    console.log('맞춤법 검사 엔진 초기화 완료')
    return cachedEngine
  } catch (error) {
    console.error('맞춤법 검사 엔진 초기화 실패:', error)
    throw error
  }
}

/**
 * 간단한 맞춤법 검사 함수
 */
export async function checkSpelling(text: string, options?: Partial<SpellCheckOptions>) {
  const engine = await getSpellChecker()
  return engine.checkText(text, options)
}

/**
 * 텍스트에 수정사항을 적용하는 함수
 */
export async function applySpellCorrections(text: string, options?: Partial<SpellCheckOptions>) {
  const engine = await getSpellChecker()
  const result = engine.checkText(text, options)
  const correctedText = engine.applyCorrections(text, result.matches)
  return {
    original: text,
    corrected: correctedText,
    matches: result.matches,
    totalErrors: result.totalErrors
  }
}

/**
 * 캐시된 엔진을 클리어합니다 (개발/테스트용)
 */
export function clearSpellCheckerCache() {
  cachedEngine = null
  spellDataLoader.clearCache()
  console.log('맞춤법 검사 엔진 캐시 클리어')
}