# Windows 10 Classic Calendar Replica (old-calendar)

Windows 10 시절의 미려하고 가벼웠던 **클래식 일정(Calendar) 데스크톱 앱**을 1:1로 정밀하게 재현한 프로젝트입니다.

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
- **MSN Weather 스타일 날씨 연동**: 각 일자별 날씨 아이콘(맑음/흐림/비/눈) 및 최고/최저 기온 표시, 섭씨(℃)/화씨(℉) 단위 전환.
- **대한민국 법정 공휴일 & 대체 캘린더(음력)**: 신정, 삼일절, 광복절 등 양력 공휴일과 설날/추석 명절 자동 반영, 음력 일자(초하루, 보름 등) 표기.
- **드래그 앤 드롭 일정 이동 (Drag & Drop Rescheduling)**: 월간 뷰에서 일정을 다른 날짜 셀로 직관적으로 드래그하여 일정 즉각 변경.
- **시맨틱 줌 (Semantic Zoom)**: 년/월 타이틀 클릭 시 연간(Year) 뷰 줌아웃 <-> 월간(Month) 뷰 줌인 원클릭 전환.
- **캘린더 인쇄 및 PDF 저장 (`Ctrl + P`)**: `@media print` 최적화 전용 스타일 지원.
- **새 캘린더 범주 추가**: 사이드바에서 사용자 정의 카테고리 생성 및 컬러 커스텀.

### 3. OAuth2 클라우드 캘린더 동기화 (Google, Outlook, Office 365, iCloud)
- **Windows 10 "계정 선택(Choose an account)" 다이얼로그**:
  - `Outlook.com / Live.com` (Microsoft Graph)
  - `Microsoft 365 / Exchange` (회사/학교 계정)
  - `Google Calendar` (Google OAuth2 v3 API)
  - `iCloud` (Apple CalDAV)
- **양방향 일정 동기화 엔진**:
  - 외부 캘린더 일정을 비동기 가져와 로컬 캐시와 원자적 병합(Merge).
  - 계정 추가 시 전용 캘린더 범주(Category) 및 색상 자동 연동.
  - 상단 헤더의 **동기화(Sync) 버튼**을 통해 원클릭 즉시 동기화 (`RotateCw` 회전 애니메이션).
  - 계정별 개별 동기화, 가시성 온/오프 토글 및 연동 해제 지원.

### 4. 고급 일정 관리 및 표준 호환
- **iCalendar (.ics) 양방향 호환**: Google Calendar, Outlook, Apple Calendar와 호환되는 표준 `.ics` 파일 내보내기 및 가져오기 지원.
- **일정 상세 속성**: 종일 여부, 참석자 초대(이메일), 비공개(Private) 일정 토글, 상태 표시(약속 있음/한가함/자리비움/임시).
- **반복 일정 (Recurrence)**: 매일, 매주, 매월, 매년 반복 일정 자동 전개 및 표시.
- **미리 알림 (Reminders)**: 정각, 15분 전, 30분 전, 1시간 전, 1일 전 알림 및 Windows 네이티브 토스트 알림 연동.

### 5. 실시간 검색 (Search Overlay)
- `Ctrl + F` 또는 상단 검색 아이콘 클릭 시 실시간 검색 오버레이 오픈.
- 제목, 설명, 위치 실시간 키워드 매칭 및 클릭 시 해당 날짜로 즉시 이동.

### 6. Windows 10 설정 패널 (Settings Slide-in)
- **계정 관리 바로가기**: 설정 창 상단에서 연동 계정 현황 확인 및 계정 추가 모달 다이렉트 호출.
- **12가지 Windows 10 Fluent Accent Colors**: 클릭 즉시 앱 전체 테마 색상(블루, 크림슨, 오렌지, 골드, 에메랄드 그린, 틸, 시안, 네이비, 퍼플, 마젠타, 로즈, 스톰 그레이) 동적 갱신.
- **테마 모드**: 어둡게(Dark) / 밝게(Light).
- **날씨 & 음력 토글**: 날씨 표시 여부, 섭씨/화씨, 음력 표시 온/오프.
- **주의 첫째 날 설정**: 일요일 / 월요일.
- **데이터 백업 및 복원**: JSON 및 iCalendar(.ics) 백업/복원.

---

## 🏗️ 아키텍처 및 디렉터리 구조

```
old-calendar/
├── electron/                 # 데스크톱 메인 & 프리로드 프로세스
│   ├── main.ts               # 프레임리스 창, 창 제어 IPC, 네이티브 알림
│   └── preload.cts           # contextBridge 기반 안전한 IPC API 노출
├── src/
│   ├── core/                 # 순수 비즈니스 로직
│   │   ├── calendar.ts       # 달력 매트릭스 계산, 날짜 연산
│   │   ├── recurrence.ts     # 반복 일정 전개, 타임슬롯 배치, 검색 필터
│   │   ├── holidays.ts       # 대한민국 법정 공휴일 & 음력 계산
│   │   ├── weather.ts        # MSN 날씨 시뮬레이션 및 예보 생성
│   │   ├── ical.ts           # iCalendar (.ics) 양방향 파서 및 생성기
│   │   └── oauthSync.ts      # OAuth2 공급자 연동 및 원격 일정 병합 엔진
│   ├── storage/              # Zustand 스토어 및 로컬 스토리지 영속화
│   │   └── calendarStore.ts  # Zero-Latency In-Memory 스토어
│   ├── constants/            # 테마 토큰, 액센트 컬러, 설정, OAuth 상수
│   │   ├── calendar.ts
│   │   ├── theme.ts
│   │   ├── settings.ts
│   │   └── oauth.ts
│   ├── components/
│   │   ├── layout/           # TitleBar, HeaderControls, Sidebar, SettingsPanel, SearchOverlay
│   │   ├── sidebar/          # MiniCalendar
│   │   ├── events/           # EventModal (일정 등록/수정/삭제)
│   │   └── sync/             # AccountModal (Windows 10 계정 선택 다이얼로그)
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
