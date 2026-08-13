'use client'

// S-06 AI 인터뷰. 운행 종료로 생성된 인터뷰 1건에 답하고 지식 카드로 게시한다
// 흐름: 질문 표시 → 음성 답변(STT) → /api/structure 분석 → 확인 → 게시
// 기사 확인 단계는 읽기 전용이다 (미정 4 — 수정 UI 를 만들지 않았다)

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/components/StoreProvider'
import {
  addCard,
  addInterviewItem,
  buildStructureRequest,
  getCurrentInterview,
  getDraftCards,
  getPointBalance,
  publishCard,
} from '@/lib/store'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { Header } from '@/components/Header'
import { ErrorState } from '@/components/ErrorState'
import { PointText } from '@/components/PointText'
import { VoiceButton } from '@/components/VoiceButton'

// 목적격 조사. 받침이 있으면 을, 없으면 를
function objectParticle(word) {
  const last = word.charCodeAt(word.length - 1)
  if (last < 0xac00 || last > 0xd7a3) return '를'
  return (last - 0xac00) % 28 === 0 ? '를' : '을'
}

// 기본 질문은 템플릿 고정이다 (해소 3). 기획서 7-1 의 카테고리별 4종 문구를 그대로 쓴다
// AI 가 만드는 것은 후속 질문뿐이다
const QUESTION_TEMPLATES = {
  center_tip: (name) => `${name} 상하차 때 알아두면 좋은 점이 있나요?`,
  gas: (name) => `${name}에 자주 들르시네요. 자주 이용하는 이유가 있나요?`,
  food: (name) =>
    `${name}${objectParticle(name)} 자주 이용하시네요. 화물기사에게 알려줄 만한 점이 있나요?`,
  rest: () => '이곳에서 자주 쉬시네요. 화물차 기사에게 편한 점이 있나요?',
}

const CATEGORY_LABELS = {
  center_tip: '센터팁',
  gas: '주유소',
  food: '식당',
  rest: '휴게소·쉼터',
}

// elementCheck 키 라벨. 키 집합은 API 가 카테고리에 맞게 골라 보낸다
const ELEMENT_LABELS = {
  place: '장소',
  entrance: '진입구',
  vehicle: '대형차 진입',
  time: '시간대',
  tip: '행동·팁',
  center: '센터',
  reason: '이유',
}

const VERDICT_MESSAGES = {
  valid: '유효한 암묵지로 판단했어요.',
  insufficient: '내용이 조금 막연해요. 한 가지만 더 알려주시겠어요?',
}

const REJECT_MESSAGES = {
  no_information: '아직 알려주실 내용이 없다고 하셨어요.',
  off_topic: '장소와 연결되는 경험이 아니에요.',
  unclear: '말씀을 알아듣지 못했어요.',
}

// 관계는 similar / conflict 만 저장된다. 저장된 관계가 없으면 신규다
const RELATION_MESSAGES = {
  similar: '기존 암묵지와 같은 내용이에요. 교차 검증으로 연결했어요',
  conflict: '기존 암묵지와 다른 내용이에요. 별도 카드로 보존해요',
}

export default function SurveyPage() {
  const router = useRouter()
  const { state, setState } = useStore()
  const recognitionRef = useRef(null)

  const [phase, setPhase] = useState('idle') // idle / recording / analyzing / review / published
  const [sttText, setSttText] = useState('')
  const [interimText, setInterimText] = useState('')
  const [followUpText, setFollowUpText] = useState(null)
  const [result, setResult] = useState(null)
  const [earned, setEarned] = useState(0)
  const [failReason, setFailReason] = useState(null)
  const [speechSupported, setSpeechSupported] = useState(null)
  const [textMode, setTextMode] = useState(false)
  const [confirmingExit, setConfirmingExit] = useState(false)

  // 화면을 벗어나도 마이크가 열려 있으면 안 된다
  // 지원 여부는 여기서 판정하지 않는다. 서버 렌더 결과와 어긋나므로 첫 시도에서 확인한다
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort()
    }
  }, [])

  if (!Array.isArray(state.centers) || !Array.isArray(state.places)) {
    return <ErrorState onRetry={() => window.location.reload()} />
  }

  const interview = getCurrentInterview(state)

  if (!interview) {
    return (
      <EmptyState
        message="지금은 답변할 인터뷰가 없어요."
        actionLabel="홈으로 가기"
        onAction={() => router.push('/home')}
      />
    )
  }

  const center = state.centers.find((item) => item.id === interview.centerId) || null
  const place = interview.placeId
    ? state.places.find((item) => item.id === interview.placeId) || null
    : null

  if (!center) {
    return (
      <ErrorState
        message="인터뷰 대상 센터를 찾을 수 없어요."
        onRetry={() => router.push('/home')}
      />
    )
  }

  const category = place ? place.category : 'center_tip'
  const template = QUESTION_TEMPLATES[category] || QUESTION_TEMPLATES.center_tip
  const question = followUpText || template(place ? place.name : center.name)

  const drafts = getDraftCards(state, interview.id)
  const items = state.interviewItems.filter((item) => item.interviewId === interview.id)
  const balance = getPointBalance(state, state.currentDriverId)
  const answer = sttText.trim()

  const stopRecognition = () => {
    if (recognitionRef.current) recognitionRef.current.stop()
  }

  // Web Speech API 가 브라우저 STT 다. 별도 STT 서버를 두지 않는다 (해소 24)
  const startRecognition = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) {
      setSpeechSupported(false)
      setTextMode(true)
      setFailReason('이 브라우저는 음성 인식을 지원하지 않아요. 아래에 직접 입력해 주세요.')
      return
    }

    const recognition = new Recognition()
    recognition.lang = 'ko-KR'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let settled = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i]
        if (chunk.isFinal) settled += chunk[0].transcript
        else interim += chunk[0].transcript
      }
      if (settled) setSttText((prev) => (prev ? prev + ' ' + settled.trim() : settled.trim()))
      setInterimText(interim)
    }

    recognition.onerror = (event) => {
      // 권한 거부와 인식 실패를 구분해 안내하고, 어느 쪽이든 텍스트 입력으로 이어갈 수 있게 한다
      setFailReason(
        event.error === 'not-allowed'
          ? '마이크 사용을 허용해 주세요. 아래에 직접 입력하셔도 돼요.'
          : '음성을 알아듣지 못했어요. 아래에 직접 입력해 주세요.'
      )
      setTextMode(true)
    }

    recognition.onend = () => {
      setInterimText('')
      setPhase((prev) => (prev === 'recording' ? 'idle' : prev))
    }

    recognitionRef.current = recognition
    setFailReason(null)
    setPhase('recording')
    recognition.start()
  }

  const handleVoiceToggle = () => {
    if (phase === 'recording') stopRecognition()
    else startRecognition()
  }

  const handleAnalyze = async () => {
    if (!answer) return
    stopRecognition()
    setFailReason(null)
    setPhase('analyzing')

    const body = buildStructureRequest(state, interview.id, answer, question, Boolean(followUpText))
    if (!body) {
      setFailReason('인터뷰 정보를 찾을 수 없어요.')
      setPhase('idle')
      return
    }

    let data
    try {
      const response = await fetch('/api/structure', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) throw new Error('structure request failed')
      data = await response.json()
    } catch {
      // LLM 실패는 서버가 캐시 폴백으로 덮는다. 여기까지 오면 요청 자체가 실패한 것이라 초안을 지우지 않고 재시도를 남긴다
      setFailReason('분석에 실패했어요. 다시 시도해 주세요.')
      setPhase('idle')
      return
    }

    // 이번 인터뷰에서 이미 카드가 나왔다면 이번 답변은 추가 음성 기여다 (+10P, 인터뷰당 상한 50P)
    // 첫 답변이 insufficient 여서 다시 답하는 경우는 카드가 없으므로 기본 보상 대상으로 남는다
    const isExtra = state.cards.some((card) => card.interviewId === interview.id)

    let next = state
    const saved = addInterviewItem(next, interview.id, {
      question,
      sttText: answer,
      elementCheck: data.elementCheck,
    })
    if (saved.ok) next = saved.state

    for (const aiCard of data.cards || []) {
      const added = addCard(next, aiCard, {
        interviewId: interview.id,
        placeId: interview.placeId,
        centerId: interview.centerId,
        isExtra,
      })
      if (added.ok) next = added.state
    }

    setState(next)
    setResult(data)
    setPhase('review')
  }

  // 후속 질문에 이어서 답한다. 질문만 바꾸고 답변 상태를 비운다
  const handleFollowUp = () => {
    setFollowUpText(result?.followUpQuestion || null)
    setSttText('')
    setInterimText('')
    setResult(null)
    setFailReason(null)
    setPhase('idle')
  }

  const handleRetry = () => {
    setSttText('')
    setInterimText('')
    setResult(null)
    setFailReason(null)
    setPhase('idle')
  }

  // 게시 전 취소. 상태를 바꾸지 않으므로 포인트도 움직이지 않는다
  // 이미 만들어진 카드가 있어도 draft 라서 다른 기사에게 노출되지 않고 보상도 지급되지 않는다
  const handleExit = () => {
    setConfirmingExit(false)
    router.push('/home')
  }

  const handlePublish = () => {
    const targets = getDraftCards(state, interview.id)
    if (targets.length === 0) {
      setFailReason('게시할 카드가 없어요.')
      return
    }

    const before = getPointBalance(state, state.currentDriverId)
    let next = state
    let published = 0
    let lastReason = null

    for (const card of targets) {
      const done = publishCard(next, card.id)
      if (done.ok) {
        next = done.state
        published += 1
      } else {
        lastReason = done.reason
      }
    }

    if (published === 0) {
      setFailReason(lastReason || '게시하지 못했어요. 다시 시도해 주세요.')
      return
    }

    setState(next)
    setEarned(getPointBalance(next, next.currentDriverId) - before)
    setFailReason(published === targets.length ? null : '일부 카드를 게시하지 못했어요.')
    setPhase('published')
  }

  if (phase === 'published') {
    return (
      <main className="mx-auto flex min-h-screen max-w-[390px] flex-col gap-5 px-4 pb-6">
        {/* 이미 게시된 뒤라 취소할 것이 없다. 뒤로가기를 두지 않는다 */}
        <Header title="게시 완료" />

        <p className="text-caption text-ink-500">{place ? place.name : center.name}</p>

        <section className="rounded-lg border border-hairline bg-accent-soft p-5 text-center shadow-block animate-card-in">
          <p className="text-body-sm text-ink-700">적립 포인트</p>
          <p className="mt-2 text-title-1 text-ink-000">
            <PointText amount={earned} />
          </p>
          <p className="mt-3 text-caption text-ink-500">현재 잔액 {balance}P</p>
        </section>

        <section className="flex flex-col gap-3">
          {drafts.length === 0 ? null : (
            <p className="text-caption text-ink-500">게시하지 못한 카드가 남아 있어요.</p>
          )}
          {state.cards
            .filter((card) => card.interviewId === interview.id && card.status === 'published')
            .map((card) => (
              <article
                key={card.id}
                className="rounded-lg border border-hairline bg-paper p-4 shadow-block"
              >
                <span className="text-caption text-ink-500">{CATEGORY_LABELS[card.category]}</span>
                <h2 className="mt-1 text-body font-bold text-ink-000">{card.title}</h2>
                {card.reason ? (
                  <p className="mt-2 text-body-sm text-ink-700">{card.reason}</p>
                ) : null}
              </article>
            ))}
        </section>

        <div className="mt-auto flex flex-col items-center gap-3">
          <Button className="w-[358px]" onClick={() => router.push('/my')}>
            포인트 내역 보기
          </Button>
          <Button variant="ghost" className="w-[358px]" onClick={() => router.push('/home')}>
            홈으로 가기
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[390px] flex-col gap-5 px-4 pb-6">
      {/* 게시 전이라 뒤로가기는 인터뷰 취소다. 확인을 받고 나간다 */}
      <Header
        title="AI 인터뷰"
        onBack={() => setConfirmingExit(true)}
        right={<PointText amount={balance} showSign={false} />}
      />

      <p className="text-caption text-ink-500">
        {place ? `${CATEGORY_LABELS[place.category]} ${place.name}` : center.name}
      </p>

      <section className="rounded-lg border border-hairline bg-paper p-4 shadow-block">
        <span className="text-caption text-ink-500">
          {followUpText ? '후속 질문' : '질문'}
        </span>
        <p className="mt-2 text-body font-bold text-ink-000">{question}</p>
      </section>

      {phase === 'review' && result ? (
        <>
          <section className="rounded-lg border border-hairline bg-paper p-4 shadow-block animate-card-in">
            <h2 className="text-body font-bold text-ink-000">
              {result.verdict === 'invalid'
                ? REJECT_MESSAGES[result.rejectReason] || '내용을 확인하지 못했어요.'
                : VERDICT_MESSAGES[result.verdict]}
            </h2>

            {result.elementCheck ? (
              <>
                <p className="mt-3 text-caption text-ink-500">말씀해 주신 정보</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(result.elementCheck).map(([key, filled]) => (
                    <li
                      key={key}
                      className={
                        'inline-flex min-h-11 items-center rounded-pill px-3 text-caption font-bold ' +
                        (filled
                          ? 'bg-accent-soft text-ink-000'
                          : 'border border-hairline bg-paper text-ink-300')
                      }
                    >
                      {ELEMENT_LABELS[key] || key} {filled ? 'O' : 'X'}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-caption text-ink-500">
                  X 로 표시된 항목은 말씀하지 않으신 내용이라 비워 두었어요.
                </p>
              </>
            ) : null}
          </section>

          {(result.cards || []).some((card) => card.relation === 'duplicate') ? (
            <p className="text-body-sm text-ink-500">이미 말씀해주신 내용이에요.</p>
          ) : null}

          {drafts.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-body font-bold text-ink-000">게시할 암묵지 {drafts.length}건</h2>
              {drafts.map((card) => {
                const relation = state.cardRelations.find((item) => item.cardId === card.id) || null
                const related = relation
                  ? state.cards.find((item) => item.id === relation.relatedCardId)
                  : null

                return (
                  <article
                    key={card.id}
                    className="rounded-lg border border-hairline bg-paper p-4 shadow-block animate-card-in"
                  >
                    <span className="text-caption text-ink-500">
                      {CATEGORY_LABELS[card.category]}
                    </span>
                    <h3 className="mt-1 text-body font-bold text-ink-000">{card.title}</h3>
                    {card.reason ? (
                      <p className="mt-2 text-body-sm text-ink-700">{card.reason}</p>
                    ) : null}

                    <p className="mt-3 text-caption text-ink-500">
                      {relation
                        ? RELATION_MESSAGES[relation.relationType]
                        : '새로 등록되는 암묵지예요'}
                    </p>
                    {related ? (
                      <p className="mt-1 text-caption text-ink-500">연결 대상 · {related.title}</p>
                    ) : null}
                  </article>
                )
              })}
            </section>
          ) : null}

          <section className="rounded-lg border border-hairline bg-sunken p-4">
            <h2 className="text-body-sm font-bold text-ink-000">내가 말한 원본</h2>
            {items.map((item) => (
              <div key={item.id} className="mt-3">
                <p className="text-caption text-ink-500">{item.question}</p>
                <p className="mt-1 text-body-sm text-ink-700">{item.sttText}</p>
              </div>
            ))}
          </section>

          {result.followUpQuestion ? (
            <section className="rounded-lg border border-hairline bg-accent-soft p-4">
              <span className="text-caption text-ink-700">이것도 알려주시겠어요?</span>
              <p className="mt-2 text-body font-bold text-ink-000">{result.followUpQuestion}</p>
              <div className="mt-3 flex justify-center">
                <Button variant="ghost" className="w-full" onClick={handleFollowUp}>
                  추가로 답변하기
                </Button>
              </div>
            </section>
          ) : null}

          {failReason ? (
            <p className="text-center text-body-sm text-danger">{failReason}</p>
          ) : null}

          <div className="mt-auto flex flex-col items-center gap-3">
            {drafts.length > 0 ? (
              <Button className="w-[358px]" onClick={handlePublish}>
                게시하기
              </Button>
            ) : (
              <Button className="w-[358px]" onClick={handleRetry}>
                다시 답변하기
              </Button>
            )}
            <p className="text-caption text-ink-500">게시하기 전에는 다른 기사에게 보이지 않아요.</p>
          </div>
        </>
      ) : (
        <>
          {answer || interimText ? (
            <section className="rounded-lg border border-hairline bg-sunken p-4">
              <span className="text-caption text-ink-500">인식된 내용</span>
              <p className="mt-2 text-body-sm text-ink-700">
                {answer}
                {interimText ? <span className="text-ink-300"> {interimText}</span> : null}
              </p>
            </section>
          ) : null}

          {textMode ? (
            <section className="rounded-lg border border-hairline bg-paper p-4 shadow-block">
              <label htmlFor="answer" className="text-caption text-ink-500">
                직접 입력
              </label>
              <textarea
                id="answer"
                value={sttText}
                onChange={(event) => setSttText(event.target.value)}
                disabled={phase === 'analyzing'}
                rows={4}
                placeholder="말씀하실 내용을 적어 주세요."
                className="mt-2 w-full rounded-md border border-hairline bg-page p-3 text-body-sm text-ink-700"
              />
            </section>
          ) : null}

          {failReason ? (
            <p className="text-center text-body-sm text-danger">{failReason}</p>
          ) : null}

          <div className="mt-auto flex flex-col items-center gap-4">
            {speechSupported === false ? (
              <p className="text-caption text-ink-500">
                이 브라우저는 음성 인식을 지원하지 않아요. 직접 입력해 주세요.
              </p>
            ) : (
              <VoiceButton
                recording={phase === 'recording'}
                onClick={handleVoiceToggle}
                disabled={phase === 'analyzing'}
                label={
                  phase === 'recording'
                    ? '듣고 있어요. 다시 누르면 멈춰요'
                    : '버튼을 누르고 말씀해 주세요'
                }
              />
            )}

            {speechSupported !== false && !textMode ? (
              <button
                type="button"
                onClick={() => setTextMode(true)}
                className="min-h-11 text-caption text-ink-500 underline"
              >
                직접 입력할게요
              </button>
            ) : null}

            <Button
              className="w-[358px]"
              onClick={handleAnalyze}
              disabled={!answer || phase === 'analyzing'}
              disabledReason={
                phase === 'analyzing' ? '분석하고 있어요' : answer ? undefined : '먼저 답변을 남겨 주세요'
              }
            >
              {phase === 'analyzing' ? '분석하고 있어요' : '답변 분석하기'}
            </Button>
          </div>
        </>
      )}

      {confirmingExit ? (
        <div
          className="fixed inset-0 z-20 flex items-end justify-center bg-[var(--scrim)] px-4 pb-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-title"
        >
          <div className="w-full max-w-[358px] rounded-lg bg-paper p-5 shadow-overlay">
            <p id="exit-title" className="text-body font-bold text-ink-000">
              인터뷰를 취소할까요?
            </p>
            <p className="mt-2 text-body-sm text-ink-500">지금까지 답변은 저장되지 않아요.</p>

            <div className="mt-5 flex flex-col gap-2">
              <Button className="w-full" onClick={handleExit}>
                인터뷰 취소하기
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setConfirmingExit(false)}>
                계속 답변하기
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
