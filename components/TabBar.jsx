'use client'

// 하단 탭바 (해소 #6). 홈 / 암묵지 / 주변 / 마이 4탭, 높이 52px
// 여정 깔때기 화면(S-01·S-02·S-09)과 인터뷰(S-06)에서는 숨긴다
// 관리자 링크는 노출하지 않는다 (해소 #13)

import { usePathname, useRouter } from 'next/navigation'

const TABS = [
  { href: '/home', label: '홈' },
  { href: '/cards', label: '암묵지' },
  { href: '/nearby', label: '주변' },
  { href: '/my', label: '마이' },
]

function matches(pathname, href) {
  return pathname === href || pathname.startsWith(href + '/')
}

export function TabBar() {
  const pathname = usePathname()
  const router = useRouter()

  const visible = TABS.some((tab) => matches(pathname, tab.href))
  if (!visible) return null

  return (
    <>
      {/* 고정 탭바에 가려지지 않게 본문 끝에 같은 높이의 여백을 둔다 */}
      <div className="h-[52px]" aria-hidden />
      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex h-[52px] max-w-[390px] items-stretch border-t border-hairline bg-paper">
        {TABS.map((tab) => {
          const active = matches(pathname, tab.href)
          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className={
                'flex flex-1 items-center justify-center text-body-sm ' +
                (active ? 'bg-accent-soft font-bold text-ink-000' : 'text-ink-500')
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
