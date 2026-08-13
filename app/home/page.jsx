'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/components/StoreProvider'
import {
  endDispatch,
  getCards,
  getCurrentDispatch,
  getPointBalance,
  startDispatch,
} from '@/lib/store'
import { loadKakaoMaps } from '@/lib/kakao'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { MockBadge } from '@/components/MockBadge'
import { PointText } from '@/components/PointText'

const CATEGORY_LABELS = {
  center_tip: '센터팁',
  gas: '주유소',
  food: '식당',
  rest: '휴게소·쉼터',
}

function buildCardsHref(condition) {
  const params = new URLSearchParams()
  if (condition.centerId) params.set('centerId', condition.centerId)
  if (condition.placeId) params.set('placeId', condition.placeId)
  if (condition.category) params.set('category', condition.category)
  const query = params.toString()
  return query ? `/cards?${query}` : '/cards'
}

function MapFallback({ center, places, getCardCount, onSelectCenter, onSelectPlace }) {
  return (
    <div className="flex min-h-[280px] flex-col gap-3 bg-[linear-gradient(#F1E8D8_1px,transparent_1px),linear-gradient(90deg,#F1E8D8_1px,transparent_1px)] bg-[size:28px_28px] p-4">
      <div className="rounded-md border border-hairline bg-paper p-3.5 shadow-block">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-caption text-ink-500">도착 화물센터</span>
            <p className="mt-1 text-body font-bold text-ink-000">{center.name}</p>
          </div>
          <button
            type="button"
            onClick={onSelectCenter}
            className="min-h-11 rounded-pill bg-accent-soft px-3 text-caption font-bold text-ink-700"
          >
            암묵지 {getCardCount({ centerId: center.id, category: 'center_tip' })}건
          </button>
        </div>
      </div>

      {places.length === 0 ? (
        <EmptyState message="이 센터 주변에 등록된 장소가 아직 없어요." />
      ) : (
        places.map((place) => (
          <button
            key={place.id}
            type="button"
            onClick={() => onSelectPlace(place)}
            className="flex min-h-11 items-center justify-between rounded-md border border-hairline bg-paper p-3.5 text-left shadow-block"
          >
            <span>
              <span className="text-caption text-ink-500">{CATEGORY_LABELS[place.category]}</span>
              <span className="mt-1 block text-body-sm font-bold text-ink-000">{place.name}</span>
            </span>
            <span className="text-caption font-bold text-ink-500">
              암묵지 {getCardCount({ placeId: place.id })}건
            </span>
          </button>
        ))
      )}
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const mapContainerRef = useRef(null)
  const { state, setState } = useStore()
  const [mapStatus, setMapStatus] = useState('loading')
  const [failReason, setFailReason] = useState(null)

  const dispatch = getCurrentDispatch(state)
  const center =
    dispatch && Array.isArray(state.centers)
      ? state.centers.find((item) => item.id === dispatch.centerId)
      : null
  const places = useMemo(
    () =>
      center && Array.isArray(state.places)
        ? state.places.filter((place) => place.centerId === center.id)
        : [],
    [center, state.places]
  )
  const centerCardCount = useMemo(
    () =>
      center
        ? getCards(state, { centerId: center.id, category: 'center_tip' }).length
        : 0,
    [center, state]
  )
  const placeCardCounts = useMemo(
    () =>
      new Map(
        places.map((place) => [place.id, getCards(state, { placeId: place.id }).length])
      ),
    [places, state]
  )

  useEffect(() => {
    if (!dispatch || !center || !mapContainerRef.current) return

    let active = true
    const container = mapContainerRef.current

    const renderMap = async () => {
      setMapStatus('loading')
      const maps = await loadKakaoMaps()
      if (!active) return
      if (!maps) {
        setMapStatus('fallback')
        return
      }

      try {
        const centerPosition = new maps.LatLng(center.lat, center.lng)
        const map = new maps.Map(container, {
          center: centerPosition,
          level: 8,
        })
        const bounds = new maps.LatLngBounds()

        const addMarker = ({ lat, lng, label, cardCount, onClick }) => {
          if (typeof lat !== 'number' || typeof lng !== 'number') return
          const position = new maps.LatLng(lat, lng)
          const marker = new maps.Marker({ map, position, title: label })
          const badge = document.createElement('button')
          badge.type = 'button'
          badge.textContent = cardCount == null ? label : `${label} · 암묵지 ${cardCount}건`
          badge.className =
            'min-h-11 rounded-pill border border-hairline bg-paper px-3 text-caption font-bold text-ink-000 shadow-lift'
          if (onClick) {
            badge.addEventListener('click', onClick)
            maps.event.addListener(marker, 'click', onClick)
          }
          new maps.CustomOverlay({
            map,
            position,
            content: badge,
            yAnchor: 1.8,
            clickable: true,
          })
          bounds.extend(position)
        }

        addMarker({
          lat: dispatch.originLat,
          lng: dispatch.originLng,
          label: dispatch.originLabel || '출발지',
        })
        addMarker({
          lat: center.lat,
          lng: center.lng,
          cardCount: centerCardCount,
          label: `도착 ${center.name}`,
          onClick: () =>
            router.push(
              buildCardsHref({ centerId: center.id, category: 'center_tip' })
            ),
        })
        places.forEach((place) =>
          addMarker({
            lat: place.lat,
            lng: place.lng,
            cardCount: placeCardCounts.get(place.id) || 0,
            label: `${CATEGORY_LABELS[place.category]} ${place.name}`,
            onClick: () =>
              router.push(
                buildCardsHref({
                  centerId: center.id,
                  placeId: place.id,
                  category: place.category,
                })
              ),
          })
        )

        map.setBounds(bounds, 48, 48, 48, 48)
        setMapStatus('ready')
      } catch {
        if (active) setMapStatus('fallback')
      }
    }

    renderMap()

    return () => {
      active = false
      container.replaceChildren()
    }
  }, [center, centerCardCount, dispatch, placeCardCounts, places, router])

  if (!Array.isArray(state.centers) || !Array.isArray(state.places)) {
    return <ErrorState onRetry={() => window.location.reload()} />
  }

  if (!dispatch) {
    return (
      <EmptyState
        message="출발지와 도착지를 먼저 입력하세요."
        actionLabel="도착지 입력"
        onAction={() => router.push('/destination')}
      />
    )
  }

  if (!center) {
    return <ErrorState message="도착지 정보를 찾을 수 없어요." onRetry={() => router.push('/destination')} />
  }

  const balance = getPointBalance(state, state.currentDriverId)
  const driving = Boolean(dispatch.startedAt && !dispatch.endedAt)
  const ended = Boolean(dispatch.endedAt)
  const getCardCount = (condition) => getCards(state, condition).length

  const handleStart = () => {
    const result = startDispatch(state, dispatch.id)
    setFailReason(result.reason)
    if (result.ok) setState(result.state)
  }

  const handleEnd = () => {
    const result = endDispatch(state, dispatch.id)
    setFailReason(result.reason)
    if (!result.ok) return
    setState(result.state)
    router.push('/survey')
  }

  const handleSelectCenter = () => {
    router.push(buildCardsHref({ centerId: center.id, category: 'center_tip' }))
  }

  const handleSelectPlace = (place) => {
    router.push(
      buildCardsHref({
        centerId: center.id,
        placeId: place.id,
        category: place.category,
      })
    )
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[390px] flex-col gap-5 px-4 py-6">
      <header className="flex items-center justify-between">
        <div>
          <span className="text-caption text-ink-500">도착지</span>
          <h1 className="mt-1 text-title-3 tracking-tight text-ink-000">{center.name}</h1>
        </div>
        <PointText amount={balance} showSign={false} />
      </header>

      <section className="overflow-hidden rounded-lg border border-hairline bg-paper shadow-block">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
          <h2 className="text-body font-bold text-ink-000">출발지와 주변 장소</h2>
          <MockBadge />
        </div>

        <div className={mapStatus === 'fallback' ? 'hidden' : 'relative'}>
          <div ref={mapContainerRef} className="h-[320px] w-full" aria-label="도착지 주변 장소 지도" />
          {mapStatus === 'loading' ? (
            <div className="absolute inset-0 flex items-center justify-center bg-sunken text-body-sm text-ink-500">
              지도를 불러오고 있어요.
            </div>
          ) : null}
        </div>
        {mapStatus === 'fallback' ? (
          <MapFallback
            center={center}
            places={places}
            getCardCount={getCardCount}
            onSelectCenter={handleSelectCenter}
            onSelectPlace={handleSelectPlace}
          />
        ) : null}
      </section>

      <section className="rounded-lg border border-hairline bg-paper p-4 shadow-block">
        <div className="flex items-center justify-between">
          <h2 className="text-body font-bold text-ink-000">센터 요약 정보</h2>
          <MockBadge />
        </div>
        <dl className="mt-4 grid grid-cols-[110px_1fr] gap-y-3 text-body-sm">
          <dt className="text-ink-500">물류 원가</dt>
          <dd className="font-bold text-ink-000">
            {center.logisticsCost == null ? '' : `${center.logisticsCost.toLocaleString('ko-KR')}원`}
          </dd>
          <dt className="text-ink-500">머무는 시간</dt>
          <dd className="font-bold text-ink-000">
            {center.avgStayMinutes == null ? '' : `${center.avgStayMinutes}분`}
          </dd>
          <dt className="text-ink-500">취급 품목</dt>
          <dd className="font-bold text-ink-000">{center.handledItems || ''}</dd>
        </dl>
      </section>

      {failReason ? <p className="text-center text-body-sm text-danger">{failReason}</p> : null}

      <div className="sticky bottom-[68px] mt-auto flex justify-center">
        {ended ? (
          <Button className="w-[358px]" onClick={() => router.push('/survey')}>
            인터뷰로 이동
          </Button>
        ) : driving ? (
          <Button className="w-[358px]" onClick={handleEnd}>
            운행 종료
          </Button>
        ) : (
          <Button className="w-[358px]" onClick={handleStart}>
            운행 시작
          </Button>
        )}
        {driving ? (
          <span className="absolute top-full mt-1 text-caption text-ink-500">
            운행 종료는 도착지 도달을 재현하는 Mock 이벤트예요.
          </span>
        ) : null}
      </div>
    </main>
  )
}
