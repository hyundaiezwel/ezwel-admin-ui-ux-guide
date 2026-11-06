# 접근성

목표는 **WCAG 2.1 AA**다. DS1(`@ezwel/ui`) 접근성 문서에서 **토큰·컴포넌트와 무관한 규칙만** 옮겼다.
대비 값은 이 문서가 아니라 `src/ws/tokens.css`와 `npm run check:contrast`가 정본이다.

---

## 1. 이미 공통이 해 주는 것

| 요구 | 어디서 |
|---|---|
| 글자 대비 4.5:1 | `tokens.css` 교정값 + 빌드 안의 `check:contrast`(라이트·다크) |
| 포커스 표시 | `base.css` `:focus-visible` 링(`--ws-focus-ring`) |
| 본문 바로가기 | `Shell.vue` 첫 요소 `.ws-skip` → `<main id="main" tabindex="-1">` |
| 화면에서만 숨김 | `.ws-sr-only` |
| 모션 축소 | `base.css` `prefers-reduced-motion` |
| 모달 포커스 가두기·복귀 | `src/lib/useFocusTrap` · 처리 확인 창은 `WsActionDialog`가 연 버튼으로 복귀 |
| 라이브러리 읽기 문구 한국어 | `main.ts` PrimeVue `locale.aria` ← `app/localeKo.ts` |
| 겹친 모달 Esc | `src/lib/useEscapeToClose` — 가장 위 하나만 닫는다 |

`--ws-text-disabled`는 대비 요건 면제(비활성)다. **경계선만으로 정보를 전달하지 않는다.**

## 2. 색에만 기대지 않기 (WCAG 1.4.1)

| 곳 | 색 외 단서 |
|---|---|
| 상태 배지 | 라벨 글자를 항상 넣는다 |
| 필수 항목 | `*` + 스크린리더용 "(필수)" |
| 검증 오류 | 필드 아래 문구. 빨간 테두리만 두지 않는다 |
| 선택된 행 | 배경 + 좌측 막대(또는 굵기) |
| 차트 | 범례를 반드시 남기고, 계열이 셋 이상이면 직접 라벨·툴팁으로 이름을 읽게 한다 |

적록 색각이 가장 흔하다. **성공(초록)과 위험(빨강)을 나란히 두고 색으로만 가르지 않는다.**

## 3. 키보드

1. **Tab만으로 주요 동작에 닿는가.** `<div @click>`은 닿지 않는다 — `<button>`.
2. **포커스가 보이는가.** 링을 지우지 않는다(`outline: none`만 쓰고 대체 표시를 안 주는 것 금지).
3. **포커스 순서 = 시각 순서인가.** `position: absolute`로 옮긴 요소가 흔한 원인.
4. **모달에서 Tab이 뒤로 새지 않는가, 닫으면 원래 자리로 오는가.** `useFocusTrap`.
5. **키보드 함정이 없는가.** 들어가서 Tab으로 못 나오는 위젯(날짜 선택 등).

단축키를 늘리려면 입력 중에도 눌리는지 먼저 확인한다.

## 4. 스크린리더

| 요소 | 필요한 것 |
|---|---|
| 아이콘 버튼 | `aria-label` |
| 장식 아이콘 | `aria-hidden="true"` |
| 입력 | `<label for>` |
| 오류 | `aria-describedby` + `role="alert"` |
| 모달 | `role="dialog"` `aria-modal="true"` + 이름 |
| 표 | `<th scope="col">`, 필요하면 `<caption class="ws-sr-only">` |
| 접기 | `aria-expanded` + `aria-controls` |
| 페이저 | `<nav aria-label>` + 현재 쪽 `aria-current="page"` |
| 동적 갱신 | `aria-live="polite"` — 토스트·건수 |

`display: none`은 스크린리더도 못 읽는다. 화면에서만 숨기려면 `.ws-sr-only`.
`aria-live="assertive"`는 쓰지 않는다 — 읽던 것을 끊는다. 정말 끊어야 하는 것(세션 만료)은 모달로.

## 5. 포인터

| 요구 | 값 |
|---|---|
| 목표 최소 | 24×24 CSS px (WCAG 2.5.8) |
| 호버 전용 정보 | 금지. 툴팁은 포커스로도 열린다 |
| 드래그 전용 동작 | 금지. 버튼·키보드 대안을 둔다 |

표 행 안 아이콘 버튼이 자주 걸린다 — 작은 아이콘을 그대로 두지 말고 버튼 상자로 감싼다.

## 6. 점검

- **자동** — `npx @axe-core/cli http://localhost:5320/<경로>`. 라벨 누락·대비·ARIA 오용은 잡지만
  포커스 순서·색 외 단서는 못 잡는다(실제 문제의 절반쯤).
- **수동(화면 완성 시)** — 마우스를 치우고 Tab만으로 끝까지 · 브라우저 200% 확대(1280 창이면 640px 폭 — 화면 전체 가로 스크롤이 없어야 한다, WCAG 1.4.10) · 다크 테마 ·
  VoiceOver(`⌘F5`)나 NVDA로 폼 한 번 통과 · DevTools 색각 시뮬레이션(적록).

## 7. 자주 나는 실수

| 증상 | 원인 | 고치는 법 |
|---|---|---|
| Tab이 버튼을 건너뛴다 | `<div @click>` | `<button>` |
| 포커스가 안 보인다 | 링 제거 | 지우지 않는다 |
| 모달 뒤로 포커스가 샌다 | 트랩 없음 | `useFocusTrap` |
| 스크린리더가 "버튼"만 읽는다 | 아이콘만 있는 버튼 | `aria-label` |
| 확대하면 버튼이 사라진다 | 고정 폭 + `overflow: hidden` | `flex-wrap`(`.ws-cluster`) |
| 오류 문구가 보이는데 읽히지 않는다 | 문구 `id`만 있고 칸에 연결 안 함 · PrimeVue 부품 바깥 틀에 속성이 붙음 | 칸에 `aria-invalid` + `aria-describedby`. `DatePicker`는 `pt.pcInputText.root`, `Select`는 `pt.label`, `Password`는 `input-props`로 넣는다 |
| 선택지 묶음(라디오) 오류가 안 읽힌다 | 첫 라디오에만 붙임 | 묶음(`role="radiogroup"` · `fieldset`)에 `aria-required` · `aria-invalid` · `aria-describedby` |
| 링크 안 `?` 도움말에 Tab이 한 번 더 멈춘다 | 링크 안에 `tabindex="0"` 요소 | `?`는 `aria-hidden`, 설명은 링크의 `aria-describedby` |
| 요소 종류 규칙 위반(`article role=group`, `dl role=status`) | 허용되지 않는 role | role을 빼거나 바깥 `div`에 붙인다 |
| 640px 폭(200% 확대)에서 화면 전체가 옆으로 밀린다 | 틀 · 본문 최소 폭 고정 | 최소 폭을 두지 않는다. 넓은 표만 `.ws-xscroll` 안에서 스크롤(UI-10) |

## 8. 공통 부품의 키보드 · 화면낭독기 동작 (디자인 점검 역반영, 2026-11-05)

| 곳 | 동작 |
|---|---|
| 상단 탭 줄(`app/TabBar.vue`) | Tab 정지점은 **선택된 탭 하나**. ← → 로 탭 사이 이동(끝에서 처음으로), Home · End, Enter · Space 로 열기, **Delete 로 닫기**(고정 탭은 안 닫힘, 입력 중이면 이탈 확인). 닫으면 새로 선택된 탭으로 포커스. × 는 마우스 전용(`tabindex=-1` · `aria-hidden`, 말풍선 「… 탭 닫기 (Delete)」). 탭 이름은 화면 이름만 |
| 처리 확인 창(`WsActionDialog`) | 닫으면(Esc · 취소 · 실행) 창을 연 버튼으로 포커스. 실행 때 첫 오류 칸(선택지 → 사유 → 날짜)에 오류 표시 · 문구 연결(`ad-err`) · 포커스. 필수 칸 `aria-required`, 선택지 묶음은 `role="radiogroup"` 에 건다 |
| 날짜 칸(`WsPeriod` · 처리 확인 창) | Tab 으로 들어오거나 칸을 눌러서는 달력이 **열리지 않는다** — 달력 아이콘 또는 ↓ 키. 화면 오류 · 도움말 · 필수를 `invalid` · `describedby` · `required`로 받아 입력 칸 자체에 잇는다 |
| 첨부(`WsUpload`) | 숨은 파일 칸은 Tab 제외. 규칙 · 오류 문구는 「파일 선택」 버튼 설명으로 |
| 에디터(`WsEditor`) | 오류면 글 칸 자체에 `aria-invalid`(저장 때 첫 오류 이동이 툴바 첫 버튼이 아니라 글 칸으로). `required` · `describedby` 받음 |
| 쪽 이동 · 창 닫기 등 PrimeVue 읽기 문구 | 한국어(`app/localeKo.ts`, 「첫 쪽 · 이전 쪽 · 다음 쪽 · 마지막 쪽 · 닫기」). 라이브러리 키가 늘면 `localeKo.spec.ts`가 잡는다 |
| 누를 수 없는 버튼 | 흐리게(opacity)만 하지 않고 전용 면 · 글자색(`--ws-action-disabled-*`, 4.5 이상)으로 그린다 |

문구 규칙(「~해 주세요」 · 「조회 결과가 없습니다.」 · 확인 창 버튼 이름)은 [`ui-conventions.md`](ui-conventions.md) UI-34에 있다.
