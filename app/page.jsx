'use client'

// 랜딩 — 팀 제작 gilbeot-landing.html 을 프로젝트 스택으로 이식 (해소 34·35·36 반영)
// CDN 의존 없음. 아이콘은 인라인 SVG 와 허용 이모지(🔒 👍 👎)만 쓴다
// 관리자 진입은 푸터의 next/link 만 사용한다. a 태그는 전체 리로드로 시연 상태가 초기화된다

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import './landing.css'

const NAV_LINKS = [
  { href: '#how', label: '동작 방식' },
  { href: '#principle', label: '비환각 원칙' },
  { href: '#features', label: '기능' },
  { href: '#points', label: '포인트' },
  { href: '#voices', label: '현장의 목소리' },
]

const MARQUEE_QUESTIONS = [
  '어느 출입구로 들어가야 하나요',
  '대형차 대기는 어디서 하나요',
  '몇 시에 상하차 대기가 긴가요',
  '센터 안에 주유소가 있나요',
  '화물차 세울 식당이 있나요',
  '쉬기 편한 휴게소는 어디인가요',
]

const CATEGORY_TILES = [
  { name: '센터팁', desc: '출입구 · 대기 위치 · 상하차 시간대' },
  { name: '주유소', desc: '대형차 진입 · 주유하기 좋은 시점' },
  { name: '식당', desc: '화물차 주차 가능 여부 · 시간대별 특징' },
  { name: '휴게소 · 쉼터', desc: '화물차 주차 · 휴식 편의' },
]

const POINT_RULES = [
  { label: '최초 가입', amount: '+100P', earn: true },
  { label: '유효한 노하우 기여 완료', amount: '+100P', earn: true },
  { label: '추가 음성 기여 보너스', detail: '인터뷰 1회당 최대 +50P', amount: '+10P/건', earn: true },
  { label: '지식 카드 1건 해금', detail: '재열람 무료', amount: '-10P', earn: false },
]

const POINT_LEDGER = [
  { label: '가입 환영', amount: '+100P', earn: true },
  { label: '지식 카드 해금 · 양산센터 팁', amount: '-10P', earn: false },
  { label: '지식 카드 해금 · B기사식당', amount: '-10P', earn: false },
  { label: '유효한 노하우 기여', amount: '+100P', earn: true },
  { label: '추가 음성 기여 보너스', amount: '+10P', earn: true },
]

const VOICES = [
  { cat: '센터팁', quote: '“이 센터는 정문보다 후문 진입이 편해요.”', name: '박철수 기사', career: '경력 15년', initial: '박', likes: 82, i: 0 },
  { cat: '주유소', quote: '“센터 안에는 주유소가 없어서 들어가기 전에 넣는 게 좋아요.”', reason: '이유 · 센터 내부에 주유소가 없음', name: '최병호 기사', career: '경력 11년', initial: '최', likes: 43, i: 1 },
  { cat: '식당', quote: '“근처 기사식당 중 이곳은 11톤 트럭도 주차할 수 있어요.”', reason: '이유 · 식당 앞에 대형차 공간이 있음', name: '한상국 기사', career: '경력 8년', initial: '한', likes: 37, i: 2 },
  { cat: '센터팁', quote: '“오후 2시 이후에는 상하차 대기가 길어요.”', name: '오영식 기사', career: '경력 21년', initial: '오', likes: 28, i: 1 },
  { cat: '휴게소 · 쉼터', quote: '“이 휴게소는 화물차 주차 공간이 넓어요.”', name: '서동만 기사', career: '경력 6년', initial: '서', likes: 19, i: 2 },
  { cat: '주유소', quote: '“밤 10시 이후에도 이용할 수 있어요.”', name: '김영수 기사', career: '경력 3년', initial: '김', likes: 43, i: 3 },
]

// 인라인 SVG 아이콘 — CDN 없이 필요한 8종만 유지한다
const ICON_PATHS = {
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  mapPin: (
    <>
      <path d="M12 21s-7-5.1-7-11a7 7 0 0 1 14 0c0 5.9-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.2l2.3 2.3 4.7-4.8" />
    </>
  ),
  minusCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12h7" />
    </>
  ),
  questionCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9.6a2.2 2.2 0 1 1 3.2 2c-.7.4-1 .8-1 1.6M12 16.4h.01" />
    </>
  ),
}

function Icon({ name, size = 16, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {ICON_PATHS[name]}
    </svg>
  )
}

function PointCoin({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={
        'inline-flex shrink-0 items-center justify-center rounded-full bg-yellow-500 font-bold text-ink-900 ' +
        className
      }
    >
      P
    </span>
  )
}

function Brand({ dark = false }) {
  return (
    <span className="flex items-center gap-2.5">
      <Image src="/logo.png" alt="길벗 로고" width={36} height={36} priority />
      <span className="leading-none">
        <span className={'block text-[17px] font-extrabold tracking-tight ' + (dark ? 'text-paper' : 'text-inverse')}>
          길벗
        </span>
        <span className={'mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.22em] ' + (dark ? 'text-paper/60' : 'text-ink-500')}>
          Gilbeot
        </span>
      </span>
    </span>
  )
}

function MobileMenu({ onClose }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true))
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(id)
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="메뉴"
      className={
        'fixed inset-0 z-50 flex flex-col justify-center bg-page/90 px-8 backdrop-blur-3xl ' +
        (open ? 'menu-open' : '')
      }
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="메뉴 닫기"
        className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-black/5 text-ink-700 transition-all duration-500 ease-spring hover:scale-[1.05] hover:bg-black/10 active:scale-[0.95]"
      >
        <Icon name="close" size={24} />
      </button>
      <nav className="flex flex-col gap-2 text-3xl font-bold tracking-tight text-inverse">
        {NAV_LINKS.map((link, index) => (
          <a
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="menu-item py-3"
            style={{ transitionDelay: `${60 * (index + 1)}ms` }}
          >
            {link.label}
          </a>
        ))}
      </nav>
      <div className="menu-item mt-10" style={{ transitionDelay: '360ms' }}>
        <Link
          href="/login"
          onClick={onClose}
          className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-inverse py-2.5 pl-8 pr-2.5 text-lg font-semibold text-page transition-all duration-500 ease-spring hover:scale-[1.02] active:scale-[0.98]"
        >
          지금 시작하기
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 text-ink-900 transition-all duration-500 ease-spring group-hover:translate-x-1">
            <Icon name="arrowRight" size={20} />
          </span>
        </Link>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  // 스크롤 진입 애니메이션. JS 미동작 시 콘텐츠를 숨기지 않도록 js 클래스로 게이트한다
  useEffect(() => {
    document.documentElement.classList.add('js')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="landing bg-page font-sans text-inverse antialiased">
      {/* 내비게이션 — 플로팅 필 */}
      <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <nav className="flex items-center gap-1 rounded-full bg-page/75 py-2 pl-3 pr-2 shadow-block ring-1 ring-hairline backdrop-blur-xl">
          <a href="#top" className="pr-3">
            <Brand />
          </a>
          <div className="hidden items-center gap-1 text-[14px] font-medium text-ink-500 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-3.5 py-2 transition-all duration-500 ease-spring hover:bg-black/5 hover:text-inverse"
              >
                {link.label}
              </a>
            ))}
          </div>
          <Link
            href="/login"
            className="group ml-2 hidden items-center gap-2 rounded-full bg-inverse py-1.5 pl-5 pr-1.5 text-[14px] font-semibold text-page transition-all duration-500 ease-spring hover:scale-[1.02] active:scale-[0.98] md:inline-flex"
          >
            시작하기
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-paper/15 transition-all duration-500 ease-spring group-hover:translate-x-0.5">
              <Icon name="arrowRight" />
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="메뉴 열기"
            aria-expanded={menuOpen}
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink-700 transition-all duration-500 ease-spring hover:bg-black/5 md:hidden"
          >
            <Icon name="menu" size={22} />
          </button>
        </nav>
      </header>

      {menuOpen ? <MobileMenu onClose={() => setMenuOpen(false)} /> : null}

      {/* 히어로 — 에디토리얼 스플릿 */}
      <section id="top" className="relative flex min-h-[100dvh] items-center overflow-hidden">
        <div aria-hidden="true" className="orb -left-32 -top-40 h-[480px] w-[480px] bg-yellow-200/80" />
        <div aria-hidden="true" className="orb right-[-120px] top-1/3 h-[380px] w-[380px] bg-accent-soft" style={{ animationDelay: '-3s' }} />
        <div aria-hidden="true" className="orb bottom-[-80px] left-1/3 h-[300px] w-[300px] bg-paper-dim" style={{ animationDelay: '-1.5s' }} />

        <div className="relative mx-auto w-full max-w-7xl px-4 pb-20 pt-32 sm:px-6 md:pb-24 md:pt-36 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-7">
              <span className="eyebrow reveal" style={{ '--i': 0 }}>
                <Icon name="mapPin" size={13} />
                화물기사 현장 지식 공유 서비스
              </span>
              <h1 className="reveal mt-6 text-5xl font-extrabold leading-tight tracking-tight text-inverse md:text-6xl lg:text-7xl" style={{ '--i': 1 }}>
                먼저 간 사람의
                <br />
                <span className="relative inline-block">
                  <span className="relative z-10">발자국</span>
                  <span aria-hidden="true" className="absolute bottom-[8%] left-[-2%] right-[-2%] h-[34%] rounded-md bg-yellow-500" />
                </span>
                을 따라갑니다
              </h1>
              <p className="reveal mt-7 max-w-[46ch] text-base leading-relaxed text-ink-500 md:text-lg" style={{ '--i': 2 }}>
                목적지까지 가는 길은 내비게이션이 알려줍니다. 도착한 다음 어디로 들어가고, 어디서
                기다리고, 어디서 쉬어야 하는지는 먼저 가본 기사가 알고 있어요. 길벗은 그 경험을 AI
                음성 인터뷰로 모아 지식 카드로 연결해요.
              </p>
              <div className="reveal mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center" style={{ '--i': 3 }}>
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-3 rounded-full bg-inverse py-2.5 pl-8 pr-2 text-lg font-semibold text-page shadow-lift transition-all duration-500 ease-spring hover:scale-[1.02] active:scale-[0.98]"
                >
                  지금 시작하기
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 text-ink-900 transition-all duration-500 ease-spring group-hover:translate-x-1">
                    <Icon name="arrowRight" size={18} />
                  </span>
                </Link>
                <a
                  href="#how"
                  className="inline-flex items-center gap-2 rounded-full bg-paper/60 px-8 py-4 text-lg font-semibold text-ink-700 ring-1 ring-hairline transition-all duration-500 ease-spring hover:scale-[1.02] hover:bg-paper active:scale-[0.98]"
                >
                  동작 방식 보기
                </a>
              </div>
              <div className="reveal mt-10 flex items-center gap-5 text-[13px] text-ink-500" style={{ '--i': 4 }}>
                <span className="flex items-center gap-1.5">
                  <PointCoin className="h-4 w-4 text-[10px]" />
                  가입하면 <strong className="font-bold text-inverse">100P</strong>를 드려요
                </span>
                <span aria-hidden="true" className="h-3.5 w-px bg-hairline" />
                <span>
                  지식 카드 1건 해금 <strong className="font-bold text-inverse">10P</strong>
                </span>
                <span aria-hidden="true" className="hidden h-3.5 w-px bg-hairline sm:block" />
                <span className="hidden sm:block">재열람 무료</span>
              </div>
            </div>

            {/* 지식 카드 스택 목업 */}
            <div className="lg:col-span-5">
              <div className="relative flex flex-col gap-5 md:block md:h-[560px]">
                {/* 잠긴 카드 — 해소 33: 제목 없이 🔒·카테고리·장소·평가 수·작성일만 */}
                <div className="reveal bezel transition-all duration-500 ease-spring hover:-translate-y-1 md:absolute md:left-0 md:top-24 md:w-[290px] md:-rotate-3" style={{ '--i': 3 }}>
                  <div className="bezel-inner p-6">
                    <div className="flex items-center justify-between">
                      <span className="chip">센터팁</span>
                      <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-sunken text-[15px]">
                        🔒
                      </span>
                    </div>
                    <p className="mt-4 text-[13px] font-semibold text-ink-500">양산센터</p>
                    <div className="mt-3 space-y-2" aria-hidden="true">
                      <div className="h-2.5 w-full rounded-full bg-ink-050" />
                      <div className="h-2.5 w-4/5 rounded-full bg-ink-050" />
                      <div className="h-2.5 w-3/5 rounded-full bg-ink-050" />
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-[12px] text-ink-500">
                      <span>👍 12</span>
                      <span>👎 1</span>
                      <span>작성 2026.08.10</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push('/login')}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-inverse py-3 text-[14px] font-semibold text-page transition-all duration-500 ease-spring hover:scale-[1.02] active:scale-[0.98]"
                    >
                      10P로 열기
                    </button>
                  </div>
                </div>

                {/* 열린 지식 카드 */}
                <div className="reveal bezel shadow-lift transition-all duration-500 ease-spring hover:-translate-y-1 md:absolute md:right-0 md:top-0 md:z-10 md:w-[330px] md:rotate-2" style={{ '--i': 4 }}>
                  <div className="bezel-inner p-6">
                    <div className="flex items-center justify-between">
                      <span className="chip">주유소</span>
                      <span className="text-[12px] text-ink-500">작성 2026.08.12</span>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-[13px] font-semibold text-ink-500">
                      <Icon name="mapPin" size={15} />
                      A주유소 · 양산센터 인근
                    </div>
                    <p className="mt-2 text-[19px] font-bold leading-snug text-inverse">진입 전에 주유하고 들어가요</p>
                    <p className="mt-2 text-[14px] leading-relaxed text-ink-500">
                      센터 안에는 주유소가 없어요. 밖에서 넣고 가는 게 편해요.
                    </p>
                    <div className="mt-5 flex items-center justify-between border-t border-line-soft pt-4">
                      <div className="flex items-center gap-3 text-[13px] font-semibold text-ink-700">
                        <span>👍 82</span>
                        <span className="text-ink-500">👎 3</span>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-ink-700">
                        기사 4명 교차 확인
                      </span>
                    </div>
                  </div>
                </div>

                {/* 인터뷰 말풍선 */}
                <div className="reveal md:absolute md:bottom-6 md:left-4 md:z-20 md:w-[320px]" style={{ '--i': 5 }}>
                  <div className="rounded-[1.5rem] rounded-bl-md bg-inverse p-5 text-page shadow-overlay">
                    <div className="flex items-start gap-3">
                      <span className="pulse-ring relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-ink-900">
                        <Icon name="mic" size={20} />
                      </span>
                      <div>
                        <p className="text-[14px] font-medium leading-snug">
                          A주유소에 자주 방문하셨네요.
                          <br />
                          자주 이용하는 이유가 있나요?
                        </p>
                        <p className="mt-1.5 text-[11px] text-paper/50">운행 종료 후에만 물어봐요</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 포인트 플로팅 칩 */}
                <div className="reveal hidden items-center gap-2 rounded-full bg-paper px-4 py-2.5 shadow-block ring-1 ring-hairline md:absolute md:-top-6 md:left-10 md:flex" style={{ '--i': 6 }}>
                  <PointCoin className="h-7 w-7 text-[13px]" />
                  <span className="text-[13px] font-semibold text-ink-700">
                    가입 환영 <span className="font-bold text-inverse">+100P</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 문제 — 질문 마퀴 */}
      <section className="relative overflow-hidden border-y border-hairline bg-paper-dim py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <span className="eyebrow reveal">내비게이션이 멈추는 곳</span>
          <h2 className="reveal mt-5 text-3xl font-extrabold leading-snug tracking-tight text-inverse md:text-5xl" style={{ '--i': 1 }}>
            도착하고 나면, 질문이 시작돼요
          </h2>
        </div>
        <div className="relative mt-12">
          <div aria-hidden="true" className="absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-paper-dim to-transparent" />
          <div aria-hidden="true" className="absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-paper-dim to-transparent" />
          <div className="marquee-track">
            {[false, true].map((clone) =>
              MARQUEE_QUESTIONS.map((question) => (
                <span
                  key={`${clone}-${question}`}
                  aria-hidden={clone || undefined}
                  className="whitespace-nowrap rounded-full bg-paper px-6 py-3.5 text-[15px] font-medium text-ink-700 ring-1 ring-hairline"
                >
                  {question}
                </span>
              ))
            )}
          </div>
        </div>
        <p className="reveal mt-12 px-4 text-center text-lg font-semibold text-ink-700 md:text-xl" style={{ '--i': 2 }}>
          이 답을 이미 알고 있는 사람이 있어요.{' '}
          <span className="relative inline-block">
            <span className="relative z-10">먼저 가본 기사</span>
            <span aria-hidden="true" className="absolute bottom-[6%] left-0 right-0 h-[32%] rounded-sm bg-yellow-400/70" />
          </span>
          예요.
        </p>
      </section>

      {/* 동작 방식 — 지그재그 스텝 */}
      <section id="how" className="relative py-24 md:py-32 lg:py-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="eyebrow reveal">동작 방식</span>
            <h2 className="reveal mt-5 text-3xl font-extrabold leading-snug tracking-tight text-inverse md:text-5xl" style={{ '--i': 1 }}>
              글을 쓰라고 하지 않아요.
              <br />
              운행이 끝난 뒤에 물어봐요
            </h2>
            <p className="reveal mt-5 text-base leading-relaxed text-ink-500 md:text-lg" style={{ '--i': 2 }}>
              위치 데이터는 도착지 주변에서 어떤 장소를 이용했는지 확인하는 데만 써요. 경로를
              분석하거나 길을 추천하지 않아요.
            </p>
          </div>

          <div className="mt-20 space-y-20 md:space-y-28">
            {/* STEP 1 */}
            <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12">
              <div className="reveal md:col-span-5">
                <span className="text-[13px] font-bold tracking-[0.2em] text-ink-500">STEP 01</span>
                <h3 className="mt-3 text-2xl font-bold leading-snug tracking-tight text-inverse md:text-3xl">
                  운행 중에는 감지만 해요
                </h3>
                <p className="mt-4 max-w-[42ch] text-base leading-relaxed text-ink-500">
                  도착지 주변의 화물센터·주유소·식당·휴게소 방문과 정차를 확인하고 인터뷰 후보로만
                  저장해요. 운행 중에는 절대 묻지 않아요.
                </p>
              </div>
              <div className="reveal md:col-span-6 md:col-start-7" style={{ '--i': 1 }}>
                <div className="bezel">
                  <div className="bezel-inner p-6">
                    <div className="flex items-center gap-2 text-[12px] font-semibold text-ink-500">
                      <span className="h-2 w-2 rounded-full bg-success" />
                      운행 중 · 장소만 식별해요
                    </div>
                    <div className="mt-4 space-y-3 text-[14px]">
                      <div className="flex items-center gap-3 rounded-2xl bg-page px-4 py-3 ring-1 ring-line-soft">
                        <span className="text-ink-700">양산센터 도착</span>
                        <span className="ml-auto text-[12px] text-ink-500">14:02</span>
                      </div>
                      <div className="flex items-center gap-3 rounded-2xl bg-page px-4 py-3 ring-1 ring-line-soft">
                        <span className="text-ink-700">A주유소 정차 · 반복 방문</span>
                        <span className="ml-auto text-[12px] text-ink-500">15:40</span>
                      </div>
                      <div className="flex items-center gap-3 rounded-2xl bg-accent-soft px-4 py-3 font-semibold text-ink-700 ring-1 ring-yellow-200">
                        인터뷰 후보 저장 · 아직 질문하지 않음
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push('/login')}
                      className="mt-5 w-full rounded-full bg-inverse py-4 text-[15px] font-semibold text-page transition-all duration-500 ease-spring hover:scale-[1.01] active:scale-[0.98]"
                    >
                      운행 종료
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2 */}
            <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12">
              <div className="reveal md:order-2 md:col-span-5 md:col-start-8">
                <span className="text-[13px] font-bold tracking-[0.2em] text-ink-500">STEP 02</span>
                <h3 className="mt-3 text-2xl font-bold leading-snug tracking-tight text-inverse md:text-3xl">
                  AI가 장소에 맞게 물어봐요
                </h3>
                <p className="mt-4 max-w-[42ch] text-base leading-relaxed text-ink-500">
                  운행 종료 버튼을 누르면, 저장된 장소 후보를 바탕으로 질문이 만들어져요. 음성으로
                  편하게 답하면 바로 텍스트로 바뀌어요.
                </p>
              </div>
              <div className="reveal md:order-1 md:col-span-6" style={{ '--i': 1 }}>
                <div className="bezel">
                  <div className="bezel-inner p-6">
                    <div className="flex items-start gap-3">
                      <Image src="/logo.png" alt="" width={36} height={36} className="shrink-0" />
                      <div className="rounded-2xl rounded-tl-md bg-page px-4 py-3 text-[14px] leading-snug text-ink-700 ring-1 ring-line-soft">
                        A주유소에 자주 방문하셨네요.
                        <br />
                        자주 이용하는 이유가 있나요?
                      </div>
                    </div>
                    <div className="mt-6 flex flex-col items-center">
                      <span
                        aria-hidden="true"
                        className="pulse-ring relative flex h-24 w-24 items-center justify-center rounded-full bg-inverse text-yellow-500 shadow-lift"
                      >
                        <Icon name="mic" size={36} />
                      </span>
                      <p className="mt-3 text-[12px] text-ink-500">버튼을 누르고 말하세요</p>
                    </div>
                    <div className="mt-6 rounded-2xl bg-sunken px-4 py-3.5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-500">
                        음성 인식 결과
                      </div>
                      <p className="mt-2 text-[14px] leading-relaxed text-ink-700">
                        “센터 들어가기 전에 넣기 편해요. 안에는 주유소가 없거든요.”
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3 */}
            <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12">
              <div className="reveal md:col-span-5">
                <span className="text-[13px] font-bold tracking-[0.2em] text-ink-500">STEP 03</span>
                <h3 className="mt-3 text-2xl font-bold leading-snug tracking-tight text-inverse md:text-3xl">
                  말한 만큼만 카드가 돼요
                </h3>
                <p className="mt-4 max-w-[42ch] text-base leading-relaxed text-ink-500">
                  AI가 답변을 장소·핵심 정보·이유·카테고리로 구조화해요. 원문에 없는 내용은 채우지
                  않고, 물어볼 가치가 있으면 후속 질문을 만들어요.
                </p>
              </div>
              <div className="reveal md:col-span-6 md:col-start-7" style={{ '--i': 1 }}>
                <div className="bezel">
                  <div className="bezel-inner p-6">
                    <div className="grid grid-cols-2 gap-2.5 text-[13px]">
                      <div className="flex items-center gap-2 rounded-xl bg-page px-3 py-2.5 ring-1 ring-line-soft">
                        <Icon name="checkCircle" className="shrink-0 text-success" />
                        <span className="text-ink-700">
                          장소 <strong>A주유소</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 rounded-xl bg-page px-3 py-2.5 ring-1 ring-line-soft">
                        <Icon name="checkCircle" className="shrink-0 text-success" />
                        <span className="text-ink-700">
                          이유 <strong>센터 내 주유소 없음</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 rounded-xl bg-page px-3 py-2.5 text-ink-500 ring-1 ring-line-soft">
                        <Icon name="minusCircle" className="shrink-0" />
                        시간대 · 비워 둠
                      </div>
                      <div className="flex items-center gap-2 rounded-xl bg-page px-3 py-2.5 text-ink-500 ring-1 ring-line-soft">
                        <Icon name="questionCircle" className="shrink-0" />
                        차량 조건 · 후속 질문
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl bg-page p-4 ring-1 ring-line-soft">
                      <span className="chip">주유소</span>
                      <p className="mt-2.5 text-[16px] font-bold leading-snug text-inverse">
                        센터 진입 전에 주유하세요
                      </p>
                      <p className="mt-1 text-[13px] text-ink-500">센터 내부에 주유소가 없습니다.</p>
                    </div>
                    <div className="mt-4 flex items-start gap-2.5">
                      <Image src="/logo.png" alt="" width={28} height={28} className="shrink-0" />
                      <p className="rounded-2xl rounded-tl-md bg-accent-soft px-4 py-2.5 text-[13px] font-medium text-ink-700">
                        대형 화물차도 들어가기 편한가요?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 4 */}
            <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12">
              <div className="reveal md:order-2 md:col-span-5 md:col-start-8">
                <span className="text-[13px] font-bold tracking-[0.2em] text-ink-500">STEP 04</span>
                <h3 className="mt-3 text-2xl font-bold leading-snug tracking-tight text-inverse md:text-3xl">
                  확인하고 게시하면 포인트
                </h3>
                <p className="mt-4 max-w-[42ch] text-base leading-relaxed text-ink-500">
                  원본 음성 기록과 AI가 만든 카드를 나란히 확인한 뒤 직접 게시해요. 유효한 노하우
                  기여는 100P, 추가 음성 기여는 건당 10P를 더 드려요.
                </p>
              </div>
              <div className="reveal md:order-1 md:col-span-6" style={{ '--i': 1 }}>
                <div className="bezel">
                  <div className="bezel-inner p-6">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="rounded-2xl bg-sunken p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-500">원본 STT</p>
                        <p className="mt-2 text-[13px] leading-relaxed text-ink-700">
                          “센터 들어가기 전에 넣기 편해요. 안에는 주유소가 없거든요.”
                        </p>
                      </div>
                      <div className="rounded-2xl bg-page p-4 ring-1 ring-line-soft">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-500">지식 카드</p>
                        <p className="mt-2 text-[13px] font-bold leading-snug text-inverse">센터 진입 전에 주유하세요</p>
                        <p className="mt-1 text-[12px] text-ink-500">이유 · 센터 내부에 주유소 없음</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push('/login')}
                      className="mt-4 w-full rounded-full bg-inverse py-4 text-[15px] font-semibold text-page transition-all duration-500 ease-spring hover:scale-[1.01] active:scale-[0.98]"
                    >
                      이대로 게시할까요?
                    </button>
                    <div className="mt-4 flex items-center gap-3 rounded-2xl bg-accent-soft px-4 py-3.5 ring-1 ring-yellow-200">
                      <PointCoin className="h-9 w-9 text-[15px]" />
                      <div className="text-[13px] font-semibold text-ink-700">
                        유효한 노하우 기여 <span className="font-bold text-ink-900">+100P</span>
                      </div>
                      <span className="ml-auto text-[12px] text-ink-500">추가 기여 +10P/건 · 최대 +50P</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI 비환각 원칙 — 다크 비교 */}
      <section id="principle" className="relative overflow-hidden bg-inverse py-24 text-ink-050 md:py-32 lg:py-40">
        <div aria-hidden="true" className="orb -top-32 right-[-100px] h-[420px] w-[420px] bg-yellow-500/10" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="reveal inline-flex items-center gap-2 rounded-full bg-yellow-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-400 ring-1 ring-paper/10">
              AI 비환각 원칙
            </span>
            <h2 className="reveal mt-5 text-3xl font-extrabold leading-snug tracking-tight text-paper md:text-5xl" style={{ '--i': 1 }}>
              기사가 말하지 않은 것은
              <br />
              쓰지 않아요
            </h2>
            <p className="reveal mt-5 text-base leading-relaxed text-paper/60 md:text-lg" style={{ '--i': 2 }}>
              현장에서 그대로 쓰이는 정보라서, 그럴듯한 문장보다 정확한 사실이 먼저예요. 정보가
              부족하면 지어내지 않고 다시 묻거나 비워 둬요.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
            <div className="reveal lg:col-span-5">
              <div className="bezel-dark h-full">
                <div className="bezel-dark-inner flex h-full flex-col p-8">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-paper/50">기사의 말</span>
                  <p className="mt-6 text-3xl font-bold leading-snug text-paper md:text-4xl">
                    “거기 차 세우기는
                    <br />
                    괜찮아요.”
                  </p>
                  <div className="mt-auto flex items-center gap-2.5 pt-8">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paper/10 text-[13px] font-bold text-paper/70">
                      박
                    </span>
                    <span className="text-[13px] text-paper/50">박철수 기사 · 경력 15년</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 lg:col-span-7">
              <div className="reveal bezel-dark" style={{ '--i': 1 }}>
                <div className="rounded-[calc(2rem-0.375rem)] bg-danger/[0.07] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-danger/30">
                  <span className="inline-flex w-max items-center gap-1.5 rounded-full bg-danger/15 px-3 py-1 text-[11px] font-semibold text-red-300 ring-1 ring-danger/30">
                    이렇게 만들지 않아요
                  </span>
                  <div className="mt-4 md:flex md:items-start md:gap-8">
                    <p className="text-lg font-bold leading-snug text-paper/70 line-through decoration-danger/70 decoration-2 md:flex-1">
                      “11톤 트럭까지 여유롭게 주차할 수 있습니다.”
                    </p>
                    <p className="mt-3 text-[14px] leading-relaxed text-paper/50 md:mt-0 md:flex-1">
                      말하지 않은 차량 크기와 여유 공간을 지어내는 순간, 다음 기사의 현장이
                      위험해져요.
                    </p>
                  </div>
                  <div className="mt-5 text-[12px] text-red-300/80">근거 없는 구체화 금지</div>
                </div>
              </div>

              <div className="reveal bezel-dark" style={{ '--i': 2 }}>
                <div className="rounded-[calc(2rem-0.375rem)] bg-yellow-500/[0.08] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-yellow-500/30">
                  <span className="inline-flex w-max items-center gap-1.5 rounded-full bg-yellow-500/15 px-3 py-1 text-[11px] font-semibold text-yellow-400 ring-1 ring-yellow-500/30">
                    길벗은 이렇게 해요
                  </span>
                  <div className="mt-4 grid grid-cols-1 gap-2.5 text-[14px] md:grid-cols-3">
                    <div className="flex items-start gap-2.5 rounded-xl bg-paper/5 px-3.5 py-3 ring-1 ring-paper/10">
                      <Icon name="checkCircle" className="mt-0.5 shrink-0 text-yellow-400" />
                      <span className="text-paper/80">
                        주차 가능 여부
                        <br />
                        <strong className="text-paper">괜찮음</strong>
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5 rounded-xl bg-paper/5 px-3.5 py-3 ring-1 ring-paper/10">
                      <Icon name="minusCircle" className="mt-0.5 shrink-0 text-paper/50" />
                      <span className="text-paper/50">
                        차량 조건
                        <br />
                        비워 둠
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5 rounded-xl bg-paper/5 px-3.5 py-3 ring-1 ring-paper/10">
                      <Icon name="questionCircle" className="mt-0.5 shrink-0 text-yellow-400" />
                      <span className="text-paper/80">
                        후속 질문
                        <br />
                        “대형 화물차도 들어가기 편한가요?”
                      </span>
                    </div>
                  </div>
                  <p className="mt-5 text-[12px] text-paper/60">
                    관리자 화면에서는 원본 STT와 구조화 결과를 나란히 확인해요
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 — 벤토 그리드 */}
      <section id="features" className="relative py-24 md:py-32 lg:py-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="eyebrow reveal">기능</span>
            <h2 className="reveal mt-5 text-3xl font-extrabold leading-snug tracking-tight text-inverse md:text-5xl" style={{ '--i': 1 }}>
              도착지 주변, 네 곳의 경험을 모아요
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
            <div className="reveal md:col-span-7">
              <div className="bezel h-full">
                <div className="bezel-inner h-full p-7">
                  <h3 className="text-xl font-bold text-inverse">지식 카드 카테고리 4종</h3>
                  <p className="mt-1.5 text-[14px] text-ink-500">지식 카드 1개는 하나의 주장, 하나의 현장 팁이에요.</p>
                  <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {CATEGORY_TILES.map((tile) => (
                      <div key={tile.name} className="rounded-2xl bg-page p-4 ring-1 ring-line-soft transition-all duration-500 ease-spring hover:-translate-y-1">
                        <p className="text-[15px] font-bold text-inverse">{tile.name}</p>
                        <p className="mt-1 text-[12px] leading-snug text-ink-500">{tile.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="reveal md:col-span-5" style={{ '--i': 1 }}>
              <div className="bezel h-full">
                <div className="bezel-inner flex h-full flex-col p-7">
                  <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-[20px]">
                    🔒
                  </span>
                  <h3 className="mt-4 text-xl font-bold text-inverse">카드 단위로 해금해요</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-500">
                    필요한 카드만 10P로 열어요. 한번 해금한 카드는 다시 볼 때 무료예요.
                  </p>
                  <div className="mt-auto flex items-center gap-3 pt-6">
                    <span className="flex flex-1 items-center gap-2 rounded-2xl bg-sunken px-4 py-3 text-[13px] font-semibold text-ink-500">
                      🔒 잠긴 카드
                    </span>
                    <Icon name="arrowRight" size={18} className="text-ink-500" />
                    <span className="flex flex-1 items-center gap-2 rounded-2xl bg-accent-soft px-4 py-3 text-[13px] font-bold text-inverse ring-1 ring-yellow-200">
                      10P로 열람
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="reveal md:col-span-4">
              <div className="bezel h-full">
                <div className="bezel-inner flex h-full flex-col p-7">
                  <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-[20px]">
                    👍
                  </span>
                  <h3 className="mt-4 text-xl font-bold text-inverse">도움 평가</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-500">
                    해금해서 읽은 사용자만 평가할 수 있어요. 카드당 1회, 언제든 바꿀 수 있어요.
                  </p>
                  <div className="mt-auto flex gap-2.5 pt-6">
                    <span className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-page py-3 text-[13px] font-semibold text-ink-700 ring-1 ring-hairline">
                      👍 도움됐어요
                    </span>
                    <span className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-page py-3 text-[13px] font-semibold text-ink-500 ring-1 ring-hairline">
                      👎 도움 안 됐어요
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="reveal md:col-span-4" style={{ '--i': 1 }}>
              <div className="bezel h-full">
                <div className="bezel-inner flex h-full flex-col p-7">
                  <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft">
                    <Icon name="checkCircle" size={22} className="text-ink-700" />
                  </span>
                  <h3 className="mt-4 text-xl font-bold text-inverse">교차 검증</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-500">
                    표현이 달라도 같은 현장 사실이면 AI가 의미로 연결해요. 원본 경험은 그대로
                    보존해요.
                  </p>
                  <div className="mt-auto space-y-2 pt-6 text-[12px] text-ink-500">
                    <p className="rounded-xl bg-page px-3 py-2 ring-1 ring-line-soft">“안에 기름 넣을 곳이 없어요.”</p>
                    <p className="rounded-xl bg-page px-3 py-2 ring-1 ring-line-soft">“주유소가 없어서 밖에서 넣고 가요.”</p>
                    <p className="pt-1 text-center font-semibold text-ink-700">→ 같은 사실 · 기사 4명 교차 확인</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="reveal md:col-span-4" style={{ '--i': 2 }}>
              <div className="bezel h-full">
                <div className="bezel-inner flex h-full flex-col p-7">
                  <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft">
                    <Icon name="questionCircle" size={22} className="text-ink-700" />
                  </span>
                  <h3 className="mt-4 text-xl font-bold text-inverse">관리자 검수</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-500">
                    부정 평가가 쌓이면 자동으로 검토 대상이 돼요. 모든 카드에 작성일을 표시해 시효를
                    확인해요.
                  </p>
                  <div className="mt-auto space-y-2 pt-6 text-[12px]">
                    <p className="rounded-xl bg-page px-3 py-2 text-ink-500 ring-1 ring-line-soft">도움 안 됐어요 5회 이상</p>
                    <p className="rounded-xl bg-page px-3 py-2 text-ink-500 ring-1 ring-line-soft">평가 5건 이상 · 부정률 60% 이상</p>
                    <p className="pt-1 text-center font-semibold text-ink-700">→ 검토 목록으로 이동</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 포인트 — 스플릿 + 원장 목업 */}
      <section id="points" className="relative overflow-hidden border-y border-hairline bg-sunken py-24 md:py-32 lg:py-40">
        <div aria-hidden="true" className="orb -bottom-24 -right-20 h-[360px] w-[360px] bg-yellow-200/70" style={{ animationDelay: '-2s' }} />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-6">
              <span className="eyebrow reveal">포인트 순환</span>
              <h2 className="reveal mt-5 text-3xl font-extrabold leading-snug tracking-tight text-inverse md:text-5xl" style={{ '--i': 1 }}>
                아는 곳에서 나누고,
                <br />
                모르는 곳에서 얻어요
              </h2>
              <p className="reveal mt-5 max-w-[46ch] text-base leading-relaxed text-ink-500 md:text-lg" style={{ '--i': 2 }}>
                포인트는 이벤트용 리워드가 아니라 기사들끼리 경험을 주고받는 교환 수단이에요. 유효한
                기여 한 번이면 다른 기사의 지식 카드를 최대 10건 열람할 수 있어요.
              </p>
              <dl className="reveal mt-9 space-y-3.5" style={{ '--i': 3 }}>
                {POINT_RULES.map((rule) => (
                  <div key={rule.label} className="flex items-center gap-4 rounded-2xl bg-paper px-5 py-4 ring-1 ring-hairline">
                    <dt className="flex-1 text-[14px] font-medium text-ink-700">
                      {rule.label}
                      {rule.detail ? <span className="text-[12px] text-ink-500"> · {rule.detail}</span> : null}
                    </dt>
                    <dd
                      className={
                        'rounded-full px-3.5 py-1 text-[14px] font-bold ' +
                        (rule.earn ? 'bg-yellow-200 text-ink-900' : 'bg-ink-050 text-ink-500')
                      }
                    >
                      {rule.amount}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="reveal lg:col-span-5 lg:col-start-8" style={{ '--i': 2 }}>
              <div className="bezel shadow-lift transition-all duration-500 ease-spring hover:rotate-0 md:rotate-1">
                <div className="bezel-inner p-7">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-ink-500">내 포인트</p>
                    <span className="chip">포인트 내역</span>
                  </div>
                  <p className="mt-2 text-5xl font-extrabold tracking-tight text-ink-900">
                    190<span className="align-top text-2xl">P</span>
                  </p>
                  <div className="mt-6 space-y-1 text-[14px]">
                    {POINT_LEDGER.map((item, index) => (
                      <div key={`${item.label}-${index}`} className="flex items-center gap-3 border-t border-line-soft py-3">
                        <PointCoin className={'h-8 w-8 text-[13px] ' + (item.earn ? '' : '!bg-sunken !text-ink-500')} />
                        <span className="text-ink-700">{item.label}</span>
                        <span className={'ml-auto font-bold ' + (item.earn ? 'text-ink-900' : 'font-semibold text-ink-500')}>
                          {item.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-center text-[12px] text-ink-500">
                    기여 1회면 지식 카드 최대 10건을 열람할 수 있어요
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 현장의 목소리 — 매소너리 */}
      <section id="voices" className="relative py-24 md:py-32 lg:py-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="eyebrow reveal">현장의 목소리</span>
            <h2 className="reveal mt-5 text-3xl font-extrabold leading-snug tracking-tight text-inverse md:text-5xl" style={{ '--i': 1 }}>
              먼저 가본 기사들의 한마디
            </h2>
            <p className="reveal mt-5 text-base leading-relaxed text-ink-500 md:text-lg" style={{ '--i': 2 }}>
              이런 말들이 지식 카드가 되어 다음 기사에게 전해져요.
            </p>
          </div>

          <div className="mt-14 columns-1 gap-5 md:columns-2 lg:columns-3 [&>*]:mb-5">
            {VOICES.map((voice) => (
              <div key={voice.name + voice.quote} className="reveal bezel break-inside-avoid" style={{ '--i': voice.i }}>
                <div className="bezel-inner p-6">
                  <span className="chip">{voice.cat}</span>
                  <p className="mt-4 text-[17px] font-bold leading-snug text-inverse">{voice.quote}</p>
                  {voice.reason ? <p className="mt-2 text-[13px] text-ink-500">{voice.reason}</p> : null}
                  <div className="mt-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-[14px] font-bold text-ink-700">
                      {voice.initial}
                    </span>
                    <div className="text-[13px]">
                      <p className="font-semibold text-ink-700">{voice.name}</p>
                      <p className="text-ink-500">{voice.career}</p>
                    </div>
                    <span className="ml-auto text-[13px] font-semibold text-ink-500">👍 {voice.likes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — 옐로우 풀블리드 */}
      <section id="start" className="relative overflow-hidden bg-yellow-500 py-24 md:py-32 lg:py-40">
        <div aria-hidden="true" className="orb -left-24 -top-32 h-[420px] w-[420px] bg-yellow-050/60" />
        <div aria-hidden="true" className="orb -bottom-28 right-[-80px] h-[360px] w-[360px] bg-yellow-400/80" style={{ animationDelay: '-3.5s' }} />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="reveal mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-ink-900 md:text-6xl">
            먼저 가본 한 사람의 경험이,
            <br />
            다음 기사의 시행착오를 줄입니다
          </h2>
          <p className="reveal mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-900/70 md:text-lg" style={{ '--i': 1 }}>
            지금 가입하면 100P를 드려요. 처음 가는 도착지의 지식 카드를 바로 열어볼 수 있어요.
          </p>
          <div className="reveal mt-10 flex justify-center" style={{ '--i': 2 }}>
            <Link
              href="/login"
              className="group inline-flex items-center gap-3 rounded-full bg-inverse py-3 pl-9 pr-2.5 text-lg font-bold text-yellow-500 shadow-overlay transition-all duration-500 ease-spring hover:scale-[1.02] active:scale-[0.98]"
            >
              지금 시작하고 100P 받기
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-yellow-500 text-ink-900 transition-all duration-500 ease-spring group-hover:translate-x-1">
                <Icon name="arrowRight" size={20} />
              </span>
            </Link>
          </div>
          <div className="reveal mt-10 flex flex-wrap justify-center gap-2.5 text-[12px] font-semibold text-ink-900/70" style={{ '--i': 3 }}>
            <span className="rounded-full bg-ink-900/5 px-3.5 py-1.5 ring-1 ring-ink-900/10">MOVE-AI Challenge 2026 출품</span>
            <span className="rounded-full bg-ink-900/5 px-3.5 py-1.5 ring-1 ring-ink-900/10">AI 비환각 원칙 적용</span>
            <span className="rounded-full bg-ink-900/5 px-3.5 py-1.5 ring-1 ring-ink-900/10">관리자 검수 운영</span>
          </div>
          <p className="reveal mx-auto mt-8 max-w-md text-[12px] leading-relaxed text-ink-900/70" style={{ '--i': 4 }}>
            실제 서비스는 카카오 T 트럭커의 배차·위치·운행 데이터 연동을 전제로 설계했어요.
          </p>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-inverse text-ink-200">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-10 md:flex-row md:items-start">
            <div>
              <Brand dark />
              <p className="mt-4 max-w-[36ch] text-[13px] leading-relaxed text-paper/50">
                화물기사의 현장 경험을 AI 음성 인터뷰로 모아 다음 기사에게 연결하는 현장 지식 공유
                서비스예요.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-8 gap-y-3 text-[14px] font-medium text-paper/60">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} className="transition-all duration-500 ease-spring hover:text-paper">
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="mt-12 flex flex-col justify-between gap-3 border-t border-paper/10 pt-6 text-[12px] text-paper/60 md:flex-row md:items-center">
            <p>© 2026 길벗 · MOVE-AI Challenge 2026 프로토타입</p>
            <Link href="/admin" className="underline underline-offset-2 hover:text-paper">
              관리자
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
