'use client'

// Mock 로그인 (해소 34) — 기사 선택만 한다. 실제 인증, 비밀번호 입력란은 만들지 않는다
// 시연 기본값은 driver_001 김영수 (해소 32)

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/components/StoreProvider'
import { signIn } from '@/lib/store'
import { ErrorState } from '@/components/ErrorState'
import { Header } from '@/components/Header'
import { MockBadge } from '@/components/MockBadge'

export default function LoginPage() {
  const router = useRouter()
  const { state, setState } = useStore()
  const [selectedId, setSelectedId] = useState('driver_001')
  const [failReason, setFailReason] = useState(null)

  if (!Array.isArray(state.drivers) || state.drivers.length === 0) {
    return <ErrorState onRetry={() => window.location.reload()} />
  }

  const handleLogin = () => {
    const r = signIn(state, selectedId)
    if (!r.ok) {
      setFailReason(r.reason)
      return
    }
    setState(r.state)
    router.push('/welcome')
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col gap-6 px-4 pb-8">
      <Header title="로그인" onBack={() => router.push('/')} />

      <section aria-labelledby="login-title">
        <div className="flex items-center justify-between gap-3">
          <h1 id="login-title" className="text-title-3 font-bold tracking-tight text-ink-000">
            기사를 선택하세요
          </h1>
          <MockBadge />
        </div>
        <p className="mt-2 text-caption text-ink-500">
          시연용 로그인이에요. 실서비스에서는 트럭커 계정으로 로그인해요.
        </p>
      </section>

      <div role="radiogroup" aria-label="기사 선택" className="flex flex-col gap-3">
        {state.drivers.map((driver) => (
          <button
            key={driver.id}
            type="button"
            role="radio"
            aria-checked={selectedId === driver.id}
            onClick={() => setSelectedId(driver.id)}
            className={
              'flex min-h-12 items-center justify-between rounded-lg border p-3.5 text-left shadow-block ' +
              (selectedId === driver.id
                ? 'border-yellow-500 bg-yellow-500 text-ink-000'
                : 'border-hairline bg-paper text-ink-700')
            }
          >
            <span className="text-body font-bold">{driver.name}</span>
            {selectedId === driver.id ? (
              <span className="text-caption font-bold">선택됨</span>
            ) : null}
          </button>
        ))}
      </div>

      {failReason ? (
        <p role="alert" className="text-center text-caption text-danger">
          {failReason}
        </p>
      ) : null}

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={handleLogin}
          className="min-h-12 w-full rounded-pill bg-inverse px-6 font-bold text-paper transition-[transform,background-color] duration-150 ease-standard hover:bg-ink-700 active:scale-[.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-000"
        >
          로그인
        </button>
      </div>
    </main>
  )
}
