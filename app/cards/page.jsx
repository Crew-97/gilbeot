'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useStore } from '@/components/StoreProvider'
import { getCards } from '@/lib/store'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { LockedCardSummary } from '@/components/LockedCardSummary'

const CATEGORIES = [
  { key: 'center_tip', label: '센터팁' },
  { key: 'gas', label: '주유소' },
  { key: 'food', label: '식당' },
  { key: 'rest', label: '휴게소·쉼터' },
]

function formatDate(iso) {
  return iso ? iso.slice(0, 10).replaceAll('-', '.') : ''
}

function CardsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state } = useStore()

  if (!Array.isArray(state.cards) || !Array.isArray(state.centers) || !Array.isArray(state.places)) {
    return <ErrorState onRetry={() => window.location.reload()} />
  }

  const centerId = searchParams.get('centerId') || undefined
  const placeId = searchParams.get('placeId') || undefined
  const category = searchParams.get('category') || undefined
  const condition = { centerId, placeId, category }

  const cards = getCards(state, condition).sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  )
  const center = centerId ? state.centers.find((item) => item.id === centerId) : null
  const place = placeId ? state.places.find((item) => item.id === placeId) : null
  const contextLabel = place?.name || center?.name || '전체 노하우'

  const setCategory = (nextCategory) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('category', nextCategory)
    router.push(`/cards?${params.toString()}`)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[390px] flex-col gap-5 px-4 py-6">
      <header>
        <span className="text-caption text-ink-500">{contextLabel}</span>
        <h1 className="mt-1 text-title-2 tracking-tight text-ink-000">노하우 목록</h1>
      </header>

      <div className="grid grid-cols-4 gap-2" role="tablist" aria-label="노하우 카테고리">
        {CATEGORIES.map((item) => {
          const active = category === item.key
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setCategory(item.key)}
              className={
                'min-h-11 rounded-pill px-2 text-caption font-bold ' +
                (active
                  ? 'bg-yellow-500 text-ink-000'
                  : 'border border-hairline bg-paper text-ink-500')
              }
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {!category ? (
        <p className="text-caption text-ink-500">전체 카테고리의 노하우를 보여드려요.</p>
      ) : null}

      {cards.length === 0 ? (
        <EmptyState
          message="아직 등록된 노하우가 없어요. 첫 경험을 남겨 보세요."
          actionLabel="홈으로 가기"
          onAction={() => router.push('/home')}
        />
      ) : (
        <section className="flex flex-col gap-3">
          {cards.map((card) => {
            const cardPlace = card.placeId
              ? state.places.find((item) => item.id === card.placeId)
              : null
            const cardCenter =
              card.category === 'center_tip'
                ? state.centers.find((item) => item.id === card.centerId)
                : null

            return (
              <article
                key={card.id}
                className="rounded-lg border border-hairline bg-paper p-4 shadow-block animate-card-in"
              >
                {card.isUnlocked ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/cards/${encodeURIComponent(card.id)}`)}
                    className="min-h-11 w-full text-left"
                  >
                    <h2 className="text-body font-bold text-ink-000">{card.title}</h2>
                    <>
                      {card.reason ? (
                        <p className="mt-2 line-clamp-1 text-body-sm text-ink-700">{card.reason}</p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-ink-500">
                        {cardPlace ? <span>{cardPlace.name}</span> : null}
                        <span>👍 {card.helpfulCount}</span>
                        <span>👎 {card.notHelpfulCount}</span>
                        <span>작성 {formatDate(card.createdAt)}</span>
                      </div>
                    </>
                  </button>
                ) : (
                  <LockedCardSummary
                    card={card}
                    placeName={cardCenter?.name || cardPlace?.name || ''}
                    onUnlock={() => router.push(`/cards/${encodeURIComponent(card.id)}`)}
                  />
                )}
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}

export default function CardsPage() {
  return (
    <Suspense fallback={<main className="p-6 text-body-sm text-ink-500">목록을 불러오고 있어요.</main>}>
      <CardsContent />
    </Suspense>
  )
}
