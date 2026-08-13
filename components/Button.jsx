'use client'

// 기본 버튼. 터치 타깃 최소 44px (장갑 낀 한 손 조작 전제)
// 비활성일 때는 disabledReason 으로 사유를 함께 보여준다 — 사유 없는 비활성 버튼을 만들지 않는다
// variant: primary(다크 필 CTA) / accent(노랑 — 텍스트는 반드시 검정) / ghost(외곽선)

const VARIANTS = {
  primary: 'bg-inverse text-paper',
  accent: 'bg-yellow-500 text-ink-000',
  ghost: 'bg-paper text-ink-000 border border-hairline',
}

export function Button({
  variant = 'primary',
  disabled = false,
  disabledReason,
  className = '',
  children,
  ...rest
}) {
  return (
    <div className="inline-flex flex-col items-center gap-1">
      <button
        disabled={disabled}
        className={
          'inline-flex h-12 min-w-11 items-center justify-center rounded-pill px-5 text-body-sm font-bold transition-transform active:scale-[0.97] disabled:active:scale-100 ' +
          (disabled ? 'bg-ink-050 text-ink-300' : VARIANTS[variant] || VARIANTS.primary) +
          ' ' +
          className
        }
        {...rest}
      >
        {children}
      </button>
      {disabled && disabledReason ? (
        <span className="text-caption text-ink-500">{disabledReason}</span>
      ) : null}
    </div>
  )
}
