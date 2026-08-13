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

// near 조회 반경 km. 갱신 기준은 미정 31 이라 상수로 빼 두고 화면에서 조정한다
export const NEAR_RADIUS_KM = 3

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
// 반환: [{ ...card, isUnlocked }] — 잠금 여부를 붙여 돌려준다
export function getCards(state, condition = {}) {
  /* TODO 04 구현 */
  return []
}

// AI 응답의 cards[] 한 건을 draft 카드로 추가. placeId 는 요청에 실어 보낸 값을 쓴다 (해소 27)
// aiCard: { title, reason, category, evidence, relation, relatedCardId, relationReason }
// context: { interviewId, placeId, centerId }
export function addCard(state, aiCard, context) {
  /* TODO 04 구현 */
  return { state, ok: false, reason: '아직 구현되지 않았어요' }
}

// 도움 평가 등록·변경·취소. value: 'helpful' | 'not_helpful'
export function toggleVote(state, driverId, cardId, value) {
  /* TODO 04 구현 */
  return { state, ok: false, reason: '아직 구현되지 않았어요' }
}

// 카드 해금 -10P. 재열람 무료, 잔액 부족이면 실패
export function unlockCard(state, driverId, cardId) {
  /* TODO 04 구현 */
  return { state, ok: false, reason: '아직 구현되지 않았어요' }
}

// 포인트 적립·차감 기록. type: signup_bonus | interview_reward | extra_reward | unlock_spend
// refId: interview_reward 는 interviewId, extra_reward 와 unlock_spend 는 cardId
export function earnPoints(state, driverId, type, refId) {
  /* TODO 04 구현 */
  return { state, ok: false, reason: '아직 구현되지 않았어요' }
}

// ── 운행 여정 (v2.4) ──────────────────────────────────────────────

// 출발지·도착지로 운행 생성. startedAt 은 비운다
// origin: { label, lat, lng } / centerId: 도착 센터
export function createDispatch(state, driverId, origin, centerId) {
  /* TODO 04 구현 */
  return { state, ok: false, reason: '아직 구현되지 않았어요' }
}

// 운행 시작. startedAt 기록
export function startDispatch(state, dispatchId) {
  /* TODO 04 구현 */
  return { state, ok: false, reason: '아직 구현되지 않았어요' }
}

// 운행 종료. endedAt 기록 후 후보 1건 선정(반복 최다, 동점이면 최근) → 인터뷰 생성
export function endDispatch(state, dispatchId) {
  /* TODO 04 구현 */
  return { state, ok: false, reason: '아직 구현되지 않았어요' }
}

// 현재 운행 반환. 상태는 저장하지 않고 두 시각으로 판정한다
// createdAt만: 운행 전 / startedAt 있음·endedAt 없음: 운행 중 / endedAt 있음: 운행 종료
export function getCurrentDispatch(state) {
  /* TODO 04 구현 */
  return null
}

// ── 인터뷰 ────────────────────────────────────────────────────────

// 노출할 인터뷰. 없으면 null
export function getCurrentInterview(state) {
  /* TODO 04 구현 */
  return null
}

// 질문·답변 1턴 저장. sttText 와 elementCheck 를 함께 담는다 (해소 18·19)
export function addInterviewItem(state, interviewId, item) {
  /* TODO 04 구현 */
  return { state, ok: false, reason: '아직 구현되지 않았어요' }
}

// draft → published + interview_reward 지급 (인터뷰 1건당 1회)
export function publishCard(state, cardId) {
  /* TODO 04 구현 */
  return { state, ok: false, reason: '아직 구현되지 않았어요' }
}

// ── 시연 보조 ─────────────────────────────────────────────────────

// 가입 처리 + signup_bonus (최초 1회)
export function signUp(state, driverId) {
  /* TODO 04 구현 */
  return { state, ok: false, reason: '아직 구현되지 않았어요' }
}

// 잔액 0P 사용자 상태로 Mock 전환 (시연 5단계)
export function switchToLowBalance(state) {
  /* TODO 04 구현 */
  return { state, ok: false, reason: '아직 구현되지 않았어요' }
}

// Mock 현재 위치 이동 (시연 8단계). 이력을 쌓지 않고 값 하나만 바꾼다
export function moveMockLocation(state, location) {
  /* TODO 04 구현 */
  return { state, ok: false, reason: '아직 구현되지 않았어요' }
}

// ── 관리자 ────────────────────────────────────────────────────────

// 상태 무관 전체 카드 조회. 기사 화면용 getCards 와 다르다
export function getAllCards(state) {
  /* TODO 04 구현 */
  return []
}

// 관리자 조치. action: 'keep' | 'hide' | 'delete' | 'reviewDone'
// reviewDone 은 review → published 복귀 + reviewedAt 기록. delete 는 Soft Delete
export function applyAdminAction(state, cardId, action) {
  /* TODO 04 구현 */
  return { state, ok: false, reason: '아직 구현되지 않았어요' }
}

// ── 조회 보조 (파생값) ─────────────────────────────────────────────

// 잔액. pointTransactions 합이 정본이다 (driver.pointBalance 는 캐시)
export function getPointBalance(state, driverId) {
  /* TODO 04 구현 */
  return 0
}

// 포인트 내역 (S-07)
export function getPointTransactions(state, driverId) {
  /* TODO 04 구현 */
  return []
}
