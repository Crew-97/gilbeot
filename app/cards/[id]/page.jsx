'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/Button'
import { ErrorState } from '@/components/ErrorState'
import { LockedCardSummary } from '@/components/LockedCardSummary'
import { MockBadge } from '@/components/MockBadge'
import { PointText } from '@/components/PointText'
import { useStore } from '@/components/StoreProvider'
import {
  getCards,
  getPointBalance,
  switchToLowBalance,
  toggleVote,
  unlockCard,
} from '@/lib/store'

const CATEGORY_LABELS = {
  center_tip: '센터팁',
  gas: '주유소',
  food: '식당',
  rest: '휴게소·쉼터',
}

const UNLOCK_COST = 10

function formatDate(iso) {
  return iso ? iso.slice(0, 10).replaceAll('-', '.') : ''
}

function FullWidthButton({ children, ...props }) {
  return (
    <div className="flex [&>div]:w-full [&>div>button]:w-full">
      <Button {...props}>{children}</Button>
    </div>
  )
}

function PageHeader({ onBack, balance }) {
  return (
    <header className="sticky top-0 z-20 -mx-4 flex h-14 items-center justify-between border-b border-hairline bg-page px-1">
      <button
        type="button"
        onClick={onBack}
        className="min-h-11 min-w-11 rounded-pill px-3 text-body-sm font-bold text-ink-700 transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-000"
      >
        뒤로
      </button>
      <span className="text-body-sm font-bold text-ink-000">지식 카드</span>
      <div className="flex min-h-11 min-w-11 items-center justify-end">
        {balance === null ? null : <PointText amount={balance} showSign={false} />}
      </div>
    </header>
  )
}

function NotFoundState({ onBack }) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[390px] px-4 pb-8">
      <PageHeader onBack={onBack} balance={null} />
      <section className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <p className="text-body-sm text-ink-500">해당 암묵지를 찾을 수 없어요.</p>
        <Button onClick={onBack}>목록으로 돌아가기</Button>
      </section>
    </main>
  )
}

export default function CardDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { state, setState } = useStore()
  const [actionError, setActionError] = useState('')
  const [isChangingDemoState, setIsChangingDemoState] = useState(false)

  const hasRequiredData =
    Array.isArray(state?.cards) &&
    Array.isArray(state?.centers) &&
    Array.isArray(state?.places) &&
    Array.isArray(state?.evaluations) &&
    Array.isArray(state?.unlocks) &&
    Array.isArray(state?.pointTransactions)

  if (!hasRequiredData) {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-[390px] px-4 pb-8">
        <PageHeader onBack={() => router.push('/cards')} balance={null} />
        <ErrorState onRetry={() => window.location.reload()} />
      </main>
    )
  }

  const rawId = params?.id
  const cardId = Array.isArray(rawId) ? rawId[0] : rawId
  const card = getCards(state).find((item) => item.id === cardId)

  if (!card) {
    return <NotFoundState onBack={() => router.push('/cards')} />
  }

  const driverId = state.currentDriverId
  const balance = getPointBalance(state, driverId)
  const place = card.placeId
    ? state.places.find((item) => item.id === card.placeId)
    : null
  const center = state.centers.find((item) => item.id === card.centerId)
  const locationName = place?.name || center?.name || ''
  const isOwnCard = card.authorDriverId === driverId
  const currentVote = state.evaluations.find(
    (evaluation) => evaluation.driverId === driverId && evaluation.cardId === card.id
  )?.value
  const hasEnoughPoints = balance >= UNLOCK_COST

  const handleUnlock = () => {
    const result = unlockCard(state, driverId, card.id)
    setState(result.state)
    setActionError(result.ok ? '' : result.reason)
  }

  const handleVote = (value) => {
    // 카드당 한 번 남기며 다른 값으로만 변경한다. 같은 값을 다시 눌러도 취소하지 않는다
    if (value === currentVote) return

    const result = toggleVote(state, driverId, card.id, value)
    setState(result.state)
    setActionError(result.ok ? '' : result.reason)
  }

  const handleLowBalanceDemo = () => {
    if (isChangingDemoState) return

    setIsChangingDemoState(true)
    const result = switchToLowBalance(state)
    setState(result.state)

    if (!result.ok) {
      setActionError(result.reason)
      setIsChangingDemoState(false)
      return
    }

    const nextLockedCard = getCards(result.state).find((item) => !item.isUnlocked)
    if (nextLockedCard) {
      setIsChangingDemoState(false)
      router.replace(`/cards/${encodeURIComponent(nextLockedCard.id)}`)
      return
    }

    setIsChangingDemoState(false)
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[390px] px-4 pb-8">
      <PageHeader onBack={() => router.back()} balance={balance} />

      <div className="flex flex-col gap-8 py-6">
        {card.isUnlocked ? (
          <section aria-labelledby="card-title" className="animate-card-in">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xs border border-hairline bg-accent-soft px-1.5 py-0.5 text-micro font-bold tracking-wide text-ink-700">
                {CATEGORY_LABELS[card.category]}
              </span>
              {locationName ? (
                <span className="text-caption text-ink-500">{locationName}</span>
              ) : null}
            </div>

            <p className="mt-5 text-caption font-bold text-ink-500">핵심 정보</p>
            <h1
              id="card-title"
              className="mt-2 break-keep text-title-2 font-bold tracking-tight text-ink-000"
            >
              {card.title}
            </h1>
          </section>
        ) : (
          // 잠긴 카드는 제목 없이 카테고리·장소·평가 수·작성일만 보여준다 (해소 33)
          // 해금 버튼은 아래 해금 섹션이 담당하므로 onUnlock 을 넘기지 않는다
          <section className="animate-card-in">
            <LockedCardSummary card={card} placeName={locationName} />
          </section>
        )}

        {!card.isUnlocked ? (
          <section
            aria-labelledby="unlock-title"
            className="rounded-lg border border-hairline bg-paper p-3.5 shadow-block animate-card-in"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="unlock-title" className="text-body font-bold text-ink-000">
                  10P로 암묵지를 열어요
                </h2>
                <p className="mt-1 text-caption text-ink-500">
                  해금한 카드는 다시 볼 때 포인트가 차감되지 않아요.
                </p>
              </div>
              <span className="shrink-0 rounded-pill bg-yellow-500 px-3 py-1 text-body-sm font-bold text-ink-000">
                🔒 10P
              </span>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-2 rounded-md bg-sunken p-3.5">
              <div>
                <dt className="text-caption text-ink-500">현재 포인트</dt>
                <dd className="mt-1 text-title-3 font-bold tracking-tight text-ink-000">
                  {balance}P
                </dd>
              </div>
              <div>
                <dt className="text-caption text-ink-500">필요 포인트</dt>
                <dd className="mt-1 text-title-3 font-bold tracking-tight text-ink-000">
                  {UNLOCK_COST}P
                </dd>
              </div>
            </dl>

            <div className="mt-5">
              <FullWidthButton
                onClick={handleUnlock}
                disabled={!hasEnoughPoints}
                disabledReason={
                  hasEnoughPoints
                    ? undefined
                    : '포인트가 부족해요. 내 경험을 공유하고 포인트를 받아 보세요.'
                }
              >
                10P로 열기
              </FullWidthButton>
            </div>

            {!hasEnoughPoints ? (
              <div className="mt-4">
                <FullWidthButton onClick={() => router.push('/home')}>
                  내 경험을 공유하고 포인트 받기
                </FullWidthButton>
              </div>
            ) : null}
          </section>
        ) : (
          <>
            {card.reason ? (
              <section
                aria-labelledby="reason-title"
                className="rounded-lg border border-hairline bg-paper p-3.5 shadow-block animate-card-in"
              >
                <h2 id="reason-title" className="text-body-sm font-bold text-ink-000">
                  이유
                </h2>
                <p className="mt-2 break-keep text-body text-ink-700">{card.reason}</p>
              </section>
            ) : null}

            <section
              aria-label="암묵지 정보"
              className="rounded-lg border border-hairline bg-paper p-3.5 shadow-block animate-card-in"
            >
              <dl className="flex flex-col gap-3 text-body-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-ink-500">작성일</dt>
                  <dd className="font-bold text-ink-700">{formatDate(card.createdAt)}</dd>
                </div>
                {card.crossCheckCount > 0 ? (
                  <div className="flex items-center justify-between gap-4 border-t border-line-soft pt-3">
                    <dt className="text-ink-500">교차 검증</dt>
                    <dd className="font-bold text-ink-700">
                      {card.crossCheckCount}명의 기사가 확인
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <section
              aria-labelledby="vote-title"
              className="rounded-lg border border-hairline bg-paper p-3.5 shadow-block animate-card-in"
            >
              <h2 id="vote-title" className="break-keep text-body font-bold text-ink-000">
                이 암묵지가 도움이 됐나요?
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={currentVote === 'helpful'}
                  onClick={() => handleVote('helpful')}
                  disabled={isOwnCard}
                  className={
                    'min-h-12 rounded-pill border px-3 text-body-sm font-bold transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-000 disabled:cursor-not-allowed disabled:border-hairline disabled:bg-ink-050 disabled:text-ink-300 ' +
                    (currentVote === 'helpful'
                      ? 'border-yellow-500 bg-yellow-500 text-ink-000'
                      : 'border-hairline bg-paper text-ink-700')
                  }
                >
                  👍 도움됐어요 {card.helpfulCount}
                </button>
                <button
                  type="button"
                  aria-pressed={currentVote === 'not_helpful'}
                  onClick={() => handleVote('not_helpful')}
                  disabled={isOwnCard}
                  className={
                    'min-h-12 rounded-pill border px-3 text-body-sm font-bold transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-000 disabled:cursor-not-allowed disabled:border-hairline disabled:bg-ink-050 disabled:text-ink-300 ' +
                    (currentVote === 'not_helpful'
                      ? 'border-ink-000 bg-sunken text-ink-000'
                      : 'border-hairline bg-paper text-ink-700')
                  }
                >
                  👎 도움 안 됐어요 {card.notHelpfulCount}
                </button>
              </div>
              {isOwnCard ? (
                <p className="mt-3 text-caption text-ink-500">
                  자기 카드는 평가할 수 없어요.
                </p>
              ) : null}
            </section>

            {!isOwnCard && balance >= UNLOCK_COST ? (
              <section className="rounded-md border border-hairline bg-sunken p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-body-sm font-bold text-ink-000">시연용 포인트 상태</h2>
                  <MockBadge />
                </div>
                <p className="mt-2 text-caption text-ink-500">
                  여러 암묵지를 열어 잔액이 0P인 상태로 전환해요.
                </p>
                <div className="mt-4">
                  <FullWidthButton
                    variant="ghost"
                    onClick={handleLowBalanceDemo}
                    disabled={isChangingDemoState}
                    disabledReason={isChangingDemoState ? '상태를 전환하고 있어요.' : undefined}
                  >
                    잔액 0P 상태로 전환
                  </FullWidthButton>
                </div>
              </section>
            ) : null}
          </>
        )}

        {actionError ? (
          <p role="alert" className="text-center text-caption text-danger">
            {actionError}
          </p>
        ) : null}
      </div>
    </main>
  )
}
