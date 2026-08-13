# Blind Hunter 리뷰 요청

`bmad-review-adversarial-general` 스킬을 사용해 재사용 가능한 노하우 카드 변경을 비판적으로 리뷰한다.

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

## 요청

사용자에게 실제 영향을 주는 결함만 보고한다. 각 발견은 파일과 줄, 재현 조건, 영향, 최소 수정 방향을 포함한다. 칭찬이나 요약은 생략한다.
