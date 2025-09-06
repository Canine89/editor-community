import { SpellDatabase, SpellRule, SpellMatch, SpellCheckOptions, SpellCheckResult, CategoryKey } from './types'

export class SpellCheckEngine {
  private database: SpellDatabase
  private allRules: SpellRule[] = []
  private categoryMap: Map<string, CategoryKey> = new Map()

  constructor(database: SpellDatabase) {
    this.database = database
    this.initializeRules()
  }

  private initializeRules() {
    // 모든 카테고리의 규칙을 우선순위순으로 정렬
    Object.entries(this.database.categories).forEach(([categoryKey, category]) => {
      category.rules.forEach(rule => {
        this.allRules.push(rule)
        this.categoryMap.set(rule.id, categoryKey as CategoryKey)
      })
    })
    
    // 우선순위 높은 순으로 정렬 (5 → 1)
    this.allRules.sort((a, b) => b.priority - a.priority)
    
  }

  checkText(text: string, options: Partial<SpellCheckOptions> = {}): SpellCheckResult {
    const startTime = performance.now()
    
    const defaultOptions: SpellCheckOptions = {
      enabledCategories: [],
      strictMode: false,
      ignoreCase: false
    }
    
    const finalOptions = { ...defaultOptions, ...options }
    const matches: SpellMatch[] = []
    
    // 카테고리 필터링
    const rulesToCheck = finalOptions.enabledCategories.length > 0 
      ? this.allRules.filter(rule => {
          const category = this.categoryMap.get(rule.id)
          return category && finalOptions.enabledCategories.includes(category)
        })
      : this.allRules


    // 각 규칙에 대해 매치 검색
    rulesToCheck.forEach(rule => {
      const ruleMatches = this.findMatches(text, rule, finalOptions)
      matches.push(...ruleMatches)
    })

    // 겹치는 매치 제거 (우선순위 기반)
    const processedMatches = this.removeDuplicateMatches(matches)
    
    // 카테고리별 개수 계산
    const categoryCounts: Record<string, number> = {}
    processedMatches.forEach(match => {
      categoryCounts[match.category] = (categoryCounts[match.category] || 0) + 1
    })

    const processingTime = performance.now() - startTime
    

    return {
      matches: processedMatches,
      totalErrors: processedMatches.length,
      categoryCounts,
      processingTime
    }
  }

  private findMatches(text: string, rule: SpellRule, options: SpellCheckOptions): SpellMatch[] {
    const matches: SpellMatch[] = []
    const wrongPatterns = Array.isArray(rule.wrong) ? rule.wrong : [rule.wrong]
    const category = this.categoryMap.get(rule.id)!
    
    wrongPatterns.forEach(wrongPattern => {
      try {
        // 정규식 특수문자 이스케이프
        const escapedPattern = this.escapeRegExp(wrongPattern)
        const flags = options.ignoreCase ? 'gi' : 'g'
        const regex = new RegExp(escapedPattern, flags)
        
        const textMatches = Array.from(text.matchAll(regex))
        
        textMatches.forEach(match => {
          if (match.index !== undefined) {
            // 문맥 검사 (추후 구현 가능)
            if (this.validateContext(text, match.index, rule)) {
              matches.push({
                ruleId: rule.id,
                original: match[0],
                corrected: rule.correct,
                startIndex: match.index,
                endIndex: match.index + match[0].length,
                category,
                priority: rule.priority,
                description: rule.description,
                examples: rule.examples,
                type: rule.type
              })
            }
          }
        })
      } catch (error) {
        console.warn(`규칙 ${rule.id} 처리 오류:`, error)
      }
    })

    return matches
  }

  private validateContext(text: string, index: number, rule: SpellRule): boolean {
    // 기본적으로 모든 매치를 허용
    // 추후 contextRules가 있는 경우 문맥 검사 로직 추가
    return true
  }

  private removeDuplicateMatches(matches: SpellMatch[]): SpellMatch[] {
    const filtered: SpellMatch[] = []
    
    // 위치순으로 정렬
    matches.sort((a, b) => {
      if (a.startIndex !== b.startIndex) {
        return a.startIndex - b.startIndex
      }
      return b.priority - a.priority // 같은 위치면 우선순위 높은 것 우선
    })
    
    matches.forEach(match => {
      // 같은 위치에서 겹치는 다른 매치가 있는지 확인
      const overlapping = filtered.find(existing => 
        this.isOverlapping(match, existing)
      )
      
      if (!overlapping) {
        filtered.push(match)
      } else {
        // 더 높은 우선순위 또는 더 긴 매치를 선택
        if (match.priority > overlapping.priority || 
           (match.priority === overlapping.priority && 
            (match.endIndex - match.startIndex) > (overlapping.endIndex - overlapping.startIndex))) {
          const index = filtered.indexOf(overlapping)
          filtered[index] = match
        }
      }
    })
    
    // 최종적으로 위치순으로 정렬
    return filtered.sort((a, b) => a.startIndex - b.startIndex)
  }

  private isOverlapping(match1: SpellMatch, match2: SpellMatch): boolean {
    return (
      (match1.startIndex >= match2.startIndex && match1.startIndex < match2.endIndex) ||
      (match1.endIndex > match2.startIndex && match1.endIndex <= match2.endIndex) ||
      (match1.startIndex <= match2.startIndex && match1.endIndex >= match2.endIndex)
    )
  }

  private escapeRegExp(string: string): string {
    // 정규식 특수문자를 이스케이프 처리
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  // 통계 정보 제공
  getStats() {
    const categoryStats: Record<string, number> = {}
    
    Object.entries(this.database.categories).forEach(([key, category]) => {
      categoryStats[key] = category.rules.length
    })

    return {
      totalRules: this.allRules.length,
      categories: categoryStats,
      version: this.database.version,
      lastUpdated: this.database.lastUpdated
    }
  }

  // 특정 카테고리의 규칙 가져오기
  getRulesByCategory(category: CategoryKey): SpellRule[] {
    return this.database.categories[category]?.rules || []
  }

  // 텍스트에 수정사항 적용
  applyCorrections(text: string, matches: SpellMatch[]): string {
    // 뒤에서부터 적용하여 인덱스 변화 방지
    const sortedMatches = [...matches].sort((a, b) => b.startIndex - a.startIndex)
    
    let correctedText = text
    sortedMatches.forEach(match => {
      correctedText = 
        correctedText.substring(0, match.startIndex) +
        match.corrected +
        correctedText.substring(match.endIndex)
    })

    return correctedText
  }
}