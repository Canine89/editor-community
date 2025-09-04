# Editor Community - Claude Development Notes

## 🚀 Development Policy

### Local Development Server
**⚠️ 중요: 로컬 서버 실행 금지**
- 로컬에서 `npm run dev` 서버를 실행하지 않음
- 모든 테스트는 프로덕션 환경에서 진행
- 변경사항은 바로 커밋 → 푸시하여 프로덕션에서 확인

### 이유
- 실시간 개발 효율성 증대
- 프로덕션 환경에서의 직접 검증
- 로컬 환경 차이로 인한 문제 사전 방지

## 📋 Recent Major Features

### 2025-09-04: 기간별 데이터 분석 및 달력 UI 개선
- **기간별 통계**: 30/60/90/120일 기간별 출판사 순위 분석
- **달력 날짜 선택**: 드롭다운 → 직관적인 달력 인터페이스
- **데이터 완성도**: Supabase Storage limit 수정으로 172개 전체 파일 조회
- **배치 업로드**: 2025년 JSON 파일 일괄 업로드 스크립트

### 주요 파일
- `src/app/admin/book-sales/page.tsx` - 메인 분석 페이지
- `src/lib/book-sales.ts` - 데이터 처리 로직
- `src/components/ui/date-picker.tsx` - 달력 컴포넌트
- `scripts/upload-2025-json.js` - JSON 배치 업로드

## 🛠️ Tech Stack
- Next.js 14.2.5
- TypeScript
- Supabase (Storage + Database)
- shadcn/ui Components
- React Hooks + Zustand
- Tailwind CSS

## 📊 Database Structure
- **book-sales-data**: Supabase Storage bucket (JSON 파일들)
- 파일명 형식: `yes24_2025_MMDD.json`
- 총 172개 파일 (2025년 1월-9월)

## ⚡ Performance Notes
- 모든 데이터 계산은 프론트엔드에서 처리
- Supabase Storage limit: 500개 파일
- 중복 제거 및 집계 로직 최적화

## 🔐 Access Control
- 관리자 권한 체크: `useAdmin` hook
- 골든래빗 임직원만 접근 가능
- 활동 로그 자동 기록