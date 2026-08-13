// 모든 상태 변경은 이 파일의 함수를 거친다. 컴포넌트에서 상태 배열을 직접 조작하지 않는다
//
// 호출 규약 (T+1:30 동결)
//   조회 함수  (state, ...조건) => 값을 반환. 상태를 바꾸지 않는다
//   변경 함수  (state, ...인자) => { state, ok, reason } 를 반환
//     state  새 상태 (실패 시 원본 그대로)
//     ok     성공 여부
//     reason 실패 사유 문자열. 화면이 그대로 보여줄 수 있는 한글 문장. 성공이면 null
// 항상 새 객체를 만든다. 기존 상태를 변형하지 않는다

import { loadCenters, loadPlaces, loadDrivers, loadCards } from '@/lib/dataSource'
import { getDistanceKm } from '@/lib/distance'

// near 조회 반경 km. 갱신 기준은 미정 31 이라 상수로 빼 두고 화면에서 조정한다
export const NEAR_RADIUS_KM = 3

// 런타임 id 생성. 시드 id 와 형식이 달라 충돌하지 않는다
let idCounter = 0
function genId(prefix) {
  idCounter += 1
  return prefix + '_' + Date.now() + '_' + idCounter
}

function now() {
  return new Date().toISOString()
}

// 초기 상태. StoreProvider 가 useState 로 들고 있는다
export function createInitialState() {
  return {
    // 시드에서 온 것 (dataSource 가 camelCase 로 변환)
    centers: loadCenters(),
    places: loadPlaces(),
    drivers: loadDrivers(),
    cards: loadCards(),

    // 런타임에 생기는 것
    dispatches: [],
    triggerEvents: [],
    interviews: [],
    interviewItems: [],
    evaluations: [],
    unlocks: [],
    pointTransactions: [],
    cardRelations: [], // similar / conflict 만 저장

    // 화면 상태 (저장 대상 아님)
    currentDriverId: 'driver_001',
    mockLocation: null, // { lat, lng } — 운행 중 조회용. 이력을 쌓지 않는다
  }
}

// ── 확정 함수 5개 (AGENTS.md 명시 — 이름 변경 금지) ──────────────────

// 조건에 맞는 published 카드 조회. 브리핑(S-09)과 운행 중 조회(S-10)도 이 함수를 쓴다
// 조건: { centerId, placeId, category, near: { lat, lng } }
// 반환: [{ ...card, isUnlocked }] — 잠금 여부를 붙여 돌려준다. 정렬은 시드 순서 그대로 (미정 2)
export function getCards(state, condition = {}) {
  const { centerId, placeId, category, near } = condition
  let result = state.cards.filter((c) => c.status === 'published' && c.deletedAt === null)

  if (centerId) result = result.filter((c) => c.centerId === centerId)
  if (placeId) result = result.filter((c) => c.placeId === placeId)
  if (category) result = result.filter((c) => c.category === category)

  if (near) {
    // 반경 안 장소의 카드 + 반경 안 센터의 center_tip 카드
    const nearPlaceIds = new Set(
      state.places.filter((p) => getDistanceKm(near, p) <= NEAR_RADIUS_KM).map((p) => p.id)
    )
    const nearCenterIds = new Set(
      state.centers.filter((c) => getDistanceKm(near, c) <= NEAR_RADIUS_KM).map((c) => c.id)
    )
    result = result.filter((c) =>
      c.placeId ? nearPlaceIds.has(c.placeId) : nearCenterIds.has(c.centerId)
    )
  }

  // 잠금 여부를 붙인다. 자기가 쓴 카드는 해금 없이 본다
  return result.map((c) => ({
    ...c,
    isUnlocked:
      c.authorDriverId === state.currentDriverId ||
      state.unlocks.some((u) => u.driverId === state.currentDriverId && u.cardId === c.id),
  }))
}

// AI 응답의 cards[] 한 건을 draft 카드로 추가. placeId 는 요청에 실어 보낸 값을 쓴다 (해소 27)
// aiCard: { title, reason, category, evidence, relation, relatedCardId, relationReason }
// context: { interviewId, placeId, centerId, isExtra } — isExtra 는 추가 음성 기여로 생긴 카드 표시
export function addCard(state, aiCard, context) {
  if (!aiCard || !aiCard.title) return { state, ok: false, reason: '카드 내용이 비어 있어요' }

  // duplicate 는 카드를 만들지 않는다
  if (aiCard.relation === 'duplicate') {
    return { state, ok: true, reason: null, cardId: null }
  }

  const cardId = genId('card')
  const newCard = {
    id: cardId,
    centerId: context.centerId,
    placeId: aiCard.category === 'center_tip' ? null : context.placeId,
    category: aiCard.category,
    title: aiCard.title,
    reason: aiCard.reason || '',
    status: 'draft', // 기사가 확인하고 게시해야 published 가 된다
    authorDriverId: state.currentDriverId,
    sttText: aiCard.evidence || '',
    helpfulCount: 0,
    notHelpfulCount: 0,
    crossCheckCount: 0,
    createdAt: now(),
    deletedAt: null,
    interviewId: context.interviewId,
    isExtra: Boolean(context.isExtra),
  }

  let cards = [...state.cards, newCard]
  let cardRelations = state.cardRelations

  // similar / conflict 만 관계로 저장하고 대상 카드의 교차 검증 횟수를 올린다. 병합·삭제하지 않는다
  if ((aiCard.relation === 'similar' || aiCard.relation === 'conflict') && aiCard.relatedCardId) {
    cardRelations = [
      ...cardRelations,
      {
        id: genId('rel'),
        cardId,
        relatedCardId: aiCard.relatedCardId,
        relationType: aiCard.relation,
        reason: aiCard.relationReason || '',
        createdAt: now(),
      },
    ]
    cards = cards.map((c) =>
      c.id === aiCard.relatedCardId ? { ...c, crossCheckCount: c.crossCheckCount + 1 } : c
    )
  }

  return { state: { ...state, cards, cardRelations }, ok: true, reason: null, cardId }
}

// 도움 평가 등록·변경·취소. value: 'helpful' | 'not_helpful'
export function toggleVote(state, driverId, cardId, value) {
  const card = state.cards.find((c) => c.id === cardId)
  if (!card) return { state, ok: false, reason: '카드를 찾을 수 없어요' }
  if (card.authorDriverId === driverId)
    return { state, ok: false, reason: '자기 카드는 평가할 수 없어요' }

  const unlocked = state.unlocks.some((u) => u.driverId === driverId && u.cardId === cardId)
  if (!unlocked) return { state, ok: false, reason: '해금한 카드만 평가할 수 있어요' }

  const existing = state.evaluations.find((e) => e.driverId === driverId && e.cardId === cardId)

  let evaluations
  let delta = { helpful: 0, notHelpful: 0 }
  if (!existing) {
    evaluations = [
      ...state.evaluations,
      { id: genId('eval'), driverId, cardId, value, createdAt: now() },
    ]
    delta[value === 'helpful' ? 'helpful' : 'notHelpful'] += 1
  } else if (existing.value === value) {
    // 같은 값을 다시 누르면 취소
    evaluations = state.evaluations.filter((e) => e.id !== existing.id)
    delta[value === 'helpful' ? 'helpful' : 'notHelpful'] -= 1
  } else {
    // 다른 값을 누르면 변경
    evaluations = state.evaluations.map((e) =>
      e.id === existing.id ? { ...e, value, createdAt: now() } : e
    )
    delta.helpful += value === 'helpful' ? 1 : -1
    delta.notHelpful += value === 'not_helpful' ? 1 : -1
  }

  let cards = state.cards.map((c) => {
    if (c.id !== cardId) return c
    const helpfulCount = c.helpfulCount + delta.helpful
    const notHelpfulCount = c.notHelpfulCount + delta.notHelpful
    // REVIEW 전환: 도움 안 됐어요 5회 이상, 또는 전체 5건 이상이면서 부정률 60% 이상
    const total = helpfulCount + notHelpfulCount
    const toReview =
      c.status === 'published' &&
      (notHelpfulCount >= 5 || (total >= 5 && notHelpfulCount / total >= 0.6))
    return { ...c, helpfulCount, notHelpfulCount, status: toReview ? 'review' : c.status }
  })

  return { state: { ...state, evaluations, cards }, ok: true, reason: null }
}

// 카드 해금 -10P. 재열람 무료, 잔액 부족이면 실패. 잔액 검사를 화면에 맡기지 않는다
export function unlockCard(state, driverId, cardId) {
  const card = state.cards.find((c) => c.id === cardId)
  if (!card) return { state, ok: false, reason: '카드를 찾을 수 없어요' }

  // 자기 카드와 이미 해금한 카드는 차감 없이 통과 (재열람 무료, 환불 없음)
  if (card.authorDriverId === driverId) return { state, ok: true, reason: null }
  const already = state.unlocks.some((u) => u.driverId === driverId && u.cardId === cardId)
  if (already) return { state, ok: true, reason: null }

  const spent = earnPoints(state, driverId, 'unlock_spend', cardId)
  if (!spent.ok) return spent

  const unlocks = [
    ...spent.state.unlocks,
    { id: genId('unlock'), driverId, cardId, createdAt: now() },
  ]
  return { state: { ...spent.state, unlocks }, ok: true, reason: null }
}

// 포인트 적립·차감 기록. 4종이 전부다 — 다른 사유를 추가하지 않는다
// type: signup_bonus +100 | interview_reward +100 | extra_reward +10 | unlock_spend -10
// refId: interview_reward 는 interviewId, extra_reward 와 unlock_spend 는 cardId
// 중복 지급 방지는 pointTransactions 조회로 한다. 잔액은 pointTransactions 합이 정본이다
export function earnPoints(state, driverId, type, refId) {
  const txs = state.pointTransactions

  let amount
  if (type === 'signup_bonus') {
    amount = 100
    if (txs.some((t) => t.type === 'signup_bonus' && t.driverId === driverId))
      return { state, ok: false, reason: '이미 가입 보상을 받았어요' }
  } else if (type === 'interview_reward') {
    amount = 100
    if (txs.some((t) => t.type === 'interview_reward' && t.interviewId === refId))
      return { state, ok: false, reason: '이 인터뷰의 기본 보상은 이미 지급됐어요' }
  } else if (type === 'extra_reward') {
    amount = 10
    if (txs.some((t) => t.type === 'extra_reward' && t.cardId === refId))
      return { state, ok: false, reason: '이 카드의 추가 보너스는 이미 지급됐어요' }
    // 인터뷰 1회 누적 +50P 상한 — 같은 인터뷰에서 생긴 카드들의 보너스 합으로 검사
    const card = state.cards.find((c) => c.id === refId)
    if (card && card.interviewId) {
      const sameInterviewCardIds = new Set(
        state.cards.filter((c) => c.interviewId === card.interviewId).map((c) => c.id)
      )
      const paid = txs
        .filter((t) => t.type === 'extra_reward' && sameInterviewCardIds.has(t.cardId))
        .reduce((sum, t) => sum + t.amount, 0)
      if (paid + amount > 50)
        return { state, ok: false, reason: '추가 보너스는 인터뷰당 최대 50P예요' }
    }
  } else if (type === 'unlock_spend') {
    amount = -10
    if (txs.some((t) => t.type === 'unlock_spend' && t.cardId === refId && t.driverId === driverId))
      return { state, ok: false, reason: '이미 해금한 카드예요' }
    if (getPointBalance(state, driverId) < 10)
      return { state, ok: false, reason: '포인트가 부족해요' }
  } else {
    return { state, ok: false, reason: '없는 포인트 사유예요' }
  }

  const tx = {
    id: genId('tx'),
    driverId,
    type,
    amount,
    interviewId: type === 'interview_reward' ? refId : null,
    cardId: type === 'extra_reward' || type === 'unlock_spend' ? refId : null,
    createdAt: now(),
  }
  return { state: { ...state, pointTransactions: [...txs, tx] }, ok: true, reason: null }
}

// ── 운행 여정 (v2.4) ──────────────────────────────────────────────

// 출발지·도착지로 운행 생성. startedAt 은 비운다. 출발지는 지도 표시 전용 — 경로 계산에 쓰지 않는다
// origin: { label, lat, lng } / centerId: 도착 센터
export function createDispatch(state, driverId, origin, centerId) {
  const center = state.centers.find((c) => c.id === centerId)
  if (!center) return { state, ok: false, reason: '도착지를 찾을 수 없어요' }

  const dispatch = {
    id: genId('dispatch'),
    driverId,
    originLabel: origin?.label || '현재 위치',
    originLat: origin?.lat ?? null,
    originLng: origin?.lng ?? null,
    centerId,
    createdAt: now(),
    startedAt: null, // 운행 시작 버튼이 채운다
    endedAt: null, // 도착지 도달 시각. MVP 는 운행 종료 버튼으로 재현
  }
  return {
    state: { ...state, dispatches: [...state.dispatches, dispatch] },
    ok: true,
    reason: null,
    dispatchId: dispatch.id,
  }
}

// 운행 시작. startedAt 기록 + Mock 운행 데이터에서 인터뷰 후보를 감지·저장한다 (노출은 하지 않는다)
export function startDispatch(state, dispatchId) {
  const dispatch = state.dispatches.find((d) => d.id === dispatchId)
  if (!dispatch) return { state, ok: false, reason: '운행을 찾을 수 없어요' }
  if (dispatch.startedAt) return { state, ok: false, reason: '이미 시작된 운행이에요' }

  const dispatches = state.dispatches.map((d) =>
    d.id === dispatchId ? { ...d, startedAt: now() } : d
  )

  // 도착 센터 주변의 반복 방문·정차를 후보로 저장 (Mock — drivers.json 의 repeatVisit)
  const driver = state.drivers.find((d) => d.id === dispatch.driverId)
  const candidates = (driver?.repeatVisit || [])
    .filter((v) => v.centerId === dispatch.centerId)
    .map((v) => ({
      id: genId('trigger'),
      dispatchId,
      placeId: v.placeId,
      type: 'repeat_visit',
      visitCount: v.visitCount,
      detectedAt: v.lastVisitedAt,
    }))

  return {
    state: { ...state, dispatches, triggerEvents: [...state.triggerEvents, ...candidates] },
    ok: true,
    reason: null,
  }
}

// 운행 종료. endedAt 기록 → 후보 1건 선정 → 인터뷰 생성 (운행 1회 = 인터뷰 최대 1건)
export function endDispatch(state, dispatchId) {
  const dispatch = state.dispatches.find((d) => d.id === dispatchId)
  if (!dispatch) return { state, ok: false, reason: '운행을 찾을 수 없어요' }
  if (!dispatch.startedAt) return { state, ok: false, reason: '시작하지 않은 운행이에요' }
  if (dispatch.endedAt) return { state, ok: false, reason: '이미 종료된 운행이에요' }

  const dispatches = state.dispatches.map((d) =>
    d.id === dispatchId ? { ...d, endedAt: now() } : d
  )

  // 반복 횟수 내림차순, 동점이면 최근 감지 순. 무작위 금지
  // 나머지 후보는 버리지 않고 그대로 둔다 — 다음 운행에서 다시 감지되므로 유실이 아니다
  const candidates = state.triggerEvents.filter((t) => t.dispatchId === dispatchId)
  const top = [...candidates].sort(
    (a, b) =>
      b.visitCount - a.visitCount || new Date(b.detectedAt) - new Date(a.detectedAt)
  )[0]

  let interviews = state.interviews
  if (top) {
    interviews = [
      ...interviews,
      {
        id: genId('interview'),
        driverId: dispatch.driverId,
        dispatchId,
        placeId: top.placeId,
        centerId: dispatch.centerId,
        createdAt: now(),
      },
    ]
  }

  return { state: { ...state, dispatches, interviews }, ok: true, reason: null }
}

// 현재 운행 반환. 상태는 저장하지 않고 두 시각으로 판정한다
// createdAt만: 운행 전 / startedAt 있음·endedAt 없음: 운행 중 / endedAt 있음: 운행 종료
export function getCurrentDispatch(state) {
  const mine = state.dispatches.filter((d) => d.driverId === state.currentDriverId)
  return mine.length > 0 ? mine[mine.length - 1] : null
}

// ── 인터뷰 ────────────────────────────────────────────────────────

// 노출할 인터뷰. 없으면 null. 운행 종료 후에만 생성되므로 존재하면 노출해도 된다
export function getCurrentInterview(state) {
  const mine = state.interviews.filter((i) => i.driverId === state.currentDriverId)
  return mine.length > 0 ? mine[mine.length - 1] : null
}

// 질문·답변 1턴 저장. item: { question, sttText, elementCheck }
// 음성·텍스트 구분 없이 sttText 에 담는다 (해소 19). elementCheck 는 저장한다 (해소 18)
export function addInterviewItem(state, interviewId, item) {
  if (!state.interviews.some((i) => i.id === interviewId))
    return { state, ok: false, reason: '인터뷰를 찾을 수 없어요' }
  const record = {
    id: genId('item'),
    interviewId,
    question: item.question || '',
    sttText: item.sttText || '',
    elementCheck: item.elementCheck ?? null,
    createdAt: now(),
  }
  return {
    state: { ...state, interviewItems: [...state.interviewItems, record] },
    ok: true,
    reason: null,
  }
}

// draft → published + 보상 지급. 기본 카드는 interview_reward (인터뷰당 1회),
// 추가 음성 기여 카드(isExtra)는 extra_reward (+10P, 인터뷰당 상한 50P)
export function publishCard(state, cardId) {
  const card = state.cards.find((c) => c.id === cardId)
  if (!card) return { state, ok: false, reason: '카드를 찾을 수 없어요' }
  if (card.status !== 'draft') return { state, ok: false, reason: '게시 전 상태가 아니에요' }

  const cards = state.cards.map((c) => (c.id === cardId ? { ...c, status: 'published' } : c))
  let next = { ...state, cards }

  // 보상 지급. 중복이면 earnPoints 가 걸러 준다 (카드 여러 장이어도 기본 보상은 1회)
  const rewarded = card.isExtra
    ? earnPoints(next, card.authorDriverId, 'extra_reward', cardId)
    : earnPoints(next, card.authorDriverId, 'interview_reward', card.interviewId)
  if (rewarded.ok) next = rewarded.state

  return { state: next, ok: true, reason: null, rewarded: rewarded.ok }
}

// ── 시연 보조 ─────────────────────────────────────────────────────

// 가입 처리 + signup_bonus (최초 1회)
export function signUp(state, driverId) {
  return earnPoints(state, driverId, 'signup_bonus', null)
}

// 잔액 0P 사용자 상태로 Mock 전환 (시연 5단계)
// 남은 잔액만큼 다른 카드를 해금한 것으로 처리해 내역까지 일관되게 만든다
export function switchToLowBalance(state) {
  let next = state
  const driverId = state.currentDriverId
  const candidates = getCards(next, {}).filter((c) => !c.isUnlocked)

  for (const card of candidates) {
    if (getPointBalance(next, driverId) < 10) break
    const r = unlockCard(next, driverId, card.id)
    if (r.ok) next = r.state
  }

  if (getPointBalance(next, driverId) >= 10)
    return { state, ok: false, reason: '해금할 카드가 부족해 잔액을 0으로 만들 수 없어요' }
  return { state: next, ok: true, reason: null }
}

// Mock 현재 위치 이동 (시연 8단계). 이력을 쌓지 않고 값 하나만 바꾼다
export function moveMockLocation(state, location) {
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number')
    return { state, ok: false, reason: '좌표가 올바르지 않아요' }
  return { state: { ...state, mockLocation: { lat: location.lat, lng: location.lng } }, ok: true, reason: null }
}

// ── 관리자 ────────────────────────────────────────────────────────

// 상태 무관 전체 카드 조회. 기사 화면용 getCards 와 다르다
export function getAllCards(state) {
  return state.cards.map((c) => ({ ...c }))
}

// 관리자 조치 4종. action: 'keep' | 'hide' | 'delete' | 'reviewDone'
// reviewDone 은 review → published 복귀 + reviewedAt 기록 (해소 23). delete 는 Soft Delete
export function applyAdminAction(state, cardId, action) {
  const card = state.cards.find((c) => c.id === cardId)
  if (!card) return { state, ok: false, reason: '카드를 찾을 수 없어요' }

  const cards = state.cards.map((c) => {
    if (c.id !== cardId) return c
    if (action === 'keep') return { ...c }
    if (action === 'hide') return { ...c, status: 'hidden' }
    if (action === 'delete') return { ...c, status: 'deleted', deletedAt: now() }
    if (action === 'reviewDone') return { ...c, status: 'published', reviewedAt: now() }
    return c
  })

  if (!['keep', 'hide', 'delete', 'reviewDone'].includes(action))
    return { state, ok: false, reason: '없는 관리자 조치예요' }

  return { state: { ...state, cards }, ok: true, reason: null }
}

// ── 조회 보조 (파생값) ─────────────────────────────────────────────

// 잔액. pointTransactions 합이 정본이다 (driver.pointBalance 는 캐시 — 둘이 다르면 합계가 옳다)
export function getPointBalance(state, driverId) {
  return state.pointTransactions
    .filter((t) => t.driverId === driverId)
    .reduce((sum, t) => sum + t.amount, 0)
}

// 포인트 내역 (S-07). 최신순
export function getPointTransactions(state, driverId) {
  return state.pointTransactions
    .filter((t) => t.driverId === driverId)
    .slice()
    .reverse()
}
