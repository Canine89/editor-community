# 데이터베이스 업데이트 로그

## 2025-09-07: 광고 시스템 데이터베이스 설정 완료

### ✅ 생성된 테이블

#### `advertisements` 테이블
- **목적**: 광고 데이터 저장
- **타입**: 캐러셀 광고, 배너 광고 지원
- **기능**: 클릭/조회수 추적, 일정 관리
- **필드**: id, title, description, type, image_url, link_url, display_order, start_date, end_date, is_active, click_count, view_count, advertiser_name, advertiser_email, advertiser_phone, created_at, updated_at

#### `ad_settings` 테이블  
- **목적**: 전역 광고 표시 설정
- **기능**: 캐러셀/배너 on/off, 자동재생 설정
- **필드**: id, show_top_carousel, show_bottom_banner, carousel_auto_play, carousel_interval, banner_position, updated_at

### ✅ 설정된 RLS 정책
- 모든 사용자가 광고를 볼 수 있음
- 인증된 사용자만 광고를 관리할 수 있음
- 보안적으로 안전한 접근 제어

### ✅ 생성된 헬퍼 함수
- `increment_ad_clicks(ad_uuid)`: 광고 클릭수 증가
- `increment_ad_views(ad_uuid)`: 광고 조회수 증가

### ✅ 초기 데이터
- **기본 설정**: 캐러셀/배너 모두 활성화, 자동재생 5초 간격
- **샘플 캐러셀 광고 3개**: 편집자 도구, 커뮤니티, 채용정보
- **샘플 배너 광고 1개**: 편집자 도구 모음
- **유효기간**: 모든 광고 1년간 활성 상태

### 🔧 환경 설정 변경
- `NEXT_PUBLIC_IS_DEV_MODE` 변수 제거
- 프로덕션 모드로 전환하여 실제 데이터베이스 사용

### 📊 결과
- `/jobs` 페이지에서 광고 표시 활성화
- `/community` 페이지에서 광고 표시 활성화  
- `/admin/advertisements`에서 광고 관리 가능
- 클릭/조회수 추적 자동 작동

## 다음 단계
1. 프로덕션 배포 후 광고 표시 확인
2. 관리자 페이지에서 광고 생성/수정 테스트
3. 클릭/조회수 통계 확인