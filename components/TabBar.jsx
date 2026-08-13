'use client'

// 하단 탭바 (해소 #6). 홈 / 노하우 / 주변 / 마이 4탭
// 여정 깔때기 화면과 인터뷰, 관리자 화면에서는 숨긴다
// 주변 탭은 운행 중에만 열고 잠긴 상태에서도 안내를 누를 수 있게 한다

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStore } from '@/components/StoreProvider'
import { getCurrentDispatch } from '@/lib/store'

const TABS = [
  { href: '/home', label: '홈', icon: 'home' },
  { href: '/cards', label: '노하우', icon: 'cards' },
  { href: '/nearby', label: '주변', icon: 'nearby', drivingOnly: true },
  { href: '/my', label: '마이', icon: 'my' },
]

const NOTICE_MS = 2600

function matches(pathname, href) {
  return pathname === href || pathname.startsWith(href + '/')
}

function TabIcon({ name }) {
  const common = {
    width: 23,
    height: 23,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (name === 'home') {
    return (
      <svg {...common}>
        <path d="M3.75 10.2 12 3.75l8.25 6.45" />
        <path d="M5.75 9.1v10.15h12.5V9.1" />
        <path d="M9.25 19.25v-5.5h5.5v5.5" />
      </svg>
    )
  }

  if (name === 'cards') {
    return (
      <svg {...common}>
        <rect x="5.25" y="4" width="13.5" height="16" rx="2.25" />
        <path d="M8.5 8h7M8.5 12h7M8.5 16h4.25" />
        <path d="M3 7.25v9.5" />
      </svg>
    )
  }

  if (name === 'nearby') {
    return (
      <svg {...common}>
        <path d="M12 21s6.25-5.48 6.25-11.25a6.25 6.25 0 1 0-12.5 0C5.75 15.52 12 21 12 21Z" />
        <circle cx="12" cy="9.75" r="2.15" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.75 20c.45-4.1 2.55-6.15 6.25-6.15S17.8 15.9 18.25 20" />
    </svg>
  )
}

export function TabBar() {
  const pathname = usePathname()
  const store = useStore()
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), NOTICE_MS)
    return () => clearTimeout(timer)
  }, [notice])

  const activeIndex = TABS.findIndex((tab) => matches(pathname, tab.href))
  if (activeIndex < 0) return null

  const dispatch = store?.state ? getCurrentDispatch(store.state) : null
  const driving = Boolean(dispatch?.startedAt && !dispatch?.endedAt)
  const glowLeft = `${((activeIndex + 0.5) / TABS.length) * 100}%`

  return (
    <>
      <div className="floating-tab-bar-spacer" aria-hidden />

      {notice ? (
        <div role="status" className="floating-tab-notice">
          <p>{notice}</p>
        </div>
      ) : null}

      <nav className="floating-tab-bar" aria-label="주요 메뉴">
        <span
          className="floating-tab-bar__glow"
          style={{ left: glowLeft }}
          aria-hidden
        />

        {TABS.map((tab) => {
          const active = matches(pathname, tab.href)
          const locked = Boolean(tab.drivingOnly) && !driving
          const className =
            'floating-tab-bar__tab ' +
            (active
              ? 'floating-tab-bar__tab--active'
              : locked
                ? 'floating-tab-bar__tab--locked'
                : '')
          const content = (
            <>
              <TabIcon name={tab.icon} />
              <span>{tab.label}</span>
            </>
          )

          if (locked) {
            return (
              <button
                key={tab.href}
                type="button"
                onClick={() => setNotice('운행을 시작하면 주변 노하우를 볼 수 있어요')}
                aria-current={active ? 'page' : undefined}
                aria-disabled="true"
                className={className}
              >
                {content}
              </button>
            )
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={className}
            >
              {content}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
