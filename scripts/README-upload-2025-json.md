# 2025 JSON 파일 배치 업로드 가이드

## 개요
`/Users/canine89/Downloads/general/2025` 디렉토리의 yes24 JSON 파일들을 Supabase Storage에 배치 업로드하는 스크립트입니다.

## 기능
- ✅ **중복 제거**: 이미 업로드된 파일 자동 감지
- ✅ **진행 상황 추적**: 실시간 업로드 진행률 표시
- ✅ **에러 처리**: 자동 재시도 (최대 3회) 및 상세 에러 로그
- ✅ **다양한 모드**: 덮어쓰기/건너뛰기/대화식 모드 지원
- ✅ **파일 정보**: 파일 크기 및 업로드 상태 표시

## 사용법

### 1. 기본 업로드 (덮어쓰기 모드)
```bash
node scripts/upload-2025-json.js
```
- 모든 JSON 파일을 업로드
- 기존 파일이 있으면 덮어쓰기

### 2. 기존 파일 건너뛰기
```bash
node scripts/upload-2025-json.js --skip-existing
```
- 이미 업로드된 파일은 건너뛰기
- 새로운 파일만 업로드

### 3. 대화식 모드
```bash
node scripts/upload-2025-json.js --interactive
```
- 각 파일마다 업로드 여부 확인
- 옵션: y(업로드), n(건너뛰기), a(모든 파일 업로드), s(모든 파일 건너뛰기)

### 4. 도움말
```bash
node scripts/upload-2025-json.js --help
```

## 출력 예시

```
🚀 Starting 2025 JSON files upload to Supabase Storage...
📂 Source directory: /Users/canine89/Downloads/general/2025
🎯 Target bucket: book-sales-data
⚙️  Mode: Skip existing
📁 Found 172 JSON files to process
🔍 Checking existing files in Supabase Storage...
📦 Found 22 existing files in storage
📄 New files: 150
🔄 Existing files: 22

🚀 Starting upload of 150 files...

[1/150] Processing: yes24_2025_0101.json
⬆️  Uploading yes24_2025_0101.json (0.68 MB)...
✅ Successfully uploaded: yes24_2025_0101.json

==================================================
📊 Upload Summary:
✅ Successfully processed: 150 files
❌ Failed uploads: 0 files
📁 Total files checked: 172
🎉 All files processed successfully!
```

## 설정 정보

- **소스 디렉토리**: `/Users/canine89/Downloads/general/2025`
- **대상 버킷**: `book-sales-data` (Supabase Storage)
- **파일 패턴**: `yes24_2025_*.json`
- **재시도 설정**: 최대 3회, 1초 간격
- **타임아웃**: 네트워크 오류 시 자동 재시도

## 주의사항

1. **환경 변수**: `.env.local` 파일에 Supabase 연결 정보가 필요합니다
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **권한**: Service Role Key가 Storage 버킷에 대한 쓰기 권한을 가져야 합니다

3. **네트워크**: 안정적인 인터넷 연결이 필요합니다 (파일당 0.6-0.7MB)

4. **디스크 공간**: 임시 작업을 위해 충분한 여유 공간 확보

## 문제 해결

### 연결 오류
```
❌ Error connecting to Supabase Storage: Transport is closed
```
- `.env.local` 파일의 환경 변수 확인
- Supabase 프로젝트 상태 및 네트워크 연결 확인

### 권한 오류
```
❌ Failed to upload: Insufficient permissions
```
- Service Role Key 권한 확인
- Storage 버킷 정책 검토

### 파일 없음 오류
```
⚠️  No JSON files found matching pattern yes24_2025_*.json
```
- 소스 디렉토리 경로 확인
- 파일명 패턴 확인

## 성공 확인

업로드 완료 후 다음 방법으로 확인할 수 있습니다:

1. **Supabase Dashboard**: Storage 탭에서 `book-sales-data` 버킷 확인
2. **스크립트 재실행**: `--skip-existing` 옵션으로 재실행하여 모든 파일이 건너뛰어지는지 확인
3. **애플리케이션**: 웹 애플리케이션에서 데이터 로딩 확인