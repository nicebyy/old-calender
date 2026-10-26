# Antigravity Workspace Guidelines (old-calender)

## 🚨 필수 안전 규칙: 터미널 명령 실행 및 무한 대기(Lock) 방지

Windows 환경의 PowerShell 및 cmd.exe 특성상, 인라인 다중행 스크립트 실행은 파싱 오류 및 무한 대기를 유발하여 **대화 세션 전체를 잠그는(Lock) 치명적인 원인**이 됩니다. 모든 에이전트는 다음 규칙을 반드시 준수해야 합니다.

### 1. 인라인 실행(`-e`) 절대 금지
- ❌ **금지**: `npx tsx -e "..."`, `node -e "..."`, `npx electron -e "..."`
  - 원인: 줄바꿈(`\n`) 및 따옴표(`"`, `'`)가 Windows 셸에서 깨져 구문이 유실되고, Node/tsx가 대화형 **REPL 모드(stdin 대기)**로 진입하거나 Electron이 메인 루프에서 영구 대기하여 Antigravity가 태스크 완료를 무한정 기다리게 됩니다.

### 2. 안전한 테스트/검증 스크립트 실행 절차
- 임시 테스트나 API 검증이 필요할 경우 반드시:
  1. `write_to_file`로 `scripts/temp-*.ts` 파일을 생성합니다.
  2. 스크립트 상단에 **강제 타임아웃 워치독(Watchdog)**을 반드시 포함합니다:
     ```ts
     const _safetyWatchdog = setTimeout(() => {
       console.error('Operation timed out');
       process.exit(1);
     }, 10000);
     ```
  3. 작업 완료 후 `clearTimeout(_safetyWatchdog)` 및 명시적 `process.exit(0)`을 호출합니다.
  4. `npx tsx scripts/temp-*.ts`로 실행한 후 임시 파일을 삭제합니다.

---

## 🛠️ 프로젝트 빌드 및 배포 규칙
1. **상대 경로 유지 (`vite.config.ts`)**:
   - 데스크톱 Electron 배포 환경(`loadFile`)을 위해 `base: './'` 설정을 절대 삭제하거나 변경하지 않습니다.
2. **테스트 및 빌드 게이트**:
   - 모든 수정 사항은 `npm test` (단위/컴포넌트 테스트 100% 통과) 및 `npm run build`를 검증한 후 커밋합니다.
3. **브랜치 전략**:
   - 작업 브랜치(`fix/*`, `feat/*`) -> `develop` 병합 -> 최종 릴리스 검증 후 `main` 병합.
   - 릴리스 배포(`Release Desktop App`) 워크플로우 완료(초록색 체크) 확인 후 GitHub Release 게시.
