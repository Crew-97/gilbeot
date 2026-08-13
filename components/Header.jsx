'use client'

// 공통 헤더. onBack 이 없으면 뒤로가기 버튼을 숨긴다 (탭 화면 등)
// right 에는 포인트 잔액 같은 화면별 요소를 넣는다
export function Header({ title, onBack, right }) {
  return (
    <header className="sticky top-0 z-10 -mx-4 flex min-h-14 items-center gap-1 border-b border-hairline bg-paper px-2">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-000"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 5L8 12l7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : (
        <span className="w-2" aria-hidden="true" />
      )}
      <h1 className="min-w-0 flex-1 truncate text-body font-bold text-ink-000">{title}</h1>
      {right ? <div className="shrink-0 pr-2">{right}</div> : null}
    </header>
  )
}
