---
title: '재사용 가능한 노하우 카드'
type: 'refactor'
created: '2026-08-13'
status: 'in-review'
baseline_commit: 'f78fd939ad1e21d82205f2cd4d026a601d61b4e6'
review_loop_iteration: 0
context:
  - 'docs/기능명세서.md'
  - 'AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/cards`의 일반 노하우 카드가 페이지 내부 함수와 전용 스타일에 결합되어 있어 다른 기사 화면에서 재사용하기 어렵다. 카드에 필요한 시각 계층과 전체 클릭, 도움 평가 동작도 하나의 컴포넌트 계약으로 고정되어 있지 않다.

**Approach:** 일반 노하우 카드를 독립 Client Component와 CSS Module로 분리하고 현재 `/cards` 피드에서 사용한다. 흰색 본문 위에 카테고리별 민트·딥그린·보라·코랄 단색 영역을 두어 “흰색 카드”와 “컬러 배경” 요구를 함께 충족한다.

## Boundaries & Constraints

**Always:** `docs/기능명세서.md`의 기사 화면 용어와 데이터 범위를 우선한다. 카테고리는 센터팁·주유소·식당·휴게소·쉼터만 사용한다. 좋아요 의미는 실제 store의 `도움됐어요` 평가와 연결하고, 모든 상태 변경은 기존 `toggleVote`를 통해 수행한다. 최소 44px 터치 타깃, 키보드 포커스, `aria-pressed`, 카드 전체 열기 영역을 제공한다. 카드 외곽은 흰색, 20px 라운드, 얇은 회백색 테두리, `0 6px 16px rgba(16,39,30,0.12)` 그림자, pressed `opacity: .9`와 `scale(.99)`를 정확히 적용한다.

**Ask First:** 댓글이나 조회 데이터를 store·시드·화면 정책에 새로 추가해야 하는 경우, 또는 잠긴 카드의 제목 노출 정책을 바꿔야 하는 경우 사용자 승인을 받는다.

**Never:** 댓글 수와 조회 수를 임의의 값으로 생성하지 않는다. `좋아요`라는 기사 화면 문구를 추가하지 않는다. 잠긴 카드의 제목을 노출하거나 기존 해금·도움 평가 정책을 변경하지 않는다. 현재 작업 트리의 다른 미커밋 변경을 되돌리거나 덮어쓰지 않는다.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| 해금 카드 | 제목, 카테고리, 작성자, 작성일, 도움 평가 수, 색상 variant | 컬러 영역과 흰색 본문, 메타 정보, 우측 상단 도움됐어요 버튼을 표시하고 카드 본문 전체를 선택하면 상세로 이동한다 | 누락된 선택 메타는 빈 문자열 대신 해당 항목만 숨긴다 |
| 평가 불가 | 잠금 카드 또는 본인 카드 | 도움됐어요 버튼을 비활성 의미로 표시하고 store를 변경하지 않는다 | `aria-disabled`로 사유를 전달할 수 있게 한다 |
| 잘못된 색상 | 정의되지 않은 variant | 민트 variant로 안전하게 표시한다 | 렌더링을 중단하지 않는다 |

</frozen-after-approval>

## Code Map

- `components/KnowHowCard.jsx` -- 카드의 재사용 가능한 마크업, 메타 정보, 전체 클릭 및 도움 평가 상호작용
- `components/KnowHowCard.module.css` -- 카드 고유 레이아웃, 네 가지 단색 variant, pressed·focus·reduced-motion 상태
- `app/cards/page.jsx` -- store 데이터를 컴포넌트 props로 변환하고 상세 이동·`toggleVote`를 연결하는 소비자
- `app/cards/feed.module.css` -- 페이지 전용 카드 스타일을 제거하고 목록·대표 카드 레이아웃만 유지하는 대상

## Tasks & Acceptance

**Execution:**
- [x] `components/KnowHowCard.jsx` -- 페이지 내부 `FeedCard`를 독립 컴포넌트로 추출하고 명시적 props 계약과 접근 가능한 전체 카드/평가 버튼을 제공한다.
- [x] `components/KnowHowCard.module.css` -- 지정 수치와 민트·딥그린·보라·코랄 색상 variant를 구현한다.
- [x] `app/cards/page.jsx` -- 새 컴포넌트를 사용하고 기존 상세 이동·도움 평가·잠금 동작을 보존한다.
- [x] `app/cards/feed.module.css` -- 추출된 일반 카드 CSS만 정리해 중복과 미사용 규칙을 없앤다.

**Acceptance Criteria:**
- Given 해금된 노하우 카드가 있을 때, when `/cards`가 렌더링되면, then 카테고리 배지·제목·작성자·작성일·도움 평가 수·우측 상단 도움됐어요 버튼이 새 공통 컴포넌트에 표시된다.
- Given 사용자가 좋아요 버튼이 아닌 카드 영역을 선택할 때, when 클릭 또는 키보드 활성화가 발생하면, then 해당 카드 상세 화면으로 이동한다.
- Given 도움 평가 자격이 있는 카드일 때, when 우측 상단 버튼을 선택하면, then 기존 `toggleVote`를 통해 `helpful` 평가가 한 번 반영된다.
- Given 카드 열기 영역이 pressed 상태일 때, when 포인터가 눌려 있으면, then 카드 opacity는 0.9이고 scale은 0.99다.
- Given 네 카테고리 카드가 있을 때, when 목록이 렌더링되면, then 민트·딥그린·보라·코랄 단색 영역이 카테고리별로 일관되게 적용된다.

## Spec Change Log

## Design Notes

댓글 수와 조회 수는 현재 기능명세, ERD, store에 존재하지 않는다. 기능명세 우선 요청에 따라 실제 UI·상태에는 추가하지 않고, 기존 `helpfulCount`를 우측 상단 `도움됐어요` 평가와 수치로 사용한다. 흰색 배경과 단색 카드 요구는 “단색 상단 영역 + 흰색 본문” 구조로 조정한다.

## Verification

**Commands:**
- `npm run lint` -- 새 컴포넌트와 소비자에 ESLint 오류가 없다.
- `npm run build` -- Next.js 16.3 App Router 프로덕션 빌드가 성공한다.

**Manual checks:**
- 390px 모바일 폭에서 네 색상, 20px 라운드, 그림자, 전체 카드 클릭, 버튼 44px, pressed·focus 상태를 확인한다.
