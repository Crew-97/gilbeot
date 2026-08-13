'use client'

import { Button } from '@/components/Button'

// 잠긴 카드 공통 표시 (해소 33)
// 제목을 숨기고 자물쇠, 카테고리, 장소명, 도움 평가 수, 작성일만 보여준다
// 제목이나 본문을 요약해 대신 보여주지 않는다 — 해금 구조가 무너진다

const CATEGORY_LABELS = {
  center_tip: '센터팁',
  gas: '주유소',
  food: '식당',
  rest: '휴게소·쉼터',
}

function formatDate(iso) {
  return iso ? iso.slice(0, 10).replaceAll('-', '.') : ''
}

// card: getCards 가 반환한 잠긴 카드 (title 은 이미 빈 문자열)
// placeName: 화면이 place 를 찾아 넘긴다. center_tip 이면 센터명을 넘긴다
// onUnlock 이 없으면 해금 버튼을 숨긴다 (표시 전용 맥락)
export function LockedCardSummary({ card, placeName, onUnlock, failReason }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span aria-hidden="true">🔒</span>
        <span className="rounded-xs border border-hairline bg-accent-soft px-1.5 py-0.5 text-micro font-bold tracking-wide text-ink-700">
          {CATEGORY_LABELS[card.category] || card.category}
        </span>
        {placeName ? <span className="text-caption text-ink-500">{placeName}</span> : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-ink-500">
        <span>👍 {card.helpfulCount}</span>
        <span>👎 {card.notHelpfulCount}</span>
        <span>작성 {formatDate(card.createdAt)}</span>
      </div>

      {onUnlock ? (
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
          <Button variant="accent" onClick={onUnlock}>
            10P로 열기
          </Button>
          {failReason ? (
            <p className="mt-1 text-caption text-ink-500">
              {failReason} 내 경험을 공유하고 포인트를 받아 보세요.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
