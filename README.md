# Classic Calendar (클래식 캘린더)

Windows 10 시절의 미려하고 가벼웠던 **클래식 일정(Calendar) 데스크톱 앱**을 정밀하게 계승한 초경량·고반응성 데스크톱 캘린더입니다. (스토어 배포 에디션)

---

## ⚡ 프로젝트 핵심 가치: "반응성(Responsiveness) 우선순위 1위"

1. **Zero-Latency Local-First In-Memory State**:
   * 로딩 스피너 및 네트워크 대기 0ms.
   * 모든 일정 데이터는 메모리(Zustand)에 상주하여 뷰 이동 및 일정 생성/수정/삭제가 즉시(0ms) 화면에 렌더링되며 백그라운드에서 로컬 영속화됩니다.
2. **GPU 가속 Fluent Design System**:
   * CSS 하드웨어 가속 레이어를 적용하여 60/120fps 부드러운 스크롤과 상호작용을 보장합니다.
3. **가볍고 빠른 네이티브 룩앤필**:
   * Windows 10 프레임리스 타이틀바, 아크릴 반투명 효과, Reveal Highlight 및 사이드바 미니 달력 완벽 재현.

---

## 🛠️ 기술 스택 (Tech Stack)

* **Runtime**: [Electron](https://www.electronjs.org/) (v34) - Context Isolation & Sandbox 보안 아키텍처
* **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (v5.7)
* **Build Tool**: [Vite](https://vitejs.dev/) (v6) - 번개 같은 HMR 및 초고속 빌드
* **State Management**: [Zustand](https://zustand.docs.pmnd.rs/) (v5) - Zero-Latency In-Memory 스토어 & 로컬 영속화
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + Windows 10 Fluent Theme Tokens
* **Testing**: [Vitest](https://vitest.dev/) (v3) - 100% 단위 테스트 통과 게이트 ([RULES.md](./RULES.md))

---

## 🌟 구현된 핵심 기능 명세 (Feature Set)

### 1. 5대 캘린더 뷰 (Full Views)
- **월간 뷰 (Month View)**: 6주 42칸 고정 그리드, 오늘 날짜 Accent Color 원형 배지, 반복 일정 전개, 날씨 위젯 표시, 공휴일/음력 표기, 마우스 드래그 앤 드롭 일정 이동.
- **주간 뷰 (Week View)**: 일~토 7일 24시간 타임테이블, 상단 종일(All-day) 일정 바, 겹치는 일정 자동 컬럼 분할 레이아웃, 실시간 현재 시각선(Red Indicator Line).
- **작업 주 뷰 (Work Week View)**: 월~금 5일 업무 집중 24시간 타임라인.
- **일간 뷰 (Day View)**: 선택된 특정 일자의 24시간 상세 타임라인 및 상세 메모 확인.
- **연간 뷰 (Year View)**: 12개월(3x4 그리드) 미니 달력 전체 조망 및 원클릭 줌인 네비게이션.

### 2. Windows 10 UWP 시그니처 기능 (1:1 패리티)
- **위치 기반 실시간 MSN Weather 연동 (Windows 네이티브 Wi-Fi 감지 & 동/구/시 단위 정밀 위치)**:
  - **Windows 네이티브 초고정밀 위치 감지**: Windows 10/11 시스템 위치 서비스(`Windows.Devices.Geolocation`)를 Electron IPC로 직접 연동하여 주변 Wi-Fi AP 삼각측량을 통해 **실제 거주 동네(예: `대구 달서구 본동`)**까지 10m 오차 수준으로 정확하게 감지.
  - **4계층 하이브리드 폴백**: Windows 네이티브 위치 -> 브라우저 GPS -> 고정밀 IP Geolocation -> 로컬 프리셋으로 오프라인 및 다양한 PC 환경에서도 100% 끊김 없는 날씨 제공.
  - **전국 시/군/구 및 동네 직접 검색 (OSM Nominatim)**: 설정 패널에서 사용자가 살고 있는 지역명(예: "본동", "달서구", "칠곡", "구미", "분당", "해운대", "제주" 등)을 직접 검색하여 1-Click 설정 가능.
  - **대구 달서구 본동 포함 30개 이상 전국 시도 및 해외 주요 거점 프리셋**: 수도권, 대구경북, 부산경남, 강원, 충청, 전라, 제주 및 글로벌 주요 도시 원클릭 선택.
  - **무료 오픈 날씨 연동 (Open-Meteo)**: 별도 API Key 없이 실시간 기상청 데이터(온도, 최고/최저, 기상 상태, 습도)를 조회하며, 네트워크 지연/오프라인 시 계절 기반 결정론적 추정 엔진으로 0ms 즉시 폴백.
  - **사이드바 실시간 날씨 카드**: 현재 위치명(`📍`), 실시간 기온, 최고/최저, 날씨 라벨, 습도(%), `RotateCw` 실시간 새로고침 버튼 및 설정 패널 바로가기 제공.
  - **월간 뷰 캘린더 그리드**: 각 일자별 날씨 아이콘(맑음/구름/흐림/비/눈) 및 최고/최저 기온, 마우스 호버 시 지역명 포함 상세 날씨 툴팁 제공.
  - **섭씨(℃)/화씨(℉) 단위 변환**: 원클릭 실시간 단위 전환.
- **대한민국 법정 공휴일 & 대체 캘린더(음력)**: 신정, 삼일절, 광복절 등 양력 공휴일과 설날/추석 명절 자동 반영, 음력 일자(초하루, 보름 등) 표기.
- **드래그 앤 드롭 일정 이동 (Drag & Drop Rescheduling)**: 월간 뷰에서 일정을 다른 날짜 셀로 직관적으로 드래그하여 일정 즉각 변경.
- **시맨틱 줌 (Semantic Zoom)**: 년/월 타이틀 클릭 시 연간(Year) 뷰 줌아웃 <-> 월간(Month) 뷰 줌인 원클릭 전환.
- **캘린더 인쇄 및 PDF 저장 (`Ctrl + P`)**: `@media print` 최적화 전용 스타일 지원.
- **새 캘린더 범주 추가**: 사이드바에서 사용자 정의 카테고리 생성 및 컬러 커스텀.

### 3. OAuth2 클라우드 캘린더 동기화 (Google Calendar, Apple iCloud)
- **Windows 10 "계정 선택(Choose an account)" 다이얼로그**:
  - `Google Calendar` (Google OAuth2 v3 API)
  - `Apple iCloud` (iCloud CalDAV & App-Specific Password)
- **양방향 일정 동기화 엔진**:
  - 외부 캘린더 일정을 비동기 가져와 로컬 캐시와 원자적 병합(Merge).
  - 계정 추가 시 전용 캘린더 범주(Category) 및 색상 자동 연동.
  - 상단 헤더의 **동기화(Sync) 버튼**을 통해 원클릭 즉시 동기화 (`RotateCw` 회전 애니메이션).
  - 계정별 개별 동기화, 가시성 온/오프 토글 및 연동 해제 지원.

### 4. 실시간 일정 알림 & Windows 10 UWP 토스트 시스템 (Reminder Notifications)
- **실시간 알림 스케줄러**: 10초 주기 백그라운드 폴러가 등록된 일정의 알림 도래 시각(`startDate - reminderMinutes`)을 모니터링하여 자동 발송.
- **다중 계층 알림 전달 (Triple-Layer Delivery)**:
  1. **Electron 데스크톱 네이티브 알림**: Windows 10 Action Center OS 토스트 팝업.
  2. **브라우저 Web Notification**: 표준 웹 알림 API 연동.
  3. **앱 내 Windows 10 UWP 토스트 배너**: 화면 우측 하단 슬라이드인 알림 배너, 일정 정보 표기 및 [해제] / [다시 알림 (5분 스누즈)] 기능 지원.
- **모달 내 즉시 알림 테스트**: 이벤트 편집 모달에서 `BellRing` 버튼을 클릭하여 즉각 알림 동작 검증 가능.
- **중복 발송 방지**: `notifiedReminderMap` 캐싱을 통해 이미 울린 알림의 반복 트리거 방지.

### 5. 고급 일정 관리 및 표준 호환
- **iCalendar (.ics) 양방향 호환**: Google Calendar, Apple Calendar 등과 완벽 호환되는 표준 `.ics` 파일 내보내기 및 가져오기 지원.
- **일정 상세 속성**: 종일 여부, 참석자 초대(이메일), 비공개(Private) 일정 토글, 상태 표시(약속 있음/한가함/자리비움/임시).
- **반복 일정 (Recurrence)**: 매일, 매주, 매월, 매년 반복 일정 자동 전개 및 표시.
- **미리 알림 주기 옵션**: 없음, 정각, 15분 전, 30분 전, 1시간 전, 1일 전.

### 6. 실시간 검색 (Search Overlay)
- `Ctrl + F` 또는 상단 검색 아이콘 클릭 시 실시간 검색 오버레이 오픈.
- 제목, 설명, 위치 실시간 키워드 매칭 및 클릭 시 해당 날짜로 즉시 이동.

### 7. 멀티 테마 & 개인 설정 시스템 (Multi-Theme Personalization)
- **테마 모드 3종**:
  - **어둡게 (Dark Mode)**: Windows 10 UWP 시그니처 딥 다크 아크릴 테마.
  - **밝게 (Light Mode)**: 눈이 편안한 깔끔한 모던 라이트 톤.
  - **Windows 모드 사용 (System Follow)**: OS 시스템 설정(`prefers-color-scheme`) 변경 시 즉각 자동 전환.
- **12가지 Windows 10 Fluent Accent Colors**:
  - 기본 파랑, 크림슨, 오렌지, 골드, 에메랄드 그린, 틸, 시안, 네이비, 퍼플, 마젠타, 로즈, 스톰 그레이.
  - CSS 커스텀 변수(`--win10-accent`)를 기반으로 오늘 원형 배지, 탭 활성화 바, 포커스 테두리, 체크박스, 모달 저장 버튼 등에 0ms 즉시 반영.
- **8종 캘린더 배경 테마 (Wallpapers) & 사용자 정의 이미지**:
  - Windows 10 히어로, 알프스 설산, 에메랄드 호수, 네온 시티, 블룸, 오로라, 선셋, 단색 기본.
  - 사용자 지정 로컬 이미지 파일 업로드(`FileReader` Data URL).
- **배경 채우기 모드 & 불투명도 조절**:
  - 사이드바에만 채우기(Windows 10 기본 룩) / 창 전체 채우기 / 채우지 않음.
  - 10% ~ 85% 불투명도 슬라이더로 텍스트 가독성과 배경 그래픽의 균형 조정.
- **1-Click 완성형 테마 프리셋 8종**:
  - `Windows 10 클래식 다크`, `Windows 10 모던 라이트`, `에메랄드 포레스트`, `크림슨 선셋`, `사이버 네온 시안`, `로열 오로라 바이올렛`, `골든 가을 앰버`, `고대비 흑백`.
- **기타 개인 설정**:
  - 날씨 표시 여부, 섭씨(℃)/화씨(℉), 음력 표시 온/오프, 주의 첫째 날(일요일/월요일).
  - JSON 및 iCalendar(.ics) 원클릭 백업/복원.

### 8. 다국어(i18n) 및 글로벌 지역화 시스템 (Multilingual Localization)
- **완전한 텍스트 하드코딩 배제 (Zero-Hardcoded UI Text)**:
  - 모든 뷰 탭, 헤더, 사이드바, 일정 모달, 계정 연동 다이얼로그, 검색 오버레이, 설정 패널, 토스트 알림의 모든 문자열이 타입 안전(Type-safe) 다국어 리소스 키 기반으로 관리됩니다.
- **한국어(Korean) & 영어(English) 기본 지원**:
  - `ko`: 정밀한 Windows 10 한국어 UWP 공식 로케일 문자열 적용.
  - `en`: 세련된 Windows 10 글로벌 영문 로케일 및 날짜/시간 포맷 적용.
- **Zero-Latency 실시간 언어 전환 (0ms In-Memory Switch)**:
  - 설정 패널의 "언어 (Language)" 옵션에서 원클릭으로 페이지 새로고침 없이 즉각 전체 UI가 전환되며 로컬 스토리지에 자동 영속화됩니다.
- **로케일 종속 포맷터 (Locale-Aware Formatter)**:
  - 요일(`일`~`토` / `Sun`~`Sat`, `일요일`~`토요일` / `Sunday`~`Saturday`), 월(`1월`~`12월` / `January`~`December`), 연/월 헤더(`2026년 10월` / `October 2026`), 24시간제/12시간제 시간 라벨이 언어에 맞춰 실시간 변환됩니다.
- **동적 파라미터 보간 (Interpolation)**:
  - `{count}`, `{year}`, `{month}`, `{time}` 등 템플릿 변수를 안전하게 치환.
- **100% 키 일치도 검증 단위 테스트 (Key Parity Tests)**:
  - 번역 리소스 간 누락된 키가 없도록 단위 테스트(`src/locales/i18n.test.ts`)로 철저히 검증.

### 9. 스토어 배포 패키징 및 브랜드 자산 (Store Packaging & Assets)
- **공식 제품명 (Product Name)**: `Classic Calendar (클래식 캘린더)`
- **스토어 앱 패키지 식별자 (App ID)**: `com.fluentcal.classic`
- **아이콘 자산 (Fluent Design Iconography)**:
  - `assets/icon.ico`: 256, 128, 48, 32px 멀티 해상도 Windows 실행/타이틀바 아이콘.
  - `assets/icon.png` & `public/icon.png`: 512x512 마스터 고해상도 PNG.
  - `public/favicon.ico`: 웹 및 브라우저 프리뷰용 파비콘.
  - **Microsoft Store / UWP 타일 규격 로고 5종**:
    - `Square44x44Logo.png` (작업 표시줄 및 앱 목록)
    - `Square150x150Logo.png` (시작 메뉴 중간 타일)
    - `Square310x310Logo.png` (시작 메뉴 큰 타일)
    - `Wide310x150Logo.png` (시작 메뉴 넓은 타일)
    - `StoreLogo.png` (스토어 상세 페이지 로고)
- **패키징 규격**: Microsoft Store (`appx`/`msix`) 및 Windows 데스크톱 독립형 설치 프로그램 (`nsis`).

---

## 🏗️ 아키텍처 및 디렉터리 구조

```
classic-calendar/
├── assets/                   # 스토어 배포용 고해상도 아이콘 및 UWP 타일 에셋
│   ├── icon.ico              # Windows 데스크톱 다중 해상도 아이콘 (256, 128, 48, 32px)
│   ├── icon.png              # 512x512 고해상도 마스터 아이콘
│   ├── Square44x44Logo.png   # 작업 표시줄 및 앱 목록 타일
│   ├── Square150x150Logo.png # 시작 메뉴 중간 타일
│   ├── Square310x310Logo.png # 시작 메뉴 큰 타일
│   ├── Wide310x150Logo.png   # 시작 메뉴 넓은 타일
│   └── StoreLogo.png         # 스토어 상세 페이지 로고
├── public/                   # 웹 파비콘 및 브라우저 에셋
│   ├── favicon.ico
│   └── icon.png
├── scripts/                  # 에셋 생성 및 패키징 유틸리티
│   └── create-ico.cjs        # 멀티 해상도 .ico 빌드 스크립트
├── electron/                 # 데스크톱 메인 & 프리로드 프로세스
│   ├── main.ts               # 프레임리스 창, 창 제어 IPC, 네이티브 알림
│   └── preload.cts           # contextBridge 기반 안전한 IPC API 노출
├── src/
│   ├── core/                 # 순수 비즈니스 로직
│   │   ├── calendar.ts       # 달력 매트릭스 계산, 날짜 연산
│   │   ├── recurrence.ts     # 반복 일정 전개, 타임슬롯 배치, 검색 필터
│   │   ├── holidays.ts       # 대한민국 법정 공휴일 & 음력 계산
│   │   ├── weather.ts        # Open-Meteo API 연동, GPS 위치 감지, 로컬 캐시/폴백
│   │   ├── weather.test.ts   # 날씨 파싱, 기온 변환, 위치 탐색 단위 테스트
│   │   ├── ical.ts           # iCalendar (.ics) 양방향 파서 및 생성기
│   │   ├── oauthSync.ts      # OAuth2 공급자 연동 및 원격 일정 병합 엔진
│   │   └── notifications.ts  # 실시간 일정 알림 계산 및 메시지 포맷터
│   ├── storage/              # Zustand 스토어 및 로컬 스토리지 영속화
│   │   └── calendarStore.ts  # Zero-Latency In-Memory 스토어
│   ├── locales/              # 다국어(i18n) 번역 리소스 사전 및 훅
│   │   ├── ko.ts             # 한국어(Korean) 리소스
│   │   ├── en.ts             # 영어(English) 리소스
│   │   ├── index.ts          # useTranslation 훅 및 로케일 헬퍼
│   │   └── i18n.test.ts      # i18n 엔진 및 키 패리티 단위 테스트
│   ├── constants/            # 테마 토큰, 액센트 컬러, 설정, OAuth 상수
│   │   ├── calendar.ts
│   │   ├── theme.ts
│   │   ├── settings.ts
│   │   ├── weather.ts        # 도시 프리셋 (17개 시도 + 해외), WMO 날씨 코드 매핑
│   │   └── oauth.ts
│   ├── components/
│   │   ├── layout/           # TitleBar, HeaderControls, Sidebar, SettingsPanel, SearchOverlay
│   │   ├── sidebar/          # MiniCalendar
│   │   ├── events/           # EventModal (일정 등록/수정/삭제)
│   │   ├── sync/             # AccountModal (Windows 10 계정 선택 다이얼로그)
│   │   └── notifications/    # ToastContainer (Windows 10 UWP 토스트 배너)
│   ├── views/                # MonthView, WeekView, DayView, YearView
│   ├── types/                # TypeScript 전역 타입 정의
│   ├── App.tsx               # 최상위 뷰 및 전역 단축키 핸들러
│   └── main.tsx              # React 19 진입점
├── tests/                    # Vitest 테스트 환경
├── RULES.md                  # 프로젝트 개발 및 브랜치 규칙
└── package.json
```

---

## ⌨️ 단축키 (Keyboard Shortcuts)

Windows 10 캘린더 네이티브 조작감을 제공하는 전역 단축키:

| 단축키 | 동작 |
| :--- | :--- |
| `Ctrl + T` | 오늘 날짜로 즉시 이동 |
| `Ctrl + N` | 새 이벤트 등록 모달 열기 |
| `Ctrl + F` | 일정 실시간 검색창 열기 |
| `Ctrl + ←` | 이전 달/주/일로 이동 |
| `Ctrl + →` | 다음 달/주/일로 이동 |
| `Ctrl + 1` | 일간 뷰 전환 |
| `Ctrl + 2` | 작업 주 뷰 전환 |
| `Ctrl + 3` | 주간 뷰 전환 |
| `Ctrl + 4` | 월간 뷰 전환 |
| `Ctrl + 5` | 연간 뷰 전환 |

---

## 🚀 실행 및 테스트 가이드

### 1. Electron 데스크톱 앱 실행
```bash
npm run dev:electron
```

### 2. 브라우저 개발 모드 실행
```bash
npm run dev
# http://localhost:5173 접속
```

### 3. 단위 테스트 실행 (테스트 통과 게이트)
```bash
npm test
```

### 4. 프로덕션 빌드
```bash
npm run build
```
