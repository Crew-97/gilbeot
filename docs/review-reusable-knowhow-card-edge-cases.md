# Edge Case Hunter 리뷰 요청

`bmad-review-edge-case-hunter` 스킬을 사용해 재사용 가능한 노하우 카드 변경의 분기와 경계 조건을 리뷰한다.

## 기준

- 승인 명세: `docs/spec-reusable-knowhow-card.md`
- 기준 커밋: `f78fd939ad1e21d82205f2cd4d026a601d61b4e6`
- 기능 정책 우선순위: `docs/기능명세서.md`
- 공통 규칙: `AGENTS.md`

## 리뷰 대상 diff

다음 명령으로 기준 커밋 이후의 tracked 변경을 읽는다.

```powershell
git diff f78fd939ad1e21d82205f2cd4d026a601d61b4e6 -- app/cards/page.jsx app/cards/feed.module.css components/KnowHowCard.jsx components/KnowHowCard.module.css docs/spec-reusable-knowhow-card.md
```

아래 untracked 파일은 `git diff`에 나타나지 않으므로 파일 전체를 반드시 읽는다.

- `components/KnowHowCard.jsx`
- `components/KnowHowCard.module.css`
- `app/cards/feed.module.css`
- `docs/spec-reusable-knowhow-card.md`

현재 작업 트리에는 사용자 소유의 다른 미커밋 변경이 함께 있다. 리뷰와 수정 제안은 위 카드 컴포넌트 범위로 한정하고, 다른 변경을 되돌리거나 덮어쓰지 않는다.

## 집중 경계 조건

- 해금·잠금 카드와 제목 비노출
- 본인 카드·평가 자격 없음·이미 `helpful` 평가됨
- 누락되거나 잘못된 category, tone, 날짜, 작성자, 장소, 평가 수
- 카드 전체 클릭 오버레이와 우측 상단 평가 버튼의 클릭·포커스 충돌
- 320px~390px 폭, 긴 한국어 제목·장소명, 키보드와 터치 입력
- reduced motion 및 pressed 상태

## 요청

처리되지 않은 edge case만 보고한다. 각 발견은 파일과 줄, 분기 조건, 현재 결과, 기대 결과를 포함한다. 이미 처리된 조건과 단순 취향은 생략한다.
