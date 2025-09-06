export interface SpellRule {
  id: string
  wrong: string | string[]           // 틀린 표현들
  correct: string                    // 올바른 표현
  type: 'spacing' | 'terminology' | 'grammar' | 'punctuation' | 'foreign' | 'numbers'
  description: string
  examples: string[]
  priority: 1 | 2 | 3 | 4 | 5       // 5가 최고 우선순위
  contextRules?: string[]            // 문맥 조건 (옵션)
}

export interface SpellCategory {
  name: string
  description: string
  rules: SpellRule[]
}

export interface SpellDatabase {
  version: string
  lastUpdated: string
  totalRules: number
  categories: Record<string, SpellCategory>
}

export interface SpellMatch {
  ruleId: string
  original: string
  corrected: string
  startIndex: number
  endIndex: number
  category: string
  priority: number
  description: string
  examples: string[]
  type: SpellRule['type']
}

export interface SpellCheckOptions {
  enabledCategories: string[]
  strictMode: boolean
  ignoreCase: boolean
}

export interface SpellCheckResult {
  matches: SpellMatch[]
  totalErrors: number
  categoryCounts: Record<string, number>
  processingTime: number
}

// 카테고리 정의
export const SPELL_CATEGORIES = {
  basic: { key: 'basic', name: '기본 한글 맞춤법', color: 'red' },
  it_terms: { key: 'it_terms', name: 'IT 전문용어', color: 'blue' },
  foreign: { key: 'foreign', name: '외래어/영어 표기', color: 'green' },
  punctuation: { key: 'punctuation', name: '문장부호 및 기호', color: 'purple' },
  grammar: { key: 'grammar', name: '문법 및 조사', color: 'orange' },
  numbers: { key: 'numbers', name: '숫자 및 단위', color: 'teal' },
  business: { key: 'business', name: '업무 용어', color: 'indigo' },
  common_errors: { key: 'common_errors', name: '자주 틀리는 맞춤법', color: 'pink' },
  tech_acronyms: { key: 'tech_acronyms', name: '기술 약어', color: 'cyan' },
  content: { key: 'content', name: '콘텐츠 관련', color: 'yellow' },
  trends: { key: 'trends', name: '트렌드 용어', color: 'emerald' }
} as const

export type CategoryKey = keyof typeof SPELL_CATEGORIES