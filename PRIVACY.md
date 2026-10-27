# 개인정보처리방침 (Privacy Policy)

**시행 일자 (Effective Date)**: 2026년 10월 27일

'Classic Calendar'(이하 '앱')는 사용자의 개인정보를 매우 소중하게 생각하며, 「개인정보 보호법」 및 관련 법령을 준수합니다. 본 개인정보처리방침은 앱이 사용자의 정보를 어떻게 다루는지 투명하게 안내하기 위해 작성되었습니다.

---

## 1. 기본 원칙 (로컬 우선 및 서버 미수집 원칙)
- 본 앱은 **로컬 독립형 데스크톱 애플리케이션(Local-First Desktop App)**입니다.
- 개발자 또는 앱 제공자는 **별도의 중앙 서버나 데이터베이스를 운영하지 않으며, 사용자의 개인 식별 정보, 캘린더 일정 내용, 메모, 설정 정보를 외부 서버로 수집·전송·저장·판매하지 않습니다.**
- 모든 데이터는 사용자의 로컬 컴퓨터(`localStorage` 및 애플리케이션 데이터 폴더)에만 안전하게 보관됩니다.

---

## 2. 수집 및 처리하는 정보 항목
앱 이용 과정에서 다음과 같은 정보가 사용자의 **로컬 장치 내부**에서만 처리됩니다:

1. **사용자가 입력한 데이터 (기기 내부 저장)**:
   - 캘린더 일정 (제목, 내용, 시작/종료 일시, 카테고리, 반복 주기, 알림 설정 등)
   - 스티커 메모 (메모 제목, 본문, 색상, 고정 여부 등)
   - 사용자 설정값 (테마 모드, 액센트 컬러, 화면 배율, 사이드바 너비, 선택한 위치 등)
2. **외부 서비스 연동 시 일시적 네트워크 요청**:
   - **날씨 정보 조회**: 사용자가 날씨 기능을 켤 경우, 사용자가 지정하거나 감지된 위치(위도/경도) 정보를 바탕으로 오픈 기상 API([Open-Meteo](https://open-meteo.com))에 일기예보 데이터를 요청합니다. 이 과정에서 개인을 식별할 수 있는 정보는 일체 포함되지 않습니다.
   - **위치 감지 및 검색**: 지역명 역지오코딩 및 검색을 위해 오픈 지오코딩 서비스(OpenStreetMap, BigDataCloud, GeoJS 등)에 좌표 또는 검색어를 일시적으로 전달할 수 있으며, 이 정보는 날씨 조회 목적 외에 어디에도 저장되지 않습니다.
   - **클라우드 캘린더 동기화(선택 기능)**: 사용자가 Google Calendar 또는 iCloud 계정을 직접 연동할 경우, 해당 서비스의 공식 OAuth2 인증을 통해 사용자 기기와 해당 클라우드 서버 간에 직접 암호화 통신합니다. 개발자의 서버를 거치지 않습니다.
   - **자동 업데이트 확인**: 최신 릴리스 및 보안 패치를 확인하기 위해 GitHub Releases API에 버전 정보(`latest.yml`)를 확인합니다.

---

## 3. 개인정보의 제3자 제공 및 위탁
- 앱은 사용자의 어떠한 개인정보도 제3자에게 제공하거나 판매하지 않으며, 외부 업체에 처리를 위탁하지 않습니다.

---

## 4. 데이터 보관 및 파기
- 모든 데이터는 사용자의 로컬 컴퓨터에만 보존되므로, 데이터의 관리 및 보존 기간은 전적으로 사용자가 통제합니다.
- 사용자는 앱 내 설정에서 데이터를 JSON 백업 파일로 내보내거나, 프로그램 삭제(제어판 앱 삭제) 또는 브라우저/앱 캐시 데이터를 삭제함으로써 언제든지 모든 데이터를 영구적으로 즉시 파기할 수 있습니다.

---

## 5. 아동의 개인정보 보호
- 본 앱은 모든 연령이 이용할 수 있으며, 만 14세 미만 아동의 개인 식별 정보를 수집하지 않습니다.

---

## 6. 문의처 및 피드백
본 개인정보처리방침 또는 앱 이용에 관한 질문이나 의견이 있으신 경우 아래 채널을 통해 언제든지 문의하실 수 있습니다:
- **개발자/프로젝트**: nicebyy
- **저장소 및 이슈 제보**: [GitHub Issues](https://github.com/nicebyy/old-calender/issues)
- **이메일**: nicebyy@naver.com

---
---

# Privacy Policy (English)

**Effective Date**: October 27, 2026

Classic Calendar ("the Application") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how your information is handled when using the Application.

---

## 1. Local-First Architecture
- Classic Calendar is an offline-capable, local-first desktop application.
- The developer **does not maintain any central servers or external databases**. We **do not collect, store, transmit, track, or sell** your personal identity, calendar schedules, notes, or app preferences.
- All your data is stored locally on your own personal computer.

---

## 2. Information Handled Locally on Your Device
The following information is processed strictly within your local machine:

1. **User-Created Content**:
   - Calendar events (titles, descriptions, dates/times, categories, recurrence, reminders)
   - Sticky notes and memos
   - User preferences (themes, accent colors, display zoom scales, layout widths)
2. **Third-Party Network Requests (Read-Only)**:
   - **Weather Forecast**: When weather features are enabled, the app requests meteorological data from [Open-Meteo](https://open-meteo.com) using coordinates. No personally identifiable information is sent.
   - **Location Geocoding**: When searching or auto-detecting location, coordinates or query strings are sent to open geocoding APIs (OpenStreetMap Nominatim, BigDataCloud, GeoJS). This information is solely used to fetch weather data and is never retained.
   - **Cloud Sync (Optional)**: If you connect Google Calendar or iCloud, standard OAuth2 encrypted communication occurs directly between your PC and Google/Apple servers without passing through any intermediary servers.
   - **Software Updates**: The app checks GitHub Releases to notify you of available software updates and security patches.

---

## 3. Data Sharing & Third-Party Disclosure
- We do not share, sell, rent, or disclose any user data to third parties.

---

## 4. Data Retention and Deletion
- Because your data resides solely on your computer, you have complete ownership and control over it.
- You can export, back up, or permanently delete your data at any time by clearing application data or uninstalling the app.

---

## 5. Contact Information
If you have any questions or suggestions regarding this Privacy Policy, please reach out via:
- **Project Repository**: [GitHub Issues](https://github.com/nicebyy/old-calender/issues)
- **Developer**: nicebyy
- **Email**: nicebyy@naver.com
