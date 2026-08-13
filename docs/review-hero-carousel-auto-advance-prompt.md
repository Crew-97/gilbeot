# Hero 캐러셀 자동 전환 독립 검토 요청

`bmad-review-adversarial-general` 스킬을 사용해 아래 변경을 검토하세요.

- `app/cards/page.jsx`
- `app/cards/feed.module.css`

검토 목표:

- 대표 노하우 카드가 5초마다 다음 카드로 순환하는지
- 마지막 카드 다음에 첫 카드가 표시되는지
- 카드가 하나뿐일 때 타이머가 생성되지 않는지
- 컴포넌트 해제 또는 카드 수 변경 시 기존 타이머가 정리되는지
- 수동 페이지 선택과 터치 스와이프가 유지되는지
- 활성 카드가 바뀔 때 슬라이드·페이드 애니메이션이 매번 재실행되는지
- `prefers-reduced-motion` 기존 처리와 충돌하지 않는지

현재 검증 결과:

- `app/cards/page.jsx` ESLint 통과
- `npm.cmd run build` 통과
- 개발 번들에서 5000ms `setInterval`, 모듈러 인덱스 증가, `clearInterval` 포함 확인
- 브라우저 자동 검수 환경에서는 기존 클릭 및 React 타이머도 동작하지 않아 실제 시간 경과 전환은 확인하지 못함

발견 사항을 심각도, 파일, 근거, 수정 제안과 함께 반환하세요.
