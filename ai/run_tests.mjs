// POST /api/structure 골든 테스트 러너
// 사용법: next dev 를 띄워 둔 다음  node ai/run_tests.mjs
//        다른 주소로 검증하려면  BASE_URL=https://... node ai/run_tests.mjs
// 프롬프트를 고치면 반드시 이 12케이스를 재확인한다 (AGENTS.md)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const ENDPOINT = `${BASE_URL}/api/structure`

const ELEMENT_KEYS = {
  center_tip: ['place', 'entrance', 'vehicle', 'time', 'tip', 'reason'],
  gas: ['place', 'vehicle', 'time', 'center', 'reason'],
  food: ['place', 'vehicle', 'time', 'center', 'reason'],
  rest: ['place', 'vehicle', 'time', 'center', 'reason'],
}

const spec = JSON.parse(readFileSync(join(HERE, 'test_utterances.json'), 'utf8'))

function buildRequest(testCase) {
  const merged = { ...spec.defaults, ...testCase }
  return {
    sttText: merged.sttText,
    questionText: merged.questionText,
    place: merged.place === undefined ? spec.defaults.place : merged.place,
    freightCenter: merged.freightCenter,
    existingCards: merged.existingCards,
    sessionCards: merged.sessionCards,
    isFollowup: merged.isFollowup === true,
  }
}

// 공백을 지운 뒤 포함 여부를 본다. evidence 가 원문에 없으면 환각이다
function evidenceInSource(evidence, sttText) {
  const strip = (s) => s.replace(/\s/g, '')
  return strip(sttText).includes(strip(evidence))
}

// 계약 위반은 케이스별 기대값과 무관하게 항상 검사한다
function checkContract(res, req) {
  const fails = []
  const category = req.place ? req.place.category : 'center_tip'
  const existingIds = new Set(req.existingCards.map((c) => c.id))
  const sessionIds = new Set(req.sessionCards.map((c) => c.id))

  if (!['valid', 'insufficient', 'invalid'].includes(res.verdict))
    fails.push(`verdict 값이 계약 밖: ${res.verdict}`)
  if (res.verdict !== 'invalid' && res.rejectReason !== null)
    fails.push('invalid 이 아닌데 rejectReason 이 채워졌다')
  if (res.verdict !== 'valid' && res.cards.length > 0)
    fails.push('valid 가 아닌데 카드가 있다')
  if (res.verdict === 'valid' && res.cards.length === 0)
    fails.push('valid 인데 카드가 없다 (모순 응답)')
  if (typeof res.fallbackUsed !== 'boolean') fails.push('fallbackUsed 가 없다')

  if (res.verdict === 'invalid') {
    if (res.elementCheck !== null) fails.push('invalid 인데 elementCheck 가 null 이 아니다')
  } else if (res.elementCheck === null) {
    fails.push('invalid 가 아닌데 elementCheck 가 null 이다')
  } else {
    const want = ELEMENT_KEYS[category].slice().sort().join(',')
    const got = Object.keys(res.elementCheck).slice().sort().join(',')
    if (want !== got) fails.push(`elementCheck 키 불일치: ${got} (기대 ${want})`)
  }

  for (const card of res.cards) {
    if (!card.title) fails.push('title 이 비었다')
    if (typeof card.reason !== 'string') fails.push('reason 이 문자열이 아니다')
    if (!['center_tip', 'gas', 'food', 'rest'].includes(card.category))
      fails.push(`category 값이 계약 밖: ${card.category}`)
    if (!['new', 'similar', 'conflict', 'duplicate'].includes(card.relation))
      fails.push(`relation 값이 계약 밖: ${card.relation}`)
    if (card.relation === 'new' && (card.relatedCardId || card.relationReason))
      fails.push('new 인데 관계 필드가 채워졌다')
    if ((card.relation === 'similar' || card.relation === 'conflict') && !existingIds.has(card.relatedCardId))
      fails.push(`relatedCardId 가 기존 카드에 없다: ${card.relatedCardId}`)
    if (card.relation === 'duplicate' && card.relatedCardId && !sessionIds.has(card.relatedCardId))
      fails.push(`duplicate relatedCardId 가 이번 인터뷰 카드에 없다: ${card.relatedCardId}`)
    if (card.evidence && !evidenceInSource(card.evidence, req.sttText))
      fails.push(`evidence 가 원문에 없다 (환각): ${card.evidence.slice(0, 40)}`)
    // UI 카피 규칙 — 느낌표 금지
    if (/[!！]/.test(card.title) || /[!！]/.test(card.reason)) fails.push('카드에 느낌표가 있다')
  }
  if (res.followUpQuestion && /[!！]/.test(res.followUpQuestion))
    fails.push('후속 질문에 느낌표가 있다')
  if (res.verdict === 'invalid' && res.followUpQuestion !== null)
    fails.push('invalid 인데 후속 질문이 있다')

  return fails
}

function checkExpect(res, expect) {
  const fails = []
  if (!expect) return fails

  if (expect.verdict && res.verdict !== expect.verdict)
    fails.push(`verdict ${res.verdict} (기대 ${expect.verdict})`)
  if ('rejectReason' in expect && res.rejectReason !== expect.rejectReason)
    fails.push(`rejectReason ${res.rejectReason} (기대 ${expect.rejectReason})`)
  if (expect.minCards !== undefined && res.cards.length < expect.minCards)
    fails.push(`카드 ${res.cards.length}장 (최소 ${expect.minCards})`)
  if (expect.maxCards !== undefined && res.cards.length > expect.maxCards)
    fails.push(`카드 ${res.cards.length}장 (최대 ${expect.maxCards})`)
  if (expect.elementCheckNull && res.elementCheck !== null)
    fails.push('elementCheck 가 null 이 아니다')

  if (expect.elementCheck && res.elementCheck) {
    for (const [key, want] of Object.entries(expect.elementCheck)) {
      if (res.elementCheck[key] !== want)
        fails.push(`elementCheck.${key} ${res.elementCheck[key]} (기대 ${want})`)
    }
  }
  if (expect.cardRelations) {
    const got = res.cards.map((c) => c.relation)
    const want = expect.cardRelations
    const covered = want.every((r) => got.includes(r))
    if (!covered) fails.push(`relation [${got.join(', ')}] (기대 [${want.join(', ')}] 포함)`)
  }
  if (expect.relatedCardIds) {
    const got = res.cards.map((c) => c.relatedCardId).filter(Boolean)
    for (const id of expect.relatedCardIds) {
      if (!got.includes(id)) fails.push(`relatedCardId ${id} 없음 (실제 [${got.join(', ')}])`)
    }
  }
  if (expect.emptyReason && res.cards.some((c) => c.reason !== ''))
    fails.push('reason 이 비어 있어야 하는데 채워졌다')
  if (expect.followUpQuestion === 'null' && res.followUpQuestion !== null)
    fails.push('후속 질문이 null 이어야 한다')
  if (expect.followUpQuestion === 'notNull' && !res.followUpQuestion)
    fails.push('후속 질문이 있어야 한다')

  return fails
}

async function runCase(testCase) {
  const req = buildRequest(testCase)
  const t0 = Date.now()
  let res
  let status
  try {
    const httpRes = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
    })
    status = httpRes.status
    res = await httpRes.json()
  } catch (error) {
    return { id: testCase.id, label: testCase.label, ok: false, ms: Date.now() - t0, fails: [`요청 실패: ${error.message}`] }
  }
  const ms = Date.now() - t0

  if (status !== 200)
    return { id: testCase.id, label: testCase.label, ok: false, ms, fails: [`HTTP ${status} ${JSON.stringify(res)}`] }

  const fails = [...checkContract(res, req), ...checkExpect(res, testCase.expect)]
  return {
    id: testCase.id,
    label: testCase.label,
    ok: fails.length === 0,
    ms,
    fallbackUsed: res.fallbackUsed,
    fails,
    response: res,
  }
}

console.log(`대상: ${ENDPOINT}`)
console.log(`케이스: ${spec.cases.length}건\n`)

const results = []
for (const testCase of spec.cases) {
  const result = await runCase(testCase)
  results.push(result)
  const mark = result.ok ? 'PASS' : 'FAIL'
  const fb = result.fallbackUsed ? ' [폴백]' : ''
  console.log(`${mark} ${result.id} ${String(result.ms).padStart(6)}ms${fb}  ${result.label}`)
  for (const fail of result.fails) console.log(`       - ${fail}`)
}

const passed = results.filter((r) => r.ok).length
const usedFallback = results.filter((r) => r.fallbackUsed).length
const latencies = results.map((r) => r.ms)
console.log(`\n${passed}/${results.length} 통과`)
console.log(`지연 최대 ${Math.max(...latencies)}ms / 평균 ${Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)}ms`)
if (usedFallback > 0) console.log(`폴백 응답 ${usedFallback}건 — LLM 호출이 실패했다는 뜻이다`)

mkdirSync(join(HERE, 'results'), { recursive: true })
const outPath = join(HERE, 'results', 'latest.json')
writeFileSync(outPath, JSON.stringify({ endpoint: ENDPOINT, passed, total: results.length, results }, null, 2), 'utf8')
console.log(`결과 저장: ${outPath}`)

process.exit(passed === results.length ? 0 : 1)
