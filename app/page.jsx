'use client'

// 랜딩 (해소 34) — 서비스 한 줄 소개와 시작하기, 하단 관리자 링크
// 관리자 링크는 반드시 next/link 다. 전체 리로드가 일어나면 시연 상태가 초기화된다

import Link from 'next/link'
import { useRouter } from 'next/navigation'

function BrandWordmark() {
  return (
    <div className="inline-flex h-12 items-center rounded-pill bg-yellow-500 px-5 text-title-3 font-bold tracking-tight text-ink-000">
      길벗
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col px-4 pb-8 pt-6 font-sans">
      <header>
        <BrandWordmark />
      </header>

      <section className="mt-14 animate-card-in" aria-labelledby="landing-title">
        <h1
          id="landing-title"
          className="break-keep text-title-1 font-bold tracking-tight text-ink-000"
        >
          먼저 가본 기사의 경험을
          <br />
          함께 가져가세요
        </h1>
        <p className="mt-4 break-keep text-body text-ink-500">
          길벗은 화물기사의 현장 경험을 AI 인터뷰로 모아 다음 기사에게 이어 주는 서비스예요.
        </p>

        <ul className="mt-8 flex flex-col gap-3 text-body-sm text-ink-700">
          <li className="rounded-lg border border-hairline bg-paper p-3.5 shadow-block">
            도착지에 쌓인 암묵지를 운행 전에 확인해요.
          </li>
          <li className="rounded-lg border border-hairline bg-paper p-3.5 shadow-block">
            운행을 마치면 AI가 내 경험을 지식 카드로 정리해요.
          </li>
          <li className="rounded-lg border border-hairline bg-paper p-3.5 shadow-block">
            기여하면 포인트를 받고, 다른 기사의 경험을 열 수 있어요.
          </li>
        </ul>
      </section>

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="min-h-12 w-full rounded-pill bg-inverse px-6 font-bold text-paper transition-[transform,background-color] duration-150 ease-standard hover:bg-ink-700 active:scale-[.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-000"
        >
          시작하기
        </button>

        <div className="mt-4 text-center">
          <Link
            href="/admin"
            className="text-caption text-ink-300 underline underline-offset-2"
          >
            관리자
          </Link>
        </div>
      </div>
    </main>
  )
}
