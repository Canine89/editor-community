# 편집자 커뮤니티 v1.0

편집자들을 위한 종합적인 온라인 커뮤니티 플랫폼입니다. 커뮤니티 게시판, 구인구직, 그리고 다양한 편집 도구들을 제공합니다.

## 🚀 주요 기능

### 📌 커뮤니티
- **게시판**: 카테고리별 게시글 작성 (일반, 질문, 정보공유, 토론)
- **익명 게시**: 선택적 익명 게시 기능
- **구인구직**: 편집 관련 일자리 정보 공유
- **댓글 시스템**: 게시글별 댓글 및 좋아요 기능

### 🛠️ 편집 도구
- **PDF 편집기**: 페이지 삽입, 삭제, 재정렬 기능
- **PDF 텍스트 추출기**: PDF에서 텍스트 추출 및 페이지별 분리
- **PDF 맞춤법 검사기**: Excel 교정쌍을 이용한 일괄 교정
- **IT 맞춤법 검사기**: IT 전문 용어 맞춤법 검사
- **GPT 텍스트 교정**: AI 기반 맞춤법 및 문맥 교정

### 📊 관리 시스템
- **관리자 대시보드**: 사용자, 게시글, 통계 관리
- **도서 매출 분석**: 골든래빗 출판사 매출 데이터 분석 (관리자 전용)
- **파일 관리**: Supabase Storage를 통한 파일 업로드 및 관리

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (서버리스)
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage
- **AI**: OpenAI GPT API
- **Deployment**: Vercel

## 📦 설치 및 설정

### 1. Node.js 설치
```bash
# nvm을 사용하여 Node.js LTS 버전 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install --lts
nvm use --lts
```

### 2. 프로젝트 클론 및 의존성 설치
```bash
git clone <repository-url>
cd editor-community
npm install
```

### 3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 정보를 입력하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI API 설정
OPENAI_API_KEY=your_openai_api_key
```

### 4. Supabase 설정
1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트를 생성하세요
2. 프로젝트 설정에서 URL과 API 키를 확인하세요
3. **SQL 에디터**에서 `supabase-schema.sql` 파일의 내용을 복사해서 실행하세요
4. **Authentication > Providers**에서 Google OAuth 설정 (선택사항)

### 5. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 http://localhost:3000으로 접속하세요.

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # 관리자 페이지
│   ├── auth/              # 인증 페이지
│   ├── community/         # 커뮤니티 게시판
│   ├── jobs/              # 구인구직 게시판
│   ├── profile/           # 사용자 프로필
│   ├── tools/             # 편집 도구들
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx          # 메인 페이지
│   └── globals.css       # 글로벌 스타일
├── components/            # 재사용 가능한 컴포넌트
│   ├── ui/               # shadcn/ui 컴포넌트
│   ├── ads/              # 광고 관련 컴포넌트
│   └── layout/           # 레이아웃 컴포넌트
├── hooks/                 # 커스텀 React Hooks
├── lib/                   # 외부 서비스 및 유틸리티
│   ├── supabase.ts       # Supabase 클라이언트
│   ├── openai.ts         # OpenAI 설정
│   ├── book-sales.ts     # 도서 매출 분석
│   └── spell-checker/    # 맞춤법 검사 시스템
└── scripts/              # 데이터 처리 스크립트
    └── upload-2025-json.js # JSON 파일 업로드
```

## 🔧 사용 가능한 스크립트

- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm run start` - 프로덕션 서버 실행
- `npm run lint` - ESLint 실행
- `npm run type-check` - TypeScript 타입 체크

## 🚀 배포

이 프로젝트는 Vercel에 최적화되어 있습니다.

1. [Vercel](https://vercel.com)에 가입하세요
2. GitHub 저장소와 연동하세요
3. 환경 변수를 Vercel에서 설정하세요
4. 자동 배포가 실행됩니다

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 📞 연락처

프로젝트 관련 문의사항은 [이슈](https://github.com/your-username/editor-community/issues)를 통해 남겨주세요.
