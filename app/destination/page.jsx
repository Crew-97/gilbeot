'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/components/StoreProvider'
import { createDispatch, getCards } from '@/lib/store'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { MockBadge } from '@/components/MockBadge'

const MOCK_ORIGIN = {
  label: '현재 위치',
  lat: 37.456,
  lng: 126.896,
}

export default function DestinationPage() {
  const router = useRouter()
  const { state, setState } = useStore()
  const [pendingCenterId, setPendingCenterId] = useState(null)
  const [failReason, setFailReason] = useState(null)

  if (!Array.isArray(state.centers) || !Array.isArray(state.cards)) {
    return <ErrorState onRetry={() => window.location.reload()} />
  }

  const handleSelectCenter = (centerId) => {
    setPendingCenterId(centerId)
    setFailReason(null)

    const result = createDispatch(state, state.currentDriverId, MOCK_ORIGIN, centerId)
    if (!result.ok) {
      setPendingCenterId(null)
      setFailReason(result.reason)
      return
    }

    setState(result.state)
    router.push('/briefing')
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[390px] flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-2">
        <span className="text-caption font-bold text-ink-500">이번 운행</span>
        <h1 className="text-title-2 tracking-tight text-ink-000">출발지와 도착지를 입력하세요</h1>
        <p className="text-body-sm text-ink-500">
          도착지와 주변 장소에 쌓인 암묵지를 먼저 확인할 수 있어요.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-label font-bold text-ink-700">출발지</h2>
          <MockBadge />
        </div>
        <label className="flex min-h-12 items-center rounded-md border border-hairline bg-paper px-4 shadow-block">
          <span className="sr-only">출발지</span>
          <input
            readOnly
            value={MOCK_ORIGIN.label}
            className="w-full bg-transparent text-body font-bold text-ink-000 outline-none"
          />
        </label>
        <p className="text-caption text-ink-500">
          현재 위치는 지도 표시와 운행 여정 관리에만 사용해요.
        </p>
      </section>

      <section className="flex flex-1 flex-col gap-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-title-3 tracking-tight text-ink-000">도착 화물센터</h2>
            <p className="mt-1 text-caption text-ink-500">처음 가는 센터를 선택하세요.</p>
          </div>
          <MockBadge />
        </div>

        {state.centers.length === 0 ? (
          <EmptyState message="표시할 화물센터가 없어요." />
        ) : (
          <div className="flex flex-col gap-3">
            {state.centers.map((center) => {
              const cardCount = getCards(state, { centerId: center.id }).length
              const pending = pendingCenterId === center.id

              return (
                <button
                  key={center.id}
                  type="button"
                  disabled={pendingCenterId !== null}
                  onClick={() => handleSelectCenter(center.id)}
                  className="flex min-h-11 w-full items-center justify-between gap-4 rounded-lg border border-hairline bg-paper p-4 text-left shadow-block transition-transform active:scale-[0.99] disabled:opacity-60"
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-body font-bold text-ink-000">{center.name}</span>
                    <span className="truncate text-caption text-ink-500">{center.address}</span>
                  </span>
                  <span className="shrink-0 rounded-pill bg-accent-soft px-3 py-1.5 text-caption font-bold text-ink-700">
                    {pending ? '선택 중' : `암묵지 ${cardCount}건`}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {failReason ? <p className="text-body-sm text-danger">{failReason}</p> : null}
      </section>
    </main>
  )
}
