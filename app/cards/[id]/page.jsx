'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/Button'
import { ErrorState } from '@/components/ErrorState'
import { LockedCardSummary } from '@/components/LockedCardSummary'
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

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 5 8 12l7 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8.2" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.8 19.2c.55-3.8 2.62-5.7 6.2-5.7s5.65 1.9 6.2 5.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s6-5.35 6-11a6 6 0 1 0-12 0c0 5.65 6 11 6 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m9 5 7 7-7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ThumbIcon({ direction }) {
  const transform = direction === 'down' ? 'rotate(180 12 12)' : undefined

  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      transform={transform}
      aria-hidden="true"
    >
      <path
        d="M7.5 20H5.2A2.2 2.2 0 0 1 3 17.8v-6.6A2.2 2.2 0 0 1 5.2 9h2.3m0 11V9l3.8-5.1c.75-1 2.35-.48 2.35.77V9h4.13a3 3 0 0 1 2.93 3.65l-1.1 5A3 3 0 0 1 16.7 20H7.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ModalShell({ children, onBack, title = '노하우 상세' }) {
  const backButtonRef = useRef(null)
  const onBackRef = useRef(onBack)

  useEffect(() => {
    onBackRef.current = onBack
  }, [onBack])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    backButtonRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onBackRef.current()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 sm:items-center sm:p-4">
      <main
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-detail-modal-title"
        className="relative h-[calc(100dvh-12px)] w-full max-w-[430px] overflow-y-auto overscroll-contain rounded-t-[28px] bg-page shadow-overlay sm:h-[min(820px,calc(100dvh-32px))] sm:rounded-[28px]"
      >
        <header className="sticky top-0 z-20 grid h-[68px] grid-cols-[46px_1fr_46px] items-center gap-3 border-b border-white/70 bg-[rgba(255,253,247,0.86)] px-5 backdrop-blur-xl">
          <button
            type="button"
            ref={backButtonRef}
            onClick={onBack}
            aria-label="뒤로"
            className="flex h-[46px] w-[46px] items-center justify-center rounded-[18px] border border-white/80 bg-white/60 text-ink-700 shadow-[0_6px_18px_rgba(82,57,18,0.12)] backdrop-blur-xl transition-transform active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-000"
          >
            <BackIcon />
          </button>
          <span
            id="card-detail-modal-title"
            className="truncate text-center text-[16px] font-bold leading-none text-ink-000"
          >
            {title}
          </span>
          <span aria-hidden="true" />
        </header>
        {children}
      </main>
    </div>
  )
}

function NotFoundState({ onBack }) {
  return (
    <ModalShell onBack={onBack}>
      <section className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <p className="text-body-sm text-ink-500">해당 노하우를 찾을 수 없어요.</p>
        <Button onClick={onBack}>목록으로 돌아가기</Button>
      </section>
    </ModalShell>
  )
}

function AuthorMeta({ author, createdAt }) {
  if (!author) return null

  return (
    <div className="mt-5 flex min-h-11 items-center gap-3" aria-label="작성자 정보">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-050 text-ink-500">
        <ProfileIcon />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[16px] font-bold leading-5 text-ink-000">
          {author.name}
        </span>
        <span className="mt-0.5 block text-[12px] leading-4 text-ink-500">
          작성 {formatDate(createdAt)}
        </span>
      </span>
    </div>
  )
}

function ContextCard({ category, locationName }) {
  if (!locationName) return null

  return (
    <div className="mt-7 flex min-h-[76px] items-center gap-3 rounded-[18px] bg-[#fff0df] px-4 py-3.5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-white/70 text-orange-500">
        <LocationIcon />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-bold leading-4 text-orange-500">
          연결된 {CATEGORY_LABELS[category] || '장소'}
        </span>
        <span className="mt-0.5 block truncate text-[16px] font-bold leading-5 text-ink-000">
          {locationName}
        </span>
      </span>
      <span className="shrink-0 text-orange-500/70">
        <ChevronIcon />
      </span>
    </div>
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
    Array.isArray(state?.drivers) &&
    Array.isArray(state?.evaluations) &&
    Array.isArray(state?.unlocks) &&
    Array.isArray(state?.pointTransactions)

  if (!hasRequiredData) {
    return (
      <ModalShell onBack={() => router.push('/cards')}>
        <div className="px-6 py-12">
          <ErrorState onRetry={() => window.location.reload()} />
        </div>
      </ModalShell>
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
  const author = state.drivers.find((item) => item.id === card.authorDriverId)
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
    <ModalShell onBack={() => router.back()}>
      <div className="px-6 pb-10 pt-5">
        {card.isUnlocked ? (
          <article aria-labelledby="card-title" className="animate-card-in">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-pill bg-accent-soft px-2.5 py-1 text-[12px] font-bold leading-4 text-ink-700">
                {CATEGORY_LABELS[card.category]}
              </span>
              {card.crossCheckCount > 0 ? (
                <span className="text-[12px] font-bold leading-4 text-success">
                  {card.crossCheckCount}명의 기사가 확인
                </span>
              ) : null}
            </div>

            <h1
              id="card-title"
              className="mt-3 break-keep text-[26px] font-extrabold leading-[1.3] tracking-[-0.025em] text-ink-000"
            >
              {card.title}
            </h1>

            <AuthorMeta author={author} createdAt={card.createdAt} />
            <ContextCard category={card.category} locationName={locationName} />

            {card.reason ? (
              <section aria-labelledby="reason-title" className="mt-8 border-t border-line-soft pt-6">
                <h2 id="reason-title" className="text-[13px] font-bold leading-5 text-ink-500">
                  이유
                </h2>
                <p className="mt-3 break-keep text-[16px] leading-[25px] text-ink-700">
                  {card.reason}
                </p>
              </section>
            ) : null}

            <section aria-labelledby="vote-title" className="mt-8 border-t border-line-soft pt-6">
              <h2 id="vote-title" className="break-keep text-[16px] font-bold leading-6 text-ink-000">
                이 노하우가 도움이 됐나요?
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  aria-pressed={currentVote === 'helpful'}
                  onClick={() => handleVote('helpful')}
                  disabled={isOwnCard}
                  className={
                    'flex min-h-12 items-center justify-center gap-1.5 rounded-pill border px-3 text-[14px] font-bold leading-5 transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-000 disabled:cursor-not-allowed disabled:border-hairline disabled:bg-ink-050 disabled:text-ink-300 ' +
                    (currentVote === 'helpful'
                      ? 'border-[#ef6a5b] bg-[#fff0ed] text-[#e75c4f]'
                      : 'border-hairline bg-paper text-ink-700')
                  }
                >
                  <ThumbIcon direction="up" />
                  <span>도움됐어요 {card.helpfulCount}</span>
                </button>
                <button
                  type="button"
                  aria-pressed={currentVote === 'not_helpful'}
                  onClick={() => handleVote('not_helpful')}
                  disabled={isOwnCard}
                  className={
                    'flex min-h-12 items-center justify-center gap-1.5 rounded-pill border px-3 text-[14px] font-bold leading-5 transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-000 disabled:cursor-not-allowed disabled:border-hairline disabled:bg-ink-050 disabled:text-ink-300 ' +
                    (currentVote === 'not_helpful'
                      ? 'border-ink-000 bg-sunken text-ink-000'
                      : 'border-hairline bg-paper text-ink-700')
                  }
                >
                  <ThumbIcon direction="down" />
                  <span>도움 안 됐어요 {card.notHelpfulCount}</span>
                </button>
              </div>
              {isOwnCard ? (
                <p className="mt-3 text-[12px] leading-4 text-ink-500">
                  자기 노하우는 평가할 수 없어요.
                </p>
              ) : null}
            </section>

            {!isOwnCard && balance >= UNLOCK_COST ? (
              <section className="mt-8 border-t border-line-soft pt-6">
                <p className="text-[13px] leading-5 text-ink-500">
                  포인트를 모두 사용한 다음 흐름을 확인해요.
                </p>
                <div className="mt-3">
                  <FullWidthButton
                    variant="ghost"
                    onClick={handleLowBalanceDemo}
                    disabled={isChangingDemoState}
                    disabledReason={isChangingDemoState ? '상태를 전환하고 있어요.' : undefined}
                  >
                    잔액 0P 상태 보기
                  </FullWidthButton>
                </div>
              </section>
            ) : null}
          </article>
        ) : (
          <article className="animate-card-in">
            <section className="rounded-[18px] border border-hairline bg-paper p-4 shadow-block">
              <LockedCardSummary card={card} placeName={locationName} />
            </section>

            <section
              aria-labelledby="unlock-title"
              className="mt-6 rounded-[18px] bg-[#fff0df] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 id="unlock-title" className="text-[20px] font-extrabold leading-[1.35] text-ink-000">
                    10P로 노하우를 열어요
                  </h1>
                  <p className="mt-1.5 text-[13px] leading-5 text-ink-500">
                    해금한 노하우는 다시 볼 때 포인트가 차감되지 않아요.
                  </p>
                </div>
                <span className="shrink-0 rounded-pill bg-yellow-500 px-3 py-1 text-[14px] font-bold leading-5 text-ink-000">
                  🔒 10P
                </span>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-2 rounded-[16px] bg-white/70 p-3.5">
                <div>
                  <dt className="text-[12px] leading-4 text-ink-500">현재 포인트</dt>
                  <dd className="mt-1 text-[22px] font-bold leading-7 tracking-tight text-ink-000">
                    {balance}P
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] leading-4 text-ink-500">필요 포인트</dt>
                  <dd className="mt-1 text-[22px] font-bold leading-7 tracking-tight text-ink-000">
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
          </article>
        )}

        {actionError ? (
          <p role="alert" className="mt-6 text-center text-[13px] leading-5 text-danger">
            {actionError}
          </p>
        ) : null}
      </div>
    </ModalShell>
  )
}
