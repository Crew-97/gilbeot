'use client'

import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { PointText } from '@/components/PointText'
import { useStore } from '@/components/StoreProvider'
import { getPointBalance, getPointTransactions } from '@/lib/store'

const TRANSACTION_LABELS = {
  signup_bonus: '가입 축하 포인트',
  interview_reward: '암묵지 기여',
  extra_reward: '추가 음성 기여 보너스',
  unlock_spend: '암묵지 해금',
}

const POINT_RULES = [
  { label: '최초 가입', amount: '+100P' },
  { label: '유효한 암묵지 기여', amount: '+100P' },
  { label: '추가 음성 기여 보너스', detail: '인터뷰당 최대 +50P', amount: '+10P/건' },
  { label: '암묵지 1건 해금', detail: '재열람 무료', amount: '-10P' },
]

function formatDateTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .formatToParts(date)
    .reduce((result, part) => ({ ...result, [part.type]: part.value }), {})

  return `${parts.year}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}`
}

function getTransactionTarget(state, transaction) {
  if (transaction.type === 'signup_bonus') return '없음'

  if (transaction.type === 'interview_reward') {
    const interview = state.interviews.find((item) => item.id === transaction.interviewId)
    const place = interview
      ? state.places.find((item) => item.id === interview.placeId)
      : null
    const center = interview
      ? state.centers.find((item) => item.id === interview.centerId)
      : null
    const locationName = place?.name || center?.name
    return locationName ? `인터뷰 · ${locationName}` : '연결된 인터뷰'
  }

  const card = state.cards.find((item) => item.id === transaction.cardId)
  return card ? `지식 카드 · ${card.title}` : '연결된 지식 카드'
}

export default function MyPage() {
  const store = useStore()
  const state = store?.state

  const hasRequiredData =
    state &&
    typeof state.currentDriverId === 'string' &&
    Array.isArray(state.pointTransactions) &&
    Array.isArray(state.interviews) &&
    Array.isArray(state.cards) &&
    Array.isArray(state.places) &&
    Array.isArray(state.centers) &&
    state.pointTransactions.every(
      (transaction) =>
        typeof transaction.id === 'string' &&
        typeof transaction.driverId === 'string' &&
        TRANSACTION_LABELS[transaction.type] &&
        Number.isFinite(transaction.amount) &&
        typeof transaction.createdAt === 'string' &&
        !Number.isNaN(new Date(transaction.createdAt).getTime())
    )

  if (!hasRequiredData) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col px-4 py-6 font-sans">
        <header className="flex min-h-14 items-center">
          <h1 className="text-title-3 font-bold tracking-tight text-ink-000">
            포인트·기여 내역
          </h1>
        </header>
        <div className="my-auto">
          <ErrorState onRetry={() => window.location.reload()} />
        </div>
      </main>
    )
  }

  const transactions = getPointTransactions(state, state.currentDriverId)
  const balance = getPointBalance(state, state.currentDriverId)

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col px-4 py-6 font-sans">
      <header className="flex min-h-14 items-center">
        <h1 className="text-title-3 font-bold tracking-tight text-ink-000">
          포인트·기여 내역
        </h1>
      </header>

      <section
        className="mt-3 rounded-lg border border-yellow-600/20 bg-yellow-500 p-3.5 text-ink-000 animate-card-in"
        aria-labelledby="point-balance-title"
      >
        <h2 id="point-balance-title" className="text-caption">
          보유 포인트
        </h2>
        <PointText amount={balance} showSign={false} className="mt-1 block text-title-1" />
        <p className="mt-2 text-caption">다른 기사의 암묵지를 1건에 10P로 열 수 있어요.</p>
      </section>

      <section
        className="mt-3 rounded-lg border border-hairline bg-paper p-3.5 shadow-block"
        aria-labelledby="point-rules-title"
      >
        <h2 id="point-rules-title" className="text-body font-bold text-ink-000">
          포인트 규칙
        </h2>
        <dl className="mt-3 flex flex-col">
          {POINT_RULES.map((rule, index) => (
            <div
              key={rule.label}
              className={
                'flex items-start justify-between gap-4 py-2.5 ' +
                (index === 0 ? '' : 'border-t border-line-soft')
              }
            >
              <dt className="text-body-sm text-ink-500">
                {rule.label}
                {rule.detail ? (
                  <span className="mt-0.5 block text-caption text-ink-300">{rule.detail}</span>
                ) : null}
              </dt>
              <dd className="shrink-0 text-body-sm font-bold text-ink-000">{rule.amount}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 border-t border-line-soft pt-3 text-caption text-ink-500">
          포인트는 암묵지 해금에만 써요. 유효한 기여는 게시를 완료해야 적립돼요.
        </p>
      </section>

      <section className="mt-8" aria-labelledby="point-history-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-caption font-bold text-ink-500">최신순</span>
            <h2
              id="point-history-title"
              className="mt-1 text-title-3 font-bold tracking-tight text-ink-000"
            >
              내역
            </h2>
          </div>
          <span className="text-caption text-ink-500">{transactions.length}건</span>
        </div>

        {transactions.length === 0 ? (
          <div className="mt-3 rounded-lg border border-hairline bg-paper shadow-block">
            <EmptyState message="아직 포인트 내역이 없어요." />
          </div>
        ) : (
          <ol className="mt-3 overflow-hidden rounded-lg border border-hairline bg-paper shadow-block">
            {transactions.map((transaction, index) => {
              const dateTime = formatDateTime(transaction.createdAt)

              return (
                <li
                  key={transaction.id}
                  className={
                    'p-4 animate-card-in ' +
                    (index === 0 ? '' : 'border-t border-line-soft')
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-body font-bold text-ink-000">
                      {TRANSACTION_LABELS[transaction.type]}
                    </h3>
                    <PointText
                      amount={transaction.amount}
                      className={transaction.amount < 0 ? 'shrink-0 text-ink-500' : 'shrink-0'}
                    />
                  </div>

                  <p className="mt-2 text-body-sm text-ink-500">
                    <span className="font-bold text-ink-700">연결 대상</span>
                    <span aria-hidden="true"> · </span>
                    {getTransactionTarget(state, transaction)}
                  </p>
                  {dateTime ? (
                    <time
                      className="mt-1 block text-caption text-ink-300"
                      dateTime={transaction.createdAt}
                    >
                      {dateTime}
                    </time>
                  ) : null}
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </main>
  )
}
