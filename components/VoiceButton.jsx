'use client'

// 음성 버튼. 최소 120px — S-06 인터뷰에서 쓴다
// recording 이면 노랑 링이 펄스로 퍼진다

export function VoiceButton({ recording = false, label, className = '', ...rest }) {
  return (
    <div className={'flex flex-col items-center gap-3 ' + className}>
      <div className="relative">
        {recording ? (
          <span
            className="absolute inset-0 rounded-pill bg-yellow-400 animate-orb-pulse"
            aria-hidden
          />
        ) : null}
        <button
          className="relative flex size-[120px] items-center justify-center rounded-pill bg-inverse text-paper shadow-block-lg transition-transform active:scale-[0.97]"
          aria-label={recording ? '녹음 멈추기' : '녹음 시작'}
          {...rest}
        >
          <MicIcon />
        </button>
      </div>
      {label ? <span className="text-body-sm text-ink-500">{label}</span> : null}
    </div>
  )
}

function MicIcon() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}
