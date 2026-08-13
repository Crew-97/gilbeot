'use client'

import Image from 'next/image'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useStore } from '@/components/StoreProvider'
import { getCards, toggleVote } from '@/lib/store'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { KnowHowCard } from '@/components/KnowHowCard'
import { LockedCardSummary } from '@/components/LockedCardSummary'
import styles from './feed.module.css'

const CATEGORIES = [
  { key: '', label: '전체' },
  { key: 'center_tip', label: '센터팁' },
  { key: 'gas', label: '주유소' },
  { key: 'food', label: '식당' },
  { key: 'rest', label: '휴게소·쉼터' },
]

const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.filter((item) => item.key).map((item) => [item.key, item.label])
)

const CATEGORY_IMAGES = {
  center_tip: '/knowhow/center-tip.svg',
  gas: '/knowhow/gas.svg',
  food: '/knowhow/food.svg',
  rest: '/knowhow/rest.svg',
}

const FEATURE_AUTO_ADVANCE_MS = 5000

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.4" stroke="currentColor" strokeWidth="2" />
      <path d="m15.6 15.6 4.1 4.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function HeartIcon({ active = false }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M20.7 5.8c-1.9-2-5.1-2-7.1 0L12 7.5l-1.6-1.7a5 5 0 0 0-7.1 7L12 21l8.7-8.2a5 5 0 0 0 0-7Z"
        fill={active ? '#E0603E' : 'rgba(255,255,255,.22)'}
        stroke={active ? '#E0603E' : '#7B817E'}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MetaIcon({ type }) {
  const common = {
    viewBox: '0 0 20 20',
    width: 15,
    height: 15,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (type === 'author') {
    return (
      <svg {...common}>
        <circle cx="10" cy="6.2" r="2.7" />
        <path d="M4.8 16c.5-3.2 2.2-4.8 5.2-4.8s4.7 1.6 5.2 4.8" />
      </svg>
    )
  }

  if (type === 'check') {
    return (
      <svg {...common}>
        <path d="M10 2.7 16 5v4.4c0 3.6-2.2 6.1-6 7.9-3.8-1.8-6-4.3-6-7.9V5l6-2.3Z" />
        <path d="m7.2 9.7 1.7 1.7 3.8-4" />
      </svg>
    )
  }

  if (type === 'evaluation') {
    return (
      <svg {...common}>
        <path d="M2.4 10s2.8-4.7 7.6-4.7 7.6 4.7 7.6 4.7-2.8 4.7-7.6 4.7S2.4 10 2.4 10Z" />
        <circle cx="10" cy="10" r="2.1" />
      </svg>
    )
  }

  return <HeartIcon active />
}

function formatShortDate(iso) {
  if (!iso) return ''
  const [, month, day] = iso.slice(0, 10).split('-')
  if (!month || !day) return ''
  return `${Number(month)}.${Number(day)}`
}

function getLocationName(card, state) {
  const place = card.placeId
    ? state.places.find((item) => item.id === card.placeId)
    : null
  const center = state.centers.find((item) => item.id === card.centerId)
  return place?.name || center?.name || ''
}

function getAuthorName(card, state) {
  return state.drivers.find((item) => item.id === card.authorDriverId)?.name || '화물기사'
}

function CardMeta({ card, state, inverse = false }) {
  const evaluationCount = card.helpfulCount + card.notHelpfulCount
  const items = [
    { type: 'author', label: getAuthorName(card, state), description: '작성자' },
    { type: 'check', label: card.crossCheckCount, description: '교차 검증' },
    { type: 'evaluation', label: evaluationCount, description: '전체 도움 평가' },
    { type: 'helpful', label: card.helpfulCount, description: '도움됐어요' },
  ]

  return (
    <div className={`${styles.metaRow} ${inverse ? styles.metaRowInverse : ''}`}>
      {items.map((item) => (
        <span key={item.type} className={styles.metaItem} title={item.description}>
          <MetaIcon type={item.type} />
          <span className={item.type === 'author' ? styles.authorName : ''}>{item.label}</span>
          <span className={styles.srOnly}>{item.description}</span>
        </span>
      ))}
    </div>
  )
}

function FeaturedCard({ card, rank, state, onOpen }) {
  const locationName = getLocationName(card, state)

  return (
    <article className={styles.featureCard}>
      <Image
        src={CATEGORY_IMAGES[card.category]}
        alt=""
        fill
        loading="eager"
        sizes="(max-width: 430px) 92vw, 390px"
        className={styles.featureImage}
      />
      <div className={styles.featureScrim} aria-hidden="true" />
      <div className={styles.rankBadge}>
        <span className={styles.rankDot} aria-hidden="true" />
        인기 {rank}위
      </div>

      {card.isUnlocked ? (
        <button type="button" className={styles.featureContent} onClick={onOpen}>
          <span className={styles.featureEyebrow}>
            {CATEGORY_LABELS[card.category]} · {formatShortDate(card.createdAt)}
          </span>
          <h3>{card.title}</h3>
          {locationName ? <span className={styles.featureLocation}>{locationName}</span> : null}
          <CardMeta card={card} state={state} inverse />
        </button>
      ) : (
        <div className={styles.featureLocked}>
          <LockedCardSummary
            card={card}
            placeName={locationName}
            onUnlock={onOpen}
            variant="overlay"
          />
        </div>
      )}
    </article>
  )
}

function CardsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state, setState } = useStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [actionError, setActionError] = useState('')
  const searchInputRef = useRef(null)
  const touchStartX = useRef(null)

  const hasRequiredData =
    Array.isArray(state.cards) &&
    Array.isArray(state.centers) &&
    Array.isArray(state.places) &&
    Array.isArray(state.drivers) &&
    Array.isArray(state.evaluations)

  const centerId = searchParams.get('centerId') || undefined
  const placeId = searchParams.get('placeId') || undefined
  const category = searchParams.get('category') || ''

  const cards = useMemo(() => {
    if (!hasRequiredData) return []

    const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR')
    return getCards(state, {
      centerId,
      placeId,
      category: category || undefined,
    })
      .filter((card) => {
        if (!normalizedQuery) return true
        const locationName = getLocationName(card, state)
        return [card.title, card.reason, locationName, CATEGORY_LABELS[card.category]]
          .filter(Boolean)
          .some((value) => value.toLocaleLowerCase('ko-KR').includes(normalizedQuery))
      })
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  }, [category, centerId, hasRequiredData, placeId, query, state])

  const featuredCards = useMemo(
    () =>
      cards
        .slice()
        .sort((a, b) => b.helpfulCount - a.helpfulCount || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 3),
    [cards]
  )

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    if (featuredCards.length < 2) return undefined

    const timer = window.setInterval(() => {
      setFeaturedIndex((current) => (current + 1) % featuredCards.length)
    }, FEATURE_AUTO_ADVANCE_MS)

    return () => window.clearInterval(timer)
  }, [featuredCards.length])

  if (!hasRequiredData) {
    return (
      <main className={styles.page}>
        <ErrorState onRetry={() => window.location.reload()} />
      </main>
    )
  }

  const setCategory = (nextCategory) => {
    setFeaturedIndex(0)
    const params = new URLSearchParams(searchParams.toString())
    if (nextCategory) params.set('category', nextCategory)
    else params.delete('category')
    const nextQuery = params.toString()
    router.push(nextQuery ? `/cards?${nextQuery}` : '/cards', { scroll: false })
  }

  const moveFeatured = (direction) => {
    if (featuredCards.length < 2) return
    setFeaturedIndex((current) =>
      (current + direction + featuredCards.length) % featuredCards.length
    )
  }

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return
    const delta = event.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 42) return
    moveFeatured(delta < 0 ? 1 : -1)
  }

  const handleHelpful = (cardId) => {
    const result = toggleVote(state, state.currentDriverId, cardId, 'helpful')
    setState(result.state)
    setActionError(result.ok ? '' : result.reason)
  }

  const goToShareFlow = () => router.push('/home')
  const activeFeatured = featuredCards[featuredIndex]
  const nextFeatured =
    featuredCards.length > 1 ? featuredCards[(featuredIndex + 1) % featuredCards.length] : null
  const lastFeatured =
    featuredCards.length > 2 ? featuredCards[(featuredIndex + 2) % featuredCards.length] : null

  return (
    <main className={styles.page}>
      <header className={`${styles.header} ${searchOpen ? styles.headerSearching : ''}`}>
        <h1>노하우</h1>
        <div className={styles.headerActions}>
          <div className={`${styles.searchGroup} ${searchOpen ? styles.searchGroupOpen : ''}`}>
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setFeaturedIndex(0)
              }}
              placeholder="노하우 검색"
              aria-label="노하우 검색"
              className={styles.searchInput}
            />
            <button
              type="button"
              aria-label={searchOpen ? '검색 닫기' : '검색 열기'}
              aria-expanded={searchOpen}
              onClick={() => {
                if (searchOpen) {
                  setQuery('')
                  setFeaturedIndex(0)
                }
                setSearchOpen((open) => !open)
              }}
              className={styles.glassButton}
            >
              <SearchIcon />
            </button>
          </div>
          <button
            type="button"
            aria-label="글 작성하기"
            onClick={goToShareFlow}
            className={styles.glassButton}
          >
            <PlusIcon />
          </button>
        </div>
      </header>

      <div className={styles.categoryScroller} role="tablist" aria-label="노하우 카테고리">
        {CATEGORIES.map((item) => {
          const active = category === item.key
          return (
            <button
              key={item.key || 'all'}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setCategory(item.key)}
              className={`${styles.categoryChip} ${active ? styles.categoryChipActive : ''}`}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {cards.length === 0 ? (
        <section className={styles.emptyWrap}>
          <EmptyState
            message={query ? '검색 결과가 없어요.' : '아직 등록된 노하우가 없어요.'}
            actionLabel={query ? '검색어 지우기' : '홈으로 가기'}
            onAction={
              query
                ? () => {
                    setQuery('')
                    setFeaturedIndex(0)
                  }
                : () => router.push('/home')
            }
          />
        </section>
      ) : (
        <>
          <section className={styles.featureSection} aria-labelledby="featured-title">
            <div className={styles.sectionHeading}>
              <div>
                <span>기사들이 많이 찾았어요</span>
                <h2 id="featured-title">대표 노하우</h2>
              </div>
              <span>{featuredIndex + 1} / {featuredCards.length}</span>
            </div>

            <div
              className={styles.featureStack}
              onTouchStart={(event) => {
                touchStartX.current = event.touches[0].clientX
              }}
              onTouchEnd={handleTouchEnd}
            >
              {lastFeatured ? (
                <div className={`${styles.featureBack} ${styles.featureBackLast}`} aria-hidden="true">
                  <Image
                    src={CATEGORY_IMAGES[lastFeatured.category]}
                    alt=""
                    fill
                    loading="eager"
                    sizes="360px"
                  />
                </div>
              ) : null}
              {nextFeatured ? (
                <div className={styles.featureBack} aria-hidden="true">
                  <Image
                    src={CATEGORY_IMAGES[nextFeatured.category]}
                    alt=""
                    fill
                    loading="eager"
                    sizes="370px"
                  />
                </div>
              ) : null}
              <FeaturedCard
                key={activeFeatured.id}
                card={activeFeatured}
                rank={featuredIndex + 1}
                state={state}
                onOpen={() => router.push(`/cards/${encodeURIComponent(activeFeatured.id)}`)}
              />
            </div>

            {featuredCards.length > 1 ? (
              <div className={styles.pagination} aria-label="대표 노하우 선택">
                {featuredCards.map((card, index) => (
                  <button
                    key={card.id}
                    type="button"
                    aria-label={`대표 노하우 ${index + 1} 보기`}
                    aria-current={featuredIndex === index ? 'true' : undefined}
                    onClick={() => setFeaturedIndex(index)}
                  >
                    <span className={featuredIndex === index ? styles.paginationActive : ''} />
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <section className={styles.feedSection} aria-labelledby="feed-title">
            <div className={styles.sectionHeading}>
              <div>
                <span>최근에 쌓인 현장 경험이에요</span>
                <h2 id="feed-title">최근 노하우</h2>
              </div>
              <span>{cards.length}건</span>
            </div>

            <div className={styles.masonryGrid}>
              {cards.map((card) => {
                const currentVote = state.evaluations.find(
                  (item) => item.driverId === state.currentDriverId && item.cardId === card.id
                )?.value
                const isOwnCard = card.authorDriverId === state.currentDriverId
                const locationName = getLocationName(card, state)
                const onOpen = () => router.push(`/cards/${encodeURIComponent(card.id)}`)

                return (
                  <KnowHowCard
                    key={card.id}
                    title={card.title}
                    summary={card.reason}
                    category={card.category}
                    authorName={getAuthorName(card, state)}
                    createdAt={card.createdAt}
                    locationName={locationName}
                    helpfulCount={card.helpfulCount}
                    evaluationCount={card.helpfulCount + card.notHelpfulCount}
                    isHelpful={currentVote === 'helpful'}
                    canEvaluate={card.isUnlocked && !isOwnCard}
                    evaluationDisabledReason={
                      isOwnCard ? '내가 작성한 노하우는 평가할 수 없어요.' : undefined
                    }
                    onOpen={onOpen}
                    onHelpful={() => handleHelpful(card.id)}
                    lockedContent={
                      card.isUnlocked ? null : (
                        <LockedCardSummary
                          card={card}
                          placeName={locationName}
                          onUnlock={onOpen}
                        />
                      )
                    }
                  />
                )
              })}
            </div>
          </section>

          <button type="button" onClick={goToShareFlow} className={styles.bottomCta}>
            <PlusIcon />
            <span>글 작성하기</span>
          </button>
        </>
      )}

      {actionError ? (
        <p role="alert" className={styles.actionError}>{actionError}</p>
      ) : null}
    </main>
  )
}

export default function CardsPage() {
  return (
    <Suspense fallback={<main className={styles.loading}>노하우를 불러오고 있어요.</main>}>
      <CardsContent />
    </Suspense>
  )
}
