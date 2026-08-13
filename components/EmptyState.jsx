'use client'

// 빈 상태 (0건). 문구와 선택적 동작 버튼을 받는다
// 문구 예시는 모두 존댓말 짧은 문장, 느낌표 없이
//   "아직 등록된 암묵지가 없어요."
//   "이 센터 주변에 등록된 장소가 아직 없어요."
//   "아직 포인트 내역이 없어요."
//   "검토가 필요한 암묵지가 없어요."

import { Button } from './Button'

export function EmptyState({ message, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <p className="text-body-sm text-ink-500">{message}</p>
      {actionLabel && onAction ? (
        <Button variant="accent" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
