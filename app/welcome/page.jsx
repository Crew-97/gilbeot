'use client'

// 가입 환영 +100P (해소 34) — 랜딩 → 로그인 다음 화면
// 기존 app/page.jsx 의 S-01 내용을 경로만 옮겼다. 포인트 로직은 store signUp 그대로

import { useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ErrorState } from '@/components/ErrorState'
import { useStore } from '@/components/StoreProvider'
import { createInitialState, signUp } from '@/lib/store'

function BrandWordmark() {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-pill bg-page/75 py-2 pl-2.5 pr-4 shadow-block ring-1 ring-hairline backdrop-blur-xl">
      <Image src="/logo.png" alt="길벗 로고" width={38} height={38} priority />
      <span className="leading-none">
        <span className="block text-[17px] font-bold tracking-tight text-inverse">길벗</span>
        <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.22em] text-ink-500">
          Gilbeot
        </span>
      </span>
    </div>
  )
}

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function WelcomeShell({ children }) {
  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-page font-sans text-inverse">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-yellow-200/75 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 top-1/3 h-72 w-72 rounded-full bg-accent-soft/80 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 left-1/4 h-64 w-64 rounded-full bg-paper-dim blur-3xl"
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col pl-[calc(1.75rem+env(safe-area-inset-left))] pr-[calc(1.75rem+env(safe-area-inset-right))] pt-[calc(1.75rem+env(safe-area-inset-top))] pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
        <header>
          <BrandWordmark />
        </header>
        {children}
      </div>
    </main>
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
      <WelcomeShell>
        <div className="my-auto py-10">
          <div className="rounded-[2rem] bg-black/[0.05] p-1.5 shadow-block ring-1 ring-black/[0.05]">
            <div className="rounded-[calc(2rem-0.375rem)] bg-paper p-6">
              <ErrorState onRetry={handleRetry} />
            </div>
          </div>
        </div>
      </WelcomeShell>
    )
  }

  return (
    <WelcomeShell>
      <section className="my-auto animate-card-in py-10 sm:py-12" aria-labelledby="welcome-title">
        <span className="inline-flex items-center rounded-pill bg-accent-soft px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-700 ring-1 ring-hairline">
          길벗과 첫 여정
        </span>

        <h1 id="welcome-title" className="mt-6 text-[38px] font-bold leading-[1.16] tracking-tight text-inverse">
          길벗 가입을
          <br />
          <span className="relative inline-block">
            <span className="relative z-10">환영합니다</span>
            <span
              aria-hidden="true"
              className="absolute bottom-[7%] left-[-2%] right-[-2%] h-[32%] rounded-md bg-yellow-500"
            />
          </span>
        </h1>
        <p className="mt-5 text-body leading-relaxed text-ink-500">
          먼저 가본 기사의 노하우를 함께 가져가세요.
        </p>

        <section className="mt-10" aria-labelledby="signup-point-title">
          <div className="rounded-[2rem] bg-black/[0.05] p-1.5 shadow-lift ring-1 ring-black/[0.05]">
            <div className="rounded-[calc(2rem-0.375rem)] bg-paper p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-[16px] font-bold text-ink-900"
                  >
                    P
                  </span>
                  <div>
                    <h2 id="signup-point-title" className="whitespace-nowrap text-[12px] font-bold text-inverse sm:text-body-sm">
                      가입 축하 포인트
                    </h2>
                  </div>
                </div>
                <strong className="shrink-0 text-[26px] font-bold tracking-tight text-inverse sm:text-[30px]">+100P</strong>
              </div>
              <div className="mt-5 border-t border-line-soft pt-4">
                <p className="text-body-sm leading-relaxed text-ink-500">
                  최초 1회 적립돼요. 100P로 다른 기사의 노하우 10건을 해금할 수 있어요.
                </p>
              </div>
            </div>
          </div>
        </section>
      </section>

      <div className="mt-auto pt-7">
        <button
          type="button"
          onClick={handleStart}
          disabled={isStarting}
          aria-busy={isStarting}
          className="group flex min-h-14 w-full items-center justify-between rounded-pill bg-inverse py-2 pl-7 pr-2 text-left font-bold text-page shadow-lift transition-all duration-500 ease-spring hover:scale-[1.02] hover:bg-ink-700 active:scale-[.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-000 disabled:cursor-wait disabled:bg-ink-200 disabled:text-ink-500 disabled:shadow-none"
        >
          <span>{isStarting ? '이동하고 있어요' : '100P 받고 시작하기'}</span>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-ink-900 transition-transform duration-500 ease-spring group-hover:translate-x-0.5 group-disabled:bg-ink-100 group-disabled:text-ink-300">
            <ArrowRightIcon />
          </span>
        </button>
      </div>
    </WelcomeShell>
  )
}
