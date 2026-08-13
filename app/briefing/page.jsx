'use client'

// S-09 도착지 브리핑 — 저장된 카드를 카테고리 4종으로 정리·배치만 한다 (기획서 8-4)
// LLM 을 호출하지 않는다. 잠긴 카드는 제목 없이 카테고리·장소·평가 수·작성일만 보여준다 (해소 33)

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/components/StoreProvider'
import { getCards, getCurrentDispatch, getPointBalance, unlockCard } from '@/lib/store'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Header } from '@/components/Header'
import { LockedCardSummary } from '@/components/LockedCardSummary'
import { PointText } from '@/components/PointText'

const CATEGORIES = [
  { key: 'center_tip', label: '화물센터 팁' },
  { key: 'gas', label: '주유소' },
  { key: 'food', label: '식당' },
  { key: 'rest', label: '휴게소·쉼터' },
]

function formatDate(iso) {
  return iso ? iso.slice(0, 10).replaceAll('-', '.') : ''
}

export default function BriefingPage() {
  const router = useRouter()
  const { state, setState } = useStore()
  // 해금 실패 사유를 카드별로 보여주기 위한 화면 상태
  const [failReasons, setFailReasons] = useState({})

  // 실패 상태: 시드 로드가 깨졌으면 재시도 안내
  if (!Array.isArray(state.centers) || state.centers.length === 0) {
    return <ErrorState onRetry={() => window.location.reload()} />
  }

  // 진입 전제: S-02 에서 도착지를 선택해 dispatch 가 생긴 상태
  const dispatch = getCurrentDispatch(state)
  if (!dispatch) {
    return (
      <EmptyState
        message="도착지를 먼저 입력하세요."
        actionLabel="도착지 입력"
        onAction={() => router.push('/destination')}
      />
    )
  }

  const center = state.centers.find((c) => c.id === dispatch.centerId)
  const balance = getPointBalance(state, state.currentDriverId)

  // 정렬은 미정 2 확정 전까지 작성일 내림차순 (S-04 와 같은 판단을 공유한다)
  const cards = getCards(state, { centerId: dispatch.centerId }).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  )
  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    cards: cards.filter((c) => c.category === cat.key),
  }))

  const placeName = (placeId) => state.places.find((p) => p.id === placeId)?.name || ''

  const handleUnlock = (cardId) => {
    const r = unlockCard(state, state.currentDriverId, cardId)
    setState(r.state)
    setFailReasons((prev) => ({ ...prev, [cardId]: r.ok ? null : r.reason }))
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[390px] flex-col gap-6 px-4 pb-6">
      <Header
        title={`${center?.name} 도착지 브리핑`}
        onBack={() => router.push('/destination')}
        right={<PointText amount={balance} showSign={false} />}
      />

      {/* 카테고리 4종별 건수 한 줄 */}
      <p className="text-caption text-ink-500">
        {grouped.map((g) => `${g.label} ${g.cards.length}건`).join(' · ')}
      </p>

      {cards.length === 0 ? (
        <EmptyState message="이 도착지에는 아직 쌓인 경험이 없어요." />
      ) : (
        grouped.map((group) => (
          <section key={group.key} className="flex flex-col gap-3">
            <h2 className="text-label font-bold text-ink-700">
              {group.label} <span className="text-ink-300">{group.cards.length}건</span>
            </h2>
            {group.cards.length === 0 ? (
              <p className="text-body-sm text-ink-500">아직 등록된 암묵지가 없어요.</p>
            ) : (
              group.cards.map((card) => (
                <article
                  key={card.id}
                  onClick={() => router.push(`/cards/${card.id}`)}
                  className="cursor-pointer rounded-lg border border-hairline bg-paper p-3.5 shadow-block animate-card-in"
                >
                  {card.isUnlocked ? (
                    <>
                      <h3 className="text-body font-bold text-ink-000">{card.title}</h3>

                      {card.reason ? (
                        <p className="mt-1 text-body-sm text-ink-700">{card.reason}</p>
                      ) : null}

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-ink-500">
                        {card.placeId ? <span>{placeName(card.placeId)}</span> : null}
                        <span>작성 {formatDate(card.createdAt)}</span>
                        {card.crossCheckCount > 0 ? (
                          <span>{card.crossCheckCount}명의 기사가 확인</span>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <LockedCardSummary
                      card={card}
                      placeName={card.placeId ? placeName(card.placeId) : center?.name || ''}
                      onUnlock={() => handleUnlock(card.id)}
                      failReason={failReasons[card.id]}
                    />
                  )}
                </article>
              ))
            )}
          </section>
        ))
      )}

      <div className="sticky bottom-4 mt-auto flex justify-center">
        <Button className="w-full max-w-[358px]" onClick={() => router.push('/home')}>
          도착지 확정
        </Button>
      </div>
    </main>
  )
}
