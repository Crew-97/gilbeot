// 좌표 두 점 사이 거리 계산. near 조회(getCards)와 지도 화면이 쓴다

// 하버사인 공식. { lat, lng } 두 개를 받아 km 를 반환한다
export function getDistanceKm(a, b) {
  if (!a || !b) return Infinity
  const R = 6371
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
