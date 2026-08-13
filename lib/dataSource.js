// 외부 데이터 로드의 단일 지점. 실서비스 전환 시 이 파일만 REST 호출로 바꾼다
// 다른 파일은 data/*.json 을 직접 import 하지 않는다

import centersSeed from '@/data/centers.json'
import placesSeed from '@/data/places.json'
import driversSeed from '@/data/drivers.json'
import cardsSeed from '@/data/cards.json'

// snake_case 키를 camelCase 로 바꾼다. 값은 절대 건드리지 않는다
function toCamelKey(key) {
  return key.replace(/_([a-z0-9])/g, (m, ch) => ch.toUpperCase())
}

// 중첩 객체와 배열 안쪽까지 재귀 변환. 키만 바꾸고 값(ENUM, id, 날짜 문자열)은 그대로 둔다
function convertKeys(value) {
  if (Array.isArray(value)) return value.map(convertKeys)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [toCamelKey(k), convertKeys(v)])
    )
  }
  return value
}

// 시드가 비어 있거나 배열이 아니면 빈 배열을 반환하고 콘솔에 남긴다. 예외로 화면을 죽이지 않는다
function loadSeed(seed, name) {
  if (!Array.isArray(seed)) {
    console.error('시드가 배열이 아닙니다:', name)
    return []
  }
  if (seed.length === 0) {
    console.error('시드가 비어 있습니다:', name)
    return []
  }
  // convertKeys 가 매번 새 배열과 새 객체를 만들어 반환한다. 원본 보호
  return convertKeys(seed)
}

export function loadCenters() {
  return loadSeed(centersSeed, 'centers')
}

export function loadPlaces() {
  return loadSeed(placesSeed, 'places')
}

export function loadDrivers() {
  return loadSeed(driversSeed, 'drivers')
}

export function loadCards() {
  return loadSeed(cardsSeed, 'cards')
}
