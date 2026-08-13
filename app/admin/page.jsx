'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { useStore } from '@/components/StoreProvider'
import { loadKakaoMaps } from '@/lib/kakao'
import { applyAdminAction, getAllCards } from '@/lib/store'

const VIEWS = [
  { id: 'dashboard', label: '현황 대시보드', icon: 'dashboard' },
  { id: 'review', label: '검토 필요', icon: 'review' },
  { id: 'cards', label: '암묵지 관리', icon: 'cards' },
  { id: 'visits', label: '방문 현황', icon: 'map' },
]

const CATEGORY_LABELS = {
  center_tip: '센터팁',
  gas: '주유소',
  food: '식당',
  rest: '휴게소·쉼터',
}

const STATUS_LABELS = {
  draft: '초안',
  published: '게시 중',
  review: '검토 필요',
  hidden: '비공개',
  deleted: '삭제됨',
}

const STATUS_STYLES = {
  draft: 'border-ink-100 bg-ink-050 text-ink-500',
  published: 'border-yellow-600/20 bg-accent-soft text-ink-700',
  review: 'border-danger/20 bg-danger/10 text-danger',
  hidden: 'border-ink-200 bg-sunken text-ink-500',
  deleted: 'border-inverse bg-inverse text-paper',
}

const ACTIONS = {
  keep: {
    label: '유지',
    question: '암묵지 내용을 유지하고 다시 게시할까요?',
    success: '암묵지 내용을 유지하고 게시 상태로 되돌렸어요.',
  },
  hide: {
    label: '비공개',
    question: '이 암묵지 카드를 비공개로 전환할까요?',
    success: '암묵지 카드를 비공개로 전환했어요.',
  },
  delete: {
    label: '삭제',
    question: '이 암묵지 카드를 삭제 상태로 전환할까요?',
    success: '암묵지 카드를 삭제 상태로 전환했어요.',
  },
  reviewDone: {
    label: '검토 완료',
    question: '검토를 완료하고 다시 게시할까요?',
    success: '검토를 완료하고 게시 상태로 되돌렸어요.',
  },
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(date)
    .reduce((result, part) => ({ ...result, [part.type]: part.value }), {})

  return `${parts.year}.${parts.month}.${parts.day}`
}

function formatDateTime(value) {
  if (!value) return ''
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

function getReviewReasons(card) {
  const total = card.helpfulCount + card.notHelpfulCount
  const reasons = []

  if (card.notHelpfulCount >= 5) {
    reasons.push(`도움 안 됐어요 ${card.notHelpfulCount}회`)
  }
  if (total >= 5 && card.notHelpfulCount / total >= 0.6) {
    reasons.push(`전체 평가 ${total}건 중 도움 안 됐어요 ${card.notHelpfulCount}건`)
  }

  return reasons
}

function getLocation(state, card) {
  const center = state.centers.find((item) => item.id === card.centerId) || null
  const place = card.placeId
    ? state.places.find((item) => item.id === card.placeId) || null
    : null
  return { center, place }
}

function getOriginalSttItems(state, card) {
  const items = card.interviewId
    ? state.interviewItems.filter((item) => item.interviewId === card.interviewId)
    : []
  const validItems = items.filter((item) => item.sttText)

  if (validItems.length > 0) return validItems
  if (!card.sttText) return []
  return [{ id: `${card.id}_stt`, question: '', sttText: card.sttText }]
}

function AdminIcon({ name, className = '' }) {
  if (name === 'dashboard') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    )
  }

  if (name === 'review') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z" />
        <path d="M12 8v5" />
        <path d="M12 17h.01" />
      </svg>
    )
  }

  if (name === 'cards') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    )
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
      <path d="M9 3v15M15 6v15" />
    </svg>
  )
}

function StatusBadge({ status }) {
  return (
    <span
      className={
        'inline-flex min-h-7 items-center rounded-pill border px-2.5 text-caption font-bold ' +
        (STATUS_STYLES[status] || STATUS_STYLES.draft)
      }
    >
      {STATUS_LABELS[status] || status}
    </span>
  )
}

function CategoryBadge({ category }) {
  return (
    <span className="inline-flex min-h-7 items-center rounded-pill border border-hairline bg-sunken px-2.5 text-caption font-bold text-ink-700">
      {CATEGORY_LABELS[category] || category}
    </span>
  )
}

function SectionHeading({ eyebrow, title, meta }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-caption font-bold text-ink-500">{eyebrow}</p> : null}
        <h2 className="mt-1 text-title-3 font-bold tracking-tight text-ink-000">{title}</h2>
      </div>
      {meta ? <div className="shrink-0">{meta}</div> : null}
    </div>
  )
}

function MetricCard({ label, value, detail, accent = false }) {
  return (
    <article
      className={
        'flex min-h-[112px] flex-col justify-between rounded-lg border p-4 shadow-block animate-card-in ' +
        (accent
          ? 'border-yellow-600/20 bg-yellow-500 text-ink-000'
          : 'border-hairline bg-sunken text-ink-700')
      }
    >
      <p className="text-caption font-bold">{label}</p>
      <div className="mt-3">
        <p className="text-title-1 font-bold tracking-tight text-ink-000">{value}</p>
        {detail ? <p className="mt-1 text-caption text-ink-500">{detail}</p> : null}
      </div>
    </article>
  )
}

function CardListRow({ state, card, selected = false, onSelect }) {
  const { center, place } = getLocation(state, card)
  const location = place?.name || center?.name || ''

  return (
    <button
      type="button"
      onClick={() => onSelect(card.id)}
      aria-pressed={selected}
      className={
        'grid min-h-[92px] w-full grid-cols-[minmax(0,1.25fr)_minmax(150px,.75fr)_110px_145px] items-center gap-4 border-t border-line-soft px-4 py-3 text-left transition-colors first:border-t-0 focus-visible:z-[1] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink-000 ' +
        (selected ? 'bg-accent-soft' : 'bg-paper hover:bg-sunken')
      }
    >
      <span className="min-w-0">
        <span className="line-clamp-2 text-body font-bold text-ink-000">{card.title}</span>
        <span className="mt-1 block text-caption text-ink-500">
          작성 {formatDate(card.createdAt)}
        </span>
      </span>
      <span className="min-w-0">
        <CategoryBadge category={card.category} />
        {location ? <span className="mt-1 block truncate text-caption text-ink-500">{location}</span> : null}
      </span>
      <span>
        <StatusBadge status={card.status} />
      </span>
      <span className="text-caption text-ink-500">
        <span className="block">👍 {card.helpfulCount} · 👎 {card.notHelpfulCount}</span>
        <span className="mt-1 block">
          교차 검증 {card.crossCheckCount}건
        </span>
      </span>
    </button>
  )
}

function ReviewListRow({ state, card, selected, onSelect }) {
  const { center, place } = getLocation(state, card)
  const reasons = getReviewReasons(card)

  return (
    <button
      type="button"
      onClick={() => onSelect(card.id)}
      aria-pressed={selected}
      className={
        'min-h-[124px] w-full border-t border-line-soft p-4 text-left transition-colors first:border-t-0 focus-visible:z-[1] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink-000 ' +
        (selected ? 'bg-accent-soft' : 'bg-paper hover:bg-sunken')
      }
    >
      <span className="flex items-center gap-2">
        <CategoryBadge category={card.category} />
        <StatusBadge status={card.status} />
        <span className="ml-auto text-caption text-ink-300">작성 {formatDate(card.createdAt)}</span>
      </span>
      <span className="mt-3 block text-body font-bold text-ink-000">{card.title}</span>
      <span className="mt-1 block text-caption text-ink-500">
        {[center?.name, place?.name].filter(Boolean).join(' · ')}
      </span>
      <span className="mt-2 block text-caption font-bold text-danger">
        {reasons.length > 0 ? reasons.join(' · ') : '검토 전환 사유를 확인할 수 없어요.'}
      </span>
    </button>
  )
}

function AdminActions({ card, pendingAction, onRequest, onCancel, onConfirm }) {
  const pending = pendingAction?.cardId === card.id ? pendingAction : null

  if (pending) {
    const config = ACTIONS[pending.action]
    const questionId = `admin-action-${card.id}-${pending.action}`
    return (
      <div
        className="rounded-md border border-ink-200 bg-sunken p-3.5"
        role="alertdialog"
        aria-modal="false"
        aria-labelledby={questionId}
      >
        <p id={questionId} className="text-body-sm font-bold text-ink-000">
          {config.question}
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="min-h-11 rounded-pill border border-hairline bg-paper px-4 text-body-sm font-bold text-ink-700 transition-transform active:scale-[0.97]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              'min-h-11 rounded-pill px-4 text-body-sm font-bold transition-transform active:scale-[0.97] ' +
              (pending.action === 'delete'
                ? 'bg-inverse text-paper'
                : 'bg-yellow-500 text-ink-000')
            }
          >
            {config.label}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-2" aria-label="관리자 검수 조치">
      <button
        type="button"
        onClick={() => onRequest('keep')}
        className="min-h-11 rounded-pill border border-hairline bg-paper px-3 text-body-sm font-bold text-ink-700 transition-transform active:scale-[0.97]"
      >
        유지
      </button>
      <button
        type="button"
        onClick={() => onRequest('hide')}
        className="min-h-11 rounded-pill border border-hairline bg-paper px-3 text-body-sm font-bold text-ink-700 transition-transform active:scale-[0.97]"
      >
        비공개
      </button>
      <button
        type="button"
        onClick={() => onRequest('delete')}
        className="min-h-11 rounded-pill bg-inverse px-3 text-body-sm font-bold text-paper transition-transform active:scale-[0.97]"
      >
        삭제
      </button>
      <button
        type="button"
        onClick={() => onRequest('reviewDone')}
        className="min-h-11 rounded-pill bg-yellow-500 px-3 text-body-sm font-bold text-ink-000 transition-transform active:scale-[0.97]"
      >
        검토 완료
      </button>
    </div>
  )
}

function CardDetail({
  state,
  card,
  showActions = false,
  pendingAction,
  onRequestAction,
  onCancelAction,
  onConfirmAction,
}) {
  if (!card) {
    return (
      <section className="rounded-lg border border-hairline bg-paper shadow-block">
        <EmptyState message="확인할 암묵지 카드를 선택하세요." />
      </section>
    )
  }

  const { center, place } = getLocation(state, card)
  const sttItems = getOriginalSttItems(state, card)
  const relations = state.cardRelations.filter(
    (relation) => relation.cardId === card.id || relation.relatedCardId === card.id
  )

  return (
    <article className="rounded-lg border border-hairline bg-paper p-3.5 shadow-block animate-card-in">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={card.category} />
            <StatusBadge status={card.status} />
          </div>
          <h3 className="mt-3 text-title-3 font-bold tracking-tight text-ink-000">{card.title}</h3>
          <p className="mt-2 text-caption text-ink-500">
            {[center?.name, place?.name].filter(Boolean).join(' · ')}
          </p>
        </div>
        <time className="shrink-0 text-caption text-ink-300" dateTime={card.createdAt}>
          작성 {formatDate(card.createdAt)}
        </time>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3" aria-label="원본 STT와 AI 구조화 결과">
        <section className="rounded-md bg-sunken p-3.5" aria-labelledby={`stt-${card.id}`}>
          <h4
            id={`stt-${card.id}`}
            className="text-micro font-bold tracking-wide text-ink-500"
          >
            원본 STT
          </h4>
          {sttItems.length === 0 ? (
            <p className="mt-3 text-body-sm text-ink-500">원본 STT가 비어 있어요.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {sttItems.map((item, index) => (
                <div key={item.id} className={index === 0 ? '' : 'border-t border-hairline pt-3'}>
                  {item.question ? (
                    <p className="mb-1 text-caption font-bold text-ink-500">{item.question}</p>
                  ) : null}
                  <p className="whitespace-pre-wrap break-keep text-body-sm leading-relaxed text-ink-700">
                    {item.sttText}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-md bg-accent-soft p-3.5" aria-labelledby={`structured-${card.id}`}>
          <h4
            id={`structured-${card.id}`}
            className="text-micro font-bold tracking-wide text-ink-500"
          >
            AI 구조화 결과
          </h4>
          <dl className="mt-3 flex flex-col gap-3 text-body-sm">
            <div>
              <dt className="text-caption text-ink-500">제목</dt>
              <dd className="mt-1 font-bold text-ink-000">{card.title}</dd>
            </div>
            <div className="border-t border-yellow-600/20 pt-3">
              <dt className="text-caption text-ink-500">이유</dt>
              <dd className={card.reason ? 'mt-1 text-ink-700' : 'mt-1 text-ink-300'}>
                {card.reason || '비어 있음'}
              </dd>
            </div>
            <div className="border-t border-yellow-600/20 pt-3">
              <dt className="text-caption text-ink-500">카테고리</dt>
              <dd className="mt-1 font-bold text-ink-700">
                {CATEGORY_LABELS[card.category] || card.category}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="mt-3 rounded-md border border-hairline bg-paper p-3.5" aria-label="평가와 검수 정보">
        <dl className="grid grid-cols-4 gap-3 text-body-sm">
          <div>
            <dt className="text-caption text-ink-500">도움됐어요</dt>
            <dd className="mt-1 font-bold text-ink-000">👍 {card.helpfulCount}</dd>
          </div>
          <div>
            <dt className="text-caption text-ink-500">도움 안 됐어요</dt>
            <dd className="mt-1 font-bold text-ink-000">👎 {card.notHelpfulCount}</dd>
          </div>
          <div>
            <dt className="text-caption text-ink-500">교차 검증</dt>
            <dd className="mt-1 font-bold text-ink-000">{card.crossCheckCount}건</dd>
          </div>
          <div>
            <dt className="text-caption text-ink-500">현재 상태</dt>
            <dd className="mt-1 font-bold text-ink-000">{STATUS_LABELS[card.status]}</dd>
          </div>
        </dl>
        {card.reviewedAt ? (
          <p className="mt-3 border-t border-line-soft pt-3 text-caption text-ink-500">
            검토 시각 {formatDateTime(card.reviewedAt)}
          </p>
        ) : null}
      </section>

      <section className="mt-3 rounded-md border border-hairline bg-paper p-3.5" aria-labelledby={`relations-${card.id}`}>
        <div className="flex items-center justify-between gap-4">
          <h4 id={`relations-${card.id}`} className="text-body-sm font-bold text-ink-000">
            교차 검증 연결 현황
          </h4>
          {card.crossCheckCount > 0 ? (
            <span className="text-caption font-bold text-ink-500">
              {card.crossCheckCount}명의 기사가 확인
            </span>
          ) : null}
        </div>

        {relations.length === 0 ? (
          <p className="mt-3 text-caption text-ink-500">
            {card.crossCheckCount > 0
              ? '교차 검증 횟수가 저장되어 있어요.'
              : '연결된 교차 검증이 없어요.'}
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {relations.map((relation) => {
              const otherCardId =
                relation.cardId === card.id ? relation.relatedCardId : relation.cardId
              const otherCard = state.cards.find((item) => item.id === otherCardId)
              return (
                <li key={relation.id} className="rounded-sm bg-sunken p-3 text-body-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-ink-000">
                      {relation.relationType === 'conflict' ? '충돌' : '유사'}
                    </span>
                    <span className="text-caption text-ink-300">{formatDate(relation.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-ink-700">
                    {otherCard?.title || '연결된 암묵지 카드'}
                  </p>
                  {relation.reason ? (
                    <p className="mt-1 text-caption text-ink-500">{relation.reason}</p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {showActions && card.status === 'review' ? (
        <section className="mt-5 border-t border-line-soft pt-5" aria-labelledby={`actions-${card.id}`}>
          <h4 id={`actions-${card.id}`} className="mb-3 text-body-sm font-bold text-ink-000">
            검수 조치
          </h4>
          <AdminActions
            card={card}
            pendingAction={pendingAction}
            onRequest={(action) => onRequestAction(card.id, action)}
            onCancel={onCancelAction}
            onConfirm={onConfirmAction}
          />
        </section>
      ) : null}
    </article>
  )
}

function DashboardView({ state, cards, onOpenCard, onOpenReview }) {
  const publishedCount = cards.filter((card) => card.status === 'published').length
  const reviewCount = cards.filter((card) => card.status === 'review').length
  const verifiedCards = cards
    .filter((card) => card.crossCheckCount > 0)
    .sort((a, b) => b.crossCheckCount - a.crossCheckCount)
  const centers = [...state.centers].sort((a, b) => b.visitCount - a.visitCount)
  const latestCards = cards.slice(0, 5)

  const categoryCounts = Object.keys(CATEGORY_LABELS).map((category) => ({
    category,
    count: cards.filter((card) => card.category === category).length,
  }))
  const statusCounts = Object.keys(STATUS_LABELS).map((status) => ({
    status,
    count: cards.filter((card) => card.status === status).length,
  }))

  return (
    <div className="animate-card-in">
      <header>
        <p className="text-caption font-bold text-ink-500">길벗 생성 데이터</p>
        <h1 className="mt-1 text-title-2 font-bold tracking-tight text-ink-000">현황 대시보드</h1>
        <p className="mt-2 text-body-sm text-ink-500">
          지식 카드와 도움 평가, 검수 상태를 실제 저장 상태로 보여드려요.
        </p>
      </header>

      <section className="mt-4 grid grid-cols-4 gap-3" aria-label="관리자 현황 요약">
        <MetricCard label="전체 지식 카드" value={`${cards.length}건`} accent />
        <MetricCard label="게시 중" value={`${publishedCount}건`} detail="기사 화면 노출 상태" />
        <MetricCard label="검토 필요" value={`${reviewCount}건`} detail="평가 임계값 자동 분류" />
        <MetricCard
          label="교차 검증 보유 카드"
          value={`${verifiedCards.length}건`}
          detail="카드별 확인 횟수 저장"
        />
      </section>

      <div className="mt-3 grid grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] gap-3">
        <section className="min-w-0 rounded-lg border border-hairline bg-paper p-3.5 shadow-block">
          <SectionHeading eyebrow="카드 분포" title="카테고리별 비율" />
          <div className="mt-5 flex flex-col gap-4">
            {categoryCounts.map(({ category, count }) => (
              <div key={category}>
                <div className="flex items-center justify-between gap-3 text-body-sm">
                  <span className="font-bold text-ink-700">{CATEGORY_LABELS[category]}</span>
                  <span className="text-ink-500">
                    {count} / {cards.length}건
                  </span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-pill bg-sunken">
                  <div
                    className="h-full rounded-pill bg-yellow-500"
                    style={{ width: cards.length === 0 ? '0%' : `${(count / cards.length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="min-w-0 rounded-lg border border-hairline bg-paper p-3.5 shadow-block">
          <SectionHeading eyebrow="카드 상태" title="상태별 건수" />
          <dl className="mt-4 flex flex-col">
            {statusCounts.map(({ status, count }, index) => (
              <div
                key={status}
                className={
                  'flex min-h-12 items-center justify-between gap-4 ' +
                  (index === 0 ? '' : 'border-t border-line-soft')
                }
              >
                <dt>
                  <StatusBadge status={status} />
                </dt>
                <dd className="text-body font-bold text-ink-000">{count}건</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] gap-3">
        <section className="min-w-0 rounded-lg border border-hairline bg-paper p-3.5 shadow-block">
          <SectionHeading eyebrow="센터별 현황" title="화물센터 방문 현황" />
          {centers.length === 0 ? (
            <EmptyState message="표시할 방문 통계가 없어요." />
          ) : (
            <ol className="mt-4 flex flex-col">
              {centers.map((center, index) => {
                const cardCount = cards.filter((card) => card.centerId === center.id).length
                return (
                  <li
                    key={center.id}
                    className={
                      'flex min-h-14 items-center gap-3 ' +
                      (index === 0 ? '' : 'border-t border-line-soft')
                    }
                  >
                    <span className="w-6 text-body-sm font-bold text-ink-300">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-body-sm font-bold text-ink-000">
                      {center.name}
                    </span>
                    <span className="shrink-0 text-caption text-ink-500">
                      {center.visitCount.toLocaleString('ko-KR')}회 방문
                    </span>
                    <span className="shrink-0 rounded-pill bg-sunken px-2.5 py-1 text-caption font-bold text-ink-700">
                      암묵지 {cardCount}건
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
        </section>

        <section className="min-w-0 rounded-lg border border-hairline bg-paper shadow-block">
          <div className="p-3.5">
            <SectionHeading
              eyebrow="최근 등록"
              title="최근 암묵지"
              meta={<span className="text-caption text-ink-500">최신순</span>}
            />
          </div>
          {latestCards.length === 0 ? (
            <EmptyState message="아직 등록된 암묵지가 없어요." />
          ) : (
            <div className="border-t border-line-soft">
              {latestCards.map((card) => {
                const { center, place } = getLocation(state, card)
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => onOpenCard(card.id)}
                    className="flex min-h-[76px] w-full items-center gap-3 border-t border-line-soft px-4 py-3 text-left transition-colors first:border-t-0 hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink-000"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-body-sm font-bold text-ink-000">{card.title}</span>
                      <span className="mt-1 block truncate text-caption text-ink-500">
                        {[center?.name, place?.name].filter(Boolean).join(' · ')} · 작성 {formatDate(card.createdAt)}
                      </span>
                    </span>
                    <StatusBadge status={card.status} />
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <section className="mt-3 rounded-lg border border-hairline bg-paper p-3.5 shadow-block">
        <SectionHeading
          eyebrow="검증 현황"
          title="교차 검증 연결 현황"
          meta={
            reviewCount > 0 ? (
              <button
                type="button"
                onClick={onOpenReview}
                className="min-h-11 rounded-pill bg-inverse px-4 text-body-sm font-bold text-paper transition-transform active:scale-[0.97]"
              >
                검토 필요 {reviewCount}건 보기
              </button>
            ) : null
          }
        />
        {verifiedCards.length === 0 ? (
          <EmptyState message="연결된 교차 검증이 없어요." />
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3">
            {verifiedCards.map((card) => {
              const { center, place } = getLocation(state, card)
              return (
                <li key={card.id}>
                  <button
                    type="button"
                    onClick={() => onOpenCard(card.id)}
                    className="flex min-h-[84px] w-full items-center justify-between gap-4 rounded-md border border-hairline bg-sunken p-3.5 text-left transition-transform active:scale-[0.99]"
                  >
                    <span className="min-w-0">
                      <span className="line-clamp-1 text-body-sm font-bold text-ink-000">{card.title}</span>
                      <span className="mt-1 block truncate text-caption text-ink-500">
                        {place?.name || center?.name || ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-body-sm font-bold text-ink-700">
                      {card.crossCheckCount}명의 기사가 확인
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function ReviewView({
  state,
  cards,
  selectedCard,
  onSelectCard,
  pendingAction,
  onRequestAction,
  onCancelAction,
  onConfirmAction,
}) {
  return (
    <div className="animate-card-in">
      <header className="flex items-start justify-between gap-6">
        <div>
          <p className="text-caption font-bold text-ink-500">평가 임계값 자동 분류</p>
          <h1 className="mt-1 text-title-2 font-bold tracking-tight text-ink-000">검토 필요</h1>
          <p className="mt-2 text-body-sm text-ink-500">
            도움 안 됐어요 5회 이상 또는 전체 평가 5건 이상이면서 부정률 60% 이상이면 분류해요.
          </p>
        </div>
        <span className="inline-flex min-h-11 items-center rounded-pill border border-danger/20 bg-danger/10 px-4 text-body-sm font-bold text-danger">
          {cards.length}건
        </span>
      </header>

      {cards.length === 0 ? (
        <section className="mt-6 rounded-lg border border-hairline bg-paper shadow-block">
          <EmptyState message="검토가 필요한 암묵지가 없어요." />
        </section>
      ) : (
        <div className="mt-6 grid grid-cols-[minmax(360px,.9fr)_minmax(420px,1.1fr)] items-start gap-3">
          <section className="overflow-hidden rounded-lg border border-hairline bg-paper shadow-block" aria-label="검토 필요 암묵지 목록">
            {cards.map((card) => (
              <ReviewListRow
                key={card.id}
                state={state}
                card={card}
                selected={selectedCard?.id === card.id}
                onSelect={onSelectCard}
              />
            ))}
          </section>

          <div className="sticky top-8">
            <CardDetail
              state={state}
              card={selectedCard}
              showActions
              pendingAction={pendingAction}
              onRequestAction={onRequestAction}
              onCancelAction={onCancelAction}
              onConfirmAction={onConfirmAction}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function CardsView({ state, cards, selectedCard, onSelectCard }) {
  return (
    <div className="animate-card-in">
      <header className="flex items-end justify-between gap-6">
        <div>
          <p className="text-caption font-bold text-ink-500">상태 무관 전체 조회</p>
          <h1 className="mt-1 text-title-2 font-bold tracking-tight text-ink-000">암묵지 관리</h1>
          <p className="mt-2 text-body-sm text-ink-500">
            초안부터 삭제 상태까지 모든 지식 카드를 확인하세요.
          </p>
        </div>
        <span className="text-body-sm font-bold text-ink-500">전체 {cards.length}건</span>
      </header>

      {cards.length === 0 ? (
        <section className="mt-6 rounded-lg border border-hairline bg-paper shadow-block">
          <EmptyState message="아직 등록된 암묵지가 없어요." />
        </section>
      ) : (
        <div className="mt-6 grid grid-cols-[minmax(520px,1.1fr)_minmax(420px,.9fr)] items-start gap-3">
          <section className="overflow-hidden rounded-lg border border-hairline bg-paper shadow-block" aria-label="전체 암묵지 목록">
            {cards.map((card) => (
              <CardListRow
                key={card.id}
                state={state}
                card={card}
                selected={selectedCard?.id === card.id}
                onSelect={onSelectCard}
              />
            ))}
          </section>

          <div className="sticky top-8">
            <CardDetail state={state} card={selectedCard} />
          </div>
        </div>
      )}
    </div>
  )
}

function AdminMapFallback({ centers, cards, selectedCenter, onSelectCenter }) {
  return (
    <div className="min-h-[360px] bg-[linear-gradient(#F1E8D8_1px,transparent_1px),linear-gradient(90deg,#F1E8D8_1px,transparent_1px)] bg-[size:28px_28px] p-5">
      <div className="rounded-md border border-hairline bg-paper p-4 shadow-block">
        <p className="text-body-sm font-bold text-ink-000">지도를 불러올 수 없어요.</p>
        <p className="mt-1 text-caption text-ink-500">
          아래 화물센터를 선택해 방문 현황을 계속 확인하세요.
        </p>
      </div>
      <div className="mt-3 grid gap-2">
        {centers.map((center) => {
          const active = selectedCenter?.id === center.id
          const cardCount = cards.filter((card) => card.centerId === center.id).length
          return (
            <button
              key={center.id}
              type="button"
              onClick={() => onSelectCenter(center.id)}
              aria-pressed={active}
              className={
                'flex min-h-14 items-center justify-between gap-4 rounded-md border px-4 text-left shadow-block transition-transform active:scale-[0.99] ' +
                (active
                  ? 'border-yellow-600 bg-yellow-500 text-ink-000'
                  : 'border-hairline bg-paper text-ink-700')
              }
            >
              <span className="text-body-sm font-bold">{center.name}</span>
              <span className="shrink-0 text-caption">
                {center.visitCount.toLocaleString('ko-KR')}회 · 암묵지 {cardCount}건
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function VisitsView({ state, cards, selectedCenterId, onSelectCenter }) {
  const mapContainerRef = useRef(null)
  const [mapStatus, setMapStatus] = useState('loading')
  const centers = useMemo(
    () => [...state.centers].sort((a, b) => b.visitCount - a.visitCount),
    [state.centers]
  )
  const selectedCenter =
    centers.find((center) => center.id === selectedCenterId) || centers[0] || null
  const places = selectedCenter
    ? state.places
        .filter((place) => place.centerId === selectedCenter.id)
        .sort((a, b) => b.visitCount - a.visitCount)
    : []
  const totalVisits = centers.reduce((sum, center) => sum + center.visitCount, 0)
  const endedDispatches = state.dispatches.filter((dispatch) => dispatch.endedAt).length

  useEffect(() => {
    if (centers.length === 0 || !mapContainerRef.current) return

    let active = true
    const container = mapContainerRef.current

    const renderMap = async () => {
      setMapStatus('loading')
      const maps = await loadKakaoMaps()
      if (!active) return
      if (!maps) {
        setMapStatus('fallback')
        return
      }

      try {
        const validCenters = centers.filter(
          (center) => typeof center.lat === 'number' && typeof center.lng === 'number'
        )
        if (validCenters.length === 0) {
          setMapStatus('fallback')
          return
        }

        const firstPosition = new maps.LatLng(validCenters[0].lat, validCenters[0].lng)
        const map = new maps.Map(container, { center: firstPosition, level: 13 })
        const bounds = new maps.LatLngBounds()

        validCenters.forEach((center) => {
          const position = new maps.LatLng(center.lat, center.lng)
          const marker = new maps.Marker({ map, position, title: center.name })
          const cardCount = state.cards.filter((card) => card.centerId === center.id).length
          const badge = document.createElement('button')

          badge.type = 'button'
          badge.textContent = `${center.name} · 암묵지 ${cardCount}건`
          badge.className =
            'min-h-11 whitespace-nowrap rounded-pill border border-hairline bg-paper px-3 text-caption font-bold text-ink-700 shadow-lift'
          badge.addEventListener('click', () => onSelectCenter(center.id))
          maps.event.addListener(marker, 'click', () => onSelectCenter(center.id))

          new maps.CustomOverlay({
            map,
            position,
            content: badge,
            yAnchor: 1.9,
            clickable: true,
          })
          bounds.extend(position)
        })

        map.setBounds(bounds, 56, 56, 56, 56)
        setMapStatus('ready')
      } catch {
        if (active) setMapStatus('fallback')
      }
    }

    renderMap()

    return () => {
      active = false
      container.replaceChildren()
    }
  }, [centers, onSelectCenter, state.cards])

  return (
    <div className="animate-card-in">
      <header className="flex items-start justify-between gap-6">
        <div>
          <p className="text-caption font-bold text-ink-500">센터와 주변 장소</p>
          <h1 className="mt-1 text-title-2 font-bold tracking-tight text-ink-000">방문 현황</h1>
          <p className="mt-2 text-body-sm text-ink-500">
            화물센터와 주변 장소의 방문·정차 현황을 확인하세요. 경로는 표시하지 않아요.
          </p>
        </div>
      </header>

      <section className="mt-4 grid grid-cols-3 gap-3" aria-label="운행 현황 요약">
        <MetricCard
          label="센터 방문 합계"
          value={`${totalVisits.toLocaleString('ko-KR')}회`}
          detail="시드의 센터 방문 횟수"
          accent
        />
        <MetricCard
          label="반복 방문·정차 감지"
          value={`${state.triggerEvents.length}건`}
          detail="운행 중 저장된 인터뷰 후보"
        />
        <MetricCard
          label="운행 종료 이벤트"
          value={`${endedDispatches}건`}
          detail="도착지 도달 버튼으로 재현"
        />
      </section>

      <div className="mt-3 grid grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)] gap-3">
        <section className="min-w-0 overflow-hidden rounded-lg border border-hairline bg-paper shadow-block">
          <div className="border-b border-line-soft p-3.5">
            <h2 className="text-body font-bold text-ink-000">화물센터 위치 현황</h2>
          </div>
          {centers.length === 0 ? (
            <EmptyState message="표시할 화물센터가 없어요." />
          ) : (
            <div>
              <div className={mapStatus === 'fallback' ? 'hidden' : 'relative'}>
                <div
                  ref={mapContainerRef}
                  className="h-[360px] w-full"
                  aria-label="화물센터 위치 지도"
                />
                {mapStatus === 'loading' ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-sunken text-body-sm text-ink-500">
                    지도를 불러오고 있어요.
                  </div>
                ) : null}
              </div>
              {mapStatus === 'fallback' ? (
                <AdminMapFallback
                  centers={centers}
                  cards={cards}
                  selectedCenter={selectedCenter}
                  onSelectCenter={onSelectCenter}
                />
              ) : null}
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-lg border border-hairline bg-paper p-3.5 shadow-block">
          <SectionHeading
            eyebrow="주변 장소"
            title={selectedCenter?.name || '화물센터를 선택하세요'}
          />
          {places.length === 0 ? (
            <EmptyState message="이 센터 주변에 등록된 장소가 아직 없어요." />
          ) : (
            <ol className="mt-4 flex flex-col">
              {places.map((place, index) => {
                const cardCount = cards.filter((card) => card.placeId === place.id).length
                return (
                  <li
                    key={place.id}
                    className={
                      'flex min-h-[76px] items-center gap-3 ' +
                      (index === 0 ? '' : 'border-t border-line-soft')
                    }
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-body-sm font-bold text-ink-000">{place.name}</span>
                      <span className="text-caption text-ink-500">
                        {CATEGORY_LABELS[place.category]} · 암묵지 {cardCount}건
                      </span>
                    </span>
                    <span className="shrink-0 text-body-sm font-bold text-ink-700">
                      {place.visitCount.toLocaleString('ko-KR')}회 방문
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}

function AdminShell({ view, reviewCount, onChangeView, children }) {
  return (
    <div className="min-h-dvh overflow-x-auto font-sans">
      <div className="flex min-h-dvh min-w-[1100px] bg-[var(--bg-app)]">
        <aside className="sticky top-0 flex h-dvh w-[220px] shrink-0 flex-col border-r border-hairline bg-paper px-3 pb-4 pt-8">
          <div className="flex items-center gap-2 px-2.5 pb-5">
            <span className="flex size-[30px] items-center justify-center rounded-sm bg-yellow-500 text-body-sm font-bold text-ink-000">
              길
            </span>
            <span>
              <span className="block text-body-sm font-bold text-ink-000">길벗 관리자</span>
              <span className="block text-micro text-ink-300">현장 지식 자산 콘솔</span>
            </span>
          </div>

          <nav className="flex flex-col gap-1" aria-label="관리자 메뉴">
            {VIEWS.map((item) => {
              const active = view === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChangeView(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={
                    'flex min-h-11 items-center gap-2.5 rounded-md px-3 text-left text-body-sm font-bold transition-colors ' +
                    (active
                      ? 'bg-yellow-500 text-ink-000'
                      : 'text-ink-700 hover:bg-sunken')
                  }
                >
                  <AdminIcon name={item.icon} className="size-[18px] stroke-current stroke-2" />
                  <span>{item.label}</span>
                  {item.id === 'review' && reviewCount > 0 ? (
                    <span className="ml-auto inline-flex min-w-7 items-center justify-center rounded-pill bg-danger px-2 py-0.5 text-micro font-bold text-paper">
                      {reviewCount}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </nav>

          <div className="mt-auto rounded-md bg-sunken p-3 text-micro leading-relaxed text-ink-500">
            암묵지와 현장 방문 현황을 한 화면에서 확인하세요.
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-8 pb-10 pt-6">
          <div className="mb-4 flex min-h-11 items-center rounded-md border border-hairline bg-paper px-4 text-body-sm text-ink-700 shadow-block">
            시연용 관리자 화면입니다. 실서비스에서는 운영자 인증이 필요합니다
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const store = useStore()
  const state = store?.state
  const setState = store?.setState
  const [view, setView] = useState('dashboard')
  const [selectedCardId, setSelectedCardId] = useState(null)
  const [selectedCenterId, setSelectedCenterId] = useState(null)
  const [pendingAction, setPendingAction] = useState(null)
  const [actionMessage, setActionMessage] = useState('')

  const hasRequiredData =
    state &&
    typeof setState === 'function' &&
    Array.isArray(state.cards) &&
    Array.isArray(state.centers) &&
    Array.isArray(state.places) &&
    Array.isArray(state.interviewItems) &&
    Array.isArray(state.evaluations) &&
    Array.isArray(state.cardRelations) &&
    Array.isArray(state.dispatches) &&
    Array.isArray(state.triggerEvents)

  if (!hasRequiredData) {
    return (
      <AdminShell view={view} reviewCount={0} onChangeView={setView}>
        <ErrorState onRetry={() => window.location.reload()} />
      </AdminShell>
    )
  }

  const cards = getAllCards(state).sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  )
  const reviewCards = cards.filter((card) => card.status === 'review')
  const selectedCard = cards.find((card) => card.id === selectedCardId) || cards[0] || null
  const selectedReviewCard =
    reviewCards.find((card) => card.id === selectedCardId) || reviewCards[0] || null

  const handleChangeView = (nextView) => {
    setView(nextView)
    setSelectedCardId(null)
    setPendingAction(null)
    setActionMessage('')
  }

  const handleOpenCard = (cardId) => {
    setSelectedCardId(cardId)
    setPendingAction(null)
    setActionMessage('')
    setView('cards')
  }

  const handleSelectCard = (cardId) => {
    setSelectedCardId(cardId)
    setPendingAction(null)
    setActionMessage('')
  }

  const handleRequestAction = (cardId, action) => {
    setPendingAction({ cardId, action })
    setActionMessage('')
  }

  const handleConfirmAction = () => {
    if (!pendingAction) return

    const result = applyAdminAction(state, pendingAction.cardId, pendingAction.action)
    if (!result.ok) {
      setActionMessage(result.reason)
      setPendingAction(null)
      return
    }

    setState(result.state)
    setActionMessage(ACTIONS[pendingAction.action].success)
    setPendingAction(null)
  }

  return (
    <AdminShell
      view={view}
      reviewCount={reviewCards.length}
      onChangeView={handleChangeView}
    >
      {actionMessage ? (
        <p
          role="status"
          className="mb-4 rounded-md border border-hairline bg-inverse px-4 py-3 text-body-sm font-bold text-paper shadow-lift"
        >
          {actionMessage}
        </p>
      ) : null}

      {view === 'dashboard' ? (
        <DashboardView
          state={state}
          cards={cards}
          onOpenCard={handleOpenCard}
          onOpenReview={() => handleChangeView('review')}
        />
      ) : null}

      {view === 'review' ? (
        <ReviewView
          state={state}
          cards={reviewCards}
          selectedCard={selectedReviewCard}
          onSelectCard={handleSelectCard}
          pendingAction={pendingAction}
          onRequestAction={handleRequestAction}
          onCancelAction={() => setPendingAction(null)}
          onConfirmAction={handleConfirmAction}
        />
      ) : null}

      {view === 'cards' ? (
        <CardsView
          state={state}
          cards={cards}
          selectedCard={selectedCard}
          onSelectCard={handleSelectCard}
        />
      ) : null}

      {view === 'visits' ? (
        <VisitsView
          state={state}
          cards={cards}
          selectedCenterId={selectedCenterId}
          onSelectCenter={setSelectedCenterId}
        />
      ) : null}
    </AdminShell>
  )
}
