# Windows 10 Classic Calendar Replica (old-calendar)

Windows 10 시절의 미려하고 가벼웠던 **클래식 일정(Calendar) 데스크톱 앱**을 1:1로 정밀하게 재현한 프로젝트입니다.

---

## ⚡ 프로젝트 핵심 가치: "반응성(Responsiveness) 우선순위 1위"

1. **Zero-Latency Local-First In-Memory State**:
   * 로딩 스피너 및 네트워크 대기 0ms.
   * 모든 일정 데이터는 메모리(Zustand)에 상주하여 월/주/일 이동, 일정 생성/수정이 즉시(0ms) 화면에 렌더링되며 백그라운드에서 로컬 영속화됩니다.
2. **GPU 가속 Fluent UI**:
   * CSS 하드웨어 가속 레이어를 적용하여 60/120fps 부드러운 스크롤과 상호작용을 보장합니다.
3. **가볍고 빠른 네이티브 룩앤필**:
   * Windows 10 프레임리스 타이틀바, 아크릴 반투명 효과, Reveal Highlight 및 사이드바 미니 달력 완벽 재현.

---

## 🏗️ 아키텍처 및 디렉터리 구조

```
old-calendar/
├── electron/                 # 데스크톱 메인 & 프리로드 프로세스
│   ├── main.ts               # 프레임리스 창, 창 제어 IPC 핸들러, 보안 설정
│   └── preload.ts            # contextBridge 기반 안전한 IPC API 노출
├── src/
│   ├── core/                 # 순수 비즈니스 로직 (달력 그리드, 날짜 연산, RRULE)
│   ├── storage/              # Zustand 스토어 및 로컬 스토리지 영속화
│   ├── constants/            # 테마 토큰, 요일/월명, 시간 설정 등 중앙화 상수
│   ├── components/
│   │   ├── layout/           # TitleBar, HeaderControls, Sidebar
│   │   ├── sidebar/          # MiniCalendar
│   │   └── events/           # EventModal (일정 등록/수정)
│   ├── views/                # MonthView (월간 6주 고정 그리드)
│   ├── types/                # TypeScript 전역 타입 정의
│   ├── App.tsx               # 최상위 뷰 및 전역 단축키 핸들러
│   └── main.tsx              # React 19 진입점
├── tests/                    # Vitest 테스트 설정
├── RULES.md                  # 프로젝트 개발 및 브랜치 규칙
└── package.json
```

---

## ⌨️ 단축키 (Keyboard Shortcuts)

Windows 10 캘린더 네이티브 조작감을 제공하는 전역 단축키를 지원합니다:

| 단축키 | 동작 |
| :--- | :--- |
| `Ctrl + T` | 오늘 날짜로 즉시 이동 |
| `Ctrl + N` | 새 이벤트 등록 모달 열기 |
| `Ctrl + ←` | 이전 달/주/일로 이동 |
| `Ctrl + →` | 다음 달/주/일로 이동 |
| `Ctrl + 1` | 일간 뷰 전환 |
| `Ctrl + 2` | 작업 주 뷰 전환 |
| `Ctrl + 3` | 주간 뷰 전환 |
| `Ctrl + 4` | 월간 뷰 전환 |
| `Ctrl + 5` | 연간 뷰 전환 |

---

## 🚀 실행 및 테스트 가이드

### 1. 웹 개발 모드 실행 (빠른 UI 개발)
```bash
npm run dev
# http://localhost:5173 접속
```

### 2. Electron 데스크톱 앱 실행
```bash
npm run dev:electron
```

### 3. 단위 테스트 실행 (테스트 통과 게이트)
```bash
npm test
```

### 4. 프로덕션 빌드
```bash
npm run build
```
