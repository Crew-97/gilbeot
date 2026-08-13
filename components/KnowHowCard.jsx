'use client'

import styles from './KnowHowCard.module.css'

const CATEGORY_CONFIG = {
  center_tip: { label: '센터팁', tone: 'mint' },
  gas: { label: '주유소', tone: 'deepGreen' },
  food: { label: '식당', tone: 'purple' },
  rest: { label: '휴게소·쉼터', tone: 'coral' },
}

const TONE_CLASSES = {
  mint: styles.toneMint,
  deepGreen: styles.toneDeepGreen,
  purple: styles.tonePurple,
  coral: styles.toneCoral,
}

function HeartIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M20.7 5.8c-1.9-2-5.1-2-7.1 0L12 7.5l-1.6-1.7a5 5 0 0 0-7.1 7L12 21l8.7-8.2a5 5 0 0 0 0-7Z"
        fill={active ? '#E0603E' : 'transparent'}
        stroke={active ? '#E0603E' : 'currentColor'}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MetaIcon({ type }) {
  const common = {
    viewBox: '0 0 20 20',
    width: 14,
    height: 14,
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

  if (type === 'date') {
    return (
      <svg {...common}>
        <rect x="3.2" y="4.4" width="13.6" height="12.2" rx="2" />
        <path d="M6.4 2.8v3.3M13.6 2.8v3.3M3.2 8h13.6" />
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

function formatDate(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getMonth() + 1}.${date.getDate()}`
}

export function KnowHowCard({
  title,
  summary,
  category,
  authorName,
  createdAt,
  locationName,
  helpfulCount = 0,
  evaluationCount,
  isHelpful = false,
  canEvaluate = false,
  evaluationDisabledReason,
  onOpen,
  onHelpful,
  tone,
  lockedContent,
}) {
  const categoryConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.center_tip
  const resolvedTone = TONE_CLASSES[tone] ? tone : categoryConfig.tone
  const dateLabel = formatDate(createdAt)
  const isLocked = Boolean(lockedContent)
  const openLabel = isLocked
    ? `${categoryConfig.label} 노하우 열기`
    : `노하우 열기: ${title}`

  const handleHelpful = (event) => {
    event.stopPropagation()
    if (!canEvaluate || isHelpful) return
    onHelpful?.()
  }

  return (
    <article className={`${styles.card} ${isLocked ? styles.cardLocked : ''}`}>
      <div className={`${styles.colorPanel} ${TONE_CLASSES[resolvedTone]}`}>
        {!isLocked ? (
          <>
            <span className={styles.categoryBadge}>{categoryConfig.label}</span>
            {locationName ? <span className={styles.locationName}>{locationName}</span> : null}
          </>
        ) : null}
      </div>

      {!isLocked ? (
        <button
          type="button"
          aria-label={isHelpful ? '도움됐어요 평가됨' : '도움됐어요로 평가'}
          aria-pressed={isHelpful}
          aria-disabled={!canEvaluate}
          title={!canEvaluate ? evaluationDisabledReason : undefined}
          onClick={handleHelpful}
          className={`${styles.helpfulButton} ${isHelpful ? styles.helpfulButtonActive : ''}`}
        >
          <HeartIcon active={isHelpful} />
        </button>
      ) : null}

      <div className={`${styles.body} ${isLocked ? styles.lockedBody : ''}`}>
        {isLocked ? (
          lockedContent
        ) : (
          <>
            <h3>{title}</h3>
            {summary ? <p className={styles.summary}>{summary}</p> : null}

            <div className={styles.metaRow}>
              {authorName ? (
                <span className={styles.metaItem} title="작성자">
                  <MetaIcon type="author" />
                  <span className={styles.metaText}>{authorName}</span>
                  <span className={styles.srOnly}>작성자</span>
                </span>
              ) : null}
              {dateLabel ? (
                <time className={styles.metaItem} dateTime={createdAt} title="작성일">
                  <MetaIcon type="date" />
                  <span>{dateLabel}</span>
                  <span className={styles.srOnly}>작성일</span>
                </time>
              ) : null}
              {Number.isFinite(evaluationCount) ? (
                <span className={styles.metaItem} title="전체 도움 평가">
                  <MetaIcon type="evaluation" />
                  <span>{evaluationCount}</span>
                  <span className={styles.srOnly}>전체 도움 평가</span>
                </span>
              ) : null}
              <span className={styles.metaItem} title="도움됐어요">
                <MetaIcon type="helpful" />
                <span>{helpfulCount}</span>
                <span className={styles.srOnly}>도움됐어요</span>
              </span>
            </div>
          </>
        )}
      </div>

      <button type="button" aria-label={openLabel} onClick={onOpen} className={styles.openButton} />
    </article>
  )
}
