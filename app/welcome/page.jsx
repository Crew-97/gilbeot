'use client'

// 가입 환영 +100P (해소 34) — 랜딩 → 로그인 다음 화면
// 기존 app/page.jsx 의 S-01 내용을 경로만 옮겼다. 포인트 로직은 store signUp 그대로

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorState } from '@/components/ErrorState'
import { useStore } from '@/components/StoreProvider'
import { createInitialState, signUp } from '@/lib/store'

function BrandWordmark() {
  return (
    <div className="inline-flex h-12 items-center rounded-pill bg-yellow-500 px-5 text-title-3 font-bold tracking-tight text-ink-000">
      길벗
    </div>
  )
}

export default function WelcomePage() {
  const router = useRouter()
  const { state, setState } = useStore()
  const [isStarting, setIsStarting] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)
  const isStartingRef = useRef(false)

  const hasRequiredData =
    Array.isArray(state?.centers) &&
    state.centers.length > 0 &&
    Array.isArray(state?.places) &&
    state.places.length > 0 &&
    Array.isArray(state?.cards) &&
    state.cards.length > 0 &&
    Array.isArray(state?.drivers) &&
    state.drivers.some((driver) => driver.id === state.currentDriverId)

  const handleRetry = () => {
    setState(createInitialState())
    setHasFailed(false)
  }

  const handleStart = () => {
    if (isStartingRef.current) return

    isStartingRef.current = true
    setIsStarting(true)

    const result = signUp(state, state.currentDriverId)
    if (!result.ok) {
      isStartingRef.current = false
      setIsStarting(false)
      setHasFailed(true)
      return
    }

    setState(result.state)
    router.push('/destination')
  }

  if (!hasRequiredData || hasFailed) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col px-4 pb-8 pt-6 font-sans">
        <header>
          <BrandWordmark />
        </header>
        <div className="my-auto">
          <ErrorState onRetry={handleRetry} />
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col px-4 pb-8 pt-6 font-sans">
      <header>
        <BrandWordmark />
      </header>

      <section className="mt-14 animate-card-in" aria-labelledby="welcome-title">
        <h1
          id="welcome-title"
          className="text-title-1 font-bold tracking-tight text-ink-000"
        >
          길벗 가입을
          <br />
          환영합니다
        </h1>
        <p className="mt-4 text-body text-ink-500">
          먼저 가본 기사의 경험을 함께 가져가세요.
        </p>

        <section
          className="mt-8 rounded-lg border border-hairline bg-yellow-500 p-3.5 text-ink-000"
          aria-labelledby="signup-point-title"
        >
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="signup-point-title" className="text-body-sm font-bold">
              가입 축하 포인트
            </h2>
            <strong className="shrink-0 text-title-1 font-bold tracking-tight">+100P</strong>
          </div>
          <p className="mt-1 text-caption">
            100P로 다른 기사의 경험 10건을 열 수 있어요.
          </p>
        </section>
      </section>

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={handleStart}
          disabled={isStarting}
          aria-busy={isStarting}
          className="min-h-12 w-full rounded-pill bg-inverse px-6 font-bold text-paper transition-[transform,background-color] duration-150 ease-standard hover:bg-ink-700 active:scale-[.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-000 disabled:cursor-wait disabled:bg-ink-200 disabled:text-ink-500"
        >
          {isStarting ? '이동하고 있어요' : '시작하기'}
        </button>
      </div>
    </main>
  )
}
