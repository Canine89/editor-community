# 편집자 커뮤니티

편집자들을 위한 종합적인 온라인 커뮤니티 플랫폼입니다. 익명 게시판, 구인구직, 그리고 다양한 파일 처리 유틸리티를 제공합니다.

## 🚀 주요 기능

- **익명 게시판**: 편집자들 간의 지식 공유와 토론
- **구인구직**: 편집 관련 일자리 찾기 및 구인
- **PDF 파일 처리**: 텍스트 추출, 분할/병합, PDF→워드 변환
- **워드 파일 처리**: 문서 포맷 정리, 스타일 적용, 목차 생성
- **자동 교정 시스템**: GPT 기반 맞춤법 및 문맥 교정

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
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx          # 메인 페이지
│   └── globals.css       # 글로벌 스타일
├── components/            # 재사용 가능한 컴포넌트
│   └── Header.tsx        # 헤더 컴포넌트
├── lib/                   # 외부 서비스 설정
│   ├── supabase.ts       # Supabase 클라이언트
│   └── openai.ts         # OpenAI 설정
├── types/                 # TypeScript 타입 정의
│   └── database.ts       # Supabase 데이터베이스 타입
└── utils/                 # 유틸리티 함수
    └── file.ts           # 파일 처리 유틸리티
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
