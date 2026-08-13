'use client'

// S-10 주변 — 운행 중 현재 위치 기반 암묵지 조회 (기획서 8-6, 해소 #30)
// 기사가 직접 열 때만 갱신한다. 알림·자동 팝업·자동 새로고침 금지
// 소비 전용 — 인터뷰를 만들지 않고, 경로·도로 정보를 주지 않는다
// 좌표 이력을 쌓지 않는다. mockLocation 은 값 하나뿐이다

import { useRouter } from 'next/navigation'
import { useStore } from '@/components/StoreProvider'
import {
  getCards,
  getCurrentDispatch,
  getPointBalance,
  unlockCard,
  moveMockLocation,
  NEAR_RADIUS_KM,
} from '@/lib/store'
import { useState } from 'react'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { MockBadge } from '@/components/MockBadge'
import { PointText } from '@/components/PointText'

// Mock 위치 프리셋. 1차는 마장휴게쉼터 부근(카드 0건) — 위치를 옮기면 목록이 바뀌는 것을 보여준다
const MOCK_SPOTS = [
  { label: '마장휴게쉼터 부근', lat: 37.236, lng: 127.385 },
  { label: '군포 복합물류센터 부근', lat: 37.31, lng: 126.936 },
]

const CATEGORY_LABELS = {
  center_tip: '화물센터 팁',
  gas: '주유소',
  food: '식당',
  rest: '휴게소·쉼터',
}

function formatDate(iso) {
  return iso ? iso.slice(0, 10).replaceAll('-', '.') : ''
}

export default function NearbyPage() {
  const router = useRouter()
  const { state, setState } = useStore()
  const [failReasons, setFailReasons] = useState({})

  // 진입 조건: 운행 중(startedAt 있음, endedAt 없음)일 때만
  const dispatch = getCurrentDispatch(state)
  const driving = dispatch && dispatch.startedAt && !dispatch.endedAt
  if (!driving) {
    return (
      <EmptyState
        message="주변 암묵지는 운행 중에만 볼 수 있어요."
        actionLabel="홈으로 가기"
        onAction={() => router.push('/home')}
      />
    )
  }

  // 현재 위치(Mock). 값이 없으면 도착 센터 기준으로 대체하고 그 사실을 알린다
  const center = state.centers.find((c) => c.id === dispatch.centerId)
  const location = state.mockLocation || MOCK_SPOTS[0]
  const effectiveLocation = location || (center ? { lat: center.lat, lng: center.lng } : null)
  const usingFallback = !effectiveLocation ? false : !location

  const spotIndex = MOCK_SPOTS.findIndex(
    (s) => s.lat === effectiveLocation?.lat && s.lng === effectiveLocation?.lng
  )
  const locationLabel =
    spotIndex >= 0 ? MOCK_SPOTS[spotIndex].label : center ? `${center.name} 기준` : '현재 위치'

  const balance = getPointBalance(state, state.currentDriverId)

  // 정렬은 미정 2 확정 전까지 작성일 내림차순. 반경은 NEAR_RADIUS_KM (미정 31 — 상수로 조정)
  const cards = effectiveLocation
    ? getCards(state, { near: effectiveLocation }).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      )
    : []

  const placeName = (placeId) => state.places.find((p) => p.id === placeId)?.name || ''

  const handleUnlock = (cardId) => {
    const r = unlockCard(state, state.currentDriverId, cardId)
    setState(r.state)
    setFailReasons((prev) => ({ ...prev, [cardId]: r.ok ? null : r.reason }))
  }

  const handleMove = () => {
    const next = MOCK_SPOTS[(spotIndex + 1) % MOCK_SPOTS.length] || MOCK_SPOTS[0]
    const r = moveMockLocation(state, { lat: next.lat, lng: next.lng })
    setState(r.state)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[390px] flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-title-3 tracking-tight text-ink-000">주변</h1>
        <PointText amount={balance} showSign={false} />
      </header>

      <div className="flex items-center justify-between rounded-md border border-hairline bg-paper p-3.5">
        <div className="flex flex-col gap-1">
          <span className="text-caption text-ink-500">현재 위치</span>
          <span className="text-body-sm font-bold text-ink-000">{locationLabel}</span>
          {usingFallback ? (
            <span className="text-caption text-ink-500">
              현재 위치를 얻지 못해 도착 센터 기준으로 보여드려요.
            </span>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1">
          <MockBadge />
          <button onClick={handleMove} className="text-caption font-bold text-ink-500 underline">
            Mock 위치 이동
          </button>
        </div>
      </div>

      <p className="text-caption text-ink-500">
        반경 {NEAR_RADIUS_KM}km 안의 암묵지를 보여드려요. 이 화면은 직접 열 때만 갱신돼요.
      </p>

      {cards.length === 0 ? (
        <EmptyState message="이 근처에는 아직 쌓인 경험이 없어요." />
      ) : (
        cards.map((card) => (
          <article
            key={card.id}
            onClick={() => router.push(`/cards/${card.id}`)}
            className="cursor-pointer rounded-lg border border-hairline bg-paper p-3.5 shadow-block animate-card-in"
          >
            <div className="flex items-center gap-2">
              <span className="rounded-xs border border-hairline bg-accent-soft px-1.5 py-0.5 text-micro font-bold tracking-wide text-ink-700">
                {CATEGORY_LABELS[card.category]}
              </span>
              {card.placeId ? (
                <span className="text-caption text-ink-500">{placeName(card.placeId)}</span>
              ) : null}
            </div>

            <h3 className="mt-2 text-body font-bold text-ink-000">
              {card.isUnlocked ? '' : '🔒 '}
              {card.title}
            </h3>

            {card.isUnlocked && card.reason ? (
              <p className="mt-1 text-body-sm text-ink-700">{card.reason}</p>
            ) : null}

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-ink-500">
              <span>작성 {formatDate(card.createdAt)}</span>
              {card.crossCheckCount > 0 ? <span>{card.crossCheckCount}명의 기사가 확인</span> : null}
            </div>

            {!card.isUnlocked ? (
              <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                <Button variant="accent" onClick={() => handleUnlock(card.id)}>
                  10P로 열기
                </Button>
                {failReasons[card.id] ? (
                  <p className="mt-1 text-caption text-ink-500">
                    {failReasons[card.id]} 내 경험을 공유하고 포인트를 받아 보세요.
                  </p>
                ) : null}
              </div>
            ) : null}
          </article>
        ))
      )}
    </main>
  )
}
