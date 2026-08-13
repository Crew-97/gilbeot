'use client'

// Mock 로그인 (해소 34) — 실제 로그인처럼 보이되 인증이 없는 시연용 화면
// 입력란에 시연 계정 값이 미리 채워져 있고, 검증 없이 driver_001 김영수로 진입한다 (해소 32)
// 입력값은 저장, 전송하지 않는다. 실제 인증 로직을 만들지 않는다

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/components/StoreProvider'
import { signIn } from '@/lib/store'
import { ErrorState } from '@/components/ErrorState'
import { Header } from '@/components/Header'

// 시연 계정 표시용 값. 어떤 값을 입력해도 동작은 같다
const DEMO_ID = '010-1234-5678'
const DEMO_PASSWORD = 'gilbeot-demo'
const DEMO_DRIVER_ID = 'driver_001'

export default function LoginPage() {
  const router = useRouter()
  const { state, setState } = useStore()
  const [loginId, setLoginId] = useState(DEMO_ID)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [failReason, setFailReason] = useState(null)

  if (!Array.isArray(state.drivers) || state.drivers.length === 0) {
    return <ErrorState onRetry={() => window.location.reload()} />
  }

  const handleLogin = (event) => {
    event.preventDefault()
    const r = signIn(state, DEMO_DRIVER_ID)
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
        <h1 id="login-title" className="text-title-3 font-bold tracking-tight text-ink-000">
          휴대폰 번호로 로그인하세요
        </h1>
        <p className="mt-2 text-caption text-ink-500">
          시연 계정이 미리 입력돼 있어요. 실서비스에서는 트럭커 계정으로 로그인해요.
        </p>
      </section>

      <form className="flex flex-col gap-4" onSubmit={handleLogin}>
        <label className="flex flex-col gap-2">
          <span className="text-label font-bold text-ink-700">휴대폰 번호</span>
          <input
            type="tel"
            autoComplete="off"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            className="min-h-12 rounded-md border border-hairline bg-paper px-3.5 text-body text-ink-000 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-000"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-label font-bold text-ink-700">비밀번호</span>
          <input
            type="password"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-12 rounded-md border border-hairline bg-paper px-3.5 text-body text-ink-000 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-000"
          />
        </label>

        {failReason ? (
          <p role="alert" className="text-center text-caption text-danger">
            {failReason}
          </p>
        ) : null}

        <div className="mt-auto pt-6">
          <button
            type="submit"
            className="min-h-12 w-full rounded-pill bg-inverse px-6 font-bold text-paper transition-[transform,background-color] duration-150 ease-standard hover:bg-ink-700 active:scale-[.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-000"
          >
            로그인
          </button>
        </div>
      </form>
    </main>
  )
}
