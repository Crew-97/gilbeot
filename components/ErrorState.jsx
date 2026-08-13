'use client'

// 실패 상태. 재시도 버튼을 반드시 함께 둔다
// 개발자용 영문 에러 메시지를 화면에 그대로 노출하지 않는다

import { Button } from './Button'

export function ErrorState({
  message = '데이터를 불러오지 못했어요. 다시 시도해 주세요.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <p className="text-body-sm text-ink-500">{message}</p>
      <Button onClick={onRetry}>다시 시도</Button>
    </div>
  )
}
