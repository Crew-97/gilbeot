'use client'

// 하단 탭바 (해소 #6). 홈 / 노하우 / 주변 / 마이 4탭, 높이 52px
// 여정 깔때기 화면(S-01·S-02·S-09)과 인터뷰(S-06)에서는 숨긴다
// 관리자 링크는 노출하지 않는다 (해소 #13)
//
// 라벨은 해소 #36 으로 "암묵지" → "노하우" 로 바꿨다. 화면 표기만이고
// 경로(/cards)와 store 함수명은 그대로다
//
// 주변 탭은 운행 중에만 연다 (2026-08-13 팀장 확정). 운행 중 현재 위치 기반
// 조회 화면이라 운행 전에는 보여 줄 기준점이 없기 때문이다 (기획서 8-6)

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useStore } from '@/components/StoreProvider'
import { getCurrentDispatch } from '@/lib/store'

const TABS = [
  { href: '/home', label: '홈' },
  { href: '/cards', label: '노하우' },
  { href: '/nearby', label: '주변', drivingOnly: true },
  { href: '/my', label: '마이' },
]

// 잠긴 탭을 눌렀을 때 띄우는 안내가 사라지는 시간
const NOTICE_MS = 2600

function matches(pathname, href) {
  return pathname === href || pathname.startsWith(href + '/')
}

export function TabBar() {
  const pathname = usePathname()
  const router = useRouter()
  const store = useStore()
  const [notice, setNotice] = useState('')

  // 훅은 조기 반환보다 위에 둔다
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), NOTICE_MS)
    return () => clearTimeout(timer)
  }, [notice])

  const visible = TABS.some((tab) => matches(pathname, tab.href))
  if (!visible) return null

  // 운행 중 판정은 두 시각으로만 한다. 상태값을 따로 저장하지 않는다
  const dispatch = store?.state ? getCurrentDispatch(store.state) : null
  const driving = Boolean(dispatch?.startedAt && !dispatch?.endedAt)

  function handleTab(tab, locked) {
    if (locked) {
      setNotice('운행을 시작하면 주변 노하우를 볼 수 있어요')
      return
    }
    router.push(tab.href)
  }

  return (
    <>
      {/* 고정 탭바에 가려지지 않게 본문 끝에 같은 높이의 여백을 둔다 */}
      <div className="h-[52px]" aria-hidden />

      {notice ? (
        <div
          role="status"
          className="fixed inset-x-0 bottom-[60px] z-10 mx-auto flex max-w-[390px] justify-center px-4"
        >
          <p className="rounded-pill bg-inverse px-4 py-2 text-center text-body-sm text-paper shadow-block">
            {notice}
          </p>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex h-[52px] max-w-[390px] items-stretch border-t border-hairline bg-paper">
        {TABS.map((tab) => {
          const active = matches(pathname, tab.href)
          const locked = Boolean(tab.drivingOnly) && !driving

          // disabled 를 쓰면 클릭이 오지 않아 안내를 띄울 수 없다.
          // 그래서 aria-disabled 로 알리고 이동만 막는다
          return (
            <button
              key={tab.href}
              onClick={() => handleTab(tab, locked)}
              aria-disabled={locked}
              className={
                'flex flex-1 items-center justify-center text-body-sm ' +
                (locked
                  ? 'text-ink-300'
                  : active
                    ? 'bg-accent-soft font-bold text-ink-000'
                    : 'text-ink-500')
              }
            >
              {tab.label}
            </button>
          )
        })}
      </nav>
    </>
  )
}
